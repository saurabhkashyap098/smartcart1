const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { addToCartRules, validate } = require('../middleware/validate');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');

// All cart routes require authentication
router.use(protect);

router.get('/', getCart);
router.post('/', addToCartRules, validate, addToCart);
router.put('/:productId', updateCartItem);   // update quantity
router.delete('/', clearCart);
router.delete('/:productId', removeFromCart);

module.exports = router;
