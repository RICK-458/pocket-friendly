import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import * as settingsService from '../services/settings.service.js';

export const getLimits = asyncHandler(async (req, res) => {
  ok(res, await settingsService.getLimits(), 'Limits fetched');
});

export const updateLimits = asyncHandler(async (req, res) => {
  ok(res, await settingsService.updateLimits(req.body), 'Limits updated');
});

export const getSavings = asyncHandler(async (req, res) => {
  ok(res, await settingsService.getSavings(), 'Savings fetched');
});

export const setSavings = asyncHandler(async (req, res) => {
  ok(res, await settingsService.setSavings(req.body.total), 'Savings updated');
});

export const addSavings = asyncHandler(async (req, res) => {
  ok(res, await settingsService.addSavings(req.body.amount), 'Savings added');
});
