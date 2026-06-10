import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import * as dashboardService from '../services/dashboard.service.js';

export const getSummary = asyncHandler(async (req, res) => {
  ok(res, await dashboardService.getSummary(), 'Dashboard summary');
});

export const getCharts = asyncHandler(async (req, res) => {
  ok(res, await dashboardService.getCharts(), 'Dashboard charts');
});
