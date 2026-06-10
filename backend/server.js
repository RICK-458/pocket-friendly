import 'dotenv/config';
import app from './src/app.js';
import { pool } from './src/config/db.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Pocket-Friendly API listening on http://localhost:${PORT}`);
});

async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down…`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
