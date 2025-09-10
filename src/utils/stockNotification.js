/**
 * Real-time stock notification system for immediate visual feedback
 */

class StockNotification {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.initialize();
  }

  initialize() {
    // Create notification container
    this.container = document.createElement('div');
    this.container.id = 'stock-notifications';
    this.container.className = 'fixed top-20 right-4 z-[10000] space-y-2 pointer-events-none';
    document.body.appendChild(this.container);

    // Listen for stock updates
    // Disable stock update notifications
    // window.addEventListener('stockUpdate', (event) => {
    //   this.showNotification(event.detail);
    // });

    // Listen for force refresh events
    window.addEventListener('forceStockRefresh', (event) => {
      this.showRefreshNotification(event.detail);
    });

    console.log('📱 Stock notification system initialized');
  }

  showNotification(data) {
    const { productId, newQuantity, oldQuantity } = data;
    
    const notification = document.createElement('div');
    notification.className = `
      bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg
      transform transition-all duration-300 ease-out
      translate-x-full opacity-0
      pointer-events-auto
    `;
    
    notification.innerHTML = `
      <div class=\"flex items-center space-x-3\">
        <div class=\"flex-shrink-0\">
          <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 13l4 4L19 7\"></path>
          </svg>
        </div>
        <div class=\"flex-1\">
          <p class=\"text-sm font-medium\">Stock Updated!</p>
          <p class=\"text-xs opacity-90\">Product: ${productId.slice(-8)}</p>
          <p class=\"text-xs opacity-90\">Quantity: ${newQuantity}</p>
        </div>
        <button onclick=\"this.parentElement.parentElement.remove()\" class=\"text-white hover:text-gray-200\">
          <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M6 18L18 6M6 6l12 12\"></path>
          </svg>
        </button>
      </div>
    `;
    
    this.container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
      notification.classList.add('translate-x-0', 'opacity-100');
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 300);
      }
    }, 3000);
  }

  showRefreshNotification(data) {
    const notification = document.createElement('div');
    notification.className = `
      bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg
      transform transition-all duration-300 ease-out
      translate-x-full opacity-0
      pointer-events-auto
    `;
    
    notification.innerHTML = `
      <div class=\"flex items-center space-x-3\">
        <div class=\"flex-shrink-0\">
          <svg class=\"w-5 h-5 animate-spin\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
            <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\"></path>
          </svg>
        </div>
        <div class=\"flex-1\">
          <p class=\"text-sm font-medium\">Refreshing Stocks...</p>
          <p class=\"text-xs opacity-90\">${data?.reason || 'Manual refresh'}</p>
        </div>
      </div>
    `;
    
    this.container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
      notification.classList.add('translate-x-0', 'opacity-100');
    }, 100);
    
    // Auto remove after 2 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 300);
      }
    }, 2000);
  }

  destroy() {
    if (this.container && this.container.parentElement) {
      this.container.remove();
    }
  }
}

// Initialize only in development
if (process.env.NODE_ENV === 'development') {
  let stockNotification;
  
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      stockNotification = new StockNotification();
    });
  } else {
    stockNotification = new StockNotification();
  }
  
  // Expose for cleanup
  window.stockNotification = stockNotification;
}

export default StockNotification;