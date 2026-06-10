import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/response.js';
import * as reminderService from '../services/reminder.service.js';

export const listReminders = asyncHandler(async (req, res) => {
  ok(res, await reminderService.listReminders(req.user.id), 'Reminders fetched');
});

export const getReminder = asyncHandler(async (req, res) => {
  const reminder = await reminderService.getReminderById(req.user.id, req.params.id);
  if (!reminder) throw ApiError.notFound('Reminder not found');
  ok(res, reminder, 'Reminder fetched');
});

export const createReminder = asyncHandler(async (req, res) => {
  created(res, await reminderService.createReminder(req.user.id, req.body), 'Reminder created');
});

export const updateReminder = asyncHandler(async (req, res) => {
  const reminder = await reminderService.updateReminder(req.user.id, req.params.id, req.body);
  if (!reminder) throw ApiError.notFound('Reminder not found');
  ok(res, reminder, 'Reminder updated');
});

export const payReminder = asyncHandler(async (req, res) => {
  const reminder = await reminderService.markReminderPaid(req.user.id, req.params.id);
  if (!reminder) throw ApiError.notFound('Reminder not found');
  ok(res, reminder, 'Reminder marked as paid');
});

export const deleteReminder = asyncHandler(async (req, res) => {
  const deleted = await reminderService.deleteReminder(req.user.id, req.params.id);
  if (!deleted) throw ApiError.notFound('Reminder not found');
  ok(res, { id: Number(req.params.id) }, 'Reminder deleted');
});
