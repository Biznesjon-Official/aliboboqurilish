import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '../services/api';
import { queryKeys } from '../lib/queryClient';

// Get all orders with filters and pagination
export const useOrders = (page = 1, limit = 50, filters = {}) => {
  return useQuery({
    queryKey: queryKeys.orders.list(page, limit, filters),
    queryFn: () => ordersAPI.getAll({ page, limit, ...filters }),
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
  });
};

// Get single order by ID
export const useOrder = (id) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersAPI.getById(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get orders count
export const useOrdersCount = () => {
  return useQuery({
    queryKey: queryKeys.orders.stats(),
    queryFn: () => ordersAPI.getCount(),
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get orders count by status
export const useOrdersCountByStatus = () => {
  return useQuery({
    queryKey: [...queryKeys.orders.stats(), 'by-status'],
    queryFn: () => ordersAPI.getCountByStatus(),
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create new order
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData) => ordersAPI.create(orderData),
    onSuccess: (newOrder) => {
      // AGGRESSIVE: Clear ALL product caches immediately
      queryClient.removeQueries({ queryKey: ['products'], exact: false });
      queryClient.removeQueries({ queryKey: ['search'], exact: false });
      
      // Force immediate refetch of all product data
      queryClient.refetchQueries({ 
        queryKey: ['products'], 
        exact: false,
        type: 'all'
      });
      
      // Invalidate and refetch orders list
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      
      // Add the new order to the cache
      queryClient.setQueryData(queryKeys.orders.detail(newOrder.id || newOrder._id), newOrder);
      
      // Update orders count
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() });
      
      // Force global stock refresh
      if (window.forceRefreshAllStocks) {
        window.forceRefreshAllStocks();
      }
      
      console.log('✅ Order created successfully:', newOrder);
    },
    onError: (error) => {
      console.error('❌ Failed to create order:', error);
    },
  });
};

// Update order
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => ordersAPI.update(id, data),
    onSuccess: (updatedOrder, { id }) => {
      // Update the specific order in cache
      queryClient.setQueryData(queryKeys.orders.detail(id), updatedOrder);
      
      // Invalidate orders list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      
      console.log('✅ Order updated successfully:', updatedOrder);
    },
    onError: (error) => {
      console.error('❌ Failed to update order:', error);
    },
  });
};

// Update order status
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, notes }) => ordersAPI.updateStatus(id, { status, notes }),
    onSuccess: (updatedOrder, { id }) => {
      // Update the specific order in cache
      queryClient.setQueryData(queryKeys.orders.detail(id), updatedOrder);
      
      // Invalidate orders list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      
      // Update status count
      queryClient.invalidateQueries({ queryKey: [...queryKeys.orders.stats(), 'by-status'] });
      
      console.log('✅ Order status updated successfully:', updatedOrder);
    },
    onError: (error) => {
      console.error('❌ Failed to update order status:', error);
    },
  });
};

// Cancel order
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => ordersAPI.updateStatus(id, { status: 'cancelled' }),
    onSuccess: (updatedOrder, id) => {
      // Update the specific order in cache
      queryClient.setQueryData(queryKeys.orders.detail(id), updatedOrder);
      
      // Invalidate orders list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      
      // Update status count
      queryClient.invalidateQueries({ queryKey: [...queryKeys.orders.stats(), 'by-status'] });
      
      console.log('✅ Order cancelled successfully:', updatedOrder);
    },
    onError: (error) => {
      console.error('❌ Failed to cancel order:', error);
    },
  });
};

// Delete order
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => ordersAPI.delete(id),
    onSuccess: (_, id) => {
      // Remove the order from cache
      queryClient.removeQueries({ queryKey: queryKeys.orders.detail(id) });
      
      // Invalidate orders list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      
      // Update orders count
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats() });
      
      console.log('✅ Order deleted successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to delete order:', error);
    },
  });
};

// Custom hook for order cache management
export const useOrderCache = () => {
  const queryClient = useQueryClient();

  const invalidateOrders = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
  };

  const invalidateOrder = (id) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(id) });
  };

  const removeOrder = (id) => {
    queryClient.removeQueries({ queryKey: queryKeys.orders.detail(id) });
  };

  const prefetchOrder = (id) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.orders.detail(id),
      queryFn: () => ordersAPI.getById(id),
    });
  };

  const getOrderFromCache = (id) => {
    return queryClient.getQueryData(queryKeys.orders.detail(id));
  };

  const setOrderInCache = (id, orderData) => {
    queryClient.setQueryData(queryKeys.orders.detail(id), orderData);
  };

  return {
    invalidateOrders,
    invalidateOrder,
    removeOrder,
    prefetchOrder,
    getOrderFromCache,
    setOrderInCache,
  };
};