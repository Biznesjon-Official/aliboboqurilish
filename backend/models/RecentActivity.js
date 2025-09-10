const mongoose = require('mongoose');

const recentActivitySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['buyurtmalar', 'mahsulotlar', 'ustalar']
  },
  icon: {
    type: String,
    required: true
  },
  iconBg: {
    type: String,
    required: true
  },
  iconColor: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  desc: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  timestamp: {
    type: Number,
    required: true,
    default: Date.now
  },
  entityType: {
    type: String,
    required: true,
    enum: ['product', 'order', 'craftsman']
  },
  entityId: {
    type: String,
    required: true
  },
  entityName: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
recentActivitySchema.index({ createdAt: -1 });
recentActivitySchema.index({ category: 1 });
recentActivitySchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('RecentActivity', recentActivitySchema);