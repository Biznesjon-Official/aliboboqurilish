#!/usr/bin/env node

/**
 * Rollback Migration Script
 * Restores Base64 images from files back to database
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

const Product = require('../models/Product');

async function rollbackMigration() {
  try {
    console.log('🔄 Starting migration rollback...\n');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/alibobo';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find products with file paths
    const products = await Product.find({
      $or: [
        { image: { $regex: '^/uploads/products/original/' } },
        { images: { $elemMatch: { $regex: '^/uploads/products/original/' } } }
      ]
    });
    
    console.log(`📊 Found ${products.length} products to rollback`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        console.log(`\n🔄 Processing: ${product.name} (${product._id})`);
        
        const updates = {};
        let hasUpdates = false;
        
        // Convert main image back to Base64
        if (product.image && product.image.startsWith('/uploads/products/original/')) {
          const base64Data = await fileToBase64(product.image);
          if (base64Data) {
            updates.image = base64Data;
            hasUpdates = true;
            console.log(`   ✅ Main image converted to Base64`);
          } else {
            console.log(`   ❌ Failed to convert main image`);
          }
        }
        
        // Convert additional images back to Base64
        if (product.images && Array.isArray(product.images)) {
          const newImages = [];
          let imageConverted = false;
          
          for (const img of product.images) {
            if (img && img.startsWith('/uploads/products/original/')) {
              const base64Data = await fileToBase64(img);
              if (base64Data) {
                newImages.push(base64Data);
                imageConverted = true;
                console.log(`   ✅ Additional image converted to Base64`);
              } else {
                newImages.push(img); // Keep original if conversion fails
                console.log(`   ❌ Failed to convert additional image`);
              }
            } else {
              newImages.push(img); // Keep non-file images as is
            }
          }
          
          if (imageConverted) {
            updates.images = newImages;
            hasUpdates = true;
          }
        }
        
        // Update database
        if (hasUpdates) {
          await Product.findByIdAndUpdate(product._id, updates);
          successCount++;
          console.log(`   ✅ Database updated successfully`);
        } else {
          console.log(`   ℹ️  No updates needed`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing ${product._id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Rollback complete!');
    console.log('====================');
    console.log(`Products processed: ${products.length}`);
    console.log(`Successful rollbacks: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Success rate: ${Math.round((successCount / products.length) * 100)}%`);
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

/**
 * Convert file to Base64
 */
async function fileToBase64(filePath) {
  try {
    // Remove leading slash and construct full path
    const relativePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fullPath = path.join(__dirname, '../../', relativePath);
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      console.log(`     File not found: ${fullPath}`);
      return null;
    }
    
    // Read file
    const fileBuffer = await fs.readFile(fullPath);
    
    // Determine MIME type from file extension
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'image/jpeg'; // default
    
    switch (ext) {
      case '.png':
        mimeType = 'image/png';
        break;
      case '.gif':
        mimeType = 'image/gif';
        break;
      case '.webp':
        mimeType = 'image/webp';
        break;
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
    }
    
    // Convert to Base64
    const base64String = fileBuffer.toString('base64');
    return `data:${mimeType};base64,${base64String}`;
    
  } catch (error) {
    console.error(`Error converting file to Base64: ${filePath}`, error.message);
    return null;
  }
}

// Run rollback
rollbackMigration();