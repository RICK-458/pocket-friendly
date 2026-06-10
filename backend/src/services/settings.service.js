import { query } from '../config/db.js';

const DEFAULT_LIMITS = { daily: 500, weekly: 3000, monthly: 12000 };

async function getSetting(userId, key, fallback) {
  const { rows } = await query(
    'SELECT value FROM settings WHERE user_id = $1 AND key = $2',
    [userId, key]
  );
  return rows.length ? rows[0].value : fallback;
}

async function setSetting(userId, key, value) {
  await query(
    `INSERT INTO settings (user_id, key, value) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [userId, key, JSON.stringify(value)]
  );
  return value;
}

export async function getLimits(userId) {
  return getSetting(userId, 'limits', DEFAULT_LIMITS);
}

export async function updateLimits(userId, { daily, weekly, monthly }) {
  const current = await getLimits(userId);
  return setSetting(userId, 'limits', {
    daily: daily ?? current.daily,
    weekly: weekly ?? current.weekly,
    monthly: monthly ?? current.monthly,
  });
}

export async function getSavings(userId) {
  const total = await getSetting(userId, 'savings', 0);
  return { total: Number(total) };
}

export async function setSavings(userId, total) {
  await setSetting(userId, 'savings', Number(total));
  return { total: Number(total) };
}

export async function addSavings(userId, amount) {
  const { total } = await getSavings(userId);
  return setSavings(userId, total + Number(amount));
}
