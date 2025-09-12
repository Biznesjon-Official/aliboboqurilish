const Craftsman = require('../models/Craftsman');

// GET all craftsmen with pagination, search, and filtering
const getCraftsmen = async (req, res) => {
  try {
    const debug = process.env.NODE_ENV === 'development'; // Enable debug only in development
    if (debug) console.log('[getCraftsmen] Request query:', req.query);
    
    // Parse and validate query parameters with sensible defaults and limits
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10)); // Limit between 1-100
    const search = req.query.search || '';
    const specialty = req.query.specialty || '';
    const status = req.query.status || '';
    const sortBy = req.query.sortBy || 'joinDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    // Log the parsed parameters for debugging
    if (debug) {
      console.log('[getCraftsmen] Parsed parameters:', { page, limit, search, specialty, status, sortBy, sortOrder });
    }
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (specialty && specialty !== 'Barcha mutaxassisliklar') {
      query.specialty = specialty;
    }
    
    // Handle status filter
    if (status) {
      query.status = status;
    }
    
    const sortOptions = {};
    // Only allow sorting by specific fields to prevent injection
    const allowedSortFields = ['joinDate', 'name', 'specialty', 'rating', 'completedJobs'];
    if (allowedSortFields.includes(sortBy)) {
      sortOptions[sortBy] = sortOrder;
    } else {
      sortOptions.joinDate = -1; // Default sort
    }
    
    if (debug) console.log('[getCraftsmen] Query:', query);
    if (debug) console.log('[getCraftsmen] Sort options:', sortOptions);
    
    // Add performance hints for MongoDB
    const craftsmen = await Craftsman.find(query)
      .sort(sortOptions)
      .limit(limit)
      .skip((page - 1) * limit)
      .maxTimeMS(30000) // Increased timeout to 30 seconds to handle network latency
      .exec();
    
    const count = await Craftsman.countDocuments(query).maxTimeMS(30000);
    
    if (debug) console.log('[getCraftsmen] Found', craftsmen.length, 'craftsmen');
    
    res.json({
      craftsmen,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCount: count
    });
  } catch (error) {
    console.error('Error fetching craftsmen:', error);
    
    // Handle timeout errors specifically
    if (error.name === 'MongoNetworkTimeoutError' || error.message.includes('timed out')) {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Database connection timeout. Please try again in a few moments.',
        retryAfter: 30
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch craftsmen',
      message: error.message 
    });
  }
};

// GET single craftsman by ID
const getCraftsmanById = async (req, res) => {
  try {
    const craftsman = await Craftsman.findById(req.params.id);
    if (!craftsman) {
      return res.status(404).json({ message: 'Usta topilmadi' });
    }
    res.json(craftsman);
  } catch (error) {
    console.error('Error fetching craftsman:', error);
    res.status(500).json({ 
      error: 'Failed to fetch craftsman',
      message: error.message 
    });
  }
};

// POST create new craftsman
const createCraftsman = async (req, res) => {
  try {
    const craftsman = new Craftsman(req.body);
    const newCraftsman = await craftsman.save();
    res.status(201).json(newCraftsman);
  } catch (error) {
    console.error('Error creating craftsman:', error);
    res.status(400).json({ 
      error: 'Failed to create craftsman',
      message: error.message 
    });
  }
};

// PUT update craftsman
const updateCraftsman = async (req, res) => {
  try {
    const craftsman = await Craftsman.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!craftsman) {
      return res.status(404).json({ message: 'Usta topilmadi' });
    }
    
    res.json(craftsman);
  } catch (error) {
    console.error('Error updating craftsman:', error);
    res.status(400).json({ 
      error: 'Failed to update craftsman',
      message: error.message 
    });
  }
};

// DELETE craftsman
const deleteCraftsman = async (req, res) => {
  try {
    const craftsman = await Craftsman.findByIdAndDelete(req.params.id);
    
    if (!craftsman) {
      return res.status(404).json({ message: 'Usta topilmadi' });
    }
    
    res.json({ message: 'Usta muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.error('Error deleting craftsman:', error);
    res.status(500).json({ 
      error: 'Failed to delete craftsman',
      message: error.message 
    });
  }
};

module.exports = {
  getCraftsmen,
  getCraftsmanById,
  createCraftsman,
  updateCraftsman,
  deleteCraftsman
};