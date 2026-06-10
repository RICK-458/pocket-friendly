import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok, created } from '../utils/response.js';
import * as authService from '../services/auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  created(res, result, 'Account created');
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  ok(res, result, 'Logged in');
});

// JWTs are stateless — logout just acknowledges; the client discards the token.
export const logout = asyncHandler(async (req, res) => {
  ok(res, null, 'Logged out');
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.id);
  if (!user) throw new ApiError(401, 'Account no longer exists');
  ok(res, user, 'Current user');
});
