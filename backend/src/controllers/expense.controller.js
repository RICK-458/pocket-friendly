import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/response.js';
import * as expenseService from '../services/expense.service.js';

export const listExpenses = asyncHandler(async (req, res) => {
  const { page, limit, search, category, startDate, endDate, sortBy, order } = req.query;
  const result = await expenseService.listExpenses({
    page, limit, search, category, startDate, endDate, sortBy, order,
  });
  ok(res, result, 'Expenses fetched');
});

export const getExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.getExpenseById(req.params.id);
  if (!expense) throw ApiError.notFound('Expense not found');
  ok(res, expense, 'Expense fetched');
});

export const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.body);
  created(res, expense, 'Expense created');
});

export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.updateExpense(req.params.id, req.body);
  if (!expense) throw ApiError.notFound('Expense not found');
  ok(res, expense, 'Expense updated');
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const deleted = await expenseService.deleteExpense(req.params.id);
  if (!deleted) throw ApiError.notFound('Expense not found');
  ok(res, { id: Number(req.params.id) }, 'Expense deleted');
});

export const bulkDeleteExpenses = asyncHandler(async (req, res) => {
  const deletedCount = await expenseService.bulkDeleteExpenses(req.body.ids);
  ok(res, { deletedCount }, `${deletedCount} expense(s) deleted`);
});
