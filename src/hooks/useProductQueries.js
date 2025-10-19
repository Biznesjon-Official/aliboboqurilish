import { useQuery, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { queryKeys, invalidateQueries, queryClient } from '../lib/queryClient';

// API base URL - Direct connection to backend
const API_BASE = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
// Feature flag: allow disabling the fast endpoint if it's unstable in production
const USE_FAST_DEFAULT = (process.env.REACT_APP_USE_FAST || 'true').toLowerCase() === 'true';

// Fetch functions
const fetchProducts = async ({ category = '', search = '', page = 1, limit = 200, sortBy = 'updatedAt', sortOrder = 'desc', signal, useFastEndpoint = USE_FAST_DEFAULT }) => {
  // Build query parameters
  const params = new URLSearchParams({
    limit: limit.toString(),
    page: page.toString(),
    sortBy,
    sortOrder,
  });

  if (category && category !== '') {
    params.append('category', category);
  }

  if (search && search.trim() !== '') {
    params.append('search', search.trim());
  }

  // For small pages (homepage, initial grids), includeImages to avoid base64 filtering to default
  if (limit <= 24) {
    params.append('includeImages', 'true');
  }

  const fastPath = `${API_BASE}/products/fast?${params.toString()}`;
  const normalPath = `${API_BASE}/products?${params.toString()}`;

  // Prefer fast endpoint, but gracefully fallback to normal on failure
  const primaryUrl = useFastEndpoint ? fastPath : normalPath;
  const fallbackUrl = useFastEndpoint ? normalPath : fastPath;



  let response = await fetch(primaryUrl, {
    signal,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  });

  // Helper to detect JSON content
  const isJson = (res) => (res.headers.get('content-type') || '').includes('application/json');

  if (!response.ok || !isJson(response)) {
    // Silently try fallback without logging to prevent console spam

    // Try fallback endpoint
    response = await fetch(fallbackUrl, {
      signal,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    });

    if (!response.ok || !isJson(response)) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  const result = await response.json();
  return result;
};

const fetchProduct = async (id, signal) => {
  const response = await fetch(`${API_BASE}/products/${id}?includeImages=true`, {
    signal,
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Hook for fetching products list with optimized settings for admin interface
export const useProducts = (category, search, page = 1, limit = 20) => {
  return useQuery({
    queryKey: queryKeys.products.list(category, search, page, limit),
    queryFn: ({ signal }) => fetchProducts({ category, search, page, limit, signal, useFastEndpoint: true }),
    keepPreviousData: false, // Disable to allow faster navigation
    staleTime: 10 * 1000, // 10 seconds - faster updates
    cacheTime: 1 * 60 * 1000, // 1 minute cache time
    refetchOnWindowFocus: false, // Disable to prevent unnecessary refetches
    refetchOnReconnect: false, // Disable to allow faster navigation
    refetchOnMount: false, // Disable to allow faster navigation
    // Fast retry settings
    retry: 1, // Reduce retry attempts for faster failure
    retryDelay: 500, // Fixed 500ms delay
    refetchInterval: false, // Disabled automatic refetching
    refetchIntervalInBackground: false, // Disabled background refetching
  });
};

// Hook for infinite scrolling products (optimized for fast initial load)
export const useInfiniteProducts = (category, search, limit = 8) => {
  return useInfiniteQuery({
    queryKey: queryKeys.products.list(category, search, 'infinite', limit),
    queryFn: ({ pageParam = 1, signal }) =>
      fetchProducts({ category, search, page: pageParam, limit, signal }),
    getNextPageParam: (lastPage) => {
      const p = lastPage?.pagination;
      if (p?.hasNextPage) {
        return (p.currentPage || 1) + 1;
      }
      return undefined;
    },
    // Optimized caching settings for better performance (like old version)
    staleTime: 2 * 60 * 1000, // 2 minutes - longer to reduce refetches
    cacheTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    refetchOnMount: false, // Don't refetch on mount if fresh
    // Network optimizations
    networkMode: 'online', // Only fetch when online
    retry: 2, // Reduced retries for faster failure
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 15000), // Faster retry
  });
};

// Hook for fetching individual product details
export const useProduct = (id, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: ({ signal }) => fetchProduct(id, signal),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000, // Product details cached longer (5 minutes)
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook for prefetching product details on hover/interaction
export const usePrefetchProduct = () => {
  return (id) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(id),
      queryFn: ({ signal }) => fetchProduct(id, signal),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Hook for search with debouncing built-in
export const useSearchProducts = (query, page = 1, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.search.products(query, page),
    queryFn: ({ signal }) => fetchProducts({ search: query, page, limit: 20, signal }),
    enabled: enabled && query && query.trim().length > 2,
    keepPreviousData: true,
    staleTime: 3 * 60 * 1000, // Search results cached for 3 minutes
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Mutation hooks for product operations
export const useCreateProduct = () => {
  return useMutation({
    mutationFn: async (productData) => {
      // console.log('🔄 Sending product data to backend:', productData);

      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      // console.log('📡 Backend response status:', response.status, response.statusText);

      // Check if response is successful (200-299 range)
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error response (raw):', errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error('❌ Failed to parse error response as JSON');
        }
        console.error('❌ Backend error response (parsed):', errorData);
        const errorMessage = errorData.message || errorData.error || errorText || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      // console.log('✅ Backend success response:', responseData);
      return responseData;
    },
    onSuccess: async (data) => {
      // console.log('✅ Product created successfully:', data);
      // OPTIMIZED: Only invalidate specific query patterns, no await
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists(), exact: false });
      // Also invalidate admin fast list queries so AdminProducts refreshes immediately
      queryClient.invalidateQueries({ queryKey: ['products-fast'], exact: false });
      // GENTLE: Only invalidate recent activities, don't force immediate refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.all });

      // Don't wait for invalidation - let it happen in background
    },
    onError: (error) => {
      console.error('❌ Product creation failed:', error);
    },
    // Performance optimizations
    retry: false, // Don't retry failed mutations to save time
    networkMode: 'always', // Always attempt the request
  });
};

export const useUpdateProduct = () => {
  return useMutation({
    mutationFn: async ({ id, ...productData }) => {
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      return response.json();
    },
    onSuccess: async (data, variables) => {
      // OPTIMIZED: Immediate cache update + gentle background invalidation
      // Align cache shape with GET /products/:id which returns { product }
      const detailPayload = data && data.product ? data : (data && data._id ? { product: data } : data);
      queryClient.setQueryData(
        queryKeys.products.detail(variables.id),
        detailPayload
      );
      // Background invalidation without waiting
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists(), exact: false });
      // Ensure AdminProducts (which uses ['products-fast', ...]) gets updated too
      queryClient.invalidateQueries({ queryKey: ['products-fast'], exact: false });
      // GENTLE: Only invalidate recent activities, don't force immediate refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.all });
    },
    // Performance optimizations
    retry: false, // Don't retry to save time
    networkMode: 'always',
  });
};

export const useDeleteProduct = () => {
  return useMutation({
    mutationFn: async (id) => {
      console.log('🗑️ Deleting product:', id);

      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
      });

      console.log('📡 Delete response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Delete error response:', errorData);
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('✅ Delete success response:', responseData);
      return responseData;
    },
    onSuccess: (data, id) => {
      console.log('✅ Product deleted successfully:', id);
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.products.detail(id) });
      // Invalidate products list
      invalidateQueries.products();
      // Also invalidate the fast products list to refresh AdminProducts immediately
      queryClient.invalidateQueries({ queryKey: ['products-fast'], exact: false });
      // GENTLE: Only invalidate recent activities, don't force immediate refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.all });
    },
    onError: (error) => {
      console.error('❌ Product deletion failed:', error);
    },
  });
};

export const useArchiveProduct = () => {
  return useMutation({
    mutationFn: async ({ id, archived }) => {
      const response = await fetch(`${API_BASE}/products/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived }),
      });
      if (!response.ok) throw new Error('Failed to update archive status');
      return response.json();
    },
    onSuccess: () => {
      invalidateQueries.products();
    },
  });
};

export const useRestoreProduct = () => {
  return useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`${API_BASE}/products/${id}/restore`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to restore product');
      return response.json();
    },
    onSuccess: (data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.products.detail(id) });
      invalidateQueries.products();
    },
  });
};

// Helper hook for cache management
export const useProductCache = () => {
  return {
    invalidateProducts: () => invalidateQueries.products(),
    invalidateProduct: (id) => invalidateQueries.productDetail(id),
    prefetchProduct: (id) => {
      return queryClient.prefetchQuery({
        queryKey: queryKeys.products.detail(id),
        queryFn: ({ signal }) => fetchProduct(id, signal),
        staleTime: 5 * 60 * 1000,
      });
    },
    getProductFromCache: (id) => {
      return queryClient.getQueryData(queryKeys.products.detail(id));
    },
    setProductInCache: (id, data) => {
      queryClient.setQueryData(queryKeys.products.detail(id), data);
    },
  };
};