#!/usr/bin/env node

/**
 * Performance Optimization: Create MongoDB Indexes
 * This script creates optimized indexes for the Product collection
 * to dramatically improve query performance from 35-78 seconds to under 1 second
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.development') });

const MONGODB_URI = process.env.MONGODB_URI || 
                   process.env.MONGO_URI || 
                   'mongodb+srv://ozodbek:9KS0xaLkMnnqqE3L@cluster0.dlopces.mongodb.net/alibobo?retryWrites=true&w=majority&appName=Cluster0';

async function createPerformanceIndexes() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('products');

    console.log('\n📊 Analyzing current indexes...');
    const existingIndexes = await collection.indexes();
    console.log('Current indexes:', existingIndexes.map(idx => idx.name));

    console.log('\n🔧 Creating performance-optimized indexes...');

    // 1. Critical compound index for the most common query pattern
    // This will dramatically speed up the main product listing
    console.log('Creating compound index for main product listing...');
    await collection.createIndex(
      { 
        isDeleted: 1,
        status: 1, 
        updatedAt: -1 
      },
      { 
        name: 'fast_product_listing',
        background: true 
      }
    );

    // 2. Category-based queries with sorting
    console.log('Creating category + sorting index...');
    await collection.createIndex(
      { 
        isDeleted: 1,
        status: 1,
        category: 1, 
        updatedAt: -1 
      },
      { 
        name: 'category_sorted_listing',
        background: true 
      }
    );

    // 3. Price-based sorting optimization
    console.log('Creating price sorting indexes...');
    await collection.createIndex(
      { 
        isDeleted: 1,
        status: 1,
        price: 1,
        updatedAt: -1 
      },
      { 
        name: 'price_asc_listing',
        background: true 
      }
    );

    await collection.createIndex(
      { 
        isDeleted: 1,
        status: 1,
        price: -1,
        updatedAt: -1 
      },
      { 
        name: 'price_desc_listing',
        background: true 
      }
    );

    // 4. Stock availability index
    console.log('Creating stock availability index...');
    await collection.createIndex(
      { 
        isDeleted: 1,
        status: 1,
        stock: 1 
      },
      { 
        name: 'stock_availability',
        background: true 
      }
    );

    // 5. Popular and new products index
    console.log('Creating featured products indexes...');
    await collection.createIndex(
      { 
        isDeleted: 1,
        status: 1,
        isPopular: 1,
        updatedAt: -1 
      },
      { 
        name: 'popular_products',
        background: true 
      }
    );

    await collection.createIndex(
      { 
        isDeleted: 1,
        status: 1,
        isNew: 1,
        updatedAt: -1 
      },
      { 
        name: 'new_products',
        background: true 
      }
    );

    // 6. Text search optimization (if not exists)
    console.log('Ensuring text search index exists...');
    try {
      await collection.createIndex(
        { 
          name: 'text',
          description: 'text',
          category: 'text'
        },
        {
          name: 'product_text_search_optimized',
          weights: {
            name: 10,
            category: 5,
            description: 1
          },
          background: true
        }
      );
    } catch (error) {
      if (error.message.includes('text index')) {
        console.log('Text index already exists, skipping...');
      } else {
        throw error;
      }
    }

    console.log('\n📈 Analyzing index usage...');
    
    // Test query performance
    const testQuery = {
      $and: [
        { $or: [{ status: 'active' }, { status: { $exists: false } }] },
        { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] }
      ]
    };

    console.log('Testing query performance...');
    const startTime = Date.now();
    
    const result = await collection.find(testQuery)
      .sort({ updatedAt: -1 })
      .limit(20)
      .explain('executionStats');
    
    const queryTime = Date.now() - startTime;
    
    console.log(`Query execution time: ${queryTime}ms`);
    console.log(`Documents examined: ${result.executionStats.totalDocsExamined}`);
    console.log(`Documents returned: ${result.executionStats.totalDocsReturned}`);
    console.log(`Index used: ${result.executionStats.executionStages.indexName || 'COLLSCAN (no index)'}`);

    if (result.executionStats.totalDocsExamined > result.executionStats.totalDocsReturned * 10) {
      console.log('⚠️  Warning: Query is examining too many documents. Consider query optimization.');
    } else {
      console.log('✅ Query performance looks good!');
    }

    console.log('\n📋 Final index list:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✅ Performance indexes created successfully!');
    console.log('🚀 Expected performance improvement: 35-78s → <1s');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createPerformanceIndexes()
    .then(() => {
      console.log('\n🎉 Index creation completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createPerformanceIndexes };