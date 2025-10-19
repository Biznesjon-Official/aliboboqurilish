import { useState, useEffect, useCallback, useRef } from 'react';
import throttle from 'lodash/throttle';

// Shared cache for notifications across hook instances
let notificationsCache = {
  data: [],
  timestamp: 0,
  unreadCount: 0
};

// In-memory request tracker to prevent duplicate requests
let requestInProgress = false;
let lastFetchTime = 0;

const useRealNotifications = (autoRefresh = true, refreshInterval = 30000) => {
  const [notifications, setNotifications] = useState(() => notificationsCache.data);
  const [loading, setLoading] = useState(notificationsCache.data.length === 0);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(notificationsCache.unreadCount);
  
  // Refs to track component mount state
  const isMountedRef = useRef(true);
  const refreshTimerRef = useRef(null);
  const controllerRef = useRef(null);

  // Format time helper function - Memoized to prevent recreating on each render
  const formatTimeAgo = useCallback((createdAt) => {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffMs = now - notificationTime;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Hozir';
    if (diffMinutes < 60) return `${diffMinutes} daqiqa oldin`;
    if (diffHours < 24) return `${diffHours} soat oldin`;
    if (diffDays === 1) return 'Kecha';
    return `${diffDays} kun oldin`;
  }, []);

  // Map backend notification types to frontend icon config
  const getNotificationConfig = (notification) => {
    const iconConfig = {
      success: { icon: 'fas fa-check-circle', color: 'bg-green-100 text-green-600' },
      error: { icon: 'fas fa-times-circle', color: 'bg-red-100 text-red-600' },
      warning: { icon: 'fas fa-exclamation-triangle', color: 'bg-yellow-100 text-yellow-600' },
      info: { icon: 'fas fa-info-circle', color: 'bg-blue-100 text-blue-600' },
      danger: { icon: 'fas fa-trash', color: 'bg-red-100 text-red-600' }
    };

    // Map entity types to specific icons
    if (notification.entityType === 'craftsman') {
      if (notification.action === 'added') {
        return { icon: 'fas fa-user-plus', color: 'bg-green-100 text-green-600' };
      } else if (notification.action === 'deleted') {
        return { icon: 'fas fa-user-times', color: 'bg-red-100 text-red-600' };
      } else if (notification.action === 'updated') {
        return { icon: 'fas fa-user-edit', color: 'bg-blue-100 text-blue-600' };
      }
      return { icon: 'fas fa-users', color: 'bg-blue-100 text-blue-600' };
    } else if (notification.entityType === 'product') {
      if (notification.action === 'added') {
        return { icon: 'fas fa-box', color: 'bg-green-100 text-green-600' };
      } else if (notification.action === 'deleted') {
        return { icon: 'fas fa-box', color: 'bg-red-100 text-red-600' };
      }
      return { icon: 'fas fa-box', color: 'bg-purple-100 text-purple-600' };
    } else if (notification.entityType === 'order') {
      return { icon: 'fas fa-shopping-cart', color: 'bg-orange-100 text-orange-600' };
    }

    // Fallback to type-based config
    return iconConfig[notification.type] || iconConfig.info;
  };

// Fetch notifications from API with deduplication
  const fetchNotifications = useCallback(async (force = false) => {
    // Deduplication: Skip fetch if one is already in progress
    if (requestInProgress) return;
    
    // Apply throttling unless force refresh
    if (!force) {
      const now = Date.now();
      const minInterval = 2000; // 2 seconds between requests
      
      if (now - lastFetchTime < minInterval) {
        return;
      }
    }
    
    // Set request tracking flags
    requestInProgress = true;
    lastFetchTime = Date.now();
    
    // Only show loading indicator on initial fetch
    if (notifications.length === 0) {
      setLoading(true);
    }
    setError(null);

    // Cancel any previous requests
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();

    try {
      // Optimize fetch with etag or If-Modified-Since headers
      const headers = {
        'Cache-Control': 'max-age=300' // Enable HTTP caching for 5 minutes
      };
      
      // Add ETag if we have one from previous request
      const etag = sessionStorage.getItem('notifications_etag');
      if (etag) {
        headers['If-None-Match'] = etag;
      }
      
      // NOTE: Using direct backend URL instead of proxy due to setupProxy.js issues
      // This ensures notifications work reliably in development environment
      const base = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
      const response = await fetch(`${base}/notifications?limit=100`, {
        signal: controllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      // If server returns 304 Not Modified, use cached data
      if (response.status === 304) {
        requestInProgress = false;
        if (notifications.length === 0) {
          setLoading(false);
        }
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Store ETag for future requests
      const newEtag = response.headers.get('etag');
      if (newEtag) {
        sessionStorage.setItem('notifications_etag', newEtag);
      }

      const data = await response.json();
      
      // Transform backend notifications to match frontend format
      const transformedNotifications = data.notifications.map(notification => {
        const config = getNotificationConfig(notification);
        return {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          time: formatTimeAgo(notification.createdAt),
          read: notification.read,
          type: notification.entityType || notification.type,
          timestamp: new Date(notification.createdAt).getTime(),
          entityType: notification.entityType,
          entityId: notification.entityId,
          action: notification.action,
          ...config
        };
      });

      if (isMountedRef.current) {
        // Only update state if data has actually changed
        if (JSON.stringify(transformedNotifications) !== JSON.stringify(notifications)) {
          setNotifications(transformedNotifications);
        }
        
        if (data.unreadCount !== unreadCount) {
          setUnreadCount(data.unreadCount || 0);
        }
        
        setLoading(false);
      }
      
      // Update shared cache
      notificationsCache = {
        data: transformedNotifications,
        timestamp: Date.now(),
        unreadCount: data.unreadCount || 0
      };
      
    } catch (err) {
      // Ignore abort errors as they're intentional
      if (err.name === 'AbortError') return;
      
      if (isMountedRef.current) {
        console.error('Error fetching notifications:', err);
        setError(err.message);
        
        // Don't clear data on error - keep showing previous data
        if (notifications.length === 0) {
          setNotifications([]);
          setUnreadCount(0);
        }
        
        setLoading(false);
      }
    } finally {
      if (isMountedRef.current) {
        controllerRef.current = null;
        requestInProgress = false;
      }
    }
  }, []); // Empty dependency to prevent infinite loop

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const base = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
      const response = await fetch(`${base}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const base = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
      const response = await fetch(`${base}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  // Create new notification
  const createNotification = useCallback(async (notificationData) => {
    try {
      const base = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
      const response = await fetch(`${base}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      if (response.ok) {
        const newNotification = await response.json();
        
        // Add to local state immediately for better UX
        const config = getNotificationConfig(newNotification);
        const transformedNotification = {
          id: newNotification._id,
          title: newNotification.title,
          message: newNotification.message,
          time: formatTimeAgo(newNotification.createdAt),
          read: false,
          type: newNotification.entityType || newNotification.type,
          timestamp: new Date(newNotification.createdAt).getTime(),
          entityType: newNotification.entityType,
          entityId: newNotification.entityId,
          action: newNotification.action,
          ...config
        };
        
        setNotifications(prev => [transformedNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        return newNotification;
      }
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  }, [formatTimeAgo]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const base = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
      const response = await fetch(`${base}/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => {
          const notification = prev.find(n => n.id === notificationId);
          if (notification && !notification.read) {
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
          }
          return prev.filter(n => n.id !== notificationId);
        });
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    try {
      const base = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
      const response = await fetch(`${base}/notifications`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error deleting all notifications:', err);
    }
  }, []);

  // Specific notification creators for different actions
  const notifyCraftsmanAdded = useCallback(async (craftsman) => {
    return await createNotification({
      type: 'success',
      title: 'Yangi usta qo\'shildi',
      message: `${craftsman.name} - ${craftsman.specialty}`,
      icon: 'fas fa-user-plus',
      color: 'bg-green-100 text-green-600',
      entityType: 'craftsman',
      entityId: craftsman._id || craftsman.id,
      entityName: craftsman.name,
      action: 'added'
    });
  }, [createNotification]);

  const notifyCraftsmanDeleted = useCallback(async (craftsman) => {
    return await createNotification({
      type: 'error',
      title: 'Usta o\'chirildi',
      message: `${craftsman.name} - ${craftsman.specialty}`,
      icon: 'fas fa-user-times',
      color: 'bg-red-100 text-red-600',
      entityType: 'craftsman',
      entityId: craftsman._id || craftsman.id,
      entityName: craftsman.name,
      action: 'deleted'
    });
  }, [createNotification]);

  const notifyCraftsmanEdited = useCallback(async (craftsman) => {
    const notificationData = {
      type: 'warning',
      title: 'Usta tahrirlandi',
      message: `${craftsman.name} - ${craftsman.specialty}`,
      icon: 'fas fa-user-edit',
      color: 'bg-blue-100 text-blue-600',
      entityType: 'craftsman',
      entityId: craftsman._id || craftsman.id,
      entityName: craftsman.name,
      action: 'updated'
    };
    
    return await createNotification(notificationData);
  }, [createNotification]);

  const notifyProductAdded = useCallback(async (product) => {
    return await createNotification({
      type: 'success',
      title: 'Yangi mahsulot qo\'shildi',
      message: `${product.name} - ${new Intl.NumberFormat('uz-UZ').format(product.price)} so'm`,
      icon: 'fas fa-box',
      color: 'bg-green-100 text-green-600',
      entityType: 'product',
      entityId: product._id || product.id,
      entityName: product.name,
      action: 'added'
    });
  }, [createNotification]);

  const notifyProductDeleted = useCallback(async (product) => {
    return await createNotification({
      type: 'error',
      title: 'Mahsulot o\'chirildi',
      message: `${product.name} - ${new Intl.NumberFormat('uz-UZ').format(product.price)} so'm`,
      icon: 'fas fa-box',
      color: 'bg-red-100 text-red-600',
      entityType: 'product',
      entityId: product._id || product.id,
      entityName: product.name,
      action: 'deleted'
    });
  }, [createNotification]);

  const notifyOrderReceived = useCallback(async (order) => {
    const customerName = order.customerName || 'Noma\'lum mijoz';
    return await createNotification({
      type: 'info',
      title: 'Yangi buyurtma',
      message: `${customerName} - ${new Intl.NumberFormat('uz-UZ').format(order.totalAmount)} so'm`,
      icon: 'fas fa-shopping-cart',
      color: 'bg-orange-100 text-orange-600',
      entityType: 'order',
      entityId: order._id || order.id,
      entityName: customerName,
      action: 'added'
    });
  }, [createNotification]);

  const notifyOrderDeleted = useCallback(async (order) => {
    const customerName = order.customerName || 'Noma\'lum mijoz';
    return await createNotification({
      type: 'error',
      title: 'Buyurtma o\'chirildi',
      message: `${customerName} - ${new Intl.NumberFormat('uz-UZ').format(order.totalAmount)} so'm`,
      icon: 'fas fa-shopping-cart',
      color: 'bg-red-100 text-red-600',
      entityType: 'order',
      entityId: order._id || order.id,
      entityName: customerName,
      action: 'deleted'
    });
  }, [createNotification]);

  // Set up auto-refresh with cleanup and smarter interval handling
  useEffect(() => {
    // Initial fetch on mount
    fetchNotifications();
    
    if (autoRefresh && refreshInterval > 0) {
      // Clear any existing timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      
      // Set up new timer with fixed interval to prevent infinite loops
      const adaptiveInterval = refreshInterval;
      
      refreshTimerRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchNotifications();
        }
      }, adaptiveInterval);
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval]); 

  const throttledFetchNotifications = useCallback(
    throttle(fetchNotifications, 1000, { leading: true, trailing: false }),
    [] 
  );

  return {
    notifications,
    setNotifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    throttledFetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
    deleteAllNotifications,
    notifyCraftsmanAdded,
    notifyCraftsmanDeleted,
    notifyCraftsmanEdited,
    notifyProductAdded,
    notifyProductDeleted,
    notifyOrderReceived,
    notifyOrderDeleted
  };
};

export default useRealNotifications;