const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Test fetching craftsmen and products
const testQueries = async () => {
  // Import models
  const Craftsman = require('./models/Craftsman');
  const Product = require('./models/Product');
  
  try {
    // Test craftsmen query
    console.log('🔍 Testing craftsmen query...');
    const craftsmen = await Craftsman.find({ status: 'active' }).limit(5);
    console.log(`✅ Found ${craftsmen.length} craftsmen`);
    
    // Test products query
    console.log('🔍 Testing products query...');
    const products = await Product.find({ 
      status: 'active',
      isDeleted: { $ne: true }
    }).limit(5);
    console.log(`✅ Found ${products.length} products`);
    
    // Test specific query that's failing
    console.log('🔍 Testing specific craftsmen query (limit=40, status=active)...');
    const specificCraftsmen = await Craftsman.find({ status: 'active' }).limit(40);
    console.log(`✅ Found ${specificCraftsmen.length} craftsmen with limit=40`);
    
    console.log('🎉 All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test query error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Run the tests
connectDB().then(testQueries);
