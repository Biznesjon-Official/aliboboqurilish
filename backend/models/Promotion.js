const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  price: {
    type: String
  },
  originalPrice: {
    type: String
  },
  description: {
    type: String
  },
  image: {
    type: String, // Can be emoji or image URL
    default: '🎯'
  },
  backgroundImage: {
    type: String, // URL for background image
    trim: true
  },
  backgroundColor: {
    type: String,
    default: 'promo-bg-sale'
  },
  textColor: {
    type: String,
    default: 'text-white'
  },
  badge: {
    type: String,
    enum: ['ISSIQ', 'YANGI', 'CHEGIRMA', 'TOP', 'CHEKLANGAN'],
    default: 'CHEGIRMA'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  priority: {
    type: Number,
    default: 0 // Higher numbers appear first
  },
  clickCount: {
    type: Number,
    default: 0
  },
  targetUrl: {
    type: String // URL to redirect when clicked
  },
  category: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
promotionSchema.index({ isActive: 1, priority: -1, createdAt: -1 });
promotionSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Promotion', promotionSchema);