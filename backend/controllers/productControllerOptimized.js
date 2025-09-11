// Optimized product controller for faster loading
const Product = require('../models/Product');

// Simple in-memory cache (in production, you might want to use Redis)
const fastCache = new Map();
const FAST_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of cache entries

// Helper function to clean expired cache entries
const cleanCache = () => {
  const now = Date.now();
  let deletedCount = 0;
  
  for (const [key, { timestamp }] of fastCache.entries()) {
    if ((now - timestamp) > FAST_CACHE_TTL) {
      fastCache.delete(key);
      deletedCount++;
    }
  }
  
  // If cache is still too large, remove oldest entries
  if (fastCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(fastCache.entries());
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest entries until we're under the limit
    const excess = fastCache.size - MAX_CACHE_SIZE;
    for (let i = 0; i < excess; i++) {
      fastCache.delete(entries[i][0]);
    }
  }
  
  if (process.env.NODE_ENV === 'development' && deletedCount > 0) {
    console.log(`[getProductsFast] Cleaned ${deletedCount} expired cache entries`);
  }
};

// Clean cache every 5 minutes
setInterval(cleanCache, 5 * 60 * 1000);

// Generate cache key based on query parameters
const getFastCacheKey = (query, page, limit, sort) => {
  return `products_fast_${JSON.stringify(query)}_${page}_${limit}_${JSON.stringify(sort)}`;
};

const getProductsFast = async (req, res) => {
  try {
    const debug = process.env.NODE_ENV === 'development'; // Enable debug only in development
    if (debug) console.log('[getProductsFast] Starting optimized product fetch');
    const startTime = Date.now();
    
    // Log incoming request
    if (debug) console.log('[getProductsFast] Request query:', req.query);
    
    // Simple pagination with stricter limits
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Default to 20, max 100
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * limit;
    
    // Basic query - only active products (fix for empty results)
    let query = {
      $and: [
        { $or: [{ status: 'active' }, { status: { $exists: false } }] },
        { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] }
      ]
    };
    
    // Category filter
    if (req.query.category && req.query.category.trim() !== '') {
      query.category = req.query.category.trim();
    }
    
    // Simple sort
    let sort = { updatedAt: -1 };
    if (req.query.sortBy === 'price') {
      sort = { price: req.query.sortOrder === 'asc' ? 1 : -1 };
    }
    
    // Serve from cache if available
    const cacheKey = getFastCacheKey(query, page, limit, sort);
    const cached = fastCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < FAST_CACHE_TTL) {
      if (debug) console.log('[getProductsFast] Served from cache');
      return res.json(cached.payload);
    }

    // Ultra-fast query with minimal data - fetch only essential fields (including images)
    const products = await Product.find(query)
      .select('name price oldPrice category stock unit badge rating isNew isPopular image images updatedAt createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean() // Use lean() for faster queries
      .maxTimeMS(5000); // Add timeout to prevent long-running queries
    
    // Choose a safe primary image: prefer product.image, else first from images
    const getPrimaryImage = (p) => {
      const imgs = Array.isArray(p.images) ? p.images : [];
      if (p.image && typeof p.image === 'string' && p.image.length > 0) return p.image;
      if (imgs.length > 0 && typeof imgs[0] === 'string' && imgs[0].length > 0) return imgs[0];
      return '/assets/default-product.svg';
    };

    // Process products to include only essential fields and keep very small image payload
    const productsWithImages = products.map(product => ({
      _id: product._id,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      category: product.category,
      stock: product.stock,
      unit: product.unit,
      badge: product.badge,
      rating: product.rating,
      isNew: product.isNew,
      isPopular: product.isPopular,
      image: getPrimaryImage(product),
      // Limit images array to at most 3 to avoid huge payloads
      images: Array.isArray(product.images) ? product.images.slice(0, 3) : [],
      updatedAt: product.updatedAt,
      createdAt: product.createdAt
    }));
    
    const duration = Date.now() - startTime;
    if (debug) console.log(`[getProductsFast] Completed in ${duration}ms, returned ${products.length} products`);
    
    const payload = {
      products: productsWithImages,
      pagination: {
        currentPage: page,
        limit,
        hasNextPage: products.length === limit,
        hasPrevPage: page > 1
      },
      performance: {
        queryTime: duration,
        optimized: true
      }
    };

    // Save to cache
    fastCache.set(cacheKey, { payload, timestamp: Date.now() });

    // Log response
    if (debug) console.log('[getProductsFast] Sending response with', products.length, 'products');
    
    res.json(payload);
    
  } catch (error) {
    console.error('[getProductsFast] Detailed Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      error: 'Failed to fetch products',
      message: error.message
    });
  }
};

module.exports = {
  getProductsFast
};


