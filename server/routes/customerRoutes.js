import express from 'express';
import { body } from 'express-validator';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  recordPayment,
  deleteCustomer,
} from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCustomers)
  .post(
    [
      body('name').trim().notEmpty().withMessage('Customer name is required'),
      body('phone').trim().notEmpty().withMessage('Phone number is required'),
      validateRequest,
    ],
    createCustomer
  );

router.route('/:id')
  .get(getCustomerById)
  .delete(deleteCustomer);

router.post(
  '/:id/payment',
  [
    body('amount').isFloat({ gt: 0 }).withMessage('Payment amount must be greater than zero'),
    validateRequest,
  ],
  recordPayment
);

export default router;
