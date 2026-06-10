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

export async function listReminders() {
  const { rows } = await query(`${STATUS_SELECT} ORDER BY due_date ASC, id ASC`, [todayStr()]);
  return rows;
}

export async function getReminderById(id) {
  const { rows } = await query(`${STATUS_SELECT} WHERE id = $2`, [todayStr(), id]);
  return rows[0] || null;
}

export async function createReminder({ name, amount, due_date, repeat_cycle }) {
  const { rows } = await query(
    `INSERT INTO reminders (name, amount, due_date, repeat_cycle)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, amount, due_date, repeat_cycle || 'monthly']
  );
  return getReminderById(rows[0].id);
}

export async function updateReminder(id, { name, amount, due_date, repeat_cycle, paid }) {
  const { rows } = await query(
    `UPDATE reminders SET
       name         = COALESCE($2, name),
       amount       = COALESCE($3, amount),
       due_date     = COALESCE($4, due_date),
       repeat_cycle = COALESCE($5, repeat_cycle),
       paid         = COALESCE($6, paid)
     WHERE id = $1
     RETURNING id`,
    [id, name ?? null, amount ?? null, due_date ?? null, repeat_cycle ?? null, paid ?? null]
  );
  return rows[0] ? getReminderById(id) : null;
}

// Mark a bill paid: records last_paid and rolls due_date forward one cycle.
export async function markReminderPaid(id) {
  const { rows } = await query(
    `UPDATE reminders SET
       paid = TRUE,
       last_paid = $2::date,
       due_date = (CASE repeat_cycle
         WHEN 'daily'   THEN due_date + INTERVAL '1 day'
         WHEN 'weekly'  THEN due_date + INTERVAL '7 days'
         WHEN 'monthly' THEN due_date + INTERVAL '1 month'
         WHEN 'yearly'  THEN due_date + INTERVAL '1 year'
       END)::date
     WHERE id = $1
     RETURNING id`,
    [id, todayStr()]
  );
  return rows[0] ? getReminderById(id) : null;
}

export async function deleteReminder(id) {
  const { rowCount } = await query('DELETE FROM reminders WHERE id = $1', [id]);
  return rowCount > 0;
}
