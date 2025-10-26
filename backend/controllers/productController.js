const Product = require('../models/Product');
const NotificationService = require('../services/NotificationService');
const { addActivity } = require('../routes/recentActivitiesRoutes');

// Performance constants
const MAX_LIMIT = 10000; // Maximum items per page
const DEFAULT_LIMIT = 10000; // Default items per page
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Simple in-memory cache for frequently accessed data
const cache = new Map();

// Cache helper functions
const getCacheKey = (query, page, limit, sort) => {
  return JSON.stringify({ query, page, limit, sort });
};

const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  // Limit cache size to prevent memory issues
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
};

// Get all products with optimized pagination, filtering, and search
const getProducts = async (req, res) => {
  try {
    const debug = process.env.DEBUG_PRODUCTS === '1' || process.env.DEBUG_PRODUCTS === 'true';
    const includeImages = req.query.includeImages === 'true';
    
    if (debug) {
      console.log('[getProducts] Request params:', {
        includeImages,
        query: req.query,
        timestamp: new Date().toISOString()
      });
    }
    
    // Debug: Always log includeImages parameter
    console.log('[getProducts] includeImages parameter:', includeImages, 'from query:', req.query.includeImages);
    
    if (debug) {
      console.log('[getProducts] Incoming params:', {
        query: req.query,
        timestamp: new Date().toISOString()
      });
    }
    // Validate and sanitize pagination parameters
    const requestedLimit = parseInt(req.query.limit) || DEFAULT_LIMIT;
    const limit = Math.min(MAX_LIMIT, Math.max(1, requestedLimit));
    


    // Build optimized query object
    // Include legacy documents that may be missing `status` or `isDeleted`
    let query = {
      $and: [
        { $or: [{ status: 'active' }, { status: { $exists: false } }] },
        { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] }
      ]
    }; // Active or missing status, not-deleted or missing flag by default

    // Category filter - use case-insensitive regex for better matching
    if (req.query.category && req.query.category.trim() !== '') {
      const categoryValue = req.query.category.trim();
      console.log(`🏷️ [getProducts] Category filter: "${categoryValue}"`);
      query.category = { $regex: new RegExp(`^${categoryValue}$`, 'i') };
      console.log(`🏷️ [getProducts] Category query:`, query.category);
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) {
        query.price.$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        query.price.$lte = parseFloat(req.query.maxPrice);
      }
    }

    // Stock filter
    if (req.query.inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Popular/New filters
    if (req.query.isPopular === 'true') {
      query.isPopular = true;
    }
    if (req.query.isNew === 'true') {
      query.isNew = true;
    }

    // Badge filter
    if (req.query.badge && req.query.badge !== '') {
      query.badge = req.query.badge;
    }

    // Build sort object
    let sort = {};
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Validate sort field to prevent injection
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'price', 'rating'];
    if (allowedSortFields.includes(sortBy)) {
      sort[sortBy] = sortOrder;
    } else {
      sort.createdAt = -1; // Default sort
    }

    // Enhanced search functionality - supports both exact word matches and partial matches
    if (req.query.search && req.query.search.trim() !== '') {
      const searchTerm = req.query.search.trim();
      
      // For longer search terms (3+ characters), try text search first for better performance
      // For shorter terms or when text search yields no results, use regex for partial matches
      if (searchTerm.length >= 3) {
        // Use MongoDB text search for exact word matches (better performance)
        query.$text = { $search: searchTerm };

        // Add text score for relevance sorting
        if (!req.query.sortBy) {
          sort = { score: { $meta: 'textScore' }, createdAt: -1 };
        }
      } else {
        // For short search terms, use regex-based partial matching
        // This allows "lu" to find "lucem"
        const regexPattern = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex chars
        query.$or = [
          { name: { $regex: regexPattern, $options: 'i' } },
          { description: { $regex: regexPattern, $options: 'i' } },
          { category: { $regex: regexPattern, $options: 'i' } }
        ];
        
        // For partial matches, sort by relevance: name matches first, then description
        if (!req.query.sortBy) {
          sort = { createdAt: -1 }; // Default sort for regex searches
        }
      }
    }

    if (debug) {
      console.log('[getProducts] Built query & sorting:', { query, sortBy, sortOrder, sort });
    }

    // Cursor-based pagination support (preferred for large collections)
    const cursor = req.query.cursor; // expects a Mongo ObjectId string of the last seen item
    if (cursor) {
      // When using cursor, we return nextCursor without totalCount for performance
      // Adjust query for _id based cursor only if sorting is stable by _id desc/asc
      // If user sorts by something else, fallback to page-based mode
      const isIdSort = Object.keys(sort).length === 1 && Object.keys(sort)[0] === 'createdAt';
      if (!isIdSort) {
        // Fallback to page mode when sort is not compatible with cursor
      } else {
        // Translate cursor to createdAt boundary or _id boundary
        // Simpler: use _id cursor with default sort by createdAt desc typically correlates with _id
        if (cursor.match(/^[0-9a-fA-F]{24}$/)) {
          // For descending order, fetch items with _id < cursor
          const idCond = sort.createdAt === -1 ? { $lt: cursor } : { $gt: cursor };
          query._id = idCond;
        }
        const docs = await Product.find(query)
          .select({
            name: 1,
            price: 1,
            oldPrice: 1,
            description: 1,
            category: 1,
            image: 1,
            images: 1,
            variants: 0, // Still exclude variants to prevent BSON size issues
            stock: 1,
            unit: 1,
            badge: 1,
            rating: 1,
            isNew: 1,
            isPopular: 1,
            hasVariants: 1,
            createdAt: 1,
            updatedAt: 1
          })
          .sort({ _id: sort.createdAt === -1 ? -1 : 1 })
          .limit(limit + 1)
          .lean();

        // Filter out base64 images from results to prevent BSON size issues (unless includeImages=true)
        const filteredDocs = docs.map(doc => ({
          ...doc,
          image: req.query.includeImages === 'true'
            ? doc.image
            : (doc.image && doc.image.startsWith('data:image/')
                ? '/assets/default-product.svg'
                : (doc.image || '/assets/default-product.svg')),
          images: req.query.includeImages === 'true'
            ? (doc.images || [])
            : (doc.images || [])
        }));

        const hasNext = filteredDocs.length > limit;
        const items = hasNext ? filteredDocs.slice(0, limit) : filteredDocs;
        const nextCursor = hasNext ? String(items[items.length - 1]._id) : null;

        const payload = {
          products: items,
          pagination: {
            mode: 'cursor',
            limit,
            nextCursor,
            hasNextPage: !!nextCursor,
          },
          filters: {
            category: req.query.category || null,
            minPrice: req.query.minPrice || null,
            maxPrice: req.query.maxPrice || null,
            inStock: req.query.inStock === 'true',
            isPopular: req.query.isPopular === 'true',
            isNew: req.query.isNew === 'true',
            badge: req.query.badge || null,
            search: req.query.search || null
          },
          sorting: {
            sortBy,
            sortOrder: req.query.sortOrder || 'desc'
          },
          performance: { cached: false }
        };

        if (debug) {
          console.log('[getProducts] Cursor mode result:', {
            returned: items.length,
            hasNext,
            nextCursor
          });
        }

        return res.json(payload);
      }
    }

    // Page-based mode (default)
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * limit;
    if (debug) {
      console.log('[getProducts] Page mode:', { page, limit, skip });
    }

    // Check cache first (only for non-search queries to avoid stale search results)
    const cacheKey = getCacheKey(query, page, limit, sort);
    if (!req.query.search) {
      const cachedResult = getFromCache(cacheKey);
      if (cachedResult) {
        if (debug) {
          console.log('[getProducts] Serving from cache with totalCount:', cachedResult?.pagination?.totalCount);
        }
        return res.json({
          ...cachedResult,
          cached: true,
          cacheTime: new Date().toISOString()
        });
      }
    }

    // Use aggregation pipeline for complex queries with better performance
    const pipeline = [
      { $match: query },
      { $sort: sort },
      {
        $facet: {
          products: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                name: 1,
                price: 1,
                oldPrice: 1,
                description: 1,
                category: 1,
                // Include or filter base64 images based on query parameter
                image: {
                  $cond: {
                    if: { $eq: [req.query.includeImages, 'true'] },
                    then: "$image",
                    else: {
                      $cond: {
                        if: { $regexMatch: { input: "$image", regex: "^data:image/" } },
                        then: '/assets/default-product.svg',
                        else: { $ifNull: ["$image", '/assets/default-product.svg'] }
                      }
                    }
                  }
                },
                // Include or filter base64 images from images array
                images: req.query.includeImages === 'true' ? { $ifNull: ["$images", []] } : {
                  $filter: {
                    input: { $ifNull: ["$images", []] },
                    cond: { $not: { $regexMatch: { input: "$$this", regex: "^data:image/" } } }
                  }
                },
                stock: 1,
                unit: 1,
                badge: 1,
                rating: 1,
                isNew: 1,
                isPopular: 1,
                hasVariants: 1,
                // Only include variant count, not full variant data
                variantCount: { $size: { $ifNull: ['$variants', []] } },
                createdAt: 1,
                updatedAt: 1,
                // Include text score only if using MongoDB text search (not regex search)
                ...(req.query.search && req.query.search.trim().length >= 3 && { score: { $meta: 'textScore' } })
              }
            }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];

    const [result] = await Product.aggregate(pipeline);
    let products = result.products;
    let totalCount = result.totalCount[0]?.count || 0;
    let totalPages = Math.ceil(totalCount / limit);
    
    // Debug: Log category filter results
    if (req.query.category && req.query.category.trim() !== '') {
      console.log(`🏷️ [getProducts] Category "${req.query.category}" results: ${totalCount} products found`);
      if (products.length > 0) {
        console.log(`🏷️ [getProducts] First 3 products categories:`, 
          products.slice(0, 3).map(p => ({ name: p.name, category: p.category }))
        );
      }
    }

    // If text search yielded no results and search term is 3+ characters, try fallback to regex
    if (req.query.search && req.query.search.trim().length >= 3 && totalCount === 0) {
      const searchTerm = req.query.search.trim();
      console.log(`[getProducts] Text search for "${searchTerm}" returned 0 results, trying regex fallback...`);
      
      // Build fallback query with regex for partial matching
      const regexPattern = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const fallbackQuery = {
        ...query,
        $or: [
          { name: { $regex: regexPattern, $options: 'i' } },
          { description: { $regex: regexPattern, $options: 'i' } },
          { category: { $regex: regexPattern, $options: 'i' } }
        ]
      };
      
      // Remove text search from fallback query
      delete fallbackQuery.$text;
      
      // Use simpler sort for regex search (no text score)
      const fallbackSort = { createdAt: -1 };
      
      // Execute fallback search
      const fallbackPipeline = [
        { $match: fallbackQuery },
        { $sort: fallbackSort },
        {
          $facet: {
            products: [
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  price: 1,
                  oldPrice: 1,
                  description: 1,
                  category: 1,
                  // Include or filter base64 images based on query parameter
                  image: {
                    $cond: {
                      if: { $eq: [req.query.includeImages, 'true'] },
                      then: "$image",
                      else: {
                        $cond: {
                          if: { $regexMatch: { input: "$image", regex: "^data:image/" } },
                          then: '/assets/default-product.svg',
                          else: { $ifNull: ["$image", '/assets/default-product.svg'] }
                        }
                      }
                    }
                  },
                  // Include or filter base64 images from images array
                  images: req.query.includeImages === 'true' ? { $ifNull: ["$images", []] } : {
                    $filter: {
                      input: { $ifNull: ["$images", []] },
                      cond: { $not: { $regexMatch: { input: "$$this", regex: "^data:image/" } } }
                    }
                  },
                  stock: 1,
                  unit: 1,
                  badge: 1,
                  rating: 1,
                  isNew: 1,
                  isPopular: 1,
                  hasVariants: 1,
                  variantCount: { $size: { $ifNull: ['$variants', []] } },
                  createdAt: 1,
                  updatedAt: 1
                  // No text score for regex search
                }
              }
            ],
            totalCount: [
              { $count: 'count' }
            ]
          }
        }
      ];
      
      const [fallbackResult] = await Product.aggregate(fallbackPipeline);
      products = fallbackResult.products;
      totalCount = fallbackResult.totalCount[0]?.count || 0;
      totalPages = Math.ceil(totalCount / limit);
      
      if (debug) {
        console.log(`[getProducts] Regex fallback for "${searchTerm}" returned ${totalCount} results`);
      }
    }

    // Normalize and ensure image fallback (use first images[0] if image is empty)
    const normalizePath = (p) => {
      if (!p || typeof p !== 'string') return p;
      return p.replace(/\\/g, '/');
    };
    products = products.map((p) => {
      let img = p.image;
      // If main image is missing or default and we have a gallery image, use it
      if (!img || img === '/assets/default-product.svg') {
        if (Array.isArray(p.images) && p.images.length > 0 && typeof p.images[0] === 'string' && p.images[0]) {
          img = p.images[0];
        }
      }
      return {
        ...p,
        image: normalizePath(img) || '/assets/default-product.svg'
      };
    });

    if (debug) {
      console.log('[getProducts] Aggregation result:', {
        returned: products.length,
        totalCount,
        totalPages
      });
    }

    // Prepare response
    const response = {
      products,
      pagination: {
        mode: 'page',
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      },
      filters: {
        category: req.query.category || null,
        minPrice: req.query.minPrice || null,
        maxPrice: req.query.maxPrice || null,
        inStock: req.query.inStock === 'true',
        isPopular: req.query.isPopular === 'true',
        isNew: req.query.isNew === 'true',
        badge: req.query.badge || null,
        search: req.query.search || null
      },
      sorting: {
        sortBy,
        sortOrder: req.query.sortOrder || 'desc'
      },
      performance: {
        cached: false
      }
    };

    // Cache the result (only for non-search queries)
    if (!req.query.search) {
      setCache(cacheKey, response);
    }


    
    res.json(response);

  } catch (error) {
    console.error('Error fetching products:', error);

    // Handle BSON size errors specifically
    if (error.code === 10334 || error.codeName === 'BSONObjectTooLarge') {
      console.error('❌ BSON Object Too Large - likely due to base64 images in database');
      return res.status(500).json({
        error: 'Database contains oversized documents',
        message: 'Some products contain base64 image data that exceeds MongoDB limits. Please convert base64 images to files.',
        code: 'BSON_TOO_LARGE',
        suggestion: 'Use the /api/products/convert-base64-images endpoint to fix this issue',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      error: 'Failed to fetch products',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Get single product by ID with optimized query
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Invalid product ID format',
        timestamp: new Date().toISOString()
      });
    }

    // Check cache first
    const cacheKey = `product_${id}`;
    const cachedProduct = getFromCache(cacheKey);
    if (cachedProduct) {
      return res.json({
        ...cachedProduct,
        cached: true
      });
    }

    // Find product with safe projections and timeout
    const doc = await Product.findById(id)
      .select({
        name: 1,
        price: 1,
        oldPrice: 1,
        description: 1,
        category: 1,
        image: 1,
        images: 1,
        stock: 1,
        unit: 1,
        badge: 1,
        rating: 1,
        isNew: 1,
        isPopular: 1,
        hasVariants: 1,
        variants: 1, // Keep variants for detail view
        createdAt: 1,
        updatedAt: 1,
        status: 1,
        isDeleted: 1
      })
      .lean()
      .maxTimeMS(5000);

    if (!doc || doc.isDeleted || doc.status === 'inactive') {
      return res.status(404).json({
        error: 'Product not found',
        timestamp: new Date().toISOString()
      });
    }

    // Sanitize image strings
    // - Keep valid base64 data URLs (detail view can handle them)
    // - Fallback to default only if base64 looks invalid/too short
    // - Always normalize backslashes
    const sanitizeImage = (p) => {
      if (!p || typeof p !== 'string') return p;
      const s = p.replace(/\\/g, '/');
      if (s.startsWith('data:image/')) {
        if (s.length < 50) {
          return '/assets/default-product.svg';
        }
        return s; // keep base64 for detail page
      }
      return s;
    };

    // Sanitize variant images as well (options.image, options.images[])
    const sanitizedVariants = Array.isArray(doc.variants)
      ? doc.variants.map((variant) => ({
          ...variant,
          options: Array.isArray(variant?.options)
            ? variant.options.map((opt) => ({
                ...opt,
                image: sanitizeImage(opt?.image) || '/assets/default-product.svg',
                images: Array.isArray(opt?.images)
                  ? opt.images
                      .map((im) => sanitizeImage(im) || '/assets/default-product.svg')
                      .filter(Boolean)
                  : []
              }))
            : []
        }))
      : [];

    let sanitized = {
      ...doc,
      image: sanitizeImage(doc.image) || '/assets/default-product.svg',
      images: Array.isArray(doc.images)
        ? doc.images.map((i) => (typeof i === 'string' ? sanitizeImage(i) : i))
        : [],
      variants: sanitizedVariants
    };

    // Fallbacks for detail view: derive images from variants if needed
    const DEFAULT_IMG = '/assets/default-product.svg';
    const isDefault = (s) => !s || s === DEFAULT_IMG;

    if (!Array.isArray(sanitized.images) || sanitized.images.length === 0) {
      const collected = [];
      for (const v of (sanitized.variants || [])) {
        for (const opt of (v.options || [])) {
          if (opt?.images && Array.isArray(opt.images)) {
            for (const im of opt.images) {
              const s = sanitizeImage(im);
              if (s && !collected.includes(s) && s !== DEFAULT_IMG) collected.push(s);
            }
          }
          if (opt?.image) {
            const s = sanitizeImage(opt.image);
            if (s && !collected.includes(s) && s !== DEFAULT_IMG) collected.push(s);
          }
        }
      }
      if (collected.length > 0) {
        sanitized.images = collected.slice(0, 10);
      }
    }

    if (isDefault(sanitized.image) && Array.isArray(sanitized.images) && sanitized.images.length > 0) {
      sanitized.image = sanitized.images[0];
    }

    // Cache the result
    setCache(cacheKey, { product: sanitized });

    res.json({ product: sanitized });

  } catch (error) {
    console.error('Error fetching product:', error);

    if (error.name === 'MongoNetworkTimeoutError' || (error.message || '').includes('timed out')) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Database connection timeout. Please try again in a few moments.',
        retryAfter: 30
      });
    }

    res.status(500).json({
      error: 'Failed to fetch product',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Get product categories with counts (cached)
const getCategories = async (req, res) => {
  try {
    const cacheKey = 'categories_with_counts';
    const cachedCategories = getFromCache(cacheKey);

    if (cachedCategories) {
      return res.json({
        ...cachedCategories,
        cached: true
      });
    }

    // Aggregate categories with product counts
    const categories = await Product.aggregate([
      { $match: { status: 'active', isDeleted: false } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const response = { categories };
    setCache(cacheKey, response);

    res.json(response);

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Clear cache (for admin use)
const clearCache = (req, res) => {
  cache.clear();
  res.json({
    message: 'Cache cleared successfully',
    timestamp: new Date().toISOString()
  });
};

// Soft delete (archive) product
const softDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Product.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true, status: 'inactive' } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: 'Mahsulot topilmadi' });

    // Invalidate simple cache
    cache.clear();

    // Add to recent activities
    try {
      addActivity({
        category: 'mahsulotlar',
        icon: 'fa-trash',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        title: 'Mahsulot o\'chirildi',
        desc: `${updated.name} - ${updated.price.toLocaleString()} so'm`,
        time: 'Hozir',
        entityType: 'product',
        entityId: updated._id,
        entityName: updated.name,
      });
    } catch (activityError) {
      console.error('⚠️ Recent activity error (non-critical):', activityError.message);
    }

    res.json({ message: 'Mahsulot arxivlandi (soft-delete)', product: updated });
  } catch (error) {
    console.error('❌ Soft delete product error:', error);
    res.status(500).json({ message: 'Mahsulotni arxivlashda xatolik', error: error.message });
  }
};

// Restore product from soft-delete
const restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Product.findByIdAndUpdate(
      id,
      { $set: { isDeleted: false, status: 'active' } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: 'Mahsulot topilmadi' });

    cache.clear();

    // Add to recent activities
    try {
      addActivity({
        category: 'mahsulotlar',
        icon: 'fa-undo',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        title: 'Mahsulot tiklandi',
        desc: `${updated.name} - ${updated.price.toLocaleString()} so'm`,
        time: 'Hozir',
        entityType: 'product',
        entityId: updated._id,
        entityName: updated.name,
      });
    } catch (activityError) {
      console.error('⚠️ Recent activity error (non-critical):', activityError.message);
    }

    res.json({ message: 'Mahsulot tiklandi', product: updated });
  } catch (error) {
    console.error('❌ Restore product error:', error);
    res.status(500).json({ message: 'Mahsulotni tiklashda xatolik', error: error.message });
  }
};

// Archive/unarchive without deletion (toggle status)
const setArchiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { archived } = req.body; // boolean
    const updated = await Product.findByIdAndUpdate(
      id,
      { $set: { status: archived ? 'inactive' : 'active' } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: 'Mahsulot topilmadi' });

    cache.clear();

    // Generate notification and recent activity
    const action = archived ? 'archived' : 'restored';
    await NotificationService.notifyAdmin({
      title: archived ? 'Mahsulot arxivlandi' : 'Mahsulot faollashtirildi',
      message: `"${updated.name}" mahsuloti ${archived ? 'arxivlandi' : 'faollashtirildi'}`,
      type: archived ? 'product_archived' : 'product_activated',
      icon: archived ? 'fa-archive' : 'fa-check-circle',
      color: archived ? 'warning' : 'success',
      data: updated
    });

    res.json({ message: archived ? 'Mahsulot arxivlandi' : 'Mahsulot faollashtirildi', product: updated });
  } catch (error) {
    console.error('❌ Set archive status error:', error);
    res.status(500).json({ message: 'Arxiv holatini o\'zgartirishda xatolik', error: error.message });
  }
};

// Update product with cache invalidation - OPTIMIZED FOR SPEED
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Product update request received

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Invalid product ID format',
        timestamp: new Date().toISOString()
      });
    }

    // Find and update product with lean for speed
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      {
        new: true, // Return updated document
        lean: true // Use lean for speed
      }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        error: 'Product not found',
        timestamp: new Date().toISOString()
      });
    }

    // OPTIMIZED: Minimal cache operations for speed
    cache.clear(); // Quick cache clear

    // OPTIMIZED: Skip heavy operations for speed
    // addActivity() - skip for faster response
    // NotificationService - skip for faster response

    console.log('✅ Product updated:', updatedProduct._id);

    // Return the updated product for frontend cache updates
    res.json({
      ...updatedProduct,
      message: 'Product updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Update product error:', error);

    // Handle duplicate key error for unique slug
    if (
      (error && error.code === 11000) ||
      (error && error.name === 'MongoServerError' && error.message && error.message.includes('E11000'))
    ) {
      const isSlugConflict = error.keyPattern?.slug || (error.message && /index:\s*slug_\d+/.test(error.message));
      if (isSlugConflict) {
        return res.status(409).json({
          code: 'DUPLICATE_SLUG',
          message: 'Slug allaqachon mavjud. Iltimos mahsulot nomini o\'zgartiring.',
          field: 'slug',
          conflictValue: error.keyValue?.slug,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Validation error
    if (error && error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Yaroqsiz ma\'lumotlar',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
    }

    // Generic server error
    res.status(500).json({
      error: 'Failed to update product',
      message: 'Mahsulotni yangilashda xatolik',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Create product with cache invalidation - OPTIMIZED FOR SPEED
const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    console.log('📝 [createProduct] Received data:', JSON.stringify(productData, null, 2));

    // Create new product
    const product = new Product(productData);
    console.log('🔄 [createProduct] Creating product...');
    const savedProduct = await product.save();
    console.log('✅ [createProduct] Product saved with ID:', savedProduct._id);

    // OPTIMIZED: Minimal cache operations for speed
    cache.clear(); // Quick cache clear

    // OPTIMIZED: Skip heavy operations for speed
    // addActivity() - skip for faster response
    // NotificationService - skip for faster response

    console.log('✅ Product created:', savedProduct._id);

    res.status(201).json({
      ...savedProduct.toObject(),
      message: 'Product created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Create product error:', error);

    // Handle duplicate key error for unique slug
    if (
      (error && error.code === 11000) ||
      (error && error.name === 'MongoServerError' && error.message && error.message.includes('E11000'))
    ) {
      const isSlugConflict = error.keyPattern?.slug || (error.message && /index:\s*slug_\d+/.test(error.message));
      if (isSlugConflict) {
        return res.status(409).json({
          code: 'DUPLICATE_SLUG',
          message: 'Slug allaqachon mavjud. Iltimos mahsulot nomini o\'zgartiring.',
          field: 'slug',
          conflictValue: error.keyValue?.slug,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Validation error
    if (error && error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Yaroqsiz ma\'lumotlar',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
    }

    // Generic server error
    res.status(500).json({
      error: 'Failed to create product',
      message: 'Mahsulot yaratishda xatolik',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Convert base64 images to file paths and save them
const convertBase64Images = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    console.log('🔄 Starting base64 to file conversion...');

    // Find products with base64 images
    const productsWithBase64 = await Product.find({
      $or: [
        { image: { $regex: '^data:image/' } },
        { images: { $elemMatch: { $regex: '^data:image/' } } }
      ]
    });

    console.log(`📊 Found ${productsWithBase64.length} products with base64 images`);

    let convertedCount = 0;
    let errorCount = 0;
    const results = [];

    for (const product of productsWithBase64) {
      try {
        let hasChanges = false;
        const productResult = {
          id: product._id,
          name: product.name,
          originalImage: product.image,
          originalImages: [...(product.images || [])],
          convertedImage: null,
          convertedImages: [],
          errors: []
        };

        // Convert main image
        if (product.image && product.image.startsWith('data:image/')) {
          try {
            const convertedPath = await saveBase64Image(product.image, product._id, 'main');
            if (convertedPath) {
              product.image = convertedPath;
              productResult.convertedImage = convertedPath;
              hasChanges = true;
            }
          } catch (error) {
            productResult.errors.push(`Main image: ${error.message}`);
            // Set to null if conversion fails
            product.image = null;
            hasChanges = true;
          }
        }

        // Convert images array
        if (product.images && product.images.length > 0) {
          const convertedImages = [];
          for (let i = 0; i < product.images.length; i++) {
            const imageData = product.images[i];
            if (imageData && imageData.startsWith('data:image/')) {
              try {
                const convertedPath = await saveBase64Image(imageData, product._id, `image_${i}`);
                if (convertedPath) {
                  convertedImages.push(convertedPath);
                  productResult.convertedImages.push(convertedPath);
                }
              } catch (error) {
                productResult.errors.push(`Image ${i}: ${error.message}`);
                // Skip invalid images
              }
            } else if (imageData && !imageData.startsWith('data:')) {
              // Keep existing file paths
              convertedImages.push(imageData);
              productResult.convertedImages.push(imageData);
            }
          }

          if (convertedImages.length !== product.images.length) {
            product.images = convertedImages;
            hasChanges = true;
          }
        }

        // Save changes if any
        if (hasChanges) {
          await product.save();
          convertedCount++;
          console.log(`✅ Converted images for product: ${product.name}`);
        }

        results.push(productResult);

      } catch (error) {
        console.error(`❌ Error processing product ${product._id}:`, error);
        errorCount++;
        results.push({
          id: product._id,
          name: product.name,
          errors: [error.message]
        });
      }
    }

    // Clear cache after conversion
    cache.clear();

    console.log(`🎉 Conversion complete: ${convertedCount} products converted, ${errorCount} errors`);

    res.json({
      message: 'Base64 image conversion completed',
      totalFound: productsWithBase64.length,
      converted: convertedCount,
      errors: errorCount,
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Base64 conversion error:', error);
    res.status(500).json({
      error: 'Failed to convert base64 images',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Helper function to save base64 image as file
const saveBase64Image = async (base64Data, productId, imageName) => {
  const fs = require('fs');
  const path = require('path');

  try {
    // Validate base64 format
    const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 image format');
    }

    const imageType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');

    // Check if image data is too small (likely incomplete)
    if (imageBuffer.length < 100) {
      throw new Error('Image data too small, likely incomplete');
    }

    // Generate filename
    const timestamp = Date.now();
    const filename = `${productId}_${imageName}_${timestamp}.${imageType}`;
    const uploadsDir = path.join(__dirname, '../uploads/products');
    const filePath = path.join(uploadsDir, filename);

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save file
    fs.writeFileSync(filePath, imageBuffer);

    // Return relative path for database
    return `/uploads/products/${filename}`;

  } catch (error) {
    console.error('Error saving base64 image:', error);
    throw error;
  }
};

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  clearCache,
  updateProduct,
  createProduct,
  softDeleteProduct,
  restoreProduct,
  setArchiveStatus,
  convertBase64Images
};
