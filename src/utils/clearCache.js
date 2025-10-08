// Auto-clear cache in development for easier debugging
import { staticCache } from './staticCache';

// Clear cache on hot reload in development
if (process.env.NODE_ENV === 'development') {
  // Clear cache when module is loaded (hot reload)
  staticCache.clear();
  
  // Clear cache on page visibility change (when switching tabs)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Clear stale cache when user returns to tab
        staticCache.cleanup();
      }
    });
  }
  
  // Clear cache on window focus (when user returns to window)
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
      staticCache.cleanup();
    });
    
    // Expose cache utilities to window for debugging
    window.aliboboCache = {
      cache: staticCache,
      clear: () => staticCache.clear(),
      stats: () => staticCache.getStats(),
      cleanup: () => staticCache.cleanup()
    };
    
    console.log('🔧 Development cache utilities available at window.aliboboCache');
  }
}

export default staticCache;