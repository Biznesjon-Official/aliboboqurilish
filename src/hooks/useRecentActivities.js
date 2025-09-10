import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recentActivitiesAPI } from '../services/api';
import { queryKeys } from '../lib/queryClient';

// Get all recent activities with filters and pagination
export const useRecentActivities = (page = 1, limit = 20, filter = 'all') => {
  return useQuery({
    queryKey: queryKeys.recentActivities.list(page, limit, filter),
    queryFn: () => recentActivitiesAPI.getAll({ page, limit, filter }),
    staleTime: 2 * 60 * 1000, // 2 minutes - prevent excessive refetching
    cacheTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
    refetchOnWindowFocus: false, // Disable refetch on window focus
    refetchOnMount: false, // Disable refetch on component mount
    refetchInterval: false, // Disable automatic polling
    refetchIntervalInBackground: false, // Disable background polling
  });
};

// Get single activity by ID
export const useRecentActivity = (id) => {
  return useQuery({
    queryKey: queryKeys.recentActivities.detail(id),
    queryFn: () => recentActivitiesAPI.getById(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get activities statistics
export const useRecentActivitiesStats = () => {
  return useQuery({
    queryKey: queryKeys.recentActivities.stats(),
    queryFn: () => recentActivitiesAPI.getStats(),
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Delete single activity
export const useDeleteRecentActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => recentActivitiesAPI.delete(id),
    onSuccess: (_, id) => {
      // Remove the activity from cache
      queryClient.removeQueries({ queryKey: queryKeys.recentActivities.detail(id) });
      
      // Invalidate activities list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.all });
      
      console.log('✅ Recent activity deleted successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to delete recent activity:', error);
    },
  });
};

// Delete all activities
export const useDeleteAllRecentActivities = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recentActivitiesAPI.deleteAll(),
    onSuccess: () => {
      // Clear all activities from cache
      queryClient.removeQueries({ queryKey: queryKeys.recentActivities.all });
      
      // Reset cache
      queryClient.setQueryData(queryKeys.recentActivities.lists(), { activities: [], totalCount: 0 });
      
      console.log('✅ All recent activities deleted successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to delete all recent activities:', error);
    },
  });
};

// Cleanup old activities
export const useCleanupRecentActivities = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (daysOld = 90) => recentActivitiesAPI.cleanup(daysOld),
    onSuccess: () => {
      // Invalidate activities list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.all });
      
      console.log('✅ Old recent activities cleaned up successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to cleanup old recent activities:', error);
    },
  });
};

// Clear cache
export const useClearRecentActivitiesCache = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recentActivitiesAPI.clearCache(),
    onSuccess: () => {
      // Invalidate activities list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.all });
      
      console.log('✅ Recent activities cache cleared successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to clear recent activities cache:', error);
    },
  });
};

// Custom hook for recent activities cache management
export const useRecentActivitiesCache = () => {
  const queryClient = useQueryClient();

  const invalidateActivities = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.all });
  };

  const invalidateActivity = (id) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.detail(id) });
  };

  const removeActivity = (id) => {
    queryClient.removeQueries({ queryKey: queryKeys.recentActivities.detail(id) });
  };

  const removeAllActivities = () => {
    queryClient.removeQueries({ queryKey: queryKeys.recentActivities.all });
  };

  const prefetchActivity = (id) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.recentActivities.detail(id),
      queryFn: () => recentActivitiesAPI.getById(id),
    });
  };

  const getActivityFromCache = (id) => {
    return queryClient.getQueryData(queryKeys.recentActivities.detail(id));
  };

  const setActivityInCache = (id, activityData) => {
    queryClient.setQueryData(queryKeys.recentActivities.detail(id), activityData);
  };

  const getActivitiesFromCache = (page = 1, limit = 20, filter = 'all') => {
    return queryClient.getQueryData(queryKeys.recentActivities.list(page, limit, filter));
  };

  const setActivitiesInCache = (page, limit, filter, activitiesData) => {
    queryClient.setQueryData(queryKeys.recentActivities.list(page, limit, filter), activitiesData);
  };

  const addActivityToCache = (newActivity) => {
    // Get all cached activities lists and add the new activity to each
    const allQueries = queryClient.getQueryCache().getAll();
    const activityListQueries = allQueries.filter(query => 
      query.queryKey[0] === 'recent-activities' && query.queryKey[1] === 'list'
    );

    activityListQueries.forEach(query => {
      const cachedData = query.state.data;
      if (cachedData && cachedData.activities) {
        const updatedData = {
          ...cachedData,
          activities: [newActivity, ...cachedData.activities],
          totalCount: cachedData.totalCount + 1,
        };
        queryClient.setQueryData(query.queryKey, updatedData);
      }
    });
  };

  const updateActivityInCache = (id, updatedActivity) => {
    // Update in detail cache
    queryClient.setQueryData(queryKeys.recentActivities.detail(id), updatedActivity);

    // Update in list caches
    const allQueries = queryClient.getQueryCache().getAll();
    const activityListQueries = allQueries.filter(query => 
      query.queryKey[0] === 'recent-activities' && query.queryKey[1] === 'list'
    );

    activityListQueries.forEach(query => {
      const cachedData = query.state.data;
      if (cachedData && cachedData.activities) {
        const updatedActivities = cachedData.activities.map(activity => 
          activity.id === id ? updatedActivity : activity
        );
        const updatedData = {
          ...cachedData,
          activities: updatedActivities,
        };
        queryClient.setQueryData(query.queryKey, updatedData);
      }
    });
  };

  const refreshAll = () => {
    invalidateActivities();
  };

  return {
    invalidateActivities,
    invalidateActivity,
    removeActivity,
    removeAllActivities,
    prefetchActivity,
    getActivityFromCache,
    setActivityInCache,
    getActivitiesFromCache,
    setActivitiesInCache,
    addActivityToCache,
    updateActivityInCache,
    refreshAll,
  };
};