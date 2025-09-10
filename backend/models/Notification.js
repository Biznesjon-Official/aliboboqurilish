const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['success', 'error', 'info', 'warning', 'danger']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  entityType: {
    type: String,
    enum: ['craftsman', 'product', 'order'],
    required: false
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  entityName: {
    type: String,
    required: false
  },
  action: {
    type: String,
    enum: ['added', 'updated', 'deleted'],
    required: false
  }
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

// Index for efficient queries
notificationSchema.index({ createdAt: -1 }); // Sort by creation time
notificationSchema.index({ read: 1, createdAt: -1 }); // Most common query pattern: unread first, then by date

// Compound indexes for filtered queries
notificationSchema.index({ entityType: 1, createdAt: -1 }); // Filter by type and date
notificationSchema.index({ entityId: 1 }); // Quick lookup by related entity
notificationSchema.index({ action: 1, entityType: 1, createdAt: -1 }); // Filter by action type

// TTL index to automatically delete old notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Text search index for notification content
notificationSchema.index({ title: 'text', message: 'text' });

// Optimize query for notification counts
notificationSchema.statics.getUnreadCount = function() {
  return this.countDocuments({ read: false });
};

// Method to mark multiple notifications as read efficiently
notificationSchema.statics.markAllAsRead = function() {
  return this.updateMany(
    { read: false },
    { $set: { read: true } }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);
