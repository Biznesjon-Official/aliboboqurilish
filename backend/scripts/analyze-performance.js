#!/usr/bin/env node

/**
 * Performance Analysis Script
 * Analyzes database and API performance
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/alibobo';

const analyzePerformance = async () => {
  try {
    console.log('🔍 Starting performance analysis...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Analyze collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📊 Database Collections (${collections.length}):`);
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const coll = db.collection(collectionName);
      
      // Get collection stats
      const stats = await coll.stats();
      const indexInfo = await coll.indexes();
      
      console.log(`\n📁 ${collectionName}:`);
      console.log(`   📄 Documents: ${stats.count.toLocaleString()}`);
      console.log(`   💾 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   🗂️  Indexes: ${indexInfo.length}`);
      
      // List indexes
      indexInfo.forEach(index => {
        const keys = Object.keys(index.key).join(', ');
        console.log(`      - ${index.name}: {${keys}}`);
      });
      
      // Check for missing indexes on common query fields
      if (collectionName === 'products') {
        console.log('   🔍 Recommended indexes for products:');
        console.log('      - { category: 1, status: 1, isDeleted: 1 }');
        console.log('      - { updatedAt: -1 }');
        console.log('      - { name: "text", description: "text" }');
      }
    }

    // Memory usage analysis
    console.log('\n🧠 Memory Usage:');
    const memUsage = process.memoryUsage();
    console.log(`   RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);

    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    console.log('   1. Ensure proper indexes are created');
    console.log('   2. Use projection to limit returned fields');
    console.log('   3. Implement caching for frequently accessed data');
    console.log('   4. Use aggregation pipelines for complex queries');
    console.log('   5. Monitor slow queries with MongoDB profiler');

    // Test query performance
    console.log('\n⚡ Query Performance Test:');
    const Product = require('../models/Product');
    
    const startTime = Date.now();
    const products = await Product.find({ status: 'active' })
      .select('name price category')
      .limit(10)
      .lean();
    const queryTime = Date.now() - startTime;
    
    console.log(`   Sample query (10 products): ${queryTime}ms`);
    console.log(`   Results: ${products.length} products found`);

  } catch (error) {
    console.error('❌ Error analyzing performance:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run if called directly
if (require.main === module) {
  analyzePerformance()
    .then(() => {
      console.log('\n🎉 Performance analysis completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = analyzePerformance;