// Browser-based stock sync for immediate updates
class BrowserStockSync {
  constructor() {
    this.initialized = false;
    this.subscribers = new Set();
  }

  init() {
    if (this.initialized) return;
    
    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Listen for custom stock update events
    window.addEventListener('stockUpdate', this.handleStockUpdate.bind(this));
    
    // Periodic sync every 3 seconds
    this.syncInterval = setInterval(() => {
      this.syncAllStocks();
    }, 3000);
    
    this.initialized = true;
    console.log('🔄 Browser Stock Sync initialized');
  }

  handleStorageChange(event) {
    if (event.key && event.key.startsWith('stock_')) {
      const productId = event.key.replace('stock_', '');
      const newStock = parseInt(event.newValue);
      
      if (!isNaN(newStock)) {
        console.log(`📦 Storage sync: Product ${productId} → ${newStock}`);
        this.notifySubscribers(productId, newStock);
      }
    }
  }

  handleStockUpdate(event) {
    const { productId, newQuantity } = event.detail;
    if (productId && newQuantity !== undefined) {
      // Store in localStorage for cross-tab sync
      localStorage.setItem(`stock_${productId}`, newQuantity.toString());
      console.log(`💾 Stored stock: Product ${productId} → ${newQuantity}`);
    }
  }

  updateStock(productId, newStock) {
    localStorage.setItem(`stock_${productId}`, newStock.toString());
    this.notifySubscribers(productId, newStock);
  }

  getStock(productId) {
    const stored = localStorage.getItem(`stock_${productId}`);
    return stored ? parseInt(stored) : null;
  }

  syncAllStocks() {
    // Force sync all products from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('stock_')) {
        const productId = key.replace('stock_', '');
        const stock = parseInt(localStorage.getItem(key));
        
        if (!isNaN(stock)) {
          // Update global stock manager if available
          if (window.stockManager) {
            const currentStock = window.stockManager.getStock(productId);
            if (currentStock !== stock) {
              console.log(`🔄 Sync update: Product ${productId} ${currentStock} → ${stock}`);
              window.stockManager.updateStock(productId, stock);
            }
          }
        }
      }
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(productId, newStock) {
    this.subscribers.forEach(callback => {
      try {
        callback(productId, newStock);
      } catch (error) {
        console.error('Error in browser sync subscriber:', error);
      }
    });
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
    window.removeEventListener('stockUpdate', this.handleStockUpdate.bind(this));
    this.subscribers.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const browserStockSync = new BrowserStockSync();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => browserStockSync.init());
} else {
  browserStockSync.init();
}

// Expose globally
if (typeof window !== 'undefined') {
  window.browserStockSync = browserStockSync;
}

export default browserStockSync;