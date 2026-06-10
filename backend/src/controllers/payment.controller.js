import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/response.js';
import * as paymentService from '../services/payment.service.js';

export const createOrder = asyncHandler(async (req, res) => {
  const result = await paymentService.createOrder(req.body);
  created(res, result, 'Order created');
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.verifyAndFinalize(req.body);
  ok(res, payment, 'Payment verified');
});

export const markFailed = asyncHandler(async (req, res) => {
  const payment = await paymentService.markFailed(req.body.razorpay_order_id, req.body.reason);
  ok(res, payment, 'Payment marked as failed');
});

export const getHistory = asyncHandler(async (req, res) => {
  const payments = await paymentService.listPayments({
    limit: req.query.limit || 50,
    status: req.query.status,
  });
  ok(res, payments, 'Payment history fetched');
});

export const getPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.id);
  if (!payment) throw ApiError.notFound('Payment not found');
  ok(res, payment, 'Payment fetched');
});
