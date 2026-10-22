
const express = require('express');
const router = express.Router();

const {
  createProduct,
  getProducts,
  getMyProducts,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

const authMiddleware = require('../middleware/authMiddleware');

// Public: View all products
router.get('/', getProducts);

// Protected: View your own products
router.get('/my', authMiddleware, getMyProducts);

// Protected: Add a product
router.post('/', authMiddleware, createProduct);

// Protected: Update your own product
router.put('/:id', authMiddleware, updateProduct);

// Protected: Delete your own product
router.delete('/:id', authMiddleware, deleteProduct);

module.exports = router;
