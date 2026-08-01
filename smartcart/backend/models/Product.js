const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:    { type: String, required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [300, 'Name cannot exceed 300 characters'],
  },
  description:   { type: String, required: [true, 'Description is required'] },
  price:         { type: Number, required: [true, 'Price is required'], min: 0 },
  originalPrice: { type: Number, min: 0 },
  discount:      { type: Number, default: 0, min: 0, max: 100 },
  category: {
    type: String,
    required: [true, 'Category is required'],
    // Accept any string; enum removed to allow seed flexibility
  },
  subcategory:  { type: String },
  brand:        { type: String, required: true },
  seller:       { type: String, default: 'SmartCart Official' },
  images:       [{ type: String }],
  highlights:   [{ type: String }],
  stock:        { type: Number, required: true, default: 0, min: 0 },
  reviews:      [reviewSchema],
  rating:       { type: Number, default: 0 },
  numReviews:   { type: Number, default: 0 },
  featured:     { type: Boolean, default: false },   // used by seed 'isFeatured' alias below
  isFeatured:   { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  tags:         [{ type: String }],
  specifications: { type: Map, of: String },
  warranty:     { type: String },
  deliveryDays: { type: Number, default: 5 },
  emi:          { type: Boolean, default: false },
}, { timestamps: true });

// Sync featured ↔ isFeatured pre-save
productSchema.pre('save', function (next) {
  if (this.isFeatured) this.featured = true;
  if (this.featured) this.isFeatured = true;
  next();
});

// Update rating on review change
productSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    this.numReviews = this.reviews.length;
    this.rating = this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
  }
};

module.exports = mongoose.model('Product', productSchema);
