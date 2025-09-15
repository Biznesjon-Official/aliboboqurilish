import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys, queryClient } from '../lib/queryClient';

// API base URL - Direct connection to backend
const API_BASE = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');

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
    queryKey: queryKeys.craftsmen.list(page, limit, search, specialty, status, sortBy, sortOrder),
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
    onSuccess: async (data) => {
      // Invalidate craftsmen lists to show new craftsman
      queryClient.invalidateQueries({ queryKey: queryKeys.craftsmen.lists(), exact: false });
      // CRITICAL: Invalidate recent activities to show craftsman addition in dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.all });
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
      // Update cache immediately
      queryClient.setQueryData(
        queryKeys.craftsmen.detail(variables.id),
        data
      );
      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.craftsmen.lists(), exact: false });
      // CRITICAL: Invalidate recent activities to show craftsman update in dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.all });
      
      // IMMEDIATE: Force refetch recent activities for instant UI update
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: queryKeys.recentActivities.all, exact: false });
      }, 100);
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
    onSuccess: async () => {
      // Invalidate lists to remove deleted craftsman
      queryClient.invalidateQueries({ queryKey: queryKeys.craftsmen.lists(), exact: false });
      // CRITICAL: Invalidate recent activities to show craftsman deletion in dashboard
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.all });
    },
    retry: false,
    networkMode: 'always',
  });
};