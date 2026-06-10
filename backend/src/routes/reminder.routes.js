import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import * as ctrl from '../controllers/reminder.controller.js';

const router = Router();

const idParam = param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt();

const REPEATS = ['daily', 'weekly', 'monthly', 'yearly'];

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 255 }).withMessage('Name must be at most 255 characters'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0').toFloat(),
  body('due_date').isISO8601().withMessage('due_date must be a valid date (YYYY-MM-DD)'),
  body('repeat_cycle').optional().isIn(REPEATS).withMessage(`repeat_cycle must be one of: ${REPEATS.join(', ')}`),
];

const updateRules = [
  idParam,
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be greater than 0').toFloat(),
  body('due_date').optional().isISO8601().withMessage('due_date must be a valid date (YYYY-MM-DD)'),
  body('repeat_cycle').optional().isIn(REPEATS).withMessage(`repeat_cycle must be one of: ${REPEATS.join(', ')}`),
  body('paid').optional().isBoolean().withMessage('paid must be a boolean').toBoolean(),
];

router.get('/', ctrl.listReminders);
router.post('/', createRules, validate, ctrl.createReminder);
router.get('/:id', idParam, validate, ctrl.getReminder);
router.put('/:id', updateRules, validate, ctrl.updateReminder);
router.post('/:id/pay', idParam, validate, ctrl.payReminder);
router.delete('/:id', idParam, validate, ctrl.deleteReminder);

export default router;
