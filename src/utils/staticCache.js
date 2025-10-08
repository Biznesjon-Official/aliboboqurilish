// Static cache utility for improved performance
class StaticCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
    this.maxSize = 100; // Maximum cache entries
    
    // Clean expired entries every 2 minutes
    setInterval(() => this.cleanup(), 2 * 60 * 1000);
  }
  
  // Generate cache key
  generateKey(prefix, ...args) {
    return `${prefix}_${args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join('_')}`;
  }
  
  // Set cache entry
  set(key, value, ttl = this.defaultTTL) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 Cached: ${key} (TTL: ${ttl}ms)`);
    }
  }
  
  // Get cache entry
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 Cache hit: ${key}`);
    }
    
    return entry.value;
  }
  
  // Check if key exists and is valid
  has(key) {
    return this.get(key) !== null;
  }
  
  // Delete specific key
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted && process.env.NODE_ENV === 'development') {
      console.log(`🗑️ Cache deleted: ${key}`);
    }
    return deleted;
  }
  
  // Clear all cache
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️ Cache cleared: ${size} entries`);
    }
  }
  
  // Clean expired entries
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0 && process.env.NODE_ENV === 'development') {
      console.log(`🧹 Cache cleanup: ${cleaned} expired entries removed`);
    }
  }
  
  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;
    
    for (const [, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      } else {
        valid++;
      }
    }
    
    return {
      total: this.cache.size,
      valid,
      expired,
      maxSize: this.maxSize
    };
  }
}

// Create singleton instance
export const staticCache = new StaticCache();

// Cache key generators for different data types
export const CACHE_KEYS = {
  PRODUCTS_LIST: (category, search, page, limit) => 
    staticCache.generateKey('products_list', category || 'all', search || '', page, limit),
  
  PRODUCT_DETAIL: (id) => 
    staticCache.generateKey('product_detail', id),
  
  CATEGORIES: () => 
    staticCache.generateKey('categories'),
  
  CRAFTSMEN_LIST: (page, limit) => 
    staticCache.generateKey('craftsmen_list', page, limit),
  
  CRAFTSMAN_DETAIL: (id) => 
    staticCache.generateKey('craftsman_detail', id),
  
  ORDERS_LIST: (page, limit, status) => 
    staticCache.generateKey('orders_list', page, limit, status || 'all'),
  
  STATISTICS: (type) => 
    staticCache.generateKey('statistics', type),
  
  SEARCH_RESULTS: (query, type) => 
    staticCache.generateKey('search_results', query, type || 'products')
};

// Cache invalidation helpers
export const invalidateCache = {
  products: () => {
    // Invalidate all product-related cache
    for (const key of staticCache.cache.keys()) {
      if (key.includes('products_') || key.includes('categories')) {
        staticCache.delete(key);
      }
    }
  },
  
  craftsmen: () => {
    // Invalidate all craftsmen-related cache
    for (const key of staticCache.cache.keys()) {
      if (key.includes('craftsmen_')) {
        staticCache.delete(key);
      }
    }
  },
  
  orders: () => {
    // Invalidate all order-related cache
    for (const key of staticCache.cache.keys()) {
      if (key.includes('orders_')) {
        staticCache.delete(key);
      }
    }
  },
  
  all: () => {
    staticCache.clear();
  }
};

export default staticCache;