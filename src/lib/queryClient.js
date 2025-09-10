import { QueryClient } from '@tanstack/react-query';

// Create query client with ultra-optimized performance settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Aggressive staleTime for immediate loading
      staleTime: 30 * 1000, // Reduced to 30 seconds for faster updates
      // Data stays in cache for reasonable time
      gcTime: 5 * 60 * 1000, // Reduced to 5 minutes for better memory management
      // Disable aggressive refetching to prevent constant loading
      refetchOnWindowFocus: false,
      // Disable refetch on reconnect for faster startup
      refetchOnReconnect: false,
      // Don't force refetch on every mount for speed
      refetchOnMount: false,
      // Ultra-fast retry strategy
      retry: 1, // Reduced to 1 retry for speed
      // Don't retry on client errors (404, 400)
      retryCondition: (failureCount, error) => {
        // Don't retry on 404 or 400 errors (client errors)
        if (error?.response?.status === 404 || error?.response?.status === 400) {
          return false;
        }
        // Don't retry on network abort errors
        if (error?.name === 'AbortError') {
          return false;
        }
        return failureCount < 1; // Only 1 retry for speed
      },
      // Fast retry delay for immediate response
      retryDelay: 300, // Reduced to 300ms for faster retry
      // Keep previous data while fetching new data for smooth UX
      keepPreviousData: false, // Disable to show fresh data immediately
      // Use structural sharing for minimizing re-renders
      structuralSharing: true,
      // Prevent request duplication with this network deduping window
      networkMode: 'always',
    },
    mutations: {
      // OPTIMIZED: No retry for mutations to save time
      retry: false, // Changed from 1 to false for faster response
      // Reduce mutation network spam with deduping window
      networkMode: 'always',
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Product-related queries
  products: {
    all: ['products'],
    lists: () => [...queryKeys.products.all, 'list'],
    list: (category, search, page = 1, limit = 200, all = false) => 
      [...queryKeys.products.lists(), { category, search, page, limit, all }],
    details: () => [...queryKeys.products.all, 'detail'],
    detail: (id) => [...queryKeys.products.details(), id],
  },
  
  // Craftsmen-related queries
  craftsmen: {
    all: ['craftsmen'],
    lists: () => [...queryKeys.craftsmen.all, 'list'],
    list: (specialty, search, page = 1, limit = 50, sortBy = 'joinDate', sortOrder = 'desc') => 
      [...queryKeys.craftsmen.lists(), { specialty, search, page, limit, sortBy, sortOrder }],
    details: () => [...queryKeys.craftsmen.all, 'detail'],
    detail: (id) => [...queryKeys.craftsmen.details(), id],
  },
  
  // Order-related queries
  orders: {
    all: ['orders'],
    lists: () => [...queryKeys.orders.all, 'list'],
    list: (page = 1, limit = 20, status = '', sortBy = 'createdAt', sortOrder = 'desc') => 
      [...queryKeys.orders.lists(), { page, limit, status, sortBy, sortOrder }],
    details: () => [...queryKeys.orders.all, 'detail'],
    detail: (id) => [...queryKeys.orders.details(), id],
    stats: () => [...queryKeys.orders.all, 'stats'],
  },
  
  // Notification-related queries
  notifications: {
    all: ['notifications'],
    lists: () => [...queryKeys.notifications.all, 'list'],
    list: (page = 1, limit = 20, read, entityType, search) => 
      [...queryKeys.notifications.lists(), { page, limit, read, entityType, search }],
    details: () => [...queryKeys.notifications.all, 'detail'],
    detail: (id) => [...queryKeys.notifications.details(), id],
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'],
  },
  
  // Recent activities queries
  recentActivities: {
    all: ['recent-activities'],
    lists: () => [...queryKeys.recentActivities.all, 'list'],
    list: (page = 1, limit = 20, filter = 'all') => 
      [...queryKeys.recentActivities.lists(), { page, limit, filter }],
    details: () => [...queryKeys.recentActivities.all, 'detail'],
    detail: (id) => [...queryKeys.recentActivities.details(), id],
    stats: () => [...queryKeys.recentActivities.all, 'stats'],
  },
  
  // Statistics queries
  statistics: {
    all: ['statistics'],
    dashboard: () => [...queryKeys.statistics.all, 'dashboard'],
    products: () => [...queryKeys.statistics.all, 'products'],
    orders: () => [...queryKeys.statistics.all, 'orders'],
    craftsmen: () => [...queryKeys.statistics.all, 'craftsmen'],
  },
  
  // Search queries
  search: {
    all: ['search'],
    products: (query, page = 1) => [...queryKeys.search.all, 'products', query, page],
    craftsmen: (query, page = 1) => [...queryKeys.search.all, 'craftsmen', query, page],
  }
};

// Utility function to invalidate queries
export const invalidateQueries = {
  products: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  craftsmen: () => queryClient.invalidateQueries({ queryKey: queryKeys.craftsmen.all }),
  orders: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
  notifications: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  recentActivities: () => queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.all }),
  statistics: () => queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all }),
};

// Prefetch functions for critical data
export const prefetch = {
  // Prefetch product by ID
  product: async (id) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(id),
      queryFn: async ({ signal }) => {
        try {
          const response = await fetch(`http://localhost:5000/api/products/${id}`, { signal });
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          return await response.json();
        } catch (error) {
          console.error('Error prefetching product:', error);
          throw error;
        }
      },
      staleTime: 5 * 60 * 1000, // Product details are cached longer
    });
  },
  
  productsList: (category, search, limit = 20, all = false) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.products.list(category, search, 1, limit, all),
      queryFn: async ({ signal }) => {
        try {
          const params = new URLSearchParams({
            limit: limit.toString(),
            page: '1',
            sortBy: 'updatedAt',
            sortOrder: 'desc',
          });
          
          // Add 'all' parameter if needed
          if (all) {
            params.append('all', 'true');
          }
          
          if (category) params.append('category', category);
          if (search) params.append('search', search);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
          
          // Direct connection to backend
          const response = await fetch(`http://localhost:5000/api/products?${params.toString()}`, { 
            signal: AbortSignal.any([signal, controller.signal]), 
            headers: { 'Cache-Control': 'max-age=3600' } // Enable HTTP cache
          });
          
          clearTimeout(timeoutId); // Clear the timeout
          
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          return await response.json();
        } catch (error) {
          // More specific error handling
          if (error.name === 'AbortError') {
            console.warn('Request aborted or timed out');
          } else {
            console.error('Error prefetching products list:', error);
          }
          throw error;
        }
      },
      // Increased staleTime for product lists
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Cache for longer
      gcTime: 15 * 60 * 1000, // 15 minutes
    });
  },
  
  // New method to prefetch craftsmen data
  craftsmenList: () => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.craftsmen.lists(),
      queryFn: async ({ signal }) => {
        try {
          const response = await fetch(`/api/craftsmen?limit=40&page=1`, { signal });
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          return await response.json();
        } catch (error) {
          console.error('Error prefetching craftsmen list:', error);
          throw error;
        }
      },
      staleTime: 5 * 60 * 1000,
    });
  },
  
  // New method to prefetch dashboard statistics
  dashboardStats: () => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.statistics.dashboard(),
      queryFn: async ({ signal }) => {
        try {
          const response = await fetch(`/api/statistics/dashboard`, { signal });
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          return await response.json();
        } catch (error) {
          console.error('Error prefetching dashboard stats:', error);
          throw error;
        }
      },
      staleTime: 30 * 1000, // 30 seconds
    });
  },
};

export default queryClient;