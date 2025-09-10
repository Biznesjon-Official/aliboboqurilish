const express = require('express');
const router = express.Router();
const RecentActivity = require('../models/RecentActivity');

// Get all recent activities with pagination and filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      filter = 'all',
      category = '',
      search = '',
    } = req.query;

    // Build query object
    let query = {};

    // Apply category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Apply general filter
    if (filter && filter !== 'all') {
      query.category = filter;
    }

    // Apply search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { desc: searchRegex },
        { entityName: searchRegex }
      ];
    }

    // Calculate pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Get total count for pagination
    const totalCount = await RecentActivity.countDocuments(query);
    
    // Get activities with pagination, sorted by newest first
    const activities = await RecentActivity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // Update time format for each activity
    const activitiesWithTime = activities.map(activity => ({
      ...activity,
      id: activity._id.toString(),
      time: formatTimeAgo(activity.timestamp || activity.createdAt.getTime())
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNumber);
    const hasNext = pageNumber < totalPages;
    const hasPrev = pageNumber > 1;

    res.json({
      success: true,
      activities: activitiesWithTime,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        hasNext,
        hasPrev,
        limit: limitNumber,
      },
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get single activity by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await RecentActivity.findById(id).lean();

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }

    // Format the activity
    const formattedActivity = {
      ...activity,
      id: activity._id.toString(),
      time: formatTimeAgo(activity.timestamp || activity.createdAt.getTime())
    };

    res.json({
      success: true,
      activity: formattedActivity,
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get activity statistics
router.get('/stats', async (req, res) => {
  try {
    const totalActivities = await RecentActivity.countDocuments();
    
    // Get category counts
    const categoryCounts = await RecentActivity.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object format
    const categoryCountsObj = {
      buyurtmalar: 0,
      mahsulotlar: 0,
      ustalar: 0
    };
    
    categoryCounts.forEach(item => {
      if (categoryCountsObj.hasOwnProperty(item._id)) {
        categoryCountsObj[item._id] = item.count;
      }
    });

    // Get recent count (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await RecentActivity.countDocuments({
      createdAt: { $gte: oneDayAgo }
    });

    const stats = {
      totalActivities,
      categoryCounts: categoryCountsObj,
      recentCount,
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Delete single activity
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedActivity = await RecentActivity.findByIdAndDelete(id);

    if (!deletedActivity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }

    res.json({
      success: true,
      message: 'Activity deleted successfully',
      deletedActivity: {
        ...deletedActivity.toObject(),
        id: deletedActivity._id.toString()
      },
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Delete all activities
router.delete('/all', async (req, res) => {
  try {
    const result = await RecentActivity.deleteMany({});
    const deletedCount = result.deletedCount;

    res.json({
      success: true,
      message: 'All activities deleted successfully',
      deletedCount,
    });
  } catch (error) {
    console.error('Error deleting all activities:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Cleanup old activities
router.post('/cleanup', async (req, res) => {
  try {
    const { daysOld = 90 } = req.body;
    const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
    
    const result = await RecentActivity.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    
    const deletedCount = result.deletedCount;
    const remainingCount = await RecentActivity.countDocuments();

    res.json({
      success: true,
      message: `Cleaned up activities older than ${daysOld} days`,
      deletedCount,
      remainingCount,
    });
  } catch (error) {
    console.error('Error cleaning up activities:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Clear cache (simulated for this mock implementation)
router.post('/cache/clear', (req, res) => {
  try {
    // In a real implementation, this would clear any caching mechanism
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Helper function to format time
const formatTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Hozir';
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  if (hours < 24) return `${hours} soat oldin`;
  if (days === 1) return 'Kecha';
  return `${days} kun oldin`;
};

// Add new activity (helper function for other routes to use)
const addActivity = async (activityData) => {
  try {
    const timestamp = Date.now();
    const newActivityData = {
      ...activityData,
      timestamp,
      time: formatTimeAgo(timestamp),
    };
    
    console.log('📝 Adding new activity to MongoDB:', newActivityData);
    
    // Save to MongoDB
    const newActivity = new RecentActivity(newActivityData);
    const savedActivity = await newActivity.save();
    
    // Return formatted activity
    const formattedActivity = {
      ...savedActivity.toObject(),
      id: savedActivity._id.toString(),
      time: formatTimeAgo(timestamp)
    };
    
    console.log('✅ Activity saved to MongoDB:', formattedActivity.id);
    
    // Clean up old activities (keep only last 1000)
    const totalCount = await RecentActivity.countDocuments();
    if (totalCount > 1000) {
      const activitiesToDelete = await RecentActivity.find()
        .sort({ createdAt: 1 })
        .limit(totalCount - 1000)
        .select('_id');
      
      if (activitiesToDelete.length > 0) {
        await RecentActivity.deleteMany({
          _id: { $in: activitiesToDelete.map(a => a._id) }
        });
        console.log(`🧹 Cleaned up ${activitiesToDelete.length} old activities`);
      }
    }
    
    console.log('📊 Total activities in MongoDB:', await RecentActivity.countDocuments());
    return formattedActivity;
  } catch (error) {
    console.error('❌ Error saving activity to MongoDB:', error);
    throw error;
  }
};

// POST /demo - Add multiple demo activities for testing
router.post('/demo', async (req, res) => {
  try {
    const demoActivities = [];
    
    // Add craftsman activities
    demoActivities.push(await addActivity({
      category: 'ustalar',
      icon: 'fa-user-edit',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: 'Usta tahrirlandi',
      desc: 'Jaloliddin Akramov - Elektrik',
      entityType: 'craftsman',
      entityId: 'demo1',
      entityName: 'Jaloliddin Akramov',
    }));
    
    demoActivities.push(await addActivity({
      category: 'ustalar',
      icon: 'fa-user-plus',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      title: 'Yangi usta qo\'shildi',
      desc: 'Sardor Karimov - Santexnik',
      entityType: 'craftsman',
      entityId: 'demo2',
      entityName: 'Sardor Karimov',
    }));
    
    // Add product activities
    demoActivities.push(await addActivity({
      category: 'mahsulotlar',
      icon: 'fa-box',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      title: 'Mahsulot tahrirlandi',
      desc: 'Samsung Galaxy S24 - 12,500,000 so\'m',
      entityType: 'product',
      entityId: 'demo3',
      entityName: 'Samsung Galaxy S24',
    }));
    
    // Add order activities
    demoActivities.push(await addActivity({
      category: 'buyurtmalar',
      icon: 'fa-shopping-cart',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      title: 'Yangi buyurtma',
      desc: 'Aziz Toshmatov - 2,500,000 so\'m',
      entityType: 'order',
      entityId: 'demo4',
      entityName: 'Aziz Toshmatov',
    }));
    
    const totalActivities = await RecentActivity.countDocuments();
    
    res.json({
      success: true,
      message: `${demoActivities.length} demo activities added successfully`,
      activities: demoActivities,
      totalActivities
    });
  } catch (error) {
    console.error('Error adding demo activities:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});
router.post('/test', async (req, res) => {
  try {
    const testActivity = await addActivity({
      category: 'ustalar',
      icon: 'fa-user-edit',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: 'Test usta tahrirlandi',
      desc: 'Test User - Test Specialty',
      time: 'Hozir',
      entityType: 'craftsman',
      entityId: 'test123',
      entityName: 'Test User',
    });
    
    const totalActivities = await RecentActivity.countDocuments();
    
    res.json({
      success: true,
      message: 'Test activity added successfully',
      activity: testActivity,
      totalActivities
    });
  } catch (error) {
    console.error('Error adding test activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Export both router and helper function
module.exports = { router, addActivity };