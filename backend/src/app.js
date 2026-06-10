import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
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

app.use(notFound);
app.use(errorHandler);

export default app;
