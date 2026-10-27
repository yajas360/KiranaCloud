import express from 'express';
import { body } from 'express-validator';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
  getReorderSheet,
  exportProductsCSV,
  bulkImportProducts,
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = express.Router();

router.use(protect);

router.get('/reorder-sheet', getReorderSheet);
router.get('/export-csv', exportProductsCSV);
router.post('/bulk-import', bulkImportProducts);

router.route('/')
  .get(getProducts)
  .post(
    [
      body('name').trim().notEmpty().withMessage('Product name is required'),
      body('costPrice').isFloat({ min: 0 }).withMessage('Cost price must be non-negative'),
      body('sellingPrice').isFloat({ min: 0 }).withMessage('Selling price must be non-negative'),
      body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock must be an integer >= 0'),
      validateRequest,
    ],
    createProduct
  );

router.route('/:id')
  .get(getProductById)
  .patch(updateProduct)
  .delete(deleteProduct);

router.post('/:id/restock', restockProduct);

export default router;
