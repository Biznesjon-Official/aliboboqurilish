const Notification = require('../models/Notification');

// Get all notifications with pagination
const getNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    // Filter by read status
    if (req.query.read !== undefined) {
      query.read = req.query.read === 'true';
    }
    
    // Filter by entity type
    if (req.query.entityType) {
      query.entityType = req.query.entityType;
    }
    
    // Filter by action
    if (req.query.action) {
      query.action = req.query.action;
    }
    
    // Get total count
    const totalCount = await Notification.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get unread count
    const unreadCount = await Notification.getUnreadCount();
    
    console.log(`📦 Notifications fetched: ${notifications.length}/${totalCount}, unread: ${unreadCount}`);
    
    res.json({
      notifications,
      unreadCount,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
};

// Create new notification
const createNotification = async (req, res) => {
  try {
    const notificationData = {
      type: req.body.type,
      title: req.body.title,
      message: req.body.message,
      icon: req.body.icon,
      color: req.body.color,
      entityType: req.body.entityType,
      entityId: req.body.entityId,
      entityName: req.body.entityName,
      action: req.body.action
    };
    
    const newNotification = new Notification(notificationData);
    const savedNotification = await newNotification.save();
    
    console.log('✅ Notification created:', savedNotification._id, savedNotification.title);
    
    res.status(201).json(savedNotification);
    
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    res.status(500).json({
      error: 'Failed to create notification',
      message: error.message
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedNotification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );
    
    if (!updatedNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    console.log(`✅ Notification ${id} marked as read`);
    
    res.json(updatedNotification);
    
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: error.message
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.markAllAsRead();
    
    console.log(`✅ Marked ${result.modifiedCount} notifications as read`);
    
    res.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
    
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      message: error.message
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedNotification = await Notification.findByIdAndDelete(id);
    
    if (!deletedNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    console.log(`✅ Notification ${id} deleted`);
    
    res.json({
      message: 'Notification deleted successfully',
      deletedNotification
    });
    
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    res.status(500).json({
      error: 'Failed to delete notification',
      message: error.message
    });
  }
};

// Delete all notifications
const deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({});
    
    console.log(`✅ Deleted ${result.deletedCount} notifications`);
    
    res.json({
      message: 'All notifications deleted successfully',
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('❌ Error deleting all notifications:', error);
    res.status(500).json({
      error: 'Failed to delete all notifications',
      message: error.message
    });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount();
    
    res.json({ unreadCount });
    
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    res.status(500).json({
      error: 'Failed to get unread count',
      message: error.message
    });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount
};