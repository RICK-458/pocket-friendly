import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import * as categoryService from '../services/category.service.js';

export const listCategories = asyncHandler(async (req, res) => {
  ok(res, await categoryService.listCategories(), 'Categories fetched');
});
