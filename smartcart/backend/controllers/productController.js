const Product = require('../models/Product');

// @desc   Get all products (with search, filter, pagination)
// @route  GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    const { keyword, search, category, brand, minPrice, maxPrice, rating, sort, page = 1, limit = 12, featured, isActive } = req.query;

    const query = {};
    // isActive filter: default to active only; pass isActive=all to see everything (admin)
    if (isActive === 'all') { /* no filter */ } else { query.isActive = true; }

    const kw = keyword || search;
    if (kw) query.name = { $regex: kw, $options: 'i' };
    if (category) query.category = { $regex: `^${category}$`, $options: 'i' };
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (rating) query.rating = { $gte: Number(rating) };
    if (featured === 'true') query.$or = [{ featured: true }, { isFeatured: true }];

    const sortMap = {
      'price-asc':  { price: 1 },
      'price-desc': { price: -1 },
      'rating':     { rating: -1 },
      'newest':     { createdAt: -1 },
      'popular':    { numReviews: -1 },
    };
    const sortOption = sortMap[sort] || { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortOption).skip(skip).limit(Number(limit));

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      products,
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Get single product
// @route  GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('reviews.user', 'name avatar');
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// @desc   Create product (admin)
// @route  POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// @desc   Update product (admin)
// @route  PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

// @desc   Delete product (admin - soft delete)
// @route  DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc   Add review
// @route  POST /api/products/:id/review
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Check if already reviewed
    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'Product already reviewed' });
    }

    product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
    product.updateRating();
    await product.save();

    res.status(201).json({ success: true, message: 'Review added', rating: product.rating, numReviews: product.numReviews });
  } catch (err) {
    next(err);
  }
};

// @desc   Get all categories
// @route  GET /api/products/categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.status(200).json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

// @desc   Get all brands
// @route  GET /api/products/brands
exports.getBrands = async (req, res, next) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });
    res.status(200).json({ success: true, brands });
  } catch (err) {
    next(err);
  }
};

// @desc   Get featured products
// @route  GET /api/products/featured
exports.getFeatured = async (req, res, next) => {
  try {
    const products = await Product.find({ featured: true, isActive: true }).limit(8);
    res.status(200).json({ success: true, products });
  } catch (err) {
    next(err);
  }
};

// @desc   Get admin dashboard stats
// @route  GET /api/products/admin-stats
exports.getAdminStats = async (req, res, next) => {
  try {
    const total = await Product.countDocuments({ isActive: true });
    const outOfStock = await Product.countDocuments({ isActive: true, stock: 0 });
    const byCategory = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.status(200).json({ success: true, total, outOfStock, byCategory });
  } catch (err) {
    next(err);
  }
};
