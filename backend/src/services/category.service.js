import { query } from '../config/db.js';

export async function listCategories() {
  const { rows } = await query('SELECT id, name, color FROM categories ORDER BY id');
  return rows;
}
