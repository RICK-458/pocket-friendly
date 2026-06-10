import { Router } from 'express';
import { body, param, query } from 'express-validator';
import validate from '../middleware/validate.js';
import * as ctrl from '../controllers/expense.controller.js';

const router = Router();

const idParam = param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt();

const listRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('limit must be 1-500').toInt(),
  query('search').optional().isString().trim(),
  query('category').optional().isString().trim(),
  query('startDate').optional().isISO8601().withMessage('startDate must be YYYY-MM-DD'),
  query('endDate').optional().isISO8601().withMessage('endDate must be YYYY-MM-DD'),
  query('sortBy').optional().isIn(['expense_date', 'amount', 'created_at', 'title', 'category'])
    .withMessage('invalid sortBy'),
  query('order').optional().isIn(['asc', 'desc', 'ASC', 'DESC']).withMessage('order must be asc or desc'),
];

const createRules = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 255 }).withMessage('Title must be at most 255 characters'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0').toFloat(),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('expense_date').optional().isISO8601().withMessage('expense_date must be a valid date (YYYY-MM-DD)'),
  body('notes').optional({ nullable: true }).isString().withMessage('notes must be a string'),
];

const updateRules = [
  idParam,
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 255 }).withMessage('Title must be at most 255 characters'),
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be greater than 0').toFloat(),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('expense_date').optional().isISO8601().withMessage('expense_date must be a valid date (YYYY-MM-DD)'),
  body('notes').optional({ nullable: true }).isString().withMessage('notes must be a string'),
];

const bulkDeleteRules = [
  body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
  body('ids.*').isInt({ min: 1 }).withMessage('each id must be a positive integer').toInt(),
];

router.get('/', listRules, validate, ctrl.listExpenses);
router.post('/', createRules, validate, ctrl.createExpense);
router.delete('/', bulkDeleteRules, validate, ctrl.bulkDeleteExpenses);
router.get('/:id', idParam, validate, ctrl.getExpense);
router.put('/:id', updateRules, validate, ctrl.updateExpense);
router.delete('/:id', idParam, validate, ctrl.deleteExpense);

export default router;
