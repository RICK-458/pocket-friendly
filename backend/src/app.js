import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Built React app (repo-root /dist) — served when deployed as a single service
const distPath = path.resolve(__dirname, '../../dist');

const app = express();

// CSP disabled: the served frontend loads Razorpay Checkout from
// checkout.razorpay.com and uses inline styles, which the default policy blocks.
app.use(helmet({ contentSecurityPolicy: false }));
const corsOrigins = [
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];
app.use(cors({ origin: corsOrigins.length ? [...new Set(corsOrigins)] : true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'API is healthy', data: { uptime: process.uptime() } })
);

app.use('/api', routes);

// Single-service deployment: serve the frontend build + SPA fallback
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

export default app;
