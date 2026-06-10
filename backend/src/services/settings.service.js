import { query } from '../config/db.js';

const DEFAULT_LIMITS = { daily: 500, weekly: 3000, monthly: 12000 };

async function getSetting(key, fallback) {
  const { rows } = await query('SELECT value FROM settings WHERE key = $1', [key]);
  return rows.length ? rows[0].value : fallback;
}

async function setSetting(key, value) {
  await query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, JSON.stringify(value)]
  );
  return value;
}

export async function getLimits() {
  return getSetting('limits', DEFAULT_LIMITS);
}

export async function updateLimits({ daily, weekly, monthly }) {
  const current = await getLimits();
  return setSetting('limits', {
    daily: daily ?? current.daily,
    weekly: weekly ?? current.weekly,
    monthly: monthly ?? current.monthly,
  });
}

export async function getSavings() {
  const total = await getSetting('savings', 0);
  return { total: Number(total) };
}

export async function setSavings(total) {
  await setSetting('savings', Number(total));
  return { total: Number(total) };
}

export async function addSavings(amount) {
  const { total } = await getSavings();
  return setSavings(total + Number(amount));
}
