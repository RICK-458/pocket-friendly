-- ════════════════════════════════════════════════════════════════════════════
-- Pocket-Friendly — seed data
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

-- Default settings (same defaults the frontend used in localStorage)
INSERT INTO settings (key, value) VALUES
    ('limits',  '{"daily": 500, "weekly": 3000, "monthly": 12000}'),
    ('savings', '0')
ON CONFLICT (key) DO NOTHING;

-- Sample expenses spread over the last week (only if table is empty)
INSERT INTO expenses (title, amount, category, expense_date, notes)
SELECT * FROM (VALUES
    ('Lunch at cafe',     250.00, 'Food',          CURRENT_DATE,                    'Lunch at cafe'),
    ('Metro card top-up', 150.00, 'Transport',     CURRENT_DATE,                    'Metro card top-up'),
    ('Groceries',         820.00, 'Food',          CURRENT_DATE - INTERVAL '1 day', 'Weekly groceries'),
    ('Movie night',       400.00, 'Entertainment', CURRENT_DATE - INTERVAL '2 day', 'Movie night'),
    ('Pharmacy',          230.00, 'Health',        CURRENT_DATE - INTERVAL '3 day', 'Vitamins'),
    ('T-shirt',           599.00, 'Shopping',      CURRENT_DATE - INTERVAL '4 day', 'Sale purchase'),
    ('Auto fare',          80.00, 'Transport',     CURRENT_DATE - INTERVAL '5 day', NULL),
    ('Electricity bill', 1240.00, 'Bills',         CURRENT_DATE - INTERVAL '6 day', 'June bill')
) AS v(title, amount, category, expense_date, notes)
WHERE NOT EXISTS (SELECT 1 FROM expenses);

-- Sample reminders (only if table is empty)
INSERT INTO reminders (name, amount, due_date, repeat_cycle, paid)
SELECT * FROM (VALUES
    ('Netflix',  499.00,  CURRENT_DATE,                     'monthly', FALSE),
    ('Rent',     9000.00, CURRENT_DATE + INTERVAL '5 day',  'monthly', FALSE),
    ('Gym',      1200.00, CURRENT_DATE - INTERVAL '2 day',  'monthly', FALSE)
) AS v(name, amount, due_date, repeat_cycle, paid)
WHERE NOT EXISTS (SELECT 1 FROM reminders);
