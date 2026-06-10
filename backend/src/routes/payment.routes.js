import { Router } from 'express';
import { body, param, query } from 'express-validator';
import validate from '../middleware/validate.js';
import * as ctrl from '../controllers/payment.controller.js';

const router = Router();

router.post(
  '/create-order',
  [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0').toFloat(),
    body('recipient_name').optional({ nullable: true }).isString().trim()
      .isLength({ max: 255 }).withMessage('recipient_name must be at most 255 characters'),
    body('note').optional({ nullable: true }).isString(),
  ],
  validate,
  ctrl.createOrder
);

router.post(
  '/verify',
  [
    body('razorpay_order_id').isString().trim().notEmpty().withMessage('razorpay_order_id is required'),
    body('razorpay_payment_id').isString().trim().notEmpty().withMessage('razorpay_payment_id is required'),
    body('razorpay_signature').isString().trim().notEmpty().withMessage('razorpay_signature is required'),
  ],
  validate,
  ctrl.verifyPayment
);

router.post(
  '/mark-failed',
  [
    body('razorpay_order_id').isString().trim().notEmpty().withMessage('razorpay_order_id is required'),
    body('reason').optional({ nullable: true }).isString(),
  ],
  validate,
  ctrl.markFailed
);

router.get(
  '/history',
  [
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be 1-200').toInt(),
    query('status').optional().isIn(['pending', 'success', 'failed']).withMessage('invalid status'),
  ],
  validate,
  ctrl.getHistory
);

router.get(
  '/:id(\\d+)',
  [param('id').isInt({ min: 1 }).toInt()],
  validate,
  ctrl.getPayment
);

export default router;
