import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import * as settingsService from '../services/settings.service.js';

export const getLimits = asyncHandler(async (req, res) => {
  ok(res, await settingsService.getLimits(req.user.id), 'Limits fetched');
});

export const updateLimits = asyncHandler(async (req, res) => {
  ok(res, await settingsService.updateLimits(req.user.id, req.body), 'Limits updated');
});

export const getSavings = asyncHandler(async (req, res) => {
  ok(res, await settingsService.getSavings(req.user.id), 'Savings fetched');
});

export const setSavings = asyncHandler(async (req, res) => {
  ok(res, await settingsService.setSavings(req.user.id, req.body.total), 'Savings updated');
});

export const addSavings = asyncHandler(async (req, res) => {
  ok(res, await settingsService.addSavings(req.user.id, req.body.amount), 'Savings added');
});
