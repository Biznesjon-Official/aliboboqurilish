const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: false
  },
  customerAddress: {
    type: String,
    required: false
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    variantOption: {
      type: String,
      required: false
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  completedDate: {
    type: Date
  },
  cancelledDate: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

// Comprehensive indexing for order management and analytics

// 1. Status-based queries (most common)
orderSchema.index({ status: 1, createdAt: -1 }); // Orders by status, newest first
orderSchema.index({ status: 1, totalAmount: -1 }); // High-value orders by status

// 2. Time-based queries for analytics
orderSchema.index({ createdAt: -1 }); // Recent orders
orderSchema.index({ orderDate: -1 }); // Orders by date
orderSchema.index({ completedDate: -1 }, { sparse: true }); // Completed orders only

// 3. Customer-based queries
orderSchema.index({ customerPhone: 1, createdAt: -1 }); // Customer order history
orderSchema.index({ customerEmail: 1, createdAt: -1 }, { sparse: true }); // Email-based lookup

// 4. Financial analytics
orderSchema.index({ totalAmount: -1, status: 1 }); // High-value orders
orderSchema.index({ createdAt: 1, totalAmount: 1 }, { name: 'revenue_calculations' });

// 5. Text search for customer lookup
orderSchema.index({ 
  customerName: 'text', 
  customerPhone: 'text',
  customerEmail: 'text'
}, {
  weights: {
    customerPhone: 10,  // Phone is primary identifier
    customerName: 5,    // Name is secondary
    customerEmail: 3    // Email is tertiary
  },
  name: 'customer_search'
});

// 6. Admin dashboard queries
orderSchema.index({ status: 1, updatedAt: -1 }); // Recently updated orders
orderSchema.index({ createdAt: -1, status: 1 }); // Recent orders with status

// 7. Performance monitoring
orderSchema.index({ updatedAt: -1 }); // Recently modified orders

module.exports = mongoose.model('Order', orderSchema);
