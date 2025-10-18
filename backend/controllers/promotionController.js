const Promotion = require('../models/Promotion');

// Get all active promotions
const getPromotions = async (req, res) => {
  try {
    const { limit = 10, active = true } = req.query;
    
    const query = {};
    if (active === 'true') {
      query.isActive = true;
      // Only show promotions that haven't expired
      query.$or = [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: new Date() } }
      ];
    }

    const promotions = await Promotion.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: promotions.length,
      promotions
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching promotions'
    });
  }
};

// Get single promotion by ID
const getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    res.json({
      success: true,
      promotion
    });
  } catch (error) {
    console.error('Error fetching promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching promotion'
    });
  }
};

// Create new promotion (admin only)
const createPromotion = async (req, res) => {
  try {
    const promotion = new Promotion(req.body);
    await promotion.save();

    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      promotion
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating promotion',
      error: error.message
    });
  }
};

// Update promotion (admin only)
const updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    res.json({
      success: true,
      message: 'Promotion updated successfully',
      promotion
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating promotion',
      error: error.message
    });
  }
};

// Delete promotion (admin only)
const deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    res.json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting promotion'
    });
  }
};

// Track promotion click
const trackPromotionClick = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      { $inc: { clickCount: 1 } },
      { new: true }
    );

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    res.json({
      success: true,
      message: 'Click tracked successfully',
      clickCount: promotion.clickCount
    });
  } catch (error) {
    console.error('Error tracking promotion click:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while tracking click'
    });
  }
};

// Get promotion analytics (admin only)
const getPromotionAnalytics = async (req, res) => {
  try {
    const analytics = await Promotion.aggregate([
      {
        $group: {
          _id: null,
          totalPromotions: { $sum: 1 },
          activePromotions: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          totalClicks: { $sum: '$clickCount' },
          avgClicksPerPromotion: { $avg: '$clickCount' }
        }
      }
    ]);

    const topPromotions = await Promotion.find({ isActive: true })
      .sort({ clickCount: -1 })
      .limit(5)
      .select('title clickCount badge');

    res.json({
      success: true,
      analytics: analytics[0] || {
        totalPromotions: 0,
        activePromotions: 0,
        totalClicks: 0,
        avgClicksPerPromotion: 0
      },
      topPromotions
    });
  } catch (error) {
    console.error('Error fetching promotion analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
};

module.exports = {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  trackPromotionClick,
  getPromotionAnalytics
};