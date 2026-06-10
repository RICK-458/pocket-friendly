-- ════════════════════════════════════════════════════════════════════════════
-- Migration 001 — Razorpay integration
-- Run with:  psql -U postgres -d pocket_friendly -f database/migrations/001_razorpay_payments.sql
-- ════════════════════════════════════════════════════════════════════════════

-- Every Razorpay payment attempt (pending → success | failed)
CREATE TABLE IF NOT EXISTS payments (
    id                  SERIAL PRIMARY KEY,
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

CREATE INDEX IF NOT EXISTS idx_payments_order   ON payments (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments (status);

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Razorpay supports more methods than the original upi/card simulation
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_method_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_method_check
    CHECK (method IN ('upi', 'card', 'netbanking', 'wallet', 'emi', 'paylater', 'other'));
