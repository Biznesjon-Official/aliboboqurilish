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
    const debug = process.env.NODE_ENV === 'development';
    if (debug) console.log('[getProductsFast] Starting ULTRA-OPTIMIZED product fetch');
    const startTime = Date.now();
    
    if (debug) console.log('[getProductsFast] Request query:', req.query);
    
    // Optimized pagination
    const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Reduced max to 50 for better performance
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * limit;
    
    // ULTRA-OPTIMIZED QUERY - Use simple, indexed fields only
    let query = {
      isDeleted: { $ne: true }, // Use indexed field directly
      status: 'active'          // Use indexed field directly
    };
    
    // Category filter (indexed)
    if (req.query.category && req.query.category.trim() !== '') {
      query.category = req.query.category.trim();
    }
    
    // Optimized sort - use indexed fields
    let sort = { updatedAt: -1 }; // Default: newest first (indexed)
    if (req.query.sortBy === 'price') {
      sort = { price: req.query.sortOrder === 'asc' ? 1 : -1, updatedAt: -1 };
    }
    
    // Check cache first
    const cacheKey = getFastCacheKey(query, page, limit, sort);
    const cached = fastCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < FAST_CACHE_TTL) {
      if (debug) console.log('[getProductsFast] ⚡ Served from cache in', Date.now() - startTime, 'ms');
      return res.json(cached.payload);
    }

    // ULTRA-FAST AGGREGATION PIPELINE - Optimized for indexes
    const pipeline = [
      // Stage 1: Match using indexed fields (FASTEST)
      { 
        $match: query 
      },
      
      // Stage 2: Sort using indexed fields
      { 
        $sort: sort 
      },
      
      // Stage 3: Pagination
      { 
        $skip: skip 
      },
      { 
        $limit: limit 
      },
      
      // Stage 4: Project only essential fields (MINIMAL PAYLOAD)
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          oldPrice: 1,
          category: 1,
          stock: 1,
          unit: 1,
          badge: 1,
          rating: 1,
          isNew: 1,
          isPopular: 1,
          // Optimize image handling - take only first image to reduce payload
          image: 1,
          thumbnail: { $arrayElemAt: ['$images', 0] }, // First image as thumbnail
          updatedAt: 1,
          createdAt: 1
        }
      }
    ];

    // ULTRA-SIMPLE query - skip aggregation completely for maximum speed
    const products = await Product.find(query)
      .select('_id name price oldPrice category stock unit badge rating isNew isPopular updatedAt createdAt') // Remove image fields for speed
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(3000); // Even stricter timeout
    
    // MINIMAL processing - no image processing for maximum speed
    const productsWithImages = products.map(product => ({
      _id: product._id,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      category: product.category,
      stock: product.stock,
      unit: product.unit || 'dona',
      badge: product.badge,
      rating: product.rating || 0,
      isNew: product.isNew || false,
      isPopular: product.isPopular || false,
      image: '/assets/default-product.svg', // Default image for speed
      updatedAt: product.updatedAt,
      createdAt: product.createdAt
    }));
    
    const duration = Date.now() - startTime;
    if (debug) console.log(`[getProductsFast] 🚀 ULTRA-FAST completed in ${duration}ms, returned ${products.length} products`);
    
    const payload = {
      products: productsWithImages,
      pagination: {
        currentPage: page,
        limit,
        hasNextPage: products.length === limit,
        hasPrevPage: page > 1,
        total: null // Skip expensive count for speed
      },
      performance: {
        queryTime: duration,
        optimized: true,
        cached: false,
        version: 'ultra-fast-v2'
      }
    };

    // Cache the result
    fastCache.set(cacheKey, { payload: { ...payload, performance: { ...payload.performance, cached: true } }, timestamp: Date.now() });

    if (debug) console.log('[getProductsFast] 📤 Sending response with', products.length, 'products');
    
    res.json(payload);
    
  } catch (error) {
    console.error('[getProductsFast] Detailed Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Handle timeout errors specifically
    if (error.name === 'MongoNetworkTimeoutError' || error.message.includes('timed out')) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Database connection timeout. Please try again in a few moments.',
        retryAfter: 30
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch products',
      message: error.message
    });
  }
};

module.exports = {
  getProductsFast
};
