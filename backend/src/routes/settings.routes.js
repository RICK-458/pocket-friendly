import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import * as ctrl from '../controllers/settings.controller.js';

const router = Router();

const limitsRules = [
  body('daily').optional().isFloat({ min: 0 }).withMessage('daily must be >= 0').toFloat(),
  body('weekly').optional().isFloat({ min: 0 }).withMessage('weekly must be >= 0').toFloat(),
  body('monthly').optional().isFloat({ min: 0 }).withMessage('monthly must be >= 0').toFloat(),
];

router.get('/limits', ctrl.getLimits);
router.put('/limits', limitsRules, validate, ctrl.updateLimits);

router.get('/savings', ctrl.getSavings);
router.put(
  '/savings',
  [body('total').isFloat({ min: 0 }).withMessage('total must be >= 0').toFloat()],
  validate,
  ctrl.setSavings
);
router.post(
  '/savings/add',
  [body('amount').isFloat({ gt: 0 }).withMessage('amount must be greater than 0').toFloat()],
  validate,
  ctrl.addSavings
);

export default router;
