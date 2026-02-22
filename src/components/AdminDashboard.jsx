import React, { useState, useEffect, useCallback } from 'react';
import AdminStatsCards from './AdminStatsCards';
import AdminRecentActivities from './AdminRecentActivities';
import AdminNotificationBell from './AdminNotificationBell';
import AdminNotificationModals from './AdminNotificationModals';
import useNotifications from '../hooks/useNotifications';
import useRealNotifications from '../hooks/useRealNotifications';
import useStatistics from '../hooks/useStatistics';

const AdminDashboard = ({ onNavigate }) => {
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  
  // Use real notification system
  const {
    notifications,
    setNotifications,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    deleteAllNotifications,
    loading: notificationsLoading,
    error: notificationsError
  } = useRealNotifications(true, 30000); // Auto-refresh every 30 seconds

  // Use demo notifications for modals (keep existing modal functionality)
  const {
    alertModal,
    confirmModal,
    promptModal,
    closeAlert,
    handleConfirmResponse,
    handlePromptResponse,
    notifySuccess,
    notifyError,
    notifyInfo
  } = useNotifications();

  // Use statistics hook for real-time data
  const {
    statistics,
    editStats,
    loading: statsLoading,
    error: statsError,
    refreshStats,
    formatNumber
  } = useStatistics(true, 300000); // Auto-refresh every 5 minutes

  // Handle statistics errors
  useEffect(() => {
    if (statsError) {
      console.error('Statistika xatoligi:', statsError);
    }
  }, [statsError]);

  // Handle navigation from activities
  const handleNavigateFromActivity = (section, searchTerm) => {
    if (onNavigate) {
      onNavigate(section, searchTerm);
    }
    // No notification needed for navigation
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <main className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto min-h-screen flex flex-col">
        {/* Top Bar: Title + Notification Bell (responsive) */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-dark">Dashboard</h2>
          <div className="flex items-center">
            <AdminNotificationBell 
              notifications={notifications} 
              setNotifications={setNotifications}
              markAllAsRead={markAllAsRead}
              markAsRead={markAsRead}
              deleteNotification={deleteNotification}
              deleteAllNotifications={deleteAllNotifications}
            />
          </div>
        </div>

        {/* Mobile-only divider under header */}
        <div className="sm:hidden border-b border-gray-200 mb-4"></div>

        {/* Stats Cards - Always show, with individual loading */}
        <AdminStatsCards 
          statistics={statistics}
          editStats={editStats}
          loading={statsLoading}
          error={statsError}
          formatNumber={formatNumber}
        />
        
        {/* Recent Activities - Always show, with Telegram-style skeleton */}
        <div className="flex-1 flex flex-col">
          <AdminRecentActivities 
            onNavigate={handleNavigateFromActivity}
            isLoading={activitiesLoading}
          />
        </div>
      </main>

      {/* Notification Modals */}
      <AdminNotificationModals
        alertModal={alertModal}
        confirmModal={confirmModal}
        promptModal={promptModal}
        onAlertClose={closeAlert}
        onConfirmResponse={handleConfirmResponse}
        onPromptResponse={handlePromptResponse}
      />

      {/* Custom CSS for animations matching index.html */}
      <style>{`
        /* Fade in animation */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        /* Slide in from top animation for new notifications */
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .notification-new {
          animation: slideInFromTop 0.4s ease-out;
        }
        
        /* Pulse animation for notification badge */
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        /* Bounce animation for notification badge */
        @keyframes bounce {
          0%, 100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: none;
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        
        /* Activity item hover effect */
        .activity-item {
          transition: all 0.3s ease;
        }
        
        .activity-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        /* Custom scrollbar for activities */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;

