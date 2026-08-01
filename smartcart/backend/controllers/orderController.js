const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const {
  sendOrderConfirmationEmail,
  sendOrderCancellationEmail,
  sendOrderStatusUpdateEmail,
} = require('../utils/emailService');

// @desc   Create order
// @route  POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Validate stock
    for (const item of cart.items) {
      if (!item.product || !item.product.isActive) {
        return res.status(400).json({ success: false, message: `Product ${item.product?.name || ''} is unavailable` });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${item.product.name}` });
      }
    }

    const itemsPrice = cart.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const shippingPrice = itemsPrice > 500 ? 0 : 49;
    const taxPrice = Math.round(itemsPrice * 0.18 * 100) / 100;
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    // Build payment fields
    const isRazorpay = ['Razorpay', 'razorpay'].includes(paymentMethod);
    const paymentResult = isRazorpay && req.body.razorpayPaymentId
      ? {
          razorpay_order_id:   req.body.razorpayOrderId,
          razorpay_payment_id: req.body.razorpayPaymentId,
          razorpay_signature:  req.body.razorpaySignature,
          status: 'paid',
        }
      : undefined;

    const order = await Order.create({
      user: req.user._id,
      items: cart.items.map(i => ({
        product: i.product._id,
        name: i.product.name,
        image: i.product.images?.[0] || '',
        price: i.price,
        quantity: i.quantity,
      })),
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      ...(paymentResult && { paymentResult, isPaid: true, paidAt: new Date(), status: 'confirmed' }),
    });

    // Reduce stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
    }

    // Clear cart
    await Cart.findOneAndDelete({ user: req.user._id });

    // ── Send order confirmation email (non-blocking) ──────────────────────
    try {
      const user = await User.findById(req.user._id).select('name email');
      if (user && user.email) {
        await sendOrderConfirmationEmail({
          email: user.email,
          name:  user.name,
          order,
        });
      }
    } catch (emailErr) {
      console.error('[Email] Order confirmation failed:', emailErr.message);
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc   Create Razorpay order
// @route  POST /api/orders/create-razorpay-order
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100), // in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Return the fields that the frontend checkout.html expects
    res.status(200).json({
      success: true,
      keyId:   process.env.RAZORPAY_KEY_ID,
      amount:  razorpayOrder.amount,
      orderId: razorpayOrder.id,
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Verify Razorpay payment & mark order paid
// @route  POST /api/orders/:id/pay
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        isPaid: true,
        paidAt: new Date(),
        status: 'confirmed',
        paymentResult: { razorpay_order_id, razorpay_payment_id, razorpay_signature, status: 'paid' },
      },
      { new: true }
    );

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc   Cancel order (user)
// @route  PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Only owner can cancel
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${order.status} order` });
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    order.status = 'cancelled';
    order.cancelReason = req.body.reason || 'Cancelled by customer';
    await order.save();

    // ── Send cancellation email (non-blocking) ────────────────────────────
    try {
      const user = await User.findById(order.user).select('name email');
      if (user && user.email) {
        await sendOrderCancellationEmail({
          email: user.email,
          name:  user.name,
          order,
        });
      }
    } catch (emailErr) {
      console.error('[Email] Order cancellation email failed:', emailErr.message);
    }

    res.status(200).json({ success: true, message: 'Order cancelled successfully', order });
  } catch (err) {
    next(err);
  }
};

// @desc   Get my orders
// @route  GET /api/orders/my-orders
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
};

// @desc   Get single order
// @route  GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Only owner or admin can view
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc   Get all orders (admin)
// @route  GET /api/orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({ success: true, total, orders });
  } catch (err) {
    next(err);
  }
};

// @desc   Update order status (admin)
// @route  PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const update = { status };

    if (status === 'delivered') {
      update.isDelivered = true;
      update.deliveredAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true }).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // ── Send status update email (non-blocking) ───────────────────────────
    try {
      if (order.user && order.user.email) {
        await sendOrderStatusUpdateEmail({
          email: order.user.email,
          name:  order.user.name,
          order,
        });
      }
    } catch (emailErr) {
      console.error('[Email] Status update email failed:', emailErr.message);
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc   Get order stats (admin)
// @route  GET /api/orders/stats
exports.getOrderStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: { totalOrders, pendingOrders, deliveredOrders, cancelledOrders, totalRevenue },
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
};
