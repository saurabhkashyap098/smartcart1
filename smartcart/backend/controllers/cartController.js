const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper – return a clean cart response with computed totals
async function getCleanCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  return cart;
}

// @desc   Get cart
// @route  GET /api/cart
exports.getCart = async (req, res, next) => {
  try {
    const cart = await getCleanCart(req.user._id);
    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: { items: [], itemsTotal: 0, shippingCharge: 0, totalAmount: 0, totalItems: 0 },
      });
    }
    res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

// @desc   Add / update item in cart
// @route  POST /api/cart
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIdx = cart.items.findIndex(i => i.product.toString() === productId);

    if (existingIdx !== -1) {
      cart.items[existingIdx].quantity      = quantity;
      cart.items[existingIdx].price         = product.price;
      cart.items[existingIdx].originalPrice = product.originalPrice || product.price;
      cart.items[existingIdx].name          = product.name;
      cart.items[existingIdx].image         = product.images?.[0] || '';
      cart.items[existingIdx].seller        = product.seller || 'SmartCart';
    } else {
      cart.items.push({
        product:       productId,
        name:          product.name,
        image:         product.images?.[0] || '',
        price:         product.price,
        originalPrice: product.originalPrice || product.price,
        seller:        product.seller || 'SmartCart',
        quantity,
      });
    }

    cart.calcTotal();
    await cart.save();

    res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

// @desc   Update item quantity
// @route  PUT /api/cart/:productId
exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(req.params.productId);
    if (!product || product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const item = cart.items.find(i => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not in cart' });

    item.quantity = quantity;
    cart.calcTotal();
    await cart.save();

    res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

// @desc   Remove item from cart
// @route  DELETE /api/cart/:productId
exports.removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
    cart.calcTotal();
    await cart.save();

    res.status(200).json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

// @desc   Clear cart
// @route  DELETE /api/cart
exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
};
