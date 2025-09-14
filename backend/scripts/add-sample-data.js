const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Import models
const Product = require('../models/Product');
const Craftsman = require('../models/Craftsman');
const Order = require('../models/Order');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      console.error('❌ MongoDB URI is missing');
      process.exit(1);
    }

    await mongoose.connect(uri, {

    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const addSampleData = async () => {
  try {
    console.log('🔍 Checking existing data...');
    
    // Check if data already exists
    const productCount = await Product.countDocuments();
    const craftsmanCount = await Craftsman.countDocuments();
    const orderCount = await Order.countDocuments();
    
    console.log(`📊 Current data: ${productCount} products, ${craftsmanCount} craftsmen, ${orderCount} orders`);
    
    // Add sample products if none exist
    if (productCount === 0) {
      console.log('📦 Adding sample products...');
    const sampleProducts = [
        {
          name: 'Test Mahsulot 1',
          price: 50000,
          description: 'Test mahsulot tavsifi',
          category: 'elektronika',
          stock: 10,
          image: '/test-image1.jpg'
        },
        {
          name: 'Test Mahsulot 2',
          price: 75000,
          description: 'Ikkinchi test mahsulot',
          category: 'kiyim',
          stock: 5,
          image: '/test-image2.jpg'
        }
      ];
      
      await Product.insertMany(sampleProducts);
      console.log('✅ Sample products added');
    }
    
    // Add sample craftsmen if none exist
    if (craftsmanCount === 0) {
      console.log('👨‍🎨 Adding sample craftsmen...');
      const sampleCraftsmen = [
        {
          name: 'Ustad Karim',
          specialty: 'Yog\'och ishi',
          experience: 15,
          rating: 4.8,
          status: 'active',
          phone: '+998901234567',
          email: 'ustad.karim@example.com'
        },
        {
          name: 'Ustad Aziz',
          specialty: 'Metall ishi',
          experience: 10,
          rating: 4.5,
          status: 'active',
          phone: '+998907654321',
          email: 'ustad.aziz@example.com'
        }
      ];
      
      await Craftsman.insertMany(sampleCraftsmen);
      console.log('✅ Sample craftsmen added');
    }
    
    // Add sample orders if none exist
    if (orderCount === 0) {
      console.log('📋 Adding sample orders...');
      const sampleOrders = [
        {
          customerName: 'Farrux Abdullayev',
          customerPhone: '+998901234567',
          customerEmail: 'farrux@example.com',
          items: [
            {
              name: 'Test Mahsulot 1',
              quantity: 2,
              price: 50000
            }
          ],
          totalAmount: 100000,
          status: 'completed',
          orderDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          notes: 'Test buyurtma'
        },
        {
          customerName: 'Gafur Mirzayev',
          customerPhone: '+998907654321',
          customerEmail: 'gafur@example.com',
          items: [
            {
              name: 'Test Mahsulot 2',
              quantity: 1,
              price: 75000
            }
          ],
          totalAmount: 75000,
          status: 'processing',
          orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          notes: 'Ikkinchi test buyurtma'
        },
        {
          customerName: 'Eldor Rahimov',
          customerPhone: '+998909876543',
          customerEmail: 'eldor@example.com',
          items: [
            {
              name: 'Test Mahsulot 1',
              quantity: 1,
              price: 50000
            },
            {
              name: 'Test Mahsulot 2',
              quantity: 1,
              price: 75000
            }
          ],
          totalAmount: 125000,
          status: 'pending',
          orderDate: new Date(), // Today
          notes: 'Uchinchi test buyurtma'
        }
      ];
      
      await Order.insertMany(sampleOrders);
      console.log('✅ Sample orders added');
    }
    
    console.log('🎉 Sample data setup complete!');
    
    // Final count
    const finalProductCount = await Product.countDocuments();
    const finalCraftsmanCount = await Craftsman.countDocuments();
    const finalOrderCount = await Order.countDocuments();
    
    console.log(`📊 Final data: ${finalProductCount} products, ${finalCraftsmanCount} craftsmen, ${finalOrderCount} orders`);
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
};

const main = async () => {
  await connectDB();
  await addSampleData();
  await mongoose.disconnect();
  console.log('👋 Disconnected from MongoDB');
  process.exit(0);
};

main();