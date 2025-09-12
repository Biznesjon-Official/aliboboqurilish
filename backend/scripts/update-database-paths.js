#!/usr/bin/env node

/**
 * Update Database Paths Script
 * Updates database records to use file paths instead of Base64 data
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

const Product = require('../models/Product');

async function updateDatabasePaths() {
  try {
    console.log('🔄 Starting database path updates...\n');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/alibobo';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find products with Base64 images
    const products = await Product.find({
      $or: [
        { 'image': { $regex: '^data:image/' } },
        { 'images': { $elemMatch: { $regex: '^data:image/' } } }
      ],
      isDeleted: { $ne: true }
    });
    
    console.log(`📊 Found ${products.length} products to update`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        console.log(`\n🔄 Processing: ${product.name} (${product._id})`);
        
        let hasUpdates = false;
        const updates = {};
        
        // Check main image
        if (product.image && product.image.startsWith('data:image/')) {
          const imagePath = await findImageFile(product._id, 0);
          if (imagePath) {
            updates.image = imagePath;
            hasUpdates = true;
            console.log(`   ✅ Main image: ${imagePath}`);
          } else {
            console.log(`   ❌ Main image file not found`);
          }
        }
        
        // Check additional images
        if (product.images && Array.isArray(product.images)) {
          const newImages = [];
          let imageIndex = 0;
          
          for (const img of product.images) {
            if (img && img.startsWith('data:image/')) {
              const imagePath = await findImageFile(product._id, imageIndex);
              if (imagePath) {
                newImages.push(imagePath);
                console.log(`   ✅ Additional image [${imageIndex}]: ${imagePath}`);
              } else {
                console.log(`   ❌ Additional image [${imageIndex}] file not found`);
                newImages.push(img); // Keep original if file not found
              }
            } else {
              newImages.push(img); // Keep non-Base64 images as is
            }
            imageIndex++;
          }
          
          if (newImages.length > 0) {
            updates.images = newImages;
            hasUpdates = true;
          }
        }
        
        // Update database if we have changes
        if (hasUpdates) {
          await Product.findByIdAndUpdate(product._id, updates);
          updatedCount++;
          console.log(`   ✅ Database updated successfully`);
        } else {
          console.log(`   ℹ️  No updates needed`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing ${product._id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Database update complete!');
    console.log('============================');
    console.log(`Products updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Success rate: ${Math.round((updatedCount / products.length) * 100)}%`);
    
  } catch (error) {
    console.error('❌ Database update failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

/**
 * Find image file for a product and image index
 */
async function findImageFile(productId, imageIndex) {
  try {
    const productDir = path.join(__dirname, '../../uploads/products/original', productId.toString());
    
    // Check if directory exists
    try {
      await fs.access(productDir);
    } catch {
      return null; // Directory doesn't exist
    }
    
    // List files in directory
    const files = await fs.readdir(productDir);
    
    // Find file that matches the pattern: productId_imageIndex_timestamp_uuid.ext
    const pattern = new RegExp(`^${productId}_${imageIndex}_\\d+_[a-f0-9]+\\.(jpg|jpeg|png|gif|webp)$`);
    
    for (const file of files) {
      if (pattern.test(file)) {
        return `/uploads/products/original/${productId}/${file}`;
      }
    }
    
    return null; // File not found
    
  } catch (error) {
    console.error(`Error finding image file for ${productId}[${imageIndex}]:`, error);
    return null;
  }
}

// Run the update
updateDatabasePaths();