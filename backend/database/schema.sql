-- ════════════════════════════════════════════════════════════════════════════
-- Pocket-Friendly — PostgreSQL schema (multi-user)
-- Run with:  psql -U postgres -f database/schema.sql
-- ════════════════════════════════════════════════════════════════════════════

-- Create the database if it doesn't exist (psql \gexec trick)
SELECT 'CREATE DATABASE pocket_friendly'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pocket_friendly')\gexec

\c pocket_friendly

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── CATEGORIES (global reference data — not user-owned) ─────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) UNIQUE NOT NULL,
    color      VARCHAR(20)  NOT NULL DEFAULT '#888',
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── EXPENSES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title        VARCHAR(255)  NOT NULL,
    amount       DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    category     VARCHAR(100)  NOT NULL DEFAULT 'Other',
    expense_date DATE          NOT NULL DEFAULT CURRENT_DATE,
    notes        TEXT,
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user          ON expenses (user_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date          ON expenses (expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category      ON expenses (category);
CREATE INDEX IF NOT EXISTS idx_expenses_category_date ON expenses (category, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at    ON expenses (created_at DESC);

-- ─── REMINDERS (bills / subscriptions) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS reminders (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name         VARCHAR(255)  NOT NULL,
    amount       DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    due_date     DATE          NOT NULL,
    repeat_cycle VARCHAR(10)   NOT NULL DEFAULT 'monthly'
                 CHECK (repeat_cycle IN ('daily', 'weekly', 'monthly', 'yearly')),
    paid         BOOLEAN       NOT NULL DEFAULT FALSE,
    last_paid    DATE,
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders (user_id, due_date, paid);
CREATE INDEX IF NOT EXISTS idx_reminders_due  ON reminders (due_date, paid);

-- ─── TRANSACTIONS (payment history) ──────────────────────────────────────────
-- recipient holds a UPI id, masked card, or razorpay payment reference.
-- Raw card numbers / CVVs are NEVER sent to or stored by the backend.
CREATE TABLE IF NOT EXISTS transactions (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    amount         DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    recipient      VARCHAR(255)  NOT NULL,
    recipient_name VARCHAR(255),
    note           TEXT,
    method         VARCHAR(10)   NOT NULL
                   CHECK (method IN ('upi', 'card', 'netbanking', 'wallet', 'emi', 'paylater', 'other')),
    expense_id     INTEGER       REFERENCES expenses (id) ON DELETE SET NULL,
    created_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user    ON transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions (created_at DESC);

-- ─── PAYMENTS (Razorpay test-mode payment attempts) ──────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    razorpay_order_id   VARCHAR(64)   UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(64),
    amount              DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency            VARCHAR(10)   NOT NULL DEFAULT 'INR',
    status              VARCHAR(10)   NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'success', 'failed')),
    method              VARCHAR(30),
    recipient_name      VARCHAR(255),
    note                TEXT,
    error_reason        TEXT,
    transaction_id      INTEGER REFERENCES transactions (id) ON DELETE SET NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user    ON payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order   ON payments (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments (status);

-- ─── SETTINGS (per-user key/value: spending limits, savings total) ───────────
CREATE TABLE IF NOT EXISTS settings (
    user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    key        VARCHAR(50) NOT NULL,
    value      JSONB       NOT NULL,
    updated_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, key)
);

-- ─── updated_at trigger ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_expenses_updated_at ON expenses;
CREATE TRIGGER trg_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_reminders_updated_at ON reminders;
CREATE TRIGGER trg_reminders_updated_at
    BEFORE UPDATE ON reminders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
