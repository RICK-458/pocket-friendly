import { query } from '../config/db.js';
import { todayStr } from '../utils/dates.js';

// Every reminder is returned with a computed status:
// overdue | due_today | upcoming | paid
const STATUS_SELECT = `
  SELECT *,
    CASE
      WHEN paid THEN 'paid'
      WHEN due_date < $1::date THEN 'overdue'
      WHEN due_date = $1::date THEN 'due_today'
      ELSE 'upcoming'
    END AS status
  FROM reminders`;

export async function listReminders(userId) {
  const { rows } = await query(
    `${STATUS_SELECT} WHERE user_id = $2 ORDER BY due_date ASC, id ASC`,
    [todayStr(), userId]
  );
  return rows;
}

export async function getReminderById(userId, id) {
  const { rows } = await query(
    `${STATUS_SELECT} WHERE id = $2 AND user_id = $3`,
    [todayStr(), id, userId]
  );
  return rows[0] || null;
}

export async function createReminder(userId, { name, amount, due_date, repeat_cycle }) {
  const { rows } = await query(
    `INSERT INTO reminders (user_id, name, amount, due_date, repeat_cycle)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, name, amount, due_date, repeat_cycle || 'monthly']
  );
  return getReminderById(userId, rows[0].id);
}

export async function updateReminder(userId, id, { name, amount, due_date, repeat_cycle, paid }) {
  const { rows } = await query(
    `UPDATE reminders SET
       name         = COALESCE($3, name),
       amount       = COALESCE($4, amount),
       due_date     = COALESCE($5, due_date),
       repeat_cycle = COALESCE($6, repeat_cycle),
       paid         = COALESCE($7, paid)
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId, name ?? null, amount ?? null, due_date ?? null, repeat_cycle ?? null, paid ?? null]
  );
  return rows[0] ? getReminderById(userId, id) : null;
}

// Mark a bill paid: records last_paid and rolls due_date forward one cycle.
export async function markReminderPaid(userId, id) {
  const { rows } = await query(
    `UPDATE reminders SET
       paid = TRUE,
       last_paid = $3::date,
       due_date = (CASE repeat_cycle
         WHEN 'daily'   THEN due_date + INTERVAL '1 day'
         WHEN 'weekly'  THEN due_date + INTERVAL '7 days'
         WHEN 'monthly' THEN due_date + INTERVAL '1 month'
         WHEN 'yearly'  THEN due_date + INTERVAL '1 year'
       END)::date
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId, todayStr()]
  );
  return rows[0] ? getReminderById(userId, id) : null;
}

export async function deleteReminder(userId, id) {
  const { rowCount } = await query(
    'DELETE FROM reminders WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
}
