const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createProductRules, reviewRules, productQueryRules, validate,
} = require('../middleware/validate');
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  addReview, getCategories, getBrands, getFeatured, getAdminStats,
} = require('../controllers/productController');

// Public
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/featured', getFeatured);
router.get('/', productQueryRules, validate, getProducts);
router.get('/:id', getProduct);

// Admin only
router.get('/admin/stats', protect, authorize('admin'), getAdminStats);
router.post('/', protect, authorize('admin'), createProductRules, validate, createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

// Authenticated
router.post('/:id/review', protect, reviewRules, validate, addReview);

module.exports = router;
