const socketService = require('./SocketService');

class NotificationService {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 1000; // Keep max 1000 notifications in memory
  }

  // Send notification to admin
  notifyAdmin(notification) {
    try {
      const adminNotification = {
        id: Date.now().toString(),
        type: 'admin',
        timestamp: new Date().toISOString(),
        read: false,
        ...notification,
      };

      // Add to in-memory store
      this.notifications.unshift(adminNotification);
      
      // Keep only the most recent notifications
      if (this.notifications.length > this.maxNotifications) {
        this.notifications = this.notifications.slice(0, this.maxNotifications);
      }

      // Send via Socket.IO
      socketService.sendToAdmin('notification', adminNotification);
      
      console.log('📢 Admin notification sent:', adminNotification);
      return adminNotification;
    } catch (error) {
      console.error('❌ Failed to send admin notification:', error);
      throw error;
    }
  }

  // Send notification to all users
  notifyAll(notification) {
    try {
      const globalNotification = {
        id: Date.now().toString(),
        type: 'global',
        timestamp: new Date().toISOString(),
        ...notification,
      };

      // Send via Socket.IO
      socketService.broadcast('notification', globalNotification);
      
      console.log('📢 Global notification sent:', globalNotification);
      return globalNotification;
    } catch (error) {
      console.error('❌ Failed to send global notification:', error);
      throw error;
    }
  }

  // Notify about new order
  notifyNewOrder(orderData) {
    try {
      const notification = {
        title: 'Yangi buyurtma',
        message: `Buyurtma #${orderData._id || orderData.id} qabul qilindi`,
        type: 'order',
        icon: 'fa-shopping-cart',
        color: 'success',
        data: orderData,
        action: {
          label: 'Ko\'rish',
          url: `/admin/orders/${orderData._id || orderData.id}`,
        },
      };

      // Send to admin
      this.notifyAdmin(notification);
      
      // Also emit specific new order event
      socketService.emitNewOrder(orderData);
      
      return notification;
    } catch (error) {
      console.error('❌ Failed to send new order notification:', error);
      throw error;
    }
  }

  // Notify about order status change
  notifyOrderStatusUpdate(orderData, oldStatus, newStatus) {
    try {
      const notification = {
        title: 'Buyurtma holati o\'zgardi',
        message: `Buyurtma #${orderData._id || orderData.id} holati "${oldStatus}" dan "${newStatus}" ga o'zgardi`,
        type: 'order_status',
        icon: 'fa-clipboard-check',
        color: 'info',
        data: { ...orderData, oldStatus, newStatus },
        action: {
          label: 'Ko\'rish',
          url: `/admin/orders/${orderData._id || orderData.id}`,
        },
      };

      // Send to admin
      this.notifyAdmin(notification);
      
      // Also emit specific order status update event
      socketService.emitOrderStatusUpdate({
        orderId: orderData._id || orderData.id,
        oldStatus,
        newStatus,
        order: orderData,
      });
      
      return notification;
    } catch (error) {
      console.error('❌ Failed to send order status notification:', error);
      throw error;
    }
  }

  // Notify about low stock
  notifyLowStock(productData, currentStock, threshold = 5) {
    try {
      const notification = {
        title: 'Kam qoldiq',
        message: `${productData.name} mahsulotida ${currentStock} dona qoldi`,
        type: 'low_stock',
        icon: 'fa-exclamation-triangle',
        color: 'warning',
        data: { ...productData, currentStock, threshold },
        action: {
          label: 'To\'ldirish',
          url: `/admin/products/${productData._id || productData.id}`,
        },
      };

      // Send to admin only
      this.notifyAdmin(notification);
      
      return notification;
    } catch (error) {
      console.error('❌ Failed to send low stock notification:', error);
      throw error;
    }
  }

  // Notify about stock update
  notifyStockUpdate(productData, oldStock, newStock, reason = 'update') {
    try {
      const stockDelta = newStock - oldStock;
      const action = stockDelta > 0 ? 'qo\'shildi' : 'kamaytirildi';
      
      const notification = {
        title: 'Zaxira yangilandi',
        message: `${productData.name} mahsuloti zaxirasi ${Math.abs(stockDelta)} dona ${action}`,
        type: 'stock_update',
        icon: 'fa-boxes',
        color: stockDelta > 0 ? 'success' : 'warning',
        data: { ...productData, oldStock, newStock, stockDelta, reason },
        action: {
          label: 'Ko\'rish',
          url: `/admin/products/${productData._id || productData.id}`,
        },
      };

      // Send to admin
      this.notifyAdmin(notification);
      
      // Also emit specific stock update event
      socketService.emitStockUpdate({
        productId: productData._id || productData.id,
        oldStock,
        newStock,
        stockDelta,
        reason,
        product: productData,
      });
      
      return notification;
    } catch (error) {
      console.error('❌ Failed to send stock update notification:', error);
      throw error;
    }
  }

  // Notify about new product
  notifyNewProduct(productData) {
    try {
      const notification = {
        title: 'Yangi mahsulot',
        message: `"${productData.name}" mahsuloti qo'shildi`,
        type: 'product',
        icon: 'fa-plus-circle',
        color: 'success',
        data: productData,
        action: {
          label: 'Ko\'rish',
          url: `/admin/products/${productData._id || productData.id}`,
        },
      };

      // Send to admin
      this.notifyAdmin(notification);
      
      // Also emit specific product update event
      socketService.emitProductUpdate({
        action: 'created',
        product: productData,
      });
      
      return notification;
    } catch (error) {
      console.error('❌ Failed to send new product notification:', error);
      throw error;
    }
  }

  // Notify about product update
  notifyProductUpdate(productData, changes = {}) {
    try {
      const notification = {
        title: 'Mahsulot yangilandi',
        message: `"${productData.name}" mahsuloti yangilandi`,
        type: 'product_update',
        icon: 'fa-edit',
        color: 'info',
        data: { ...productData, changes },
        action: {
          label: 'Ko\'rish',
          url: `/admin/products/${productData._id || productData.id}`,
        },
      };

      // Send to admin
      this.notifyAdmin(notification);
      
      // Also emit specific product update event
      socketService.emitProductUpdate({
        action: 'updated',
        product: productData,
        changes,
      });
      
      return notification;
    } catch (error) {
      console.error('❌ Failed to send product update notification:', error);
      throw error;
    }
  }

  // Get recent notifications
  getRecentNotifications(limit = 50, type = null) {
    try {
      let notifications = [...this.notifications];
      
      // Filter by type if specified
      if (type) {
        notifications = notifications.filter(n => n.type === type);
      }
      
      // Limit results
      return notifications.slice(0, limit);
    } catch (error) {
      console.error('❌ Failed to get recent notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  markAsRead(notificationId) {
    try {
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
        return notification;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      return null;
    }
  }

  // Mark all notifications as read
  markAllAsRead(type = null) {
    try {
      let count = 0;
      this.notifications.forEach(notification => {
        if (!type || notification.type === type) {
          if (!notification.read) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
            count++;
          }
        }
      });
      return count;
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      return 0;
    }
  }

  // Delete notification
  deleteNotification(notificationId) {
    try {
      const index = this.notifications.findIndex(n => n.id === notificationId);
      if (index > -1) {
        const deleted = this.notifications.splice(index, 1)[0];
        return deleted;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
      return null;
    }
  }

  // Clear all notifications
  clearAllNotifications(type = null) {
    try {
      const originalCount = this.notifications.length;
      
      if (type) {
        this.notifications = this.notifications.filter(n => n.type !== type);
      } else {
        this.notifications = [];
      }
      
      const deletedCount = originalCount - this.notifications.length;
      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
      return 0;
    }
  }

  // Get notification statistics
  getStats() {
    try {
      const total = this.notifications.length;
      const unread = this.notifications.filter(n => !n.read).length;
      const types = {};
      
      this.notifications.forEach(n => {
        types[n.type] = (types[n.type] || 0) + 1;
      });
      
      return {
        total,
        unread,
        read: total - unread,
        types,
      };
    } catch (error) {
      console.error('❌ Failed to get notification stats:', error);
      return { total: 0, unread: 0, read: 0, types: {} };
    }
  }
}

// Export singleton instance
const notificationService = new NotificationService();
module.exports = notificationService;