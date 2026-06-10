import { query } from '../config/db.js';

const SORTABLE = {
  expense_date: 'expense_date',
  amount: 'amount',
  created_at: 'created_at',
  title: 'title',
  category: 'category',
};

// Every query is scoped to the authenticated user — userId is never optional.
export async function listExpenses(userId, {
  page = 1,
  limit = 20,
  search,
  category,
  startDate,
  endDate,
  sortBy = 'expense_date',
  order = 'desc',
} = {}) {
  const where = ['user_id = $1'];
  const params = [userId];

  if (search) {
    params.push(`%${search}%`);
    where.push(`(title ILIKE $${params.length} OR notes ILIKE $${params.length})`);
  }
  if (category && category !== 'All') {
    params.push(category);
    where.push(`category = $${params.length}`);
  }
  if (startDate) {
    params.push(startDate);
    where.push(`expense_date >= $${params.length}`);
  }
  if (endDate) {
    params.push(endDate);
    where.push(`expense_date <= $${params.length}`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const sortCol = SORTABLE[sortBy] || 'expense_date';
  const dir = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM expenses ${whereSql}`,
    params
  );
  const total = countRows[0].total;

  const offset = (page - 1) * limit;
  const { rows } = await query(
    `SELECT * FROM expenses ${whereSql}
     ORDER BY ${sortCol} ${dir}, id DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    items: rows,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getExpenseById(userId, id) {
  const { rows } = await query('SELECT * FROM expenses WHERE id = $1 AND user_id = $2', [id, userId]);
  return rows[0] || null;
}

export async function createExpense(userId, { title, amount, category, expense_date, notes }) {
  const { rows } = await query(
    `INSERT INTO expenses (user_id, title, amount, category, expense_date, notes)
     VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6)
     RETURNING *`,
    [userId, title, amount, category, expense_date || null, notes || null]
  );
  return rows[0];
}

export async function updateExpense(userId, id, { title, amount, category, expense_date, notes }) {
  const { rows } = await query(
    `UPDATE expenses SET
       title        = COALESCE($3, title),
       amount       = COALESCE($4, amount),
       category     = COALESCE($5, category),
       expense_date = COALESCE($6, expense_date),
       notes        = COALESCE($7, notes)
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, title ?? null, amount ?? null, category ?? null, expense_date ?? null, notes ?? null]
  );
  return rows[0] || null;
}

export async function deleteExpense(userId, id) {
  const { rowCount } = await query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [id, userId]);
  return rowCount > 0;
}

export async function bulkDeleteExpenses(userId, ids) {
  const { rowCount } = await query(
    'DELETE FROM expenses WHERE id = ANY($1::int[]) AND user_id = $2',
    [ids, userId]
  );
  return rowCount;
}
