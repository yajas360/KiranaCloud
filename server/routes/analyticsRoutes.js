import express from 'express';
import {
  getDashboardMetrics,
  getDayCloseSummary,
  submitDayClose,
  getDayCloseHistory,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/metrics', getDashboardMetrics);
router.get('/day-close/summary', getDayCloseSummary);
router.post('/day-close', submitDayClose);
router.get('/day-close/history', getDayCloseHistory);

export default router;
