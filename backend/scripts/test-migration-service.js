#!/usr/bin/env node

/**
 * Test Migration Service
 * Tests the ImageMigrationService functionality
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

const ImageMigrationService = require('../services/ImageMigrationService');

async function testMigrationService() {
  try {
    console.log('🧪 Testing ImageMigrationService...\n');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/alibobo';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const migrationService = new ImageMigrationService();
    
    // Test 1: Check readiness
    console.log('\n📋 Test 1: Checking service readiness...');
    const readiness = await migrationService.checkReadiness();
    console.log('Readiness result:', readiness);
    
    // Test 2: Get migration stats
    console.log('\n📊 Test 2: Getting migration statistics...');
    const stats = await migrationService.getMigrationStats();
    console.log('Migration stats:', stats);
    
    // Test 3: Get sample products
    console.log('\n📦 Test 3: Getting sample products with Base64 images...');
    const products = await migrationService.getProductsWithBase64Images(3, 0);
    console.log(`Found ${products.length} products with Base64 images`);
    
    if (products.length > 0) {
      const product = products[0];
      console.log(`Sample product: ${product.name} (${product._id})`);
      
      // Test 4: Validate Base64 images
      console.log('\n🔍 Test 4: Validating Base64 images...');
      
      if (product.image && product.image.startsWith('data:image/')) {
        const validation = migrationService.validateBase64Image(product.image);
        console.log('Main image validation:', validation);
      }
      
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((img, index) => {
          if (img && img.startsWith('data:image/')) {
            const validation = migrationService.validateBase64Image(img);
            console.log(`Additional image ${index} validation:`, validation);
          }
        });
      }
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

testMigrationService();