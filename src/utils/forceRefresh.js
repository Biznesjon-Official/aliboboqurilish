// Force refresh utility for immediate stock updates
export const forceRefreshAllStocks = () => {
  if (typeof window === 'undefined') return;
  
  console.log('🔄 FORCE REFRESH: Starting aggressive stock update...');
  
  // 1. Clear all React Query caches
  if (window.queryClient) {
    console.log('🗑️ Clearing React Query cache...');
    window.queryClient.clear();
    
    // Force refetch all product queries
    window.queryClient.refetchQueries({
      queryKey: ['products'],
      exact: false,
      type: 'all'
    });
  }
  
  // 2. Update global stock from localStorage
  if (window.stockManager) {
    console.log('🔄 Syncing global stock from localStorage...');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('stock_')) {
        const productId = key.replace('stock_', '');
        const stock = parseInt(localStorage.getItem(key));
        if (!isNaN(stock)) {
          window.stockManager.updateStock(productId, stock);
        }
      }
    }
  }
  
  // 3. Trigger browser sync
  if (window.browserStockSync) {
    console.log('📦 Triggering browser sync...');
    window.browserStockSync.syncAllStocks();
  }
  
  // 4. Dispatch global refresh event
  window.dispatchEvent(new CustomEvent('forceStockRefresh', {
    detail: { timestamp: new Date().toISOString() }
  }));
  
  console.log('✅ FORCE REFRESH: Complete!');
};

// Add keyboard shortcut for force refresh (Ctrl+R+R)
let lastKeyTime = 0;
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'r') {
    const currentTime = Date.now();
    if (currentTime - lastKeyTime < 500) { // Double Ctrl+R within 500ms
      e.preventDefault();
      forceRefreshAllStocks();
      lastKeyTime = 0; // Reset
    } else {
      lastKeyTime = currentTime;
    }
  }
});

console.log('⌨️ Force refresh shortcut: Ctrl+R+R (double Ctrl+R)');