const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createOrderRules, verifyPaymentRules, updateOrderStatusRules,
  razorpayOrderRules, cancelOrderRules, validate,
} = require('../middleware/validate');
const {
  createOrder, createRazorpayOrder, verifyPayment,
  getMyOrders, getOrder, getAllOrders, updateOrderStatus,
  cancelOrder, getOrderStats,
} = require('../controllers/orderController');

// All order routes require authentication
router.use(protect);

router.post('/', createOrderRules, validate, createOrder);
router.post('/create-razorpay-order', razorpayOrderRules, validate, createRazorpayOrder);
router.get('/my-orders', getMyOrders);
router.get('/stats', authorize('admin'), getOrderStats);
router.get('/', authorize('admin'), getAllOrders);
router.get('/:id', getOrder);
router.post('/:id/pay', verifyPaymentRules, validate, verifyPayment);
router.put('/:id/cancel', cancelOrderRules, validate, cancelOrder);
router.put('/:id/status', authorize('admin'), updateOrderStatusRules, validate, updateOrderStatus);

module.exports = router;
