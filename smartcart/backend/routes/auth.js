const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  registerRules, loginRules, changePasswordRules, addressRules,
  forgotPasswordRules, resetPasswordRules, validate,
} = require('../middleware/validate');
const {
  register, login, getMe, updateProfile, changePassword,
  addAddress, updateAddress, deleteAddress,
  toggleWishlist, getWishlist,
  forgotPassword, resetPassword,
  getAllUsers, toggleUser,
} = require('../controllers/authController');

// Public
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/forgot-password', forgotPasswordRules, validate, forgotPassword);
router.put('/reset-password/:token', resetPasswordRules, validate, resetPassword);

// Authenticated
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePasswordRules, validate, changePassword);
router.post('/address', protect, addressRules, validate, addAddress);
router.put('/address/:id', protect, addressRules, validate, updateAddress);
router.delete('/address/:id', protect, deleteAddress);
router.post('/wishlist/:productId', protect, toggleWishlist);
router.get('/wishlist', protect, getWishlist);

// Admin only
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id/toggle', protect, authorize('admin'), toggleUser);

module.exports = router;
