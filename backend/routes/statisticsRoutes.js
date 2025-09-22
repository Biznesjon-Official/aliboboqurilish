const express = require('express');
const router = express.Router();

// Import models
const Product = require('../models/Product');
const Craftsman = require('../models/Craftsman');
const Order = require('../models/Order');

// GET /api/statistics/dashboard - Dashboard statistics
router.get('/dashboard', async (req, res) => {
  console.log('📊 Dashboard statistics request received');
  try {
    // Get current date info
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    console.log('📅 Date ranges calculated');

    // Count totals
    console.log('🔢 Counting documents...');
    const [
      totalProducts,
      totalCraftsmen,
      totalOrders,
      thisMonthOrders,
      lastMonthOrders
    ] = await Promise.all([
      // Align with products list: include only active (or missing status) & not-deleted (or missing flag)
      Product.countDocuments({
        $and: [
          { $or: [{ status: 'active' }, { status: { $exists: false } }] },
          { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] }
        ]
      }),
      Craftsman.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ 
        createdAt: { 
          $gte: startOfLastMonth, 
          $lte: endOfLastMonth 
        } 
      })
    ]);

    console.log(`📊 Counts: ${totalProducts} products, ${totalCraftsmen} craftsmen, ${totalOrders} orders`);

    // Calculate revenue (only from completed orders)
    console.log('💰 Calculating revenue from completed orders only...');
    const revenueAggregation = await Order.aggregate([
      {
        $match: {
          status: 'completed', // Only include completed orders
          totalAmount: { $exists: true, $ne: null, $type: "number" }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const thisMonthRevenueAgg = await Order.aggregate([
      {
        $match: { 
          createdAt: { $gte: startOfMonth },
          status: 'completed', // Only include completed orders
          totalAmount: { $exists: true, $ne: null, $type: "number" }
        }
      },
      {
        $group: {
          _id: null,
          monthlyRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const lastMonthRevenueAgg = await Order.aggregate([
      {
        $match: { 
          createdAt: { 
            $gte: startOfLastMonth, 
            $lte: endOfLastMonth 
          },
          status: 'completed', // Only include completed orders
          totalAmount: { $exists: true, $ne: null, $type: "number" }
        }
      },
      {
        $group: {
          _id: null,
          lastMonthRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalRevenue = revenueAggregation[0]?.totalRevenue || 0;
    const thisMonthRevenue = thisMonthRevenueAgg[0]?.monthlyRevenue || 0;
    const lastMonthRevenue = lastMonthRevenueAgg[0]?.lastMonthRevenue || 0;

    // Calculate growth percentages
    const ordersGrowth = lastMonthOrders > 0 
      ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 
      : 0;

    const revenueGrowth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Get active craftsmen
    const activeCraftsmen = await Craftsman.countDocuments({ status: 'active' });

    // Get products by category
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Recent orders (handle missing fields gracefully)
    const recentOrders = await Order.find({
      $or: [
        { customerName: { $exists: true, $ne: null } },
        { _id: { $exists: true } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id customerName totalAmount status createdAt orderNumber')
      .lean(); // Use lean() for better performance

    const statistics = {
      products: {
        total: totalProducts,
        byCategory: productsByCategory
      },
      craftsmen: {
        total: totalCraftsmen,
        active: activeCraftsmen,
        inactive: totalCraftsmen - activeCraftsmen
      },
      orders: {
        total: totalOrders,
        thisMonth: thisMonthOrders,
        lastMonth: lastMonthOrders,
        growth: Math.round(ordersGrowth * 100) / 100,
        recent: recentOrders
      },
      revenue: {
        total: totalRevenue,
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        growth: Math.round(revenueGrowth * 100) / 100
      },
      timestamp: new Date().toISOString()
    };

    console.log('✅ Statistics calculated successfully');
    res.json(statistics);
  } catch (error) {
    console.error('❌ Dashboard statistics error:', error);
    res.status(500).json({ 
      message: 'Statistika olishda xatolik',
      error: error.message 
    });
  }
});

// GET /api/statistics/edits - Edit statistics
router.get('/edits', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    // Calculate date ranges
    const now = new Date();
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // Count updates (check if updatedAt is different from createdAt)
    const [totalEdits, todayEdits, weeklyEdits] = await Promise.all([
      // Count products updated in the specified period (exclude new creations)
      Product.countDocuments({
        updatedAt: { $gte: startDate },
        $expr: { $ne: ['$createdAt', '$updatedAt'] }
      }),
      // Today's edits
      Product.countDocuments({
        updatedAt: { $gte: startOfToday },
        $expr: { $ne: ['$createdAt', '$updatedAt'] }
      }),
      // This week's edits
      Product.countDocuments({
        updatedAt: { $gte: startOfWeek },
        $expr: { $ne: ['$createdAt', '$updatedAt'] }
      })
    ]);

    // Get edit activity by day (last 7 days)
    const editsByDay = await Product.aggregate([
      {
        $match: {
          updatedAt: { $gte: startOfWeek },
          $expr: { $ne: ['$createdAt', '$updatedAt'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$updatedAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Most edited products
    const mostEditedProducts = await Product.aggregate([
      {
        $match: {
          updatedAt: { $gte: startDate },
          $expr: { $ne: ['$createdAt', '$updatedAt'] }
        }
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          editCount: { $sum: 1 },
          lastEdit: { $max: '$updatedAt' }
        }
      },
      {
        $sort: { editCount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    const editStats = {
      total: totalEdits,
      today: todayEdits,
      thisWeek: weeklyEdits,
      period: days,
      byDay: editsByDay,
      mostEdited: mostEditedProducts,
      timestamp: new Date().toISOString()
    };

    res.json(editStats);
  } catch (error) {
    console.error('❌ Edit statistics error:', error);
    res.status(500).json({ 
      message: 'Tahrirlash statistikasini olishda xatolik',
      error: error.message 
    });
  }
});

// GET /api/statistics/summary - Quick summary for cards
router.get('/summary', async (req, res) => {
  try {
    const [totalProducts, totalCraftsmen, totalOrders] = await Promise.all([
      // Align with products list filters
      Product.countDocuments({
        $and: [
          { $or: [{ status: 'active' }, { status: { $exists: false } }] },
          { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] }
        ]
      }),
      Craftsman.countDocuments(),
      Order.countDocuments()
    ]);

    res.json({
      products: totalProducts,
      craftsmen: totalCraftsmen,
      orders: totalOrders,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Summary statistics error:', error);
    res.status(500).json({ 
      message: 'Umumiy statistika olishda xatolik',
      error: error.message 
    });
  }
});

module.exports = router;