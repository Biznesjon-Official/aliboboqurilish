// Optimized product controller for faster loading
const Product = require('../models/Product');

// Simple in-memory cache (in production, you might want to use Redis)
const fastCache = new Map();
const FAST_CACHE_TTL = 300 * 1000; // 5 minutes for much faster repeat loads
const MAX_CACHE_SIZE = 200; // Increased cache size

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
    
    // Pagination for page-based navigation
    const limit = Math.min(parseInt(req.query.limit) || 100, 100); // 100 products per page
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * limit;
    
    // ULTRA-OPTIMIZED QUERY - Use simple, indexed fields only
    let query = {
      $and: [
        { $or: [{ status: 'active' }, { status: { $exists: false } }] },
        { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] }
      ]
    };
    
    // Category filter (indexed)
    if (req.query.category && req.query.category.trim() !== '') {
      query.category = req.query.category.trim();
    }
    
    // Fast search filter - use text index if available, fallback to regex
    if (req.query.search && req.query.search.trim() !== '') {
      const searchTerm = req.query.search.trim();
      try {
        // Try text search first (fastest if text index exists)
        query.$text = { $search: searchTerm };
      } catch (error) {
        // Fallback to regex search if no text index
        const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [
          { name: searchRegex },
          { category: searchRegex },
          { description: searchRegex }
        ];
      }
    }
    
    // Optimized sort - use indexed fields
    let sort = { updatedAt: -1 }; // Default: newest first (indexed)
    if (req.query.sortBy === 'price') {
      sort = { price: req.query.sortOrder === 'asc' ? 1 : -1, updatedAt: -1 };
    }
    
    // Check cache first
    const cacheKey = getFastCacheKey(query, page, limit, sort);
    const cached = fastCache.get(cacheKey);
    
    // TEMPORARY: Clear cache to ensure fresh data with description field
    if (cached) {
      console.log('[getProductsFast] 🧹 Clearing cache to get fresh data with description');
      fastCache.clear();
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
          description: 1,
          // Optimize image handling - take only first image to reduce payload
          image: 1,
          thumbnail: { $arrayElemAt: ['$images', 0] }, // First image as thumbnail
          updatedAt: 1,
          createdAt: 1
        }
      }
    ];

    // Helper: normalize path slashes; do NOT force medium folder (fallback avoids 404s)
    const toMedium = (p) => {
      if (!p || typeof p !== 'string') return p;
      const norm = p.replace(/\\/g, '/');
      return norm;
    };

    // Execute optimized aggregation pipeline
    let products;
    try {
      const aggregateQuery = Product.aggregate(pipeline);
      aggregateQuery.option({ maxTimeMS: 5000 }); // 5 second timeout
      products = await aggregateQuery;
    } catch (err) {
      const msg = (err && err.message) ? err.message.toLowerCase() : '';
      // If aggregation fails, try simple find as fallback
      console.log('[getProductsFast] Aggregation failed, using simple find fallback');
      if (msg.includes('timeout') || msg.includes('failed') || msg.includes('aggregation')) {
        products = await Product.find(query)
          .select('_id name price oldPrice category stock unit badge image description updatedAt')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean()
          .maxTimeMS(3000); // 3 second timeout for fallback
      } else {
        throw err;
      }
    }
    
    // OPTIMIZED processing - include real images with fallback
    const productsWithImages = products.map(product => {
      // Determine the best image to use
      let imageToUse = '/assets/default-product.svg'; // Default fallback
      
      // Priority 1: Use main image if it exists and is not default
      if (product.image && product.image !== '/assets/default-product.svg') {
        imageToUse = toMedium(product.image);
      }
      // Priority 2: Use first image from images array if available
      else if (product.images && product.images.length > 0 && product.images[0]) {
        imageToUse = toMedium(product.images[0]);
      }
      
      return {
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
        description: product.description || '',
        image: imageToUse,
        images: Array.isArray(product.images) && product.images.length > 0
          ? product.images.slice(0, 3).map(toMedium)
          : [],
        updatedAt: product.updatedAt,
        createdAt: product.createdAt
      };
    });
    
    const duration = Date.now() - startTime;
    if (debug) console.log(`[getProductsFast] 🚀 ULTRA-FAST completed in ${duration}ms, returned ${products.length} products`);
    
    // Debug: Check if description is included in first product
    if (productsWithImages.length > 0) {
      console.log('[getProductsFast] 📝 First product description:', productsWithImages[0].description);
      console.log('[getProductsFast] 📋 First product fields:', Object.keys(productsWithImages[0]));
    }
    
    // Debug: Check pagination info
    console.log('[getProductsFast] 📊 Pagination info:', {
      requestedPage: page,
      requestedLimit: limit,
      returnedProducts: productsWithImages.length,
      hasNextPage: products.length === limit
    });
    
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

    // Cache disabled temporarily to ensure fresh data with description
    // fastCache.set(cacheKey, { payload: { ...payload, performance: { ...payload.performance, cached: true } }, timestamp: Date.now() });

    if (debug) console.log('[getProductsFast] 📤 Sending response with', products.length, 'products');
    
    res.json(payload);
    
  } catch (error) {
    console.error('[getProductsFast] Detailed Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Attempt a safe fallback using a very simple query (no hints, slightly higher timeout)
    try {
      const limit = Math.min(parseInt(req.query.limit) || 100, 100);
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const skip = (page - 1) * limit;

      const query = {
        isDeleted: false,
        status: 'active',
        ...(req.query.category && req.query.category.trim() !== '' ? { category: req.query.category.trim() } : {})
      };
      
      // Add search to fallback query
      if (req.query.search && req.query.search.trim() !== '') {
        const searchTerm = req.query.search.trim();
        const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [
          { name: searchRegex },
          { category: searchRegex },
          { description: searchRegex }
        ];
      }
      const sort = req.query.sortBy === 'price'
        ? { price: req.query.sortOrder === 'asc' ? 1 : -1, updatedAt: -1 }
        : { updatedAt: -1 };

      const products = await Product.find(query)
        .select('_id name price oldPrice category stock unit badge rating isNew isPopular image images description updatedAt createdAt')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .maxTimeMS(5000);

      const toMedium = (p) => {
        if (!p || typeof p !== 'string') return p;
        const norm = p.replace(/\\/g, '/');
        return norm;
      };

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
        description: product.description || '',
        image: (product.image && product.image !== '/assets/default-product.svg')
          ? toMedium(product.image)
          : (product.images && product.images[0]) ? toMedium(product.images[0]) : '/assets/default-product.svg',
        images: Array.isArray(product.images) && product.images.length > 0
          ? product.images.slice(0, 3).map(toMedium)
          : [],
        updatedAt: product.updatedAt,
        createdAt: product.createdAt
      }));

      return res.json({
        products: productsWithImages,
        pagination: {
          currentPage: page,
          limit,
          hasNextPage: products.length === limit,
          hasPrevPage: page > 1,
          total: null
        },
        performance: {
          optimized: false,
          cached: false,
          fallback: true
        }
      });
    } catch (fallbackErr) {
      console.error('[getProductsFast] Fallback failed:', fallbackErr?.message || fallbackErr);

      // Handle timeout errors specifically
      if (fallbackErr.name === 'MongoNetworkTimeoutError' || (fallbackErr.message || '').includes('timed out')) {
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'Database connection timeout. Please try again in a few moments.',
          retryAfter: 30
        });
      }

      res.status(500).json({
        error: 'Failed to fetch products',
        message: fallbackErr.message || error.
        message
      });
    }
  }
};

module.exports = {
  getProductsFast,
  // Helper: prime cache for given pages at startup
  primeProductsFastCache: async ({ pages = [1], limit = 20, category, sortBy = 'updatedAt', sortOrder = 'desc' } = {}) => {
    const debug = process.env.DEBUG === 'true';
    try {
      // Build query identical to getProductsFast
      let query = {
        isDeleted: { $ne: true },
        status: 'active'
      };
      if (category && String(category).trim() !== '') {
        query.category = String(category).trim();
      }

      const sort = sortBy === 'price' ? { price: sortOrder === 'asc' ? 1 : -1, updatedAt: -1 } : { updatedAt: -1 };

      for (const page of pages) {
        const p = Math.max(1, parseInt(page));
        const l = Math.min(parseInt(limit) || 20, 50);
        const skip = (p - 1) * l;
        const cacheKey = getFastCacheKey(query, p, l, sort);

        // Skip if already cached and fresh
        const cached = fastCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < FAST_CACHE_TTL) continue;

        // Execute same minimal query used in handler
        let exec = Product.find(query)
          .select('_id name price oldPrice category stock unit badge rating isNew isPopular image images.0 updatedAt createdAt')
          .sort(sort)
          .skip(skip)
          .limit(l)
          .lean()
          .maxTimeMS(3000);

        if (sort && Object.prototype.hasOwnProperty.call(sort, 'updatedAt')) {
          try { exec = exec.hint({ updatedAt: -1, status: 1 }); } catch (_) {}
        }

        const products = await exec;

        const toMedium = (p) => {
          if (!p || typeof p !== 'string') return p;
          const norm = p.replace(/\\/g, '/');
          return norm
            .replace('/uploads/products/original/', '/uploads/products/medium/')
            .replace('/uploads/products/large/', '/uploads/products/medium/');
        };

        const productsWithImages = products.map(product => {
          let imageToUse = '/assets/default-product.svg';
          if (product.image && product.image !== '/assets/default-product.svg') {
            imageToUse = toMedium(product.image);
          } else if (product.images && product.images.length > 0 && product.images[0]) {
            imageToUse = toMedium(product.images[0]);
          }
          return {
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
            image: imageToUse,
            updatedAt: product.updatedAt,
            createdAt: product.createdAt
          };
        });

        const payload = {
          products: productsWithImages,
          pagination: {
            currentPage: p,
            limit: l,
            hasNextPage: products.length === l,
            hasPrevPage: p > 1,
            total: null
          },
          performance: {
            queryTime: null,
            optimized: true,
            cached: true,
            version: 'ultra-fast-v2'
          }
        };

        fastCache.set(cacheKey, { payload, timestamp: Date.now() });
        if (debug) console.log(`[primeProductsFastCache] Primed cache for page=${p}, limit=${l}`);
      }
    } catch (err) {
      if (debug) console.log('[primeProductsFastCache] Error:', err.message);
    }
  }
};
