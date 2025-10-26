import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';

// API base URL
const API_BASE = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');

// Fast products with pagination support
const fetchFastProducts = async ({ category = '', search = '', page = 1, limit = 100, signal }) => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString(),
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    includeImages: 'true'
  });
  
  if (category && category !== '') {
    params.append('category', category);
  }
  
  if (search && search.trim() !== '') {
    params.append('search', search.trim());
  }
  
  const url = `${API_BASE}/products/fast?${params.toString()}`;
  
  // Add timeout for faster failure
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  try {
    const response = await fetch(url, {
      signal: signal || controller.signal,
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json',
        'Cache-Control': 'max-age=300' // 5 minute browser cache
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Hook for fast products with pagination support
export const useFastProducts = (category, search, page = 1, limit = 100) => {
  return useQuery({
    queryKey: ['fast-products', category, search, page, limit],
    queryFn: ({ signal }) => fetchFastProducts({ category, search, page, limit, signal }),
    staleTime: 5 * 60 * 1000, // 5 minutes - longer stale time for immediate display
    cacheTime: 15 * 60 * 1000, // 15 minutes - longer cache
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if we have data - IMMEDIATE DISPLAY
    refetchOnReconnect: false,
    retry: 1, // Only 1 retry for fastest response
    retryDelay: 500, // Fast retry
    // CRITICAL: Enable immediate display from cache
    initialData: undefined, // Let React Query handle cache
    placeholderData: undefined, // No placeholder to avoid confusion
    // Enable immediate cache return
    suspense: false,
    useErrorBoundary: false,
  });
};