const Craftsman = require('../models/Craftsman');

// GET all craftsmen with pagination, search, and filtering
const getCraftsmen = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', specialty = '', sortBy = 'joinDate', sortOrder = 'desc' } = req.query;
    
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
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const craftsmen = await Craftsman.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Craftsman.countDocuments(query);
    
    res.json({
      craftsmen,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCount: count
    });
  } catch (error) {
    console.error('Error fetching craftsmen:', error);
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
