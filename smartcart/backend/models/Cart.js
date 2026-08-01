const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:          { type: String, required: true },
  image:         { type: String, default: '' },
  price:         { type: Number, required: true },
  originalPrice: { type: Number, default: 0 },
  seller:        { type: String, default: 'SmartCart' },
  quantity:      { type: Number, required: true, min: 1, default: 1 },
});

const cartSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items:         [cartItemSchema],
  itemsTotal:    { type: Number, default: 0 },
  shippingCharge:{ type: Number, default: 0 },
  totalAmount:   { type: Number, default: 0 },
  totalItems:    { type: Number, default: 0 },
}, { timestamps: true });

cartSchema.methods.calcTotal = function () {
  this.itemsTotal    = this.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  this.totalItems    = this.items.reduce((acc, i) => acc + i.quantity, 0);
  this.shippingCharge= this.itemsTotal > 500 ? 0 : 49;
  this.totalAmount   = this.itemsTotal + this.shippingCharge;
};

module.exports = mongoose.model('Cart', cartSchema);
