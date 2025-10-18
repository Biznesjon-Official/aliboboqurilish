const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get filter options with counts
router.get('/options', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    // Build base query
    let baseQuery = {
      $and: [
        { $or: [{ status: 'active' }, { status: { $exists: false } }] },
        { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] }
      ]
    };

    // Add category filter if provided
    if (category && category !== 'all') {
      baseQuery.category = category;
    }

    // Add search filter if provided
    if (search && search.trim()) {
      const searchTerm = search.trim();
      if (searchTerm.length >= 3) {
        baseQuery.$text = { $search: searchTerm };
      } else {
        const regexPattern = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        baseQuery.$or = [
          { name: { $regex: regexPattern, $options: 'i' } },
          { description: { $regex: regexPattern, $options: 'i' } },
          { category: { $regex: regexPattern, $options: 'i' } }
        ];
      }
    }

    // Aggregate filter options
    const [categories, priceRange] = await Promise.all([
      // Categories with counts - normalize to lowercase for grouping
      Product.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: { $toLower: '$category' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        {
          $project: {
            _id: 0,
            name: '$_id',
            count: 1
          }
        }
      ]),

      // Price range
      Product.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: null,
            min: { $min: '$price' },
            max: { $max: '$price' }
          }
        }
      ])
    ]);

    res.json({
      categories: categories || [],
      priceRange: priceRange[0] || { min: 0, max: 10000000 }
    });

  } catch (error) {
    console.error('Filter options error:', error);
    res.status(500).json({
      error: 'Failed to fetch filter options',
      message: error.message
    });
  }
});

module.exports = router;
