import { Router } from 'express';
import expenseRoutes from './expense.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import reminderRoutes from './reminder.routes.js';
import settingsRoutes from './settings.routes.js';
import transactionRoutes from './transaction.routes.js';
import paymentRoutes from './payment.routes.js';
import categoryRoutes from './category.routes.js';

const router = Router();

router.use('/expenses', expenseRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reminders', reminderRoutes);
router.use('/settings', settingsRoutes);
// Razorpay endpoints first (create-order, verify, history, :id);
// unmatched paths fall through to the transaction routes (GET /, POST /)
router.use('/payments', paymentRoutes);
router.use('/payments', transactionRoutes);
router.use('/categories', categoryRoutes);

export default router;
