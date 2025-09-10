const Product = require('../models/Product');

// Optimized product controller for faster loading
const getProductsFast = async (req, res) => {
  try {
    const debug = true; // Always enable debug for troubleshooting
    if (debug) console.log('[getProductsFast] Starting optimized product fetch');
    const startTime = Date.now();
    
    // Simple pagination
    const limit = Math.min(parseInt(req.query.limit) || 60, 100);
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
    
    // Ultra-fast query with minimal data - fetch only essential fields
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for faster queries
    
    // Process products to include only essential fields and add default image
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
      image: '/assets/default-product.png', // Use default image for speed
      images: []
    }));
    
    const duration = Date.now() - startTime;
    if (debug) console.log(`[getProductsFast] Completed in ${duration}ms, returned ${products.length} products`);
    
    res.json({
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
    });
    
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