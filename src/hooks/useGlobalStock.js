import { useState, useEffect, useCallback } from 'react';

// Global stock state - bypasses React Query for immediate updates
let globalStockState = new Map();
let subscribers = new Set();

// Global stock manager
const stockManager = {
  // Update stock for a product
  updateStock: (productId, newStock) => {
    globalStockState.set(productId, newStock);
    // Notify all subscribers immediately
    subscribers.forEach(callback => {
      try {
        callback(productId, newStock);
      } catch (error) {
        console.error('Error in stock subscriber:', error);
      }
    });
  },

  // Get current stock for a product
  getStock: (productId) => {
    return globalStockState.get(productId);
  },

  // Subscribe to stock updates
  subscribe: (callback) => {
    subscribers.add(callback);
    // Return unsubscribe function
    return () => {
      subscribers.delete(callback);
    };
  },

  // Initialize stock from product data
  initializeStock: (productId, initialStock) => {
    if (!globalStockState.has(productId)) {
      globalStockState.set(productId, initialStock);
    }
  },

  // Clear all stock data (for testing)
  clear: () => {
    globalStockState.clear();
  }
};

// CRITICAL: Expose to window for immediate access
if (typeof window !== 'undefined') {
  window.stockManager = stockManager;
}

// Hook for using global stock state
export const useGlobalStock = (productId, initialStock) => {
  const [localStock, setLocalStock] = useState(initialStock);

  // Initialize stock in global state
  useEffect(() => {
    stockManager.initializeStock(productId, initialStock);
    const currentGlobalStock = stockManager.getStock(productId);
    if (currentGlobalStock !== undefined && currentGlobalStock !== localStock) {
      setLocalStock(currentGlobalStock);
    }
  }, [productId, initialStock, localStock]);

  // Subscribe to global stock updates
  useEffect(() => {
    const unsubscribe = stockManager.subscribe((updatedProductId, newStock) => {
      if (updatedProductId === productId) {
        setLocalStock(newStock);
      }
    });

    return unsubscribe;
  }, [productId]);

  // Function to update stock manually
  const updateStock = useCallback((newStock) => {
    stockManager.updateStock(productId, newStock);
  }, [productId]);

  return {
    stock: localStock,
    updateStock,
    globalStock: stockManager.getStock(productId)
  };
};

// Hook for listening to WebSocket updates and updating global stock
export const useGlobalStockListener = () => {
  useEffect(() => {
    // Listen for custom stock update events and update global state
    const handleStockUpdate = (event) => {
      const { productId, newQuantity } = event.detail;
      if (productId && newQuantity !== undefined) {
        stockManager.updateStock(productId, newQuantity);
      }
    };

    window.addEventListener('stockUpdate', handleStockUpdate);
    
    return () => {
      window.removeEventListener('stockUpdate', handleStockUpdate);
    };
  }, []);

  return stockManager;
};

export default stockManager;