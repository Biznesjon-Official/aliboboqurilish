import { QueryClient } from '@tanstack/react-query';

// Create query client with optimized performance settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Balanced staleTime for better user experience
      staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
      // Data stays in cache longer before garbage collection
      gcTime: 10 * 60 * 1000, // 10 minutes
      // Disable aggressive refetching to prevent constant loading
      refetchOnWindowFocus: false,
      // Enable refetch on reconnect for real-time data
      refetchOnReconnect: true,
      // Don't force refetch on every mount
      refetchOnMount: false,
      // Smart retry strategy to avoid wasting bandwidth
      retry: (failureCount, error) => {
        // Don't retry on 404 or 400 errors (client errors)
        if (error?.response?.status === 404 || error?.response?.status === 400) {
          return false;
        }
        // Don't retry on network abort errors
        if (error?.name === 'AbortError') {
          return false;
        }
        // Don't retry on network change errors
        if (error?.message?.includes('network change') || error?.message?.includes('ERR_NETWORK_CHANGED')) {
          return false;
        }
        return failureCount < 2; // Reduce max retries to 2 (was 3)
      },
      // Exponential backoff with jitter for better distributed retries
      retryDelay: attemptIndex => {
        // Base delay shorter for initial retry, capped at 5 seconds for faster updates
        const delay = Math.min(800 * (2 ** attemptIndex), 5000); // Reduced from 20000 to 5000
        // More pronounced jitter (up to 25%)
        return delay + (Math.random() * delay * 0.25);
      },
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
    list: (category, search, page = 1, limit = 200) => 
      [...queryKeys.products.lists(), { category, search, page, limit }],
    details: () => [...queryKeys.products.all, 'detail'],
    detail: (id) => [...queryKeys.products.details(), id],
  },
  
  // Craftsmen-related queries
  craftsmen: {
    all: ['craftsmen'],
    lists: () => [...queryKeys.craftsmen.all, 'list'],
    list: (specialty, search, page = 1, limit = 50, status = '', sortBy = 'joinDate', sortOrder = 'desc') =>
      [...queryKeys.craftsmen.lists(), { specialty, search, status, page, limit, sortBy, sortOrder }],
    details: () => [...queryKeys.craftsmen.all, 'detail'],
    detail: (id) => [...queryKeys.craftsmen.details(), id],
  },
  
  // Orders-related queries
  orders: {
    all: ['orders'],
    lists: () => [...queryKeys.orders.all, 'list'],
    list: (status, search, page = 1, limit = 50) =>
      [...queryKeys.orders.lists(), { status, search, page, limit }],
    details: () => [...queryKeys.orders.all, 'detail'],
    detail: (id) => [...queryKeys.orders.details(), id],
    // FIXED: Stats function for order statistics
    stats: () => [...queryKeys.orders.all, 'stats'],
  },
  
  // Search-related queries
  search: {
    all: ['search'],
    products: (query, page = 1) => [...queryKeys.search.all, 'products', { query, page }],
  },
  
  // Category-related queries
  categories: {
    all: ['categories'],
    list: () => [...queryKeys.categories.all, 'list'],
  },
  
  // Statistics and admin queries
  statistics: {
    all: ['statistics'],
    dashboard: () => [...queryKeys.statistics.all, 'dashboard'],
    orders: () => [...queryKeys.statistics.all, 'orders'],
  },

  // Stock management queries (NEW for real-time updates)
  stock: {
    all: ['stock'],
    product: (id) => [...queryKeys.stock.all, 'product', id],
    levels: () => [...queryKeys.stock.all, 'levels'],
  },

  // Recent Activities queries
  recentActivities: {
    all: ['recent-activities'],
    lists: () => [...queryKeys.recentActivities.all, 'list'],
    list: (page = 1, limit = 20, filter = 'all') => 
      [...queryKeys.recentActivities.lists(), { page, limit, filter }],
    details: () => [...queryKeys.recentActivities.all, 'detail'],
    detail: (id) => [...queryKeys.recentActivities.details(), id],
    stats: () => [...queryKeys.recentActivities.all, 'stats'],
  },
};

// Enhanced cache invalidation helpers for real-time stock updates
export const invalidateQueries = {
  products: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  productDetail: (id) => queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) }),
  search: () => queryClient.invalidateQueries({ queryKey: queryKeys.search.all }),
  categories: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
  craftsmen: () => queryClient.invalidateQueries({ queryKey: queryKeys.craftsmen.all }),
  orders: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
  recentActivities: () => queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.all }),
  recentActivityDetail: (id) => queryClient.invalidateQueries({ queryKey: queryKeys.recentActivities.detail(id) }),
  // NEW: Real-time stock invalidation
  stock: () => queryClient.invalidateQueries({ queryKey: queryKeys.stock.all }),
  productStock: (id) => queryClient.invalidateQueries({ queryKey: queryKeys.stock.product(id) }),
  // CRITICAL: Invalidate everything for immediate stock updates
  allProductData: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.stock.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.search.all });
  },
};

// Enhanced prefetch helpers for intelligent data preloading
export const prefetchQueries = {
  productDetail: (id) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(id),
      queryFn: async ({ signal }) => {
        try {
          const response = await fetch(`/api/products/${id}`, { signal });
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
  
  productsList: (category, search, limit = 20) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.products.list(category, search, 1, limit),
      queryFn: async ({ signal }) => {
        try {
          const params = new URLSearchParams({
            limit: limit.toString(),
            page: '1',
            sortBy: 'updatedAt',
            sortOrder: 'desc',
          });
          
          if (category) params.append('category', category);
          if (search) params.append('search', search);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
          
          // Direct connection to backend
          const base = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
          const response = await fetch(`${base}/products?${params.toString()}`, { 
            signal: AbortSignal.any([signal, controller.signal]), 
            headers: { 'Cache-Control': 'max-age=3600' } // Enable HTTP cache
          });
          
          clearTimeout(timeoutId); // Clear the timeout
          
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          return await response.json();
        } catch (error) {
          // More specific error handling
          if (error.name === 'AbortError') {
            // Silently handle timeout/abort to prevent console spam
            return { products: [], totalPages: 0, totalProducts: 0 };
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
          const base = process.env.REACT_APP_API_BASE || (process.env.NODE_ENV === 'production' ? 'https://aliboboqurilish.uz/api' : 'http://localhost:5000/api');
          const isProdHost = /aliboboqurilish\.uz/i.test(base || '');
          const url = `${base}/craftsmen?limit=20&page=1${isProdHost ? '&minimal=1' : ''}`;
          const response = await fetch(url, { signal });
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          return await response.json();
        } catch (error) {
          // Silently handle errors to prevent console spam
          if (error.name === 'AbortError') {
            return { craftsmen: [], totalPages: 0, totalCraftsmen: 0 };
          }
          // Only log non-abort errors
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
          const response = await fetch('/api/statistics/dashboard', { signal });
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          return await response.json();
        } catch (error) {
          console.error('Error prefetching dashboard stats:', error);
          throw error;
        }
      },
      staleTime: 1 * 60 * 1000, // Stats are more dynamic, 1 minute stale time
    });
  },
};

// NEW: Optimistic update helpers for real-time stock management
export const optimisticUpdates = {
  // Update product stock optimistically
  updateProductStock: (productId, newStock, variantOption = null) => {
    const productKey = queryKeys.products.detail(productId);
    const currentData = queryClient.getQueryData(productKey);
    
    if (currentData) {
      const updatedProduct = { ...currentData };
      
      if (variantOption && updatedProduct.hasVariants && updatedProduct.variants) {
        // Update variant stock
        updatedProduct.variants = updatedProduct.variants.map(variant => ({
          ...variant,
          options: variant.options.map(option => {
            if (option.value === variantOption) {
              return { ...option, stock: newStock };
            }
            return option;
          })
        }));
      } else {
        // Update main product stock
        updatedProduct.stock = newStock;
      }
      
      // Apply optimistic update to product detail cache
      queryClient.setQueryData(productKey, updatedProduct);
      
      // FORCE IMMEDIATE REFETCH: This ensures UI updates immediately
      setTimeout(() => {
        queryClient.refetchQueries({ 
          queryKey: queryKeys.products.detail(productId),
          type: 'active'
        });
      }, 100);
      
      // CRITICAL: Also update in ALL product lists that contain this product
      const allQueries = queryClient.getQueryCache().getAll();
      allQueries.forEach(query => {
        if (query.queryKey[0] === 'products' && 
            (query.queryKey.includes('list') || query.queryKey[1] === 'list')) {
          const queryData = query.state?.data;
          if (queryData?.products && Array.isArray(queryData.products)) {
            const productIndex = queryData.products.findIndex(p => p._id === productId);
            if (productIndex !== -1) {
              const updatedProducts = [...queryData.products];
              updatedProducts[productIndex] = {
                ...updatedProducts[productIndex],
                stock: variantOption ? updatedProducts[productIndex].stock : newStock
              };
              queryClient.setQueryData(query.queryKey, {
                ...queryData,
                products: updatedProducts
              });
              
              // Force refetch of this list too
              setTimeout(() => {
                queryClient.refetchQueries({ 
                  queryKey: query.queryKey,
                  type: 'active'
                });
              }, 150);
            }
          }
        }
      });
      
      // Also update search results
      const searchQueries = queryClient.getQueriesData({
        queryKey: queryKeys.search.all,
        exact: false
      });
      
      searchQueries.forEach(([queryKey, queryData]) => {
        if (queryData?.products && Array.isArray(queryData.products)) {
          const productIndex = queryData.products.findIndex(p => p._id === productId);
          if (productIndex !== -1) {
            const updatedProducts = [...queryData.products];
            updatedProducts[productIndex] = {
              ...updatedProducts[productIndex],
              stock: variantOption ? updatedProducts[productIndex].stock : newStock
            };
            queryClient.setQueryData(queryKey, {
              ...queryData,
              products: updatedProducts
            });
          }
        }
      });
      
      return updatedProduct;
    }
    
    return null;
  },
  
  // Rollback optimistic update if needed
  rollbackProductStock: (productId, originalStock, variantOption = null) => {
    return optimisticUpdates.updateProductStock(productId, originalStock, variantOption);
  },
  
  // Bulk update multiple products
  updateMultipleProductsStock: (updates) => {
    const results = [];
    
    updates.forEach(({ productId, newStock, variantOption }) => {
      const result = optimisticUpdates.updateProductStock(productId, newStock, variantOption);
      if (result) {
        results.push({ productId, updatedProduct: result });
      }
    });
    
    return results;
  },
};