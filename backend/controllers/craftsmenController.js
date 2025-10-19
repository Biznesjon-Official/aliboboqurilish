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
    const minimal = req.query.minimal === '1' || req.query.minimal === 'true';
    
    // Log the parsed parameters for debugging
    if (debug) {
      console.log('[getCraftsmen] Parsed parameters:', { page, limit, search, specialty, status, sortBy, sortOrder });
    }
    
    const query = {};
    
    if (search) {
      console.log(`🔍 [getCraftsmen] Search filter: "${search}"`);
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (specialty && specialty !== 'Barcha mutaxassisliklar') {
      console.log(`🏷️ [getCraftsmen] Specialty filter: "${specialty}"`);
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
      let s = p.replace(/\\/g, '/');
      const idxWithSlash = s.indexOf('/uploads/');
      const idxNoSlash = s.indexOf('uploads/');
      if (idxWithSlash >= 0) {
        s = s.substring(idxWithSlash);
        return s;
      }
      if (idxNoSlash >= 0) {
        s = '/' + s.substring(idxNoSlash);
        return s;
      }
      return s;
    };
    const toStringSafe = (v) => (typeof v === 'string' ? v : '');

    // Sanitize and limit portfolio to first image only to prevent large/circular data
    let craftsmen;
    try {
      craftsmen = raw.map((c) => {
        try {
          // Minimal path: return essential fields + SAFE preview images (sanitized strings only)
          if (minimal) {
            const DEFAULT_AVATAR = '/assets/ustalar/placeholder.svg';
            let avatar = toStringSafe(c.avatar);
            if (avatar) {
              if (avatar.startsWith('data:image/')) {
                // Keep valid base64 images
                avatar = avatar;
              } else {
                avatar = normalizePath(avatar) || DEFAULT_AVATAR;
              }
            } else {
              avatar = DEFAULT_AVATAR;
            }

            let firstPortfolio = null;
            if (Array.isArray(c.portfolio) && c.portfolio.length > 0) {
              const s = toStringSafe(c.portfolio[0]);
              if (s) {
                firstPortfolio = s.startsWith('data:image/') ? s : normalizePath(s);
              }
            }

            return {
              _id: c._id,
              name: toStringSafe(c.name),
              specialty: toStringSafe(c.specialty),
              phone: toStringSafe(c.phone),
              status: toStringSafe(c.status) || 'active',
              joinDate: c.joinDate || null,
              rating: typeof c.rating === 'number' ? c.rating : 0,
              avatar,
              portfolioPreview: firstPortfolio
            };
          }

          // Full path with image sanitization
          const DEFAULT_AVATAR = '/assets/ustalar/placeholder.svg';

          let avatar = toStringSafe(c.avatar);
          if (avatar) {
            if (avatar.startsWith('data:image/')) {
              // Keep base64
              avatar = avatar;
            } else {
              avatar = normalizePath(avatar) || DEFAULT_AVATAR;
            }
          } else {
            avatar = DEFAULT_AVATAR;
          }

          let firstPortfolio = null;
          if (Array.isArray(c.portfolio) && c.portfolio.length > 0) {
            const p0 = c.portfolio[0];
            const s = toStringSafe(p0);
            if (s) {
              firstPortfolio = s.startsWith('data:image/') ? s : normalizePath(s);
            }
          }

          return {
            _id: c._id,
            name: toStringSafe(c.name),
            specialty: toStringSafe(c.specialty),
            phone: toStringSafe(c.phone),
            status: toStringSafe(c.status) || 'active',
            joinDate: c.joinDate || null,
            rating: typeof c.rating === 'number' ? c.rating : 0,
            avatar,
            portfolioPreview: firstPortfolio
          };
        } catch (_) {
          // As a last resort, return minimal fields to avoid failing the whole list
          const s = (v) => (typeof v === 'string' ? v : '');
          return {
            _id: c && c._id,
            name: s(c && c.name),
            specialty: s(c && c.specialty),
            phone: s(c && c.phone),
            status: s(c && c.status) || 'active',
            joinDate: (c && c.joinDate) || null,
            rating: c && typeof c.rating === 'number' ? c.rating : 0
          };
        }
      });
    } catch (e) {
      if (process.env.DEBUG === 'true') {
        console.warn('[getCraftsmen] Sanitization failed, falling back to minimal. Reason:', e?.message || e);
      }
      craftsmen = raw.map((c) => ({
        _id: c._id,
        name: typeof c.name === 'string' ? c.name : '',
        specialty: typeof c.specialty === 'string' ? c.specialty : '',
        phone: typeof c.phone === 'string' ? c.phone : '',
        status: typeof c.status === 'string' ? c.status : 'active',
        joinDate: c.joinDate || null,
        rating: typeof c.rating === 'number' ? c.rating : 0
      }));
    }
    
    // Skip count for better performance (optional)
    const count = craftsmen.length === limit ? limit * page + 1 : (page - 1) * limit + craftsmen.length;
    
    if (debug) console.log('[getCraftsmen] Found', craftsmen.length, 'craftsmen');
    
    // Debug: Log search/filter results
    if (search || specialty) {
      console.log(`🔍 [getCraftsmen] Filter results: search="${search}", specialty="${specialty}", found=${craftsmen.length} craftsmen`);
      if (craftsmen.length > 0) {
        console.log(`🔍 [getCraftsmen] First 3 craftsmen:`, 
          craftsmen.slice(0, 3).map(c => ({ name: c.name, specialty: c.specialty }))
        );
      }
    }
    
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