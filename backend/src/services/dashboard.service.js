import { query } from '../config/db.js';
import { todayStr, weekStart, monthStartStr } from '../utils/dates.js';
import { getLimits, getSavings } from './settings.service.js';

export async function getSummary() {
  const today = todayStr();
  const week = weekStart();
  const monthStart = monthStartStr();

  const [totals, breakdown, recent, dueToday, limits, savings] = await Promise.all([
    query(
      `SELECT
         COALESCE(SUM(amount), 0)::float                                    AS total_expenses,
         COALESCE(SUM(amount) FILTER (WHERE expense_date = $1), 0)::float   AS today_expenses,
         COALESCE(SUM(amount) FILTER (WHERE expense_date >= $2), 0)::float  AS week_expenses,
         COALESCE(SUM(amount) FILTER (WHERE expense_date >= $3), 0)::float  AS monthly_expenses,
         COALESCE(AVG(amount), 0)::float                                    AS average_expense,
         COUNT(*)::int                                                      AS expense_count
       FROM expenses`,
      [today, week, monthStart]
    ),
    query(
      `SELECT category, SUM(amount)::float AS total
       FROM expenses
       WHERE expense_date >= $1
       GROUP BY category
       ORDER BY total DESC`,
      [monthStart]
    ),
    query('SELECT * FROM expenses ORDER BY expense_date DESC, id DESC LIMIT 5'),
    query(
      `SELECT COUNT(*)::int AS count FROM reminders WHERE paid = FALSE AND due_date = $1`,
      [today]
    ),
    getLimits(),
    getSavings(),
  ]);

  const t = totals.rows[0];
  return {
    totalExpenses: t.total_expenses,
    todayExpenses: t.today_expenses,
    weekExpenses: t.week_expenses,
    monthlyExpenses: t.monthly_expenses,
    averageExpense: Math.round(t.average_expense * 100) / 100,
    expenseCount: t.expense_count,
    categoryBreakdown: breakdown.rows,
    recentTransactions: recent.rows,
    billsDueToday: dueToday.rows[0].count,
    limits,
    savings,
  };
}

export async function getCharts() {
  const today = todayStr();
  const monthStart = monthStartStr();

  const [daily, monthly, distribution] = await Promise.all([
    // Spending per day for the last 7 days (zero-filled via generate_series)
    query(
      `SELECT d::date::text AS date, COALESCE(SUM(e.amount), 0)::float AS total
       FROM generate_series($1::date - 6, $1::date, '1 day') AS d
       LEFT JOIN expenses e ON e.expense_date = d::date
       GROUP BY d
       ORDER BY d`,
      [today]
    ),
    // Spending per month for the last 6 months (zero-filled)
    query(
      `SELECT to_char(m, 'YYYY-MM') AS month, COALESCE(SUM(e.amount), 0)::float AS total
       FROM generate_series(
         date_trunc('month', $1::date) - INTERVAL '5 months',
         date_trunc('month', $1::date),
         '1 month'
       ) AS m
       LEFT JOIN expenses e ON date_trunc('month', e.expense_date) = m
       GROUP BY m
       ORDER BY m`,
      [today]
    ),
    // Current-month category distribution with percentage share
    query(
      `SELECT category,
              SUM(amount)::float AS total,
              ROUND(100.0 * SUM(amount) / NULLIF(SUM(SUM(amount)) OVER (), 0), 1)::float AS percentage
       FROM expenses
       WHERE expense_date >= $1
       GROUP BY category
       ORDER BY total DESC`,
      [monthStart]
    ),
  ]);

  return {
    dailyTrend: daily.rows,
    monthlyTrend: monthly.rows,
    categoryDistribution: distribution.rows,
  };
}
