
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const productRoutes = require('./routes/productRoutes');
const craftsmenRoutes = require('./routes/craftsmenRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const ordersRoutes = require('./routes/ordersRoutes');

app.use('/api/products', productRoutes);
app.use('/api/craftsmen', craftsmenRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/orders', ordersRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Alibobo Backend Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Alibobo Backend API',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      craftsmen: '/api/craftsmen',
      notifications: '/api/notifications',
      orders: '/api/orders',
      health: '/api/health'
    }
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {

    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   - Products: http://localhost:${PORT}/api/products`);
    console.log(`   - Craftsmen: http://localhost:${PORT}/api/craftsmen`);
    console.log(`   - Notifications: http://localhost:${PORT}/api/notifications`);
    console.log(`   - Orders: http://localhost:${PORT}/api/orders`);
    console.log(`   - Health: http://localhost:${PORT}/api/health`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log(`❌ Error: ${err.message}`);
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();
