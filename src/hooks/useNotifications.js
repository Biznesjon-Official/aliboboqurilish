import { useState, useCallback } from 'react';

const useNotifications = () => {
  // Notification state - matching index.html structure
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Yangi buyurtma',
      message: 'Buyurtma #12001 qabul qilindi',
      time: '5 daqiqa oldin',
      read: false,
      type: 'order',
      timestamp: Date.now() - 300000 // 5 minutes ago
    },
    {
      id: 2,
      title: 'Mahsulot tugadi',
      message: 'Cement M400 tugab qoldi',
      time: '1 soat oldin',
      read: false,
      type: 'stock',
      timestamp: Date.now() - 3600000 // 1 hour ago
    },
    {
      id: 3,
      title: 'Yangi usta',
      message: 'Ahmad Karimov ro\'yxatdan o\'tdi',
      time: '2 soat oldin',
      read: true,
      type: 'user',
      timestamp: Date.now() - 7200000 // 2 hours ago
    }
  ]);

  // Modal states
  const [alertModal, setAlertModal] = useState({ show: false });
  const [confirmModal, setConfirmModal] = useState({ show: false });
  const [promptModal, setPromptModal] = useState({ show: false });

  // Add new notification - matching index.html addNotification function
  const addNotification = useCallback((notification) => {
    // Notifications disabled
    return;
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Show alert modal - exact match with index.html showAlert function
  const showAlert = useCallback((title, message, type = 'info') => {
    // Icon mapping matching index.html exactly
    const iconConfig = {
      success: { icon: 'fas fa-check-circle', color: 'text-green-600', bg: 'bg-green-100' },
      error: { icon: 'fas fa-times-circle', color: 'text-red-600', bg: 'bg-red-100' },
      warning: { icon: 'fas fa-exclamation-triangle', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      info: { icon: 'fas fa-info-circle', color: 'text-blue-600', bg: 'bg-blue-100' },
      danger: { icon: 'fas fa-trash', color: 'text-red-600', bg: 'bg-red-100' }
    };
    
    setAlertModal({
      show: true,
      title,
      message,
      type,
      iconConfig: iconConfig[type] || iconConfig.info
    });
  }, []);

  // Show confirm modal - exact match with index.html showConfirm function
  const showConfirm = useCallback((title, message, callback, onCancel = null, type = 'warning') => {
    // Icon mapping matching index.html exactly
    const iconConfig = {
      success: { icon: 'fas fa-check-circle', color: 'text-green-600', bg: 'bg-green-100' },
      error: { icon: 'fas fa-times-circle', color: 'text-red-600', bg: 'bg-red-100' },
      warning: { icon: 'fas fa-exclamation-triangle', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      info: { icon: 'fas fa-info-circle', color: 'text-blue-600', bg: 'bg-blue-100' },
      danger: { icon: 'fas fa-trash', color: 'text-red-600', bg: 'bg-red-100' },
      question: { icon: 'fas fa-question-circle', color: 'text-blue-600', bg: 'bg-blue-100' },
      edit: { icon: 'fas fa-edit', color: 'text-blue-600', bg: 'bg-blue-100' },
      select: { icon: 'fas fa-list', color: 'text-blue-600', bg: 'bg-blue-100' }
    };
    
    return new Promise((resolve) => {
      setConfirmModal({
        show: true,
        title,
        message,
        type,
        callback,
        onCancel,
        resolve,
        iconConfig: iconConfig[type] || iconConfig.warning
      });
    });
  }, []);

  // Show prompt modal (matching index.html showPrompt function)
  const showPrompt = useCallback((title, message, defaultValue = '', placeholder = '') => {
    return new Promise((resolve) => {
      setPromptModal({
        show: true,
        title,
        message,
        defaultValue,
        placeholder,
        resolve
      });
    });
  }, []);

  // Close alert modal
  const closeAlert = useCallback(() => {
    setAlertModal({ show: false });
  }, []);

  // Handle confirm response
  const handleConfirmResponse = useCallback((response) => {
    setConfirmModal(currentModal => {
      // If response is false (cancel), call onCancel callback if it exists
      if (response === false && currentModal.onCancel) {
        currentModal.onCancel();
      }
      
      // If response is true (confirm), call the main callback
      if (response === true && currentModal.callback) {
        currentModal.callback();
      }
      
      // Always resolve the promise if it exists
      if (currentModal.resolve) {
        currentModal.resolve(response);
      }
      
      // Return closed modal state
      return { show: false };
    });
  }, []);

  // Handle prompt response
  const handlePromptResponse = useCallback((response) => {
    if (promptModal.resolve) {
      promptModal.resolve(response);
    }
    setPromptModal({ show: false });
  }, [promptModal.resolve]);

  // Notification helper functions for different actions
  const notifySuccess = useCallback((title, message) => {
    addNotification({ title, message, type: 'success' });
    showAlert(title, message, 'success');
  }, [addNotification, showAlert]);

  const notifyError = useCallback((title, message) => {
    addNotification({ title, message, type: 'error' });
    showAlert(title, message, 'error');
  }, [addNotification, showAlert]);

  const notifyInfo = useCallback((title, message) => {
    addNotification({ title, message, type: 'info' });
  }, [addNotification]);

  const notifyWarning = useCallback((title, message) => {
    addNotification({ title, message, type: 'warning' });
    showAlert(title, message, 'warning');
  }, [addNotification, showAlert]);

  // Specific notification functions for different entities
  const notifyCraftsmanAdded = useCallback((craftsman) => {
    addNotification({
      title: 'Yangi usta qo\'shildi',
      message: `${craftsman.name} - ${craftsman.specialty}`,
      type: 'craftsman'
    });
  }, [addNotification]);

  // Generate recent activities - exact match with index.html generateRecentActivities function
  const generateRecentActivities = useCallback((craftsmen = [], products = [], orders = []) => {
    const now = new Date();
    const activities = [];
    
    // Add recent notifications to activities (deleted items, etc.)
    const recentNotifications = notifications
      .filter(notification => {
        // Include delete notifications and other important ones
        return notification.title.includes('o\'chirildi') || 
               notification.title.includes('qo\'shildi') ||
               notification.type === 'user' || 
               notification.type === 'product';
      })
      .slice(0, 5); // Show last 5 notifications
      
    recentNotifications.forEach(notification => {
      const notificationTime = new Date(notification.timestamp || Date.now());
      const daysDiff = Math.floor((now - notificationTime) / (1000 * 60 * 60 * 24));
      const timeText = daysDiff === 0 ? 'Bugun' : daysDiff === 1 ? 'Kecha' : `${daysDiff} kun oldin`;
      
      let iconConfig = {
        icon: 'fa-info-circle',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        category: 'bildirishnomalar'
      };
      
      // Set specific icons based on notification type
      if (notification.title.includes('Usta o\'chirildi')) {
        iconConfig = {
          icon: 'fa-user-times',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          category: 'ustalar'
        };
      } else if (notification.title.includes('Mahsulot o\'chirildi')) {
        iconConfig = {
          icon: 'fa-box',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          category: 'mahsulotlar'
        };
      } else if (notification.title.includes('usta qo\'shildi')) {
        iconConfig = {
          icon: 'fa-user-plus',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          category: 'ustalar'
        };
      } else if (notification.title.includes('mahsulot qo\'shildi')) {
        iconConfig = {
          icon: 'fa-box',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          category: 'mahsulotlar'
        };
      }
      
      activities.push({
        category: iconConfig.category,
        icon: iconConfig.icon,
        iconBg: iconConfig.iconBg,
        iconColor: iconConfig.iconColor,
        title: notification.title,
        desc: notification.message,
        time: timeText,
        timestamp: notificationTime.getTime(),
        clickAction: () => {
          // Navigate to relevant section based on category
          if (iconConfig.category === 'ustalar') {
            window.location.hash = '#craftsmen';
          } else if (iconConfig.category === 'mahsulotlar') {
            window.location.hash = '#products';
          }
        }
      });
    });
    
    // Recent craftsmen activities - matching index.html logic exactly
    const recentCraftsmen = [...craftsmen]
      .sort((a, b) => new Date(b.joinDate || b.createdAt || '2024-01-01') - new Date(a.joinDate || a.createdAt || '2024-01-01'))
      .slice(0, 3);
      
    recentCraftsmen.forEach((craftsman, index) => {
      const joinDate = new Date(craftsman.joinDate || craftsman.createdAt || '2024-01-01');
      const daysDiff = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
      const timeText = daysDiff === 0 ? 'Bugun' : daysDiff === 1 ? 'Kecha' : `${daysDiff} kun oldin`;
      
      activities.push({
        category: 'ustalar',
        icon: 'fa-user-plus',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        title: 'Yangi usta qo\'shildi',
        desc: `${craftsman.name} - ${craftsman.specialty}`,
        time: timeText,
        timestamp: joinDate.getTime(),
        clickAction: () => {
          // Navigate to craftsmen section and filter by name
          window.location.hash = '#craftsmen';
        }
      });
    });
    
    // Recent products activities - matching index.html logic exactly
    const recentProducts = [...products]
      .sort((a, b) => new Date(b.addedDate || b.createdAt || '2024-01-01') - new Date(a.addedDate || a.createdAt || '2024-01-01'))
      .slice(0, 2);
      
    recentProducts.forEach((product, index) => {
      const addDate = new Date(product.addedDate || product.createdAt || '2024-01-01');
      const daysDiff = Math.floor((now - addDate) / (1000 * 60 * 60 * 24));
      const timeText = daysDiff === 0 ? 'Bugun' : daysDiff === 1 ? 'Kecha' : `${daysDiff} kun oldin`;
      
      activities.push({
        category: 'mahsulotlar',
        icon: 'fa-box',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        title: 'Yangi mahsulot qo\'shildi',
        desc: `${product.name} - ${new Intl.NumberFormat('uz-UZ').format(product.price)} so'm`,
        time: timeText,
        timestamp: addDate.getTime(),
        clickAction: () => {
          // Navigate to products section
          window.location.hash = '#products';
        }
      });
    });
    
    // Recent orders activities - matching index.html logic exactly
    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.date || b.createdAt || '2024-01-01') - new Date(a.date || a.createdAt || '2024-01-01'))
      .slice(0, 3);
      
    recentOrders.forEach((order, index) => {
      const orderDate = new Date(order.date || order.createdAt || '2024-01-01');
      const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
      const timeText = daysDiff === 0 ? 'Bugun' : daysDiff === 1 ? 'Kecha' : `${daysDiff} kun oldin`;
      
      activities.push({
        category: 'buyurtmalar',
        icon: 'fa-shopping-cart',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        title: 'Yangi buyurtma',
        desc: `Buyurtma #${order.id || order._id} - ${new Intl.NumberFormat('uz-UZ').format(order.total || order.totalAmount)} so'm`,
        time: timeText,
        timestamp: orderDate.getTime(),
        clickAction: () => {
          // Navigate to orders section
          window.location.hash = '#orders';
        }
      });
    });
    
    // Sort activities by timestamp DESC (newest first) - matching index.html
    return activities.sort((a, b) => b.timestamp - a.timestamp);
  }, []);

  const notifyCraftsmanDeleted = useCallback((craftsmanName, specialty) => {
    // Add notification to notification bell - matching index.html behavior
    addNotification({
      title: 'Usta o\'chirildi',
      message: `${craftsmanName} - ${specialty}`,
      type: 'user', // Use 'user' type to show in notification bell
      icon: 'fa-user-times',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    });
  }, [addNotification]);

  const safeNotifyCraftsmanDeleted = useCallback((name, specialty) => {
    setTimeout(() => notifyCraftsmanDeleted(name, specialty), 0);
  }, [notifyCraftsmanDeleted]);

  const notifyProductAdded = useCallback((product) => {
    addNotification({
      title: 'Yangi mahsulot qo\'shildi',
      message: `${product.name} - ${new Intl.NumberFormat('uz-UZ').format(product.price)} so'm`,
      type: 'product'
    });
  }, [addNotification]);

  const notifyProductDeleted = useCallback((productName, productPrice) => {
    // Add notification to notification bell - matching index.html behavior
    addNotification({
      title: 'Mahsulot o\'chirildi',
      message: `${productName} - ${new Intl.NumberFormat('uz-UZ').format(productPrice)} so'm`,
      type: 'product', // Use 'product' type to show in notification bell
      icon: 'fa-box',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    });
  }, [addNotification]);

  const safeNotifyProductDeleted = useCallback((name, price) => {
    setTimeout(() => notifyProductDeleted(name, price), 0);
  }, [notifyProductDeleted]);

  const notifyOrderReceived = useCallback((order) => {
    addNotification({
      title: 'Yangi buyurtma',
      message: `Buyurtma #${order.orderNumber || order.id} - ${new Intl.NumberFormat('uz-UZ').format(order.totalAmount)} so'm`,
      type: 'order'
    });
  }, [addNotification]);

  const notifyLowStock = useCallback((product, stock) => {
    addNotification({
      title: 'Kam qoldiq ogohlantirish',
      message: `${product.name} - faqat ${stock} dona qoldi`,
      type: 'stock'
    });
  }, [addNotification]);

  // Safe notification handlers to prevent React setState during render errors
  const safeNotifySuccess = useCallback((title, message) => {
    setTimeout(() => notifySuccess(title, message), 0);
  }, [notifySuccess]);

  const safeNotifyError = useCallback((title, message) => {
    setTimeout(() => notifyError(title, message), 0);
  }, [notifyError]);

  const safeNotifyWarning = useCallback((title, message) => {
    setTimeout(() => notifyWarning(title, message), 0);
  }, [notifyWarning]);

  const safeNotifyCraftsmanAdded = useCallback((name, specialty) => {
    setTimeout(() => notifyCraftsmanAdded({ name, specialty }), 0);
  }, [notifyCraftsmanAdded]);

  return {
    // Notification state
    notifications,
    setNotifications,
    
    // Modal states
    alertModal,
    confirmModal,
    promptModal,
    
    // Notification functions
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    
    // Modal functions
    showAlert,
    showConfirm,
    showPrompt,
    closeAlert,
    handleConfirmResponse,
    handlePromptResponse,
    
    // Helper functions
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning,
    
    // Safe notification handlers
    safeNotifySuccess,
    safeNotifyError,
    safeNotifyWarning,
    safeNotifyCraftsmanAdded,
    safeNotifyCraftsmanDeleted,
    safeNotifyProductDeleted,
    
    // Specific notification functions
    notifyCraftsmanAdded,
    notifyCraftsmanDeleted,
    notifyProductAdded,
    notifyProductDeleted,
    notifyOrderReceived,
    notifyLowStock,
    
    // Activity generation function - matching index.html
    generateRecentActivities
  };
};

export default useNotifications;
