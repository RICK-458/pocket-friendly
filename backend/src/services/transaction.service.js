import { pool, query } from '../config/db.js';
import { todayStr } from '../utils/dates.js';

export async function listTransactions(userId, limit = 20) {
  const { rows } = await query(
    'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2',
    [userId, limit]
  );
  return rows;
}

// Records a payment and its matching expense atomically (single DB transaction),
// mirroring the frontend behaviour where every payment also appears in expenses.
export async function createPayment(userId, { amount, method, recipient, recipient_name, note }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const title = `Payment to ${recipient_name || recipient}`;
    const { rows: expRows } = await client.query(
      `INSERT INTO expenses (user_id, title, amount, category, expense_date, notes)
       VALUES ($1, $2, $3, 'Other', $4, $5)
       RETURNING *`,
      [userId, title, amount, todayStr(), note || null]
    );

    const { rows: txRows } = await client.query(
      `INSERT INTO transactions (user_id, amount, recipient, recipient_name, note, method, expense_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, amount, recipient, recipient_name || null, note || null, method, expRows[0].id]
    );

    await client.query('COMMIT');
    return { transaction: txRows[0], expense: expRows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
