import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

// Runs after express-validator chains; turns violations into a 400 response.
export default function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  next(ApiError.badRequest('Validation failed', errors));
}
