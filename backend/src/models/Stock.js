const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 6,
    match: /^[A-Z]+$/
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  price: {
    type: Number,
    required: true,
    min: 0.01,
    default: 10.00
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerUsername: {
    type: String,
    required: true
  },
  priceHistory: {
    type: [Number],
    default: []
  },
  totalShares: {
    type: Number,
    default: 1000000 
  }
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);
