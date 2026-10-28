import express from 'express';
import { body } from 'express-validator';
import { register, login, logout, getMe, updateStoreProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validateRequest,
  ],
  register
);

router.post(
  '/login',
  [
    body().custom((value, { req }) => {
      const identifier = (req.body.email || req.body.identifier || '').toString().trim();
      if (!identifier) {
        throw new Error('Please enter your email address or 10-digit mobile number');
      }
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const isPhone = /^\d{10}$/.test(identifier);
      if (!isEmail && !isPhone) {
        throw new Error('Please provide a valid email address or 10-digit mobile number');
      }
      return true;
    }),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest,
  ],
  login
);

router.post('/logout', logout);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateStoreProfile);

export default router;
