import pg from 'pg';

const { Pool, types } = pg;

// Return DATE columns as plain 'YYYY-MM-DD' strings (the format the frontend uses)
types.setTypeParser(types.builtins.DATE, (v) => v);
// Return DECIMAL/NUMERIC columns as numbers instead of strings
types.setTypeParser(types.builtins.NUMERIC, (v) => (v === null ? null : parseFloat(v)));

export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool(); // falls back to PGHOST / PGPORT / PGUSER / PGPASSWORD / PGDATABASE

pool.on('error', (err) => console.error('Unexpected PG pool error:', err));

export const query = (text, params) => pool.query(text, params);
