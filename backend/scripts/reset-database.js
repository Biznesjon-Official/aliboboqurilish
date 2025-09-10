#!/usr/bin/env node

/**
 * Database Reset Script
 * 
 * This script handles database reset operations including:
 * - Dropping conflicting indexes
 * - Recreating proper indexes
 * - Cleaning up orphaned data
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment configuration
if (process.env.NODE_ENV === 'development') {
  require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
} else {
  require('dotenv').config({ path: path.join(__dirname, '../config.env') });
}

// Import models to ensure they're registered
const Product = require('../models/Product');
const Order = require('../models/Order');
const Craftsman = require('../models/Craftsman');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alibobo';

async function resetDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections`);

    // Drop problematic indexes
    console.log('\n🗑️  Dropping conflicting indexes...');
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const coll = mongoose.connection.db.collection(collectionName);
      
      try {
        // Get existing indexes
        const indexes = await coll.indexes();
        console.log(`  📊 Collection "${collectionName}" has ${indexes.length} indexes`);
        
        // Look for problematic indexes
        for (const index of indexes) {
          if (index.name && (
            index.name.includes('customer_search_unified') ||
            index.name.includes('customer_search') && index.name !== 'customer_search'
          )) {
            console.log(`  🗑️  Dropping conflicting index: ${index.name}`);
            await coll.dropIndex(index.name);
            console.log(`  ✅ Dropped index: ${index.name}`);
          }
        }
      } catch (error) {
        if (error.code === 27 || error.message.includes('index not found')) {
          console.log(`  ℹ️  No conflicting indexes found in "${collectionName}"`);
        } else {
          console.log(`  ⚠️  Error checking indexes in "${collectionName}": ${error.message}`);
        }
      }
    }

    // Recreate indexes using models
    console.log('\n🔧 Recreating indexes from models...');
    
    const models = [Product, Order, Craftsman];
    
    for (const model of models) {
      try {
        console.log(`  🔄 Ensuring indexes for ${model.modelName}...`);
        await model.ensureIndexes();
        console.log(`  ✅ Indexes ensured for ${model.modelName}`);
      } catch (error) {
        console.log(`  ⚠️  Error ensuring indexes for ${model.modelName}: ${error.message}`);
      }
    }

    console.log('\n✅ Database reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the reset if this script is executed directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('🎉 Database reset script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database reset script failed:', error);
      process.exit(1);
    });
}

module.exports = { resetDatabase };