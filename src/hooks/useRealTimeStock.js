import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys, optimisticUpdates } from '../lib/queryClient';
import socketService from '../services/SocketService';

/**
 * Custom hook for managing real-time stock updates via WebSocket
 * Automatically updates React Query cache when stock changes are received
 */
export const useRealTimeStock = (options = {}) => {
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef(null);
  const { debug = false, onStockUpdate, onLowStock } = options;

  useEffect(() => {
    // Initialize socket service if not already done
    if (!socketService.isConnected) {
      socketService.initialize();
    }

    // Handle stock updates
    const handleStockUpdate = (data) => {
      if (debug) {
        console.log('🔄 Real-time stock update received:', data);
      }

      try {
        if (data.type === 'single_product') {
          // Handle single product stock update
          updateSingleProductStock(data);
        } else if (data.type === 'bulk_update') {
          // Handle bulk stock updates (multiple products)
          updateBulkProductStock(data);
        }

        // Call custom callback if provided
        if (onStockUpdate) {
          onStockUpdate(data);
        }
      } catch (error) {
        console.error('Error processing stock update:', error);
      }
    };

    // Handle low stock alerts
    const handleLowStockAlert = (data) => {
      if (debug) {
        console.log('⚠️ Low stock alert received:', data);
      }

      if (onLowStock) {
        onLowStock(data);
      }
    };

    // Subscribe to socket events
    const unsubscribeStock = socketService.on('stockUpdate', handleStockUpdate);
    const unsubscribeLowStock = socketService.on('lowStockAlert', handleLowStockAlert);

    // Store unsubscribe functions
    unsubscribeRef.current = () => {
      unsubscribeStock();
      unsubscribeLowStock();
    };

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [debug, onStockUpdate, onLowStock]);

  // Helper function to update single product stock in cache
  const updateSingleProductStock = (data) => {
    const { productId, newQuantity, variantOption } = data;

    try {
      // Use optimistic updates for immediate UI response
      optimisticUpdates.updateProductStock(productId, newQuantity, variantOption);
      
      if (debug) {
        console.log(`📦 Optimistically updated product ${productId} stock to ${newQuantity}${variantOption ? ` (${variantOption})` : ''}`);
      }
      
      // IMMEDIATE: Emit custom DOM event for instant UI updates
      window.dispatchEvent(new CustomEvent('stockUpdate', {
        detail: {
          productId,
          newQuantity,
          variantOption,
          timestamp: new Date().toISOString()
        }
      }));
      
      // FORCE IMMEDIATE: Update global stock manager
      if (window.stockManager) {
        window.stockManager.updateStock(productId, newQuantity);
      }
      
      // IMMEDIATE: Force all caches to be invalid and refetch NOW
      queryClient.invalidateQueries({ 
        queryKey: ['products'],
        exact: false,
        refetchType: 'all'
      });
      
      // IMMEDIATE: Clear all cached product data
      queryClient.removeQueries({
        queryKey: ['products'],
        exact: false
      });
      
      // IMMEDIATE: Force immediate refetch of specific product
      queryClient.resetQueries({
        queryKey: queryKeys.products.detail(productId),
        exact: true
      });
      
      // IMMEDIATE: Force immediate refetch of product lists
      queryClient.resetQueries({
        queryKey: queryKeys.products.lists(),
        exact: false
      });
      
    } catch (error) {
      console.error('Error updating product stock:', error);
      // Fallback to full invalidation if optimistic update fails
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.all
      });
    }
  };

  // Helper function to update multiple products in bulk
  const updateBulkProductStock = (data) => {
    const { updates } = data;

    if (!Array.isArray(updates)) {
      console.warn('Invalid bulk stock update format:', data);
      return;
    }

    try {
      // Use optimistic bulk updates for immediate UI response
      const results = optimisticUpdates.updateMultipleProductsStock(
        updates.map(update => ({
          productId: update.productId,
          newStock: update.newQuantity,
          variantOption: update.variantOption
        }))
      );
      
      if (debug) {
        console.log(`📦 Optimistically bulk updated stock for ${results.length} products`);
      }
      
    } catch (error) {
      console.error('Error in bulk stock update:', error);
      // Fallback to invalidation
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.all
      });
    }
  };

  // Return helper functions for manual operations
  return {
    isConnected: socketService.isConnected,
    connectionStatus: socketService.getConnectionStatus(),
    // Manual invalidation helpers
    invalidateProductStock: (productId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(productId)
      });
    },
    invalidateAllProducts: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.all
      });
    },
    // Socket control
    joinAdminRoom: () => socketService.joinAdminRoom(),
    leaveAdminRoom: () => socketService.leaveAdminRoom(),
  };
};

/**
 * Simplified hook for basic stock monitoring without callbacks
 */
export const useStockMonitor = (debug = false) => {
  return useRealTimeStock({ debug });
};

/**
 * Hook specifically for admin users with low stock alerts
 */
export const useAdminStockMonitor = (onLowStock) => {
  const stockHook = useRealTimeStock({
    debug: true,
    onLowStock
  });

  useEffect(() => {
    // Auto-join admin room for admin-specific events
    stockHook.joinAdminRoom();

    return () => {
      stockHook.leaveAdminRoom();
    };
  }, [stockHook]);

  return stockHook;
};

export default useRealTimeStock;