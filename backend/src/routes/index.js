import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import authRoutes from './auth.routes.js';
import expenseRoutes from './expense.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import reminderRoutes from './reminder.routes.js';
import settingsRoutes from './settings.routes.js';
import transactionRoutes from './transaction.routes.js';
import paymentRoutes from './payment.routes.js';
import categoryRoutes from './category.routes.js';

const router = Router();

// Public
router.use('/auth', authRoutes);

// Everything below requires a valid JWT — data is isolated per req.user.id
router.use('/expenses', requireAuth, expenseRoutes);
router.use('/dashboard', requireAuth, dashboardRoutes);
router.use('/reminders', requireAuth, reminderRoutes);
router.use('/settings', requireAuth, settingsRoutes);
// Razorpay endpoints first (create-order, verify, history, :id);
// unmatched paths fall through to the transaction routes (GET /, POST /)
router.use('/payments', requireAuth, paymentRoutes);
router.use('/payments', requireAuth, transactionRoutes);
router.use('/categories', requireAuth, categoryRoutes);

export default router;
