import { Router } from 'express';
import { body, query } from 'express-validator';
import validate from '../middleware/validate.js';
import * as ctrl from '../controllers/transaction.controller.js';

const router = Router();

// NOTE: raw card numbers / CVVs must never be sent here — the client sends a
// masked card ("**** 1234") or a UPI id as `recipient`.
const paymentRules = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0').toFloat(),
  body('method').isIn(['upi', 'card']).withMessage('method must be upi or card'),
  body('recipient').trim().notEmpty().withMessage('recipient is required')
    .isLength({ max: 255 }).withMessage('recipient must be at most 255 characters')
    .custom((v) => !/^\d{12,19}$/.test(v.replace(/\s/g, '')))
    .withMessage('recipient looks like a raw card number — send a masked value instead'),
  body('recipient_name').optional({ nullable: true }).isString().trim()
    .isLength({ max: 255 }).withMessage('recipient_name must be at most 255 characters'),
  body('note').optional({ nullable: true }).isString(),
];

router.get(
  '/',
  [query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100').toInt()],
  validate,
  ctrl.listTransactions
);
router.post('/', paymentRules, validate, ctrl.createPayment);

export default router;
