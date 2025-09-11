#!/usr/bin/env node

// Database optimization script for MongoDB indexes and performance
const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure indexes are defined
const Product = require('../models/Product');
const Order = require('../models/Order');
const Craftsman = require('../models/Craftsman');
const Notification = require('../models/Notification');

const optimizeDatabase = async () => {
  try {
    console.log('🔧 Starting database optimization...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
    });
    console.log('✅ Connected to MongoDB\n');

    // Get database instance
    const db = mongoose.connection.db;

    // Analyze and optimize each collection
    const collections = [
      { name: 'products', model: Product },
      { name: 'orders', model: Order },
      { name: 'craftsmen', model: Craftsman },
      { name: 'notifications', model: Notification }
    ];

    for (const { name, model } of collections) {
      console.log(`📊 Analyzing collection: ${name}`);
      
      try {
        // Get collection stats
        const stats = await db.collection(name).stats();
        console.log(`  Documents: ${stats.count.toLocaleString()}`);
        console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Average document size: ${stats.avgObjSize} bytes`);

        // Get current indexes
        const indexes = await db.collection(name).indexes();
        console.log(`  Current indexes: ${indexes.length}`);

        // Ensure model indexes are created
        await model.ensureIndexes();
        console.log(`  ✅ Model indexes ensured`);

        // Get updated indexes
        const updatedIndexes = await db.collection(name).indexes();
        console.log(`  Updated indexes: ${updatedIndexes.length}`);

        // Show index details
        console.log('  Index details:');
        updatedIndexes.forEach((index, i) => {
          const keyStr = Object.keys(index.key).map(key => 
            `${key}:${index.key[key]}`
          ).join(', ');
          console.log(`    ${i + 1}. ${index.name || 'unnamed'} (${keyStr})`);
        });

        console.log('');
      } catch (error) {
        console.log(`  ❌ Error analyzing ${name}:`, error.message);
      }
    }

    // Run database-wide optimizations
    console.log('🚀 Running database optimizations...\n');

    // Analyze query performance for products
    console.log('📈 Product query performance analysis:');
    try {
      // Test common product queries
      const productQueries = [
        { category: 'electronics', status: 'active' },
        { status: 'active', price: { $gte: 100, $lte: 1000 } },
        { $text: { $search: 'phone' }, status: 'active' },
        { status: 'active', isPopular: true },
        { status: 'active', stock: { $gt: 0 } }
      ];

      for (const query of productQueries) {
        const explain = await Product.find(query).explain('executionStats');
        const stats = explain.executionStats;
        console.log(`  Query: ${JSON.stringify(query)}`);
        console.log(`    Execution time: ${stats.executionTimeMillis}ms`);
        console.log(`    Documents examined: ${stats.totalDocsExamined}`);
        console.log(`    Documents returned: ${stats.totalDocsReturned}`);
        console.log(`    Index used: ${stats.executionStages.indexName || 'COLLSCAN'}`);
        console.log('');
      }
    } catch (error) {
      console.log('  ❌ Error in query analysis:', error.message);
    }

    // Analyze order query performance
    console.log('📈 Order query performance analysis:');
    try {
      const orderQueries = [
        { status: 'pending' },
        { status: 'completed', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        { totalAmount: { $gte: 1000 } },
        { $text: { $search: 'john' } }
      ];

      for (const query of orderQueries) {
        const explain = await Order.find(query).explain('executionStats');
        const stats = explain.executionStats;
        console.log(`  Query: ${JSON.stringify(query)}`);
        console.log(`    Execution time: ${stats.executionTimeMillis}ms`);
        console.log(`    Documents examined: ${stats.totalDocsExamined}`);
        console.log(`    Documents returned: ${stats.totalDocsReturned}`);
        console.log(`    Index used: ${stats.executionStages.indexName || 'COLLSCAN'}`);
        console.log('');
      }
    } catch (error) {
      console.log('  ❌ Error in order query analysis:', error.message);
    }

    // Performance recommendations
    console.log('💡 Performance Recommendations:');
    console.log('================================');

    // Check for collections without proper indexes
    for (const { name, model } of collections) {
      try {
        const stats = await db.collection(name).stats();
        const indexes = await db.collection(name).indexes();
        
        if (indexes.length <= 2) { // Only _id and maybe one other
          console.log(`⚠️  ${name}: Consider adding more indexes for better query performance`);
        }
        
        if (stats.count > 10000 && stats.avgObjSize > 1000) {
          console.log(`⚠️  ${name}: Large collection with big documents - consider data archiving`);
        }
        
        if (stats.count > 0) {
          console.log(`✅ ${name}: ${stats.count.toLocaleString()} documents, ${indexes.length} indexes`);
        }
      } catch (error) {
        console.log(`❌ Could not analyze ${name}:`, error.message);
      }
    }

    console.log('\n🎉 Database optimization completed!');

  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
};

// Run optimization if called directly
if (require.main === module) {
  optimizeDatabase().catch(console.error);
}

module.exports = optimizeDatabase;