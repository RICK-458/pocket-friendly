import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import ApiError from '../utils/ApiError.js';

function signToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new ApiError(503, 'JWT_SECRET is not configured — set it in backend/.env and restart');
  }
  return jwt.sign(
    { sub: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

const PUBLIC_USER = 'id, name, email, created_at';

export async function register({ name, email, password }) {
  const normalized = email.toLowerCase().trim();

  const existing = await query('SELECT id FROM users WHERE email = $1', [normalized]);
  if (existing.rows.length) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING ${PUBLIC_USER}`,
    [name.trim(), normalized, passwordHash]
  );
  const user = rows[0];
  return { user, token: signToken(user) };
}

export async function login({ email, password }) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  const row = rows[0];

  // Same error for unknown email and wrong password — don't leak which one
  const valid = row && (await bcrypt.compare(password, row.password_hash));
  if (!valid) throw new ApiError(401, 'Invalid email or password');

  const user = { id: row.id, name: row.name, email: row.email, created_at: row.created_at };
  return { user, token: signToken(user) };
}

export async function getUserById(id) {
  const { rows } = await query(`SELECT ${PUBLIC_USER} FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}
