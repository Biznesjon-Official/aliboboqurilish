import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys, queryClient } from '../lib/queryClient';

// API base URL - use same-origin in production to avoid CORS between www/apex
const API_BASE = (() => {
  if (process.env.REACT_APP_API_BASE) return process.env.REACT_APP_API_BASE;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (process.env.NODE_ENV === 'production' && origin) {
    return `${origin.replace(/\/$/, '')}/api`;
  }
  return 'http://localhost:5000/api';
})();

console.log(`🔧 API Base URL: ${API_BASE}`);

// Fetch functions
const fetchCraftsmen = async ({ page = 1, limit = 10, search = '', specialty = '', status = '', sortBy = 'joinDate', sortOrder = 'desc', signal }) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    specialty,
    status, // Add status parameter
    sortBy,
    sortOrder
  });

  // TEMP: request minimal payload when hitting production host to avoid backend image serialization issues
  // Detect production host by API_BASE domain rather than NODE_ENV
  const isProdHost = /aliboboqurilish\.uz/i.test(API_BASE || '');
  if (isProdHost && !params.has('minimal')) params.append('minimal', '1');

  const url = `${API_BASE}/craftsmen?${params.toString()}`;
  console.log(`📡 Fetching craftsmen from: ${url}`);
  
  let response = await fetch(url, {
    signal,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include credentials for CORS
  });

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 500; // Reduced from 1000 to 500ms
    console.log(`⏳ Rate limited, waiting ${waitTime}ms before retrying`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    // Retry the request
    response = await fetch(url, {
      signal,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include credentials for CORS
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ HTTP error! status: ${response.status}, message: ${errorText}`);
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  return response.json();
};

const fetchCraftsman = async (id, signal) => {
  const response = await fetch(`${API_BASE}/craftsmen/${id}`, {
    signal,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include credentials for CORS
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ HTTP error! status: ${response.status}, message: ${errorText}`);
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  return response.json();
};

// Hook for fetching craftsmen list with caching
export const useCraftsmen = (page = 1, limit = 10, search = '', specialty = '', status = '', sortBy = 'joinDate', sortOrder = 'desc') => {
  return useQuery({
    // Ensure parameter order matches queryKeys.craftsmen.list(specialty, search, page, limit, status, sortBy, sortOrder)
    queryKey: queryKeys.craftsmen.list(specialty, search, page, limit, status, sortBy, sortOrder),
    queryFn: ({ signal }) => fetchCraftsmen({ page, limit, search, specialty, status, sortBy, sortOrder, signal }),
    keepPreviousData: true, // Keep previous data while fetching new data
    staleTime: 2 * 60 * 1000, // Cache data for 2 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false, // Don't refetch if data is fresh
  });
};

// Hook for fetching individual craftsman details
export const useCraftsman = (id, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.craftsmen.detail(id),
    queryFn: ({ signal }) => fetchCraftsman(id, signal),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000, // Craftsman details cached longer (5 minutes)
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  });
};

// Mutation hooks for craftsman operations
export const useCreateCraftsman = () => {
  return useMutation({
    mutationFn: async (craftsmanData) => {
      const response = await fetch(`${API_BASE}/craftsmen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(craftsmanData),
        credentials: 'include', // Include credentials for CORS
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error('❌ Failed to parse error response as JSON');
        }
        const errorMessage = errorData.message || errorData.error || errorText || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      return responseData;
    },
    onSuccess: async (data, variables) => {
      // Patch response data with price fields if backend omitted them
      try {
        const v = variables || {};
        const priceCandidate = v.price ?? v.hourlyRate ?? v.pricePerHour ?? v.rate;
        if (priceCandidate !== undefined && priceCandidate !== null) {
          if (data.price === undefined || data.price === null) data.price = priceCandidate;
          if (data.hourlyRate === undefined || data.hourlyRate === null) data.hourlyRate = priceCandidate;
          if (data.pricePerHour === undefined || data.pricePerHour === null) data.pricePerHour = priceCandidate;
          if (data.rate === undefined || data.rate === null) data.rate = priceCandidate;
        }
        // Merge other edited fields so UI reflects them immediately
        const { id: _omitId, ...restVars } = v;
        Object.assign(data, restVars);
      } catch (_) {}
      // Invalidate craftsmen lists to show new craftsman
      queryClient.invalidateQueries({ queryKey: queryKeys.craftsmen.lists(), exact: false });
      // CRITICAL: Invalidate recent activities to show craftsman addition in dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.all });
      // Optimistically insert the new craftsman into any active list caches
      const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.craftsmen.lists(), exact: false });
      listQueries.forEach(([key, current]) => {
        if (!current || !Array.isArray(current.craftsmen)) return;
        const already = current.craftsmen.findIndex((c) => c._id === data._id) !== -1;
        const updated = {
          ...current,
          craftsmen: already ? current.craftsmen : [data, ...current.craftsmen],
          totalCount: (current.totalCount || 0) + (already ? 0 : 1),
        };
        queryClient.setQueryData(key, updated);
      });
      // Force refetch active craftsmen lists for immediate UI update
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: queryKeys.craftsmen.lists(), type: 'active' });
      }, 50);
    },
    onError: (error) => {
      console.error('❌ Craftsman creation failed:', error);
    },
    retry: false,
    networkMode: 'always',
  });
};

export const useUpdateCraftsman = () => {
  return useMutation({
    mutationFn: async ({ id, ...craftsmanData }) => {
      const response = await fetch(`${API_BASE}/craftsmen/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(craftsmanData),
        credentials: 'include', // Include credentials for CORS
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP error! status: ${response.status}, message: ${errorText}`);
        throw new Error('Failed to update craftsman');
      }

      return response.json();
    },
    onSuccess: async (data, variables) => {
      // Patch response data with price fields if backend omitted them
      try {
        const v = variables || {};
        const priceCandidate = v.price ?? v.hourlyRate ?? v.pricePerHour ?? v.rate;
        if (priceCandidate !== undefined && priceCandidate !== null) {
          if (data.price === undefined || data.price === null) data.price = priceCandidate;
          if (data.hourlyRate === undefined || data.hourlyRate === null) data.hourlyRate = priceCandidate;
          if (data.pricePerHour === undefined || data.pricePerHour === null) data.pricePerHour = priceCandidate;
          if (data.rate === undefined || data.rate === null) data.rate = priceCandidate;
        }
      } catch (_) {}
      // Update cache immediately
      queryClient.setQueryData(queryKeys.craftsmen.detail(variables.id), data);
      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.craftsmen.lists(), exact: false });
      // CRITICAL: Invalidate recent activities to show craftsman update in dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.all });
      // Optimistically update any list caches that contain this craftsman
      const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.craftsmen.lists(), exact: false });
      listQueries.forEach(([key, current]) => {
        if (!current || !Array.isArray(current.craftsmen)) return;
        const idx = current.craftsmen.findIndex((c) => c._id === variables.id);
        if (idx !== -1) {
          const updatedArray = [...current.craftsmen];
          updatedArray[idx] = { ...updatedArray[idx], ...data };
          queryClient.setQueryData(key, { ...current, craftsmen: updatedArray });
        }
      });
      
      // IMMEDIATE: Force refetch recent activities for instant UI update
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: queryKeys.recentActivities.all, exact: false });
      }, 100);
      // IMMEDIATE: Force refetch craftsmen lists for instant UI update
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: queryKeys.craftsmen.lists(), type: 'active' });
      }, 50);
    },
    retry: false,
    networkMode: 'always',
  });
};

export const useDeleteCraftsman = () => {
  return useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`${API_BASE}/craftsmen/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include credentials for CORS
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP error! status: ${response.status}, message: ${errorText}`);
        throw new Error('Failed to delete craftsman');
      }

      return response.json();
    },
    onSuccess: async (_, id) => {
      // Invalidate lists to remove deleted craftsman
      queryClient.invalidateQueries({ queryKey: queryKeys.craftsmen.lists(), exact: false });
      // CRITICAL: Invalidate recent activities to show craftsman deletion in dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.all });
      // Optimistically remove the craftsman from list caches
      const listQueries = queryClient.getQueriesData({ queryKey: queryKeys.craftsmen.lists(), exact: false });
      listQueries.forEach(([key, current]) => {
        if (!current || !Array.isArray(current.craftsmen)) return;
        const updatedArray = current.craftsmen.filter((c) => c._id !== id);
        const newTotal = Math.max(0, (current.totalCount || 0) - 1);
        queryClient.setQueryData(key, { ...current, craftsmen: updatedArray });
      });
      // Force refetch active craftsmen lists for immediate UI update
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: queryKeys.craftsmen.lists(), type: 'active' });
      }, 50);
    },
    retry: false,
    networkMode: 'always',
  });
};