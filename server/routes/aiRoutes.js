import express from 'express';
import { getAiBusinessAdvice } from '../controllers/aiAdvisorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/advisor', getAiBusinessAdvice);

export default router;
