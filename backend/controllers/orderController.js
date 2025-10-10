const Order = require('../models/Order');

// Get all orders with pagination and filtering
const getOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    
    // Search filter
    if (req.query.search && req.query.search.trim() !== '') {
      const searchTerm = req.query.search.trim();
      query.$or = [
        { customerName: { $regex: searchTerm, $options: 'i' } },
        { customerPhone: { $regex: searchTerm, $options: 'i' } },
        { customerAddress: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    // Get total count
    const totalCount = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get orders with pagination
    const orders = await Order.find(query)
      .sort({ orderDate: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .lean();
    
    console.log(`📦 Orders fetched: ${orders.length}/${totalCount}`);
    
    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({
      error: 'Failed to fetch orders',
      message: error.message
    });
  }
};

// Create new order
const createOrder = async (req, res) => {
  try {
    const orderData = {
      customerName: req.body.customerName,
      customerPhone: req.body.customerPhone,
      customerAddress: req.body.customerAddress,
      items: req.body.items,
      totalAmount: req.body.totalAmount,
      status: req.body.status || 'pending',
      orderDate: new Date()
    };
    
    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save();
    
    console.log('✅ Order created:', savedOrder._id);
    
    res.status(201).json({
      ...savedOrder.toObject(),
      message: 'Order created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      error: 'Failed to create order',
      message: error.message
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log(`✅ Order ${id} status updated to: ${status}`);
    
    res.json({
      ...updatedOrder.toObject(),
      message: 'Order status updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error updating order:', error);
    res.status(500).json({
      error: 'Failed to update order',
      message: error.message
    });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedOrder = await Order.findByIdAndDelete(id);
    
    if (!deletedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log(`✅ Order ${id} deleted`);
    
    res.json({
      message: 'Order deleted successfully',
      deletedOrder: deletedOrder.toObject()
    });
    
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    res.status(500).json({
      error: 'Failed to delete order',
      message: error.message
    });
  }
};

module.exports = {
  getOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder
};