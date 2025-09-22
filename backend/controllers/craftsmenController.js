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
    
    // OPTIMIZED craftsmen query - include only safe fields to avoid huge payloads/cycles
    const raw = await Craftsman.find(query)
      .select('_id name specialty phone status joinDate rating avatar portfolio')
      .sort(sortOptions)
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()
      .maxTimeMS(3000)
      .exec();

    const normalizePath = (p) => {
      if (!p || typeof p !== 'string') return p;
      const s = p.replace(/\\/g, '/');
      if (s.includes('/uploads/')) {
        const idx = s.indexOf('/uploads/');
        return s.substring(idx);
      }
      return s;
    };

    // Sanitize and limit portfolio to first image only to prevent large/circular data
    const craftsmen = raw.map(c => {
      let avatar = c.avatar;
      if (typeof avatar === 'string' && avatar.startsWith('data:image/')) {
        avatar = '/assets/ustalar/placeholder.svg';
      } else {
        avatar = normalizePath(avatar) || '/assets/ustalar/placeholder.svg';
      }

      let firstPortfolio = null;
      if (Array.isArray(c.portfolio) && c.portfolio.length > 0) {
        const p0 = c.portfolio[0];
        if (typeof p0 === 'string') {
          firstPortfolio = p0.startsWith('data:image/') ? null : normalizePath(p0);
        }
      }

      return {
        _id: c._id,
        name: c.name,
        specialty: c.specialty,
        phone: c.phone,
        status: c.status,
        joinDate: c.joinDate,
        rating: c.rating,
        avatar,
        portfolioPreview: firstPortfolio
      };
    });
    
    // Skip count for better performance (optional)
    const count = craftsmen.length === limit ? limit * page + 1 : (page - 1) * limit + craftsmen.length;
    
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