const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/base64/products - Get products with base64 images
router.get('/products', async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const skip = (page - 1) * limit;

    console.log(`🔍 Fetching products with base64 images (page ${page}, limit ${limit})`);

    const query = {
      $and: [
        { $or: [{ status: 'active' }, { status: { $exists: false } }] },
        { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] }
      ]
    };

    const products = await Product.find(query)
      .select('name price image images category stock badge rating isNew isPopular createdAt')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const totalCount = await Product.countDocuments(query);

    console.log(`✅ Found ${products.length} products, total: ${totalCount}`);

    // Log first product for debugging
    if (products.length > 0) {
      const firstProduct = products[0];
      console.log(`📦 First product: ${firstProduct.name}`);
      console.log(`   Main image: ${firstProduct.image ? (firstProduct.image.startsWith('data:') ? 'BASE64' : 'FILE_PATH') : 'null'}`);
      console.log(`   Images array: ${firstProduct.images?.length || 0} items`);
    }

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
    console.error('❌ Error fetching products with base64 images:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products with base64 images',
      details: error.message 
    });
  }
});

module.exports = router;