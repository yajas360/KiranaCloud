import express from 'express';
import { body } from 'express-validator';
import {
  createSale,
  getSales,
  getSaleById,
  voidSale,
} from '../controllers/saleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSales)
  .post(
    [
      body('items').isArray({ min: 1 }).withMessage('Cart must contain at least one item'),
      body('items.*.productId').notEmpty().withMessage('Product ID is required for each cart item'),
      body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be an integer >= 1'),
      validateRequest,
    ],
    createSale
  );

router.route('/:id')
  .get(getSaleById);

router.post('/:id/void', voidSale);

export default router;
