import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as ctrl from '../controllers/auth.controller.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required')
      .isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),
    body('email').trim().isEmail().withMessage('A valid email is required')
      .isLength({ max: 255 }).withMessage('Email must be at most 255 characters'),
    body('password').isString().isLength({ min: 6, max: 72 })
      .withMessage('Password must be 6-72 characters'),
  ],
  validate,
  ctrl.register
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('A valid email is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ],
  validate,
  ctrl.login
);

router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);

export default router;
