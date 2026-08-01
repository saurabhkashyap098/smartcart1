const { body, param, query, validationResult } = require('express-validator');

// Helper – runs after validation rules and returns 422 if any errors
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth ────────────────────────────────────────────────────────────────────

exports.registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
];

exports.loginRules = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

exports.addressRules = [
  body('name').trim().notEmpty().withMessage('Address name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode').trim().notEmpty().withMessage('Pincode is required'),
];

exports.forgotPasswordRules = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
];

exports.resetPasswordRules = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  param('token').notEmpty().withMessage('Reset token is required'),
];

exports.cancelOrderRules = [
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason too long'),
];

// ─── Product ─────────────────────────────────────────────────────────────────

exports.createProductRules = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

exports.reviewRules = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment').trim().notEmpty().withMessage('Review comment is required'),
];

exports.productQueryRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be non-negative'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be non-negative'),
];

// ─── Cart ────────────────────────────────────────────────────────────────────

exports.addToCartRules = [
  body('productId').notEmpty().withMessage('productId is required').isMongoId().withMessage('Invalid productId'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

// ─── Order ───────────────────────────────────────────────────────────────────

exports.createOrderRules = [
  body('shippingAddress.name').trim().notEmpty().withMessage('Shipping name is required'),
  body('shippingAddress.phone').trim().notEmpty().withMessage('Shipping phone is required'),
  body('shippingAddress.addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
  body('shippingAddress.pincode').trim().notEmpty().withMessage('Pincode is required'),
  body('paymentMethod')
    .isIn(['Razorpay', 'COD', 'razorpay', 'cod'])
    .withMessage("Payment method must be 'Razorpay' or 'COD'"),
];

exports.verifyPaymentRules = [
  body('razorpay_order_id').notEmpty().withMessage('razorpay_order_id is required'),
  body('razorpay_payment_id').notEmpty().withMessage('razorpay_payment_id is required'),
  body('razorpay_signature').notEmpty().withMessage('razorpay_signature is required'),
];

exports.updateOrderStatusRules = [
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
];

exports.razorpayOrderRules = [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
];
