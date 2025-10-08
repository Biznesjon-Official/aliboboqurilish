import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import '../styles/select-styles.css';
import RecentActivitiesSkeleton from './skeletons/RecentActivitiesSkeleton';
// Removed FadeInTransition for simpler code
import { useRecentActivities, useDeleteRecentActivity, useDeleteAllRecentActivities, useRecentActivitiesCache } from '../hooks/useRecentActivities';
import { ExclamationTriangleFAIcon, FilterFAIcon, ClockFAIcon, BoxFAIcon, CartFAIcon, HammerFAIcon } from './FontAwesome';

// Helper function to get icon component from CSS class
const getActivityIcon = (iconClass) => {
  const iconMap = {
    'fas fa-box': BoxFAIcon,
    'fas fa-shopping-cart': CartFAIcon,
    'fas fa-hammer': HammerFAIcon,
    // Add more mappings as needed
  };
  return iconMap[iconClass] || BoxFAIcon; // Default to BoxFAIcon
};

const AdminRecentActivities = ({ onNavigate, isLoading = false }) => {
  const [filter, setFilter] = useState('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState(new Set());
  
  // Use React Query hooks for recent activities
  const { data: activitiesData, isLoading: activitiesLoading, error } = useRecentActivities(1, 20, filter);
  const deleteActivityMutation = useDeleteRecentActivity();
  const deleteAllActivitiesMutation = useDeleteAllRecentActivities();
  const activitiesCache = useRecentActivitiesCache();
  
  // Debug log when activities data changes (throttled to prevent spam)
  useEffect(() => {
    if (activitiesData && process.env.NODE_ENV === 'development') {
      // Only log if the data actually changed
      const currentDataHash = JSON.stringify({
        totalCount: activitiesData.totalCount,
        activitiesCount: activitiesData.activities?.length
      });
      
      if (currentDataHash !== window.lastActivitiesDataHash) {
        console.log('🔄 Recent activities data updated:', {
          totalCount: activitiesData.totalCount,
          activitiesCount: activitiesData.activities?.length,
          activities: activitiesData.activities?.slice(0, 3).map(a => ({ title: a.title, desc: a.desc })) // Show first 3 for debugging
        });
        window.lastActivitiesDataHash = currentDataHash;
      }
    }
  }, [activitiesData]);
  
  // Listen for update events with throttling to prevent excessive refreshes
  useEffect(() => {
    let refreshTimer = null;
    
    const throttledRefresh = () => {
      if (refreshTimer) return; // Already scheduled
      refreshTimer = setTimeout(() => {
        activitiesCache.refreshAll();
        refreshTimer = null;
      }, 1000); // Throttle to max once per second
    };
    
    const handleCraftsmanUpdate = (event) => {
      console.log('🔔 Received craftsman update event, refreshing activities...', event.detail);
      throttledRefresh();
    };
    
    const handleProductUpdate = (event) => {
      console.log('🔔 Received product update event, refreshing activities...', event.detail);
      throttledRefresh();
    };
    
    const handleProductAdded = (event) => {
      console.log('🔔 Received product added event, refreshing activities...', event.detail);
      throttledRefresh();
    };
    
    window.addEventListener('craftsmanUpdated', handleCraftsmanUpdate);
    window.addEventListener('productUpdated', handleProductUpdate);
    window.addEventListener('productAdded', handleProductAdded);
    
    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      window.removeEventListener('craftsmanUpdated', handleCraftsmanUpdate);
      window.removeEventListener('productUpdated', handleProductUpdate);
      window.removeEventListener('productAdded', handleProductAdded);
    };
  }, [activitiesCache]);
  
  // Extract activities from the API response
  const activities = activitiesData?.activities || [];
  const totalCount = activitiesData?.totalCount || 0;

  // Selection functions
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedActivities(new Set());
  };

  const selectAll = () => {
    setSelectedActivities(new Set(activities.map(a => a.id)));
  };

  const handleActivityClick = (activity) => {
    if (selectionMode) {
      // In selection mode, toggle selection
      const newSelected = new Set(selectedActivities);
      if (newSelected.has(activity.id)) {
        newSelected.delete(activity.id);
      } else {
        newSelected.add(activity.id);
      }
      setSelectedActivities(newSelected);
    } else {
      // Normal mode: navigate based on entity type
      if (onNavigate && activity.entityType && activity.entityName) {
        if (activity.entityType === 'product') {
          onNavigate('products', activity.entityName);
        } else if (activity.entityType === 'order') {
          onNavigate('orders', activity.entityName);
        } else if (activity.entityType === 'craftsman') {
          onNavigate('craftsmen', activity.entityName);
        }
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedActivities.size === 0) return;
    
    try {
      // Delete selected activities
      for (const activityId of selectedActivities) {
        await deleteActivityMutation.mutateAsync(activityId);
      }
      
      setSelectedActivities(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error('Error deleting selected activities:', error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllActivitiesMutation.mutateAsync();
      setSelectedActivities(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error('Error deleting all activities:', error);
    }
  };

  // Filter activities - now filter is applied on the server side via API
  const filteredActivities = activities;

  const filterOptions = [
    { value: 'all', label: 'Barcha amallar' },
    { value: 'products', label: 'Mahsulotlar' },
    { value: 'orders', label: 'Buyurtmalar' },
    { value: 'craftsmen', label: 'Ustalar' },
    { value: 'system', label: 'Tizim' },
  ];

  // Show Telegram-style skeleton while loading
  if (isLoading || activitiesLoading) {
    return <RecentActivitiesSkeleton itemCount={5} />;
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex-1 flex flex-col h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <ExclamationTriangleFAIcon className="text-red-500 text-2xl mb-2" />
            <p className="text-gray-600">Amallar yuklanmadi</p>
            <button 
              onClick={() => activitiesCache.refreshAll()}
              className="mt-2 text-sm text-primary-orange hover:text-opacity-80"
            >
              Qayta urinish
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <RecentActivitiesSkeleton itemCount={5} />;
  }

  return (
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 flex-1 flex flex-col h-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h3 className="text-lg sm:text-xl font-bold text-primary-dark">Oxirgi amallar</h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <FilterFAIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <select
                className="custom-select custom-select-with-icon text-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Selection button */}
            {filteredActivities.length > 0 && (
              <button
                onClick={toggleSelectionMode}
                className="text-sm text-primary-orange hover:text-opacity-80 transition-colors px-2 py-1 rounded font-medium"
              >
                {selectionMode ? 'Bekor qilish' : 'Tanlash'}
              </button>
            )}
          </div>
        </div>
        
        {/* Selection buttons */}
        {selectionMode && filteredActivities.length > 0 && (
          <div className="flex gap-3 md:gap-2 mb-4">
            <button
              onClick={selectAll}
              className="flex-1 px-4 py-2 md:px-2 md:py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm md:text-xs touch-manipulation"
            >
              Hammasini tanlash
            </button>
            <button
              onClick={selectedActivities.size > 0 ? handleDeleteSelected : handleDeleteAll}
              className="flex-1 px-4 py-2 md:px-2 md:py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm md:text-xs touch-manipulation"
            >
              {selectedActivities.size > 0 ? `O'chirish (${selectedActivities.size})` : "O'chirish"}
            </button>
          </div>
        )}

        <div className="space-y-2 sm:space-y-3 sm:max-h-96 sm:overflow-y-auto flex-1 lg:flex-none">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <ClockFAIcon className="text-2xl sm:text-3xl mb-2 sm:mb-3 opacity-50" />
              <p className="text-sm">Hozircha hech qanday faoliyat mavjud emas</p>
              <p className="text-xs mt-1 opacity-75">Yangi amallar bajarilganda bu yerda ko'rsatiladi</p>
            </div>
          ) : (
            filteredActivities.map((activity, index) => (
              <div
                key={`${activity.category}-${index}`}
                className={`activity-item flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${
                  index === 0 ? 'notification-new' : ''
                } ${
                  selectionMode && selectedActivities.has(activity.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => handleActivityClick(activity)}
                data-category={activity.category}
              >
                {selectionMode && (
                  <div className="flex items-center justify-center flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedActivities.has(activity.id)}
                      onChange={() => handleActivityClick(activity)}
                      className="w-5 h-5 text-primary-orange bg-gray-100 border-gray-300 rounded focus:ring-primary-orange focus:ring-2 touch-manipulation"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${activity.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                  {React.createElement(getActivityIcon(activity.icon), { className: `${activity.iconColor} text-sm` })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm leading-tight">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {activity.desc}
                  </p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {activity.time}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
  );
};

export default AdminRecentActivities;