const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { 
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Validation rules
const productValidation = [
  body('name').notEmpty().trim(),
  body('batchNumber').notEmpty(),
  body('expiryDate').isISO8601(),
  body('quantity').isInt({ min: 0 }),
  body('price').isFloat({ min: 0 }),
  body('company').notEmpty(),
  body('warehouseId').notEmpty()
];

// All routes require authentication
router.use(authenticate);

// Stats route (before /:id to avoid conflict)
router.get('/stats', getProductStats);

// CRUD routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorize('ADMIN', 'MANAGER'), productValidation, createProduct);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateProduct);
router.delete('/:id', authorize('ADMIN'), deleteProduct);

module.exports = router;