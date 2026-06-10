-- ════════════════════════════════════════════════════════════════════════════
-- Migration 002 — Authentication & per-user data isolation
-- Run with:  psql -U postgres -d pocket_friendly -f database/migrations/002_auth_users.sql
--
-- Existing records are assigned to Test User 1 so no data is lost.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Test users (password for both: password123, bcrypt cost 10)
INSERT INTO users (name, email, password_hash) VALUES
    ('Test User 1', 'test1@example.com', '$2b$10$oSrZkS7Zy6P21s8N0jraE.LfvcahjpFYGpYu7h5UiuLb4nG4c85Lq'),
    ('Test User 2', 'test2@example.com', '$2b$10$oSrZkS7Zy6P21s8N0jraE.LfvcahjpFYGpYu7h5UiuLb4nG4c85Lq')
ON CONFLICT (email) DO NOTHING;

-- ─── Add user_id ownership to every user-data table ─────────────────────────
-- (categories stays global: it holds the 8 fixed reference categories only)

-- expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users (id) ON DELETE CASCADE;
UPDATE expenses SET user_id = (SELECT id FROM users WHERE email = 'test1@example.com') WHERE user_id IS NULL;
ALTER TABLE expenses ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses (user_id, expense_date);

-- reminders
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users (id) ON DELETE CASCADE;
UPDATE reminders SET user_id = (SELECT id FROM users WHERE email = 'test1@example.com') WHERE user_id IS NULL;
ALTER TABLE reminders ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders (user_id, due_date, paid);

-- transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users (id) ON DELETE CASCADE;
UPDATE transactions SET user_id = (SELECT id FROM users WHERE email = 'test1@example.com') WHERE user_id IS NULL;
ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions (user_id, created_at DESC);

-- payments (Razorpay attempts)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users (id) ON DELETE CASCADE;
UPDATE payments SET user_id = (SELECT id FROM users WHERE email = 'test1@example.com') WHERE user_id IS NULL;
ALTER TABLE payments ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments (user_id, created_at DESC);

-- settings: key/value per user — primary key becomes (user_id, key)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users (id) ON DELETE CASCADE;
UPDATE settings SET user_id = (SELECT id FROM users WHERE email = 'test1@example.com') WHERE user_id IS NULL;
ALTER TABLE settings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE settings ADD PRIMARY KEY (user_id, key);

-- ─── Sample data for Test User 2 (isolation testing) ────────────────────────
INSERT INTO expenses (user_id, title, amount, category, expense_date, notes)
SELECT u.id, v.title, v.amount, v.category, v.expense_date, v.notes
FROM users u,
     (VALUES
        ('Coffee',          120.00, 'Food',      CURRENT_DATE,                    'Morning coffee'),
        ('Bus pass',        300.00, 'Transport', CURRENT_DATE - INTERVAL '1 day', NULL),
        ('Headphones',     1499.00, 'Shopping',  CURRENT_DATE - INTERVAL '2 day', 'Sale'),
        ('Internet bill',   799.00, 'Bills',     CURRENT_DATE - INTERVAL '3 day', 'June bill')
     ) AS v(title, amount, category, expense_date, notes)
WHERE u.email = 'test2@example.com'
  AND NOT EXISTS (SELECT 1 FROM expenses e WHERE e.user_id = u.id);

INSERT INTO reminders (user_id, name, amount, due_date, repeat_cycle, paid)
SELECT u.id, 'Spotify', 119.00, CURRENT_DATE + INTERVAL '3 day', 'monthly', FALSE
FROM users u
WHERE u.email = 'test2@example.com'
  AND NOT EXISTS (SELECT 1 FROM reminders r WHERE r.user_id = u.id);

INSERT INTO settings (user_id, key, value)
SELECT u.id, v.key, v.value::jsonb
FROM users u,
     (VALUES
        ('limits',  '{"daily": 500, "weekly": 3000, "monthly": 12000}'),
        ('savings', '0')
     ) AS v(key, value)
WHERE u.email = 'test2@example.com'
ON CONFLICT (user_id, key) DO NOTHING;
