import { query } from '../config/db.js';

const SORTABLE = {
  expense_date: 'expense_date',
  amount: 'amount',
  created_at: 'created_at',
  title: 'title',
  category: 'category',
};

export async function listExpenses({
  page = 1,
  limit = 20,
  search,
  category,
  startDate,
  endDate,
  sortBy = 'expense_date',
  order = 'desc',
} = {}) {
  const where = [];
  const params = [];

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

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
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

export async function getExpenseById(id) {
  const { rows } = await query('SELECT * FROM expenses WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function createExpense({ title, amount, category, expense_date, notes }) {
  const { rows } = await query(
    `INSERT INTO expenses (title, amount, category, expense_date, notes)
     VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5)
     RETURNING *`,
    [title, amount, category, expense_date || null, notes || null]
  );
  return rows[0];
}

export async function updateExpense(id, { title, amount, category, expense_date, notes }) {
  const { rows } = await query(
    `UPDATE expenses SET
       title        = COALESCE($2, title),
       amount       = COALESCE($3, amount),
       category     = COALESCE($4, category),
       expense_date = COALESCE($5, expense_date),
       notes        = COALESCE($6, notes)
     WHERE id = $1
     RETURNING *`,
    [id, title ?? null, amount ?? null, category ?? null, expense_date ?? null, notes ?? null]
  );
  return rows[0] || null;
}

export async function deleteExpense(id) {
  const { rowCount } = await query('DELETE FROM expenses WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function bulkDeleteExpenses(ids) {
  const { rowCount } = await query('DELETE FROM expenses WHERE id = ANY($1::int[])', [ids]);
  return rowCount;
}
