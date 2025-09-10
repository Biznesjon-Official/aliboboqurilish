const mongoose = require('mongoose');

const recentActivitySchema = new mongoose.Schema(
  {
    // High-level category buckets used in filters and stats
    category: {
      type: String,
      enum: ['buyurtmalar', 'mahsulotlar', 'ustalar'],
      required: true,
    },

    // Visual metadata for the activity item
    icon: { type: String },
    iconBg: { type: String },
    iconColor: { type: String },

    // Descriptive content
    title: { type: String, required: true },
    desc: { type: String },

    // Optional denormalized time fields used by the UI
    timestamp: { type: Number }, // milliseconds since epoch
    time: { type: String }, // human readable like "Hozir", "2 soat oldin"

    // Entity reference (soft link for flexibility across collections)
    entityType: { type: String }, // e.g., 'order', 'product', 'craftsman'
    entityId: { type: String },
    entityName: { type: String },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
    versionKey: false,
  }
);

// Useful index for sorting and cleanup operations
recentActivitySchema.index({ createdAt: -1 });
recentActivitySchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('RecentActivity', recentActivitySchema);


