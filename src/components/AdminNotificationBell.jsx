  import React, { useState } from 'react';
import { BellFAIcon, CartFAIcon, ExclamationTriangleFAIcon, UserFAIcon, BoxFAIcon, HammerFAIcon, InfoCircleFAIcon } from './FontAwesome';

const AdminNotificationBell = ({ notifications = [], setNotifications, markAllAsRead, markAsRead, deleteNotification, deleteAllNotifications }) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    if (markAllAsRead) {
      markAllAsRead();
    } else if (setNotifications) {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  const handleMarkAsRead = (notificationId) => {
    if (selectionMode) {
      // In selection mode, toggle selection
      const newSelected = new Set(selectedNotifications);
      if (newSelected.has(notificationId)) {
        newSelected.delete(notificationId);
      } else {
        newSelected.add(notificationId);
      }
      setSelectedNotifications(newSelected);
    } else {
      // Normal mode: mark as read
      if (markAsRead) {
        markAsRead(notificationId);
      } else if (setNotifications) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
      }
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedNotifications(new Set());
  };

  const selectAll = () => {
    setSelectedNotifications(new Set(notifications.map(n => n.id)));
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.size === 0) return;
    
    // Delete selected notifications
    for (const notificationId of selectedNotifications) {
      if (deleteNotification) {
        await deleteNotification(notificationId);
      }
    }
    
    setSelectedNotifications(new Set());
    setSelectionMode(false);
  };

  const handleDeleteAll = async () => {
    if (deleteAllNotifications) {
      await deleteAllNotifications();
    } else if (setNotifications) {
      setNotifications([]);
    }
    setSelectedNotifications(new Set());
    setSelectionMode(false);
  };

  const toggleNotifications = () => {
    setNotifOpen(!notifOpen);
    // Clear selections and exit selection mode when closing
    if (notifOpen) {
      setSelectedNotifications(new Set());
      setSelectionMode(false);
    }
  };

  // Close notifications when clicking outside and handle body scroll lock
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifOpen && !event.target.closest('.notification-panel') && !event.target.closest('.notification-bell')) {
        setNotifOpen(false);
        setSelectedNotifications(new Set()); // Clear selections when closing
        setSelectionMode(false); // Exit selection mode
      }
    };

    // Prevent body scroll when notifications are open
    if (notifOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Restore body scroll when component unmounts
      document.body.style.overflow = 'unset';
    };
  }, [notifOpen]);

  return (
    <div className="relative">
      <button
        onClick={toggleNotifications}
        className="notification-bell relative text-gray-600 hover:text-primary-orange transition-colors duration-200"
      >
        <BellFAIcon className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {notifOpen && (
        <div className="notification-panel fixed top-16 right-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-[80vh] md:max-h-96 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800 text-lg">Bildirishnomalar</h3>
              <div className="flex gap-2">
                {!selectionMode && unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-sm text-primary-orange hover:text-opacity-80 transition-colors px-2 py-1 rounded"
                  >
                    Hammasini o'qish
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={toggleSelectionMode}
                    className="text-sm text-primary-orange hover:text-opacity-80 transition-colors px-2 py-1 rounded font-medium"
                  >
                    {selectionMode ? 'Bekor qilish' : 'Tanlash'}
                  </button>
                )}
              </div>
            </div>
            
            {selectionMode && notifications.length > 0 && (
              <div className="flex gap-3 md:gap-2 mb-2">
                <button
                  onClick={selectAll}
                  className="flex-1 px-4 py-2 md:px-2 md:py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm md:text-xs touch-manipulation"
                >
                  Hammasini tanlash
                </button>
                <button
                  onClick={selectedNotifications.size > 0 ? handleDeleteSelected : handleDeleteAll}
                  className="flex-1 px-4 py-2 md:px-2 md:py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm md:text-xs touch-manipulation"
                >
                  {selectedNotifications.size > 0 ? `O'chirish (${selectedNotifications.size})` : "O'chirish"}
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <BellFAIcon className="text-3xl mb-3 opacity-50" />
                <p className="text-sm">Bildirishnomalar yo'q</p>
              </div>
            ) : (
              notifications.map((notification, index) => {
                const iconConfig = {
                  order: { icon: CartFAIcon, color: 'bg-blue-100 text-blue-600' },
                  stock: { icon: ExclamationTriangleFAIcon, color: 'bg-yellow-100 text-yellow-600' },
                  user: { icon: UserFAIcon, color: 'bg-green-100 text-green-600' },
                  product: { icon: BoxFAIcon, color: 'bg-purple-100 text-purple-600' },
                  craftsman: { icon: HammerFAIcon, color: 'bg-orange-100 text-orange-600' },
                  info: { icon: InfoCircleFAIcon, color: 'bg-blue-100 text-blue-600' }
                };
                
                const config = iconConfig[notification.type] || iconConfig.info;
                
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-3 p-4 hover:bg-gray-50 transition-colors border-l-4 cursor-pointer touch-manipulation ${
                      !notification.read ? 'border-l-primary-orange bg-orange-50' : 'border-l-transparent'
                    } ${
                      selectionMode && selectedNotifications.has(notification.id) ? 'bg-blue-50 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    {selectionMode && (
                      <div className="flex items-center justify-center flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.has(notification.id)}
                          onChange={() => handleMarkAsRead(notification.id)}
                          className="w-5 h-5 text-primary-orange bg-gray-100 border-gray-300 rounded focus:ring-primary-orange focus:ring-2 touch-manipulation"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    <div className={`w-10 h-10 ${config.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                    {!selectionMode && !notification.read && (
                      <div className="w-2 h-2 bg-primary-orange rounded-full flex-shrink-0 animate-pulse"></div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;