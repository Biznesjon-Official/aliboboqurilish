const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { getProducts, getProductById, getCategories, clearCache, updateProduct, createProduct, softDeleteProduct, restoreProduct, setArchiveStatus, convertBase64Images } = require('../controllers/productController');
const { getProductsFast } = require('../controllers/productControllerOptimized');

router.get('/with-images', async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * limit;

    const query = {
      $and: [
        { $or: [{ status: 'active' }, { status: { $exists: false } }] },
        { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] }
      ]
    };

    const products = await Product.find(query)
      .select('name price image images category stock badge rating isNew isPopular description')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const totalCount = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit,
        hasNextPage: page < Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching products with images:', error);
    res.status(500).json({ error: 'Failed to fetch products with images' });
  }
});

// GET /api/products - Get all products with optimized pagination and filtering
router.get('/', getProducts);

// GET /api/products/fast - Ultra-fast products endpoint (must be before /:id)
router.get('/fast', getProductsFast);

// GET /api/products/categories/list - Get all categories with counts (cached)
router.get('/categories/list', getCategories);

// GET /api/products/cache/clear - Clear cache (admin only)
router.get('/cache/clear', clearCache);

// POST /api/products/convert-base64-images - Convert base64 images to files (admin only)
// Disabled by default; enable via ENABLE_BASE64_CONVERT=true
if (process.env.ENABLE_BASE64_CONVERT === 'true') {
  router.post('/convert-base64-images', convertBase64Images);
}

// GET /api/products/:id - Get single product (optimized)
router.get('/:id', getProductById);

// POST /api/products - Create new product
router.post('/', createProduct);

// PUT /api/products/:id - Update product
router.put('/:id', updateProduct);

// PATCH /api/products/:id/archive - Toggle archive status (inactive/active)
router.patch('/:id/archive', setArchiveStatus);

// PATCH /api/products/:id/restore - Restore soft-deleted product
router.patch('/:id/restore', restoreProduct);

// DELETE /api/products/:id - Soft delete (archive) product
router.delete('/:id', softDeleteProduct);

module.exports = router;
