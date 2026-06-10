import { Router } from 'express';
import * as ctrl from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/summary', ctrl.getSummary);
router.get('/charts', ctrl.getCharts);

export default router;
