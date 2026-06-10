import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';
import * as transactionService from '../services/transaction.service.js';

export const listTransactions = asyncHandler(async (req, res) => {
  const limit = req.query.limit || 20;
  ok(res, await transactionService.listTransactions(req.user.id, limit), 'Transactions fetched');
});

export const createPayment = asyncHandler(async (req, res) => {
  const result = await transactionService.createPayment(req.user.id, req.body);
  created(res, result, 'Payment recorded');
});
