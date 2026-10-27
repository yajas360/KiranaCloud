import express from 'express';
import { getDashboardMetrics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/metrics', getDashboardMetrics);

export default router;
