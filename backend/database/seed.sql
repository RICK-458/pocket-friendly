-- ════════════════════════════════════════════════════════════════════════════
-- Pocket-Friendly — seed data (multi-user)
-- Run with:  psql -U postgres -d pocket_friendly -f database/seed.sql
-- ════════════════════════════════════════════════════════════════════════════

-- The 8 fixed categories (colors match the frontend COLORS map)
INSERT INTO categories (name, color) VALUES
    ('Food',          '#FFE600'),
    ('Transport',     '#4169FF'),
    ('Shopping',      '#FF6B9D'),
    ('Bills',         '#FF7A2F'),
    ('Health',        '#00C896'),
    ('Entertainment', '#FF3B3B'),
    ('Savings',       '#9B59FF'),
    ('Other',         '#888')
ON CONFLICT (name) DO NOTHING;

-- Test users (password for both: password123, bcrypt cost 10)
INSERT INTO users (name, email, password_hash) VALUES
    ('Test User 1', 'test1@example.com', '$2b$10$oSrZkS7Zy6P21s8N0jraE.LfvcahjpFYGpYu7h5UiuLb4nG4c85Lq'),
    ('Test User 2', 'test2@example.com', '$2b$10$oSrZkS7Zy6P21s8N0jraE.LfvcahjpFYGpYu7h5UiuLb4nG4c85Lq')
ON CONFLICT (email) DO NOTHING;

-- Default settings for both test users
INSERT INTO settings (user_id, key, value)
SELECT u.id, v.key, v.value::jsonb
FROM users u,
     (VALUES
        ('limits',  '{"daily": 500, "weekly": 3000, "monthly": 12000}'),
        ('savings', '0')
     ) AS v(key, value)
WHERE u.email IN ('test1@example.com', 'test2@example.com')
ON CONFLICT (user_id, key) DO NOTHING;

-- Sample expenses for Test User 1 (only if they have none)
INSERT INTO expenses (user_id, title, amount, category, expense_date, notes)
SELECT u.id, v.title, v.amount, v.category, v.expense_date, v.notes
FROM users u,
     (VALUES
        ('Lunch at cafe',     250.00, 'Food',          CURRENT_DATE,                    'Lunch at cafe'),
        ('Metro card top-up', 150.00, 'Transport',     CURRENT_DATE,                    'Metro card top-up'),
        ('Groceries',         820.00, 'Food',          CURRENT_DATE - INTERVAL '1 day', 'Weekly groceries'),
        ('Movie night',       400.00, 'Entertainment', CURRENT_DATE - INTERVAL '2 day', 'Movie night'),
        ('Pharmacy',          230.00, 'Health',        CURRENT_DATE - INTERVAL '3 day', 'Vitamins'),
        ('T-shirt',           599.00, 'Shopping',      CURRENT_DATE - INTERVAL '4 day', 'Sale purchase'),
        ('Auto fare',          80.00, 'Transport',     CURRENT_DATE - INTERVAL '5 day', NULL),
        ('Electricity bill', 1240.00, 'Bills',         CURRENT_DATE - INTERVAL '6 day', 'June bill')
     ) AS v(title, amount, category, expense_date, notes)
WHERE u.email = 'test1@example.com'
  AND NOT EXISTS (SELECT 1 FROM expenses e WHERE e.user_id = u.id);

-- Sample expenses for Test User 2 (only if they have none)
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

-- Sample reminders
INSERT INTO reminders (user_id, name, amount, due_date, repeat_cycle, paid)
SELECT u.id, v.name, v.amount, v.due_date, v.repeat_cycle, v.paid
FROM users u,
     (VALUES
        ('Netflix',  499.00,  CURRENT_DATE,                    'monthly', FALSE),
        ('Rent',     9000.00, CURRENT_DATE + INTERVAL '5 day', 'monthly', FALSE),
        ('Gym',      1200.00, CURRENT_DATE - INTERVAL '2 day', 'monthly', FALSE)
     ) AS v(name, amount, due_date, repeat_cycle, paid)
WHERE u.email = 'test1@example.com'
  AND NOT EXISTS (SELECT 1 FROM reminders r WHERE r.user_id = u.id);

INSERT INTO reminders (user_id, name, amount, due_date, repeat_cycle, paid)
SELECT u.id, 'Spotify', 119.00, CURRENT_DATE + INTERVAL '3 day', 'monthly', FALSE
FROM users u
WHERE u.email = 'test2@example.com'
  AND NOT EXISTS (SELECT 1 FROM reminders r WHERE r.user_id = u.id);
