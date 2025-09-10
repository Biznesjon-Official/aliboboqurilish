#!/usr/bin/env node

/**
 * Direct MongoDB script to fix base64 images
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment configuration
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });

// Product schema (simplified)
const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema);

// Helper function to save base64 image as file
const saveBase64Image = async (base64Data, productId, imageName) => {
  try {
    // Validate base64 format
    const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 image format');
    }
    
    const imageType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');
    
    // Check if image data is too small (likely incomplete)
    if (imageBuffer.length < 100) {
      throw new Error('Image data too small, likely incomplete');
    }
    
    // Generate filename
    const timestamp = Date.now();
    const filename = `${productId}_${imageName}_${timestamp}.${imageType}`;
    const uploadsDir = path.join(__dirname, '../uploads/products');
    const filePath = path.join(uploadsDir, filename);
    
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Save file
    fs.writeFileSync(filePath, imageBuffer);
    
    // Return relative path for database
    return `/uploads/products/${filename}`;
    
  } catch (error) {
    console.error('Error saving base64 image:', error);
    throw error;
  }
};

async function fixBase64Images() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MongoDB URI is missing');
    }
    
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    // Find products with base64 images
    console.log('🔍 Finding products with base64 images...');
    const productsWithBase64 = await Product.find({
      $or: [
        { image: { $regex: '^data:image/' } },
        { images: { $elemMatch: { $regex: '^data:image/' } } }
      ]
    }); // Process all at once
    
    console.log(`📊 Found ${productsWithBase64.length} products with base64 images`);
    
    let convertedCount = 0;
    let errorCount = 0;
    
    for (const product of productsWithBase64) {
      try {
        console.log(`\n🔄 Processing: ${product.name}`);
        let hasChanges = false;
        
        // Convert main image (also check if it's an old file path that needs updating)
        if (product.image && (product.image.startsWith('data:image/') || product.image.includes('_main_175699'))) {
          try {
            if (product.image.startsWith('data:image/')) {
              console.log('  Converting main image...');
              const convertedPath = await saveBase64Image(product.image, product._id, 'main');
              product.image = convertedPath;
              hasChanges = true;
              console.log(`  ✅ Main image: ${convertedPath}`);
            } else {
              // Update old file path to new format
              console.log('  Updating main image path...');
              const timestamp = Date.now();
              const newPath = `/uploads/products/${product._id}_main_${timestamp}.jpeg`;
              product.image = newPath;
              hasChanges = true;
              console.log(`  ✅ Main image updated: ${newPath}`);
            }
          } catch (error) {
            console.log(`  ❌ Main image failed: ${error.message}`);
            product.image = null; // Remove invalid base64
            hasChanges = true;
          }
        }
        
        // Convert images array
        if (product.images && product.images.length > 0) {
          const convertedImages = [];
          for (let i = 0; i < product.images.length; i++) {
            const imageData = product.images[i];
            if (imageData && imageData.startsWith('data:image/')) {
              try {
                console.log(`  Converting image ${i}...`);
                const convertedPath = await saveBase64Image(imageData, product._id, `image_${i}`);
                convertedImages.push(convertedPath);
                console.log(`  ✅ Image ${i}: ${convertedPath}`);
              } catch (error) {
                console.log(`  ❌ Image ${i} failed: ${error.message}`);
                // Skip invalid images
              }
            } else if (imageData && !imageData.startsWith('data:')) {
              // Keep existing file paths
              convertedImages.push(imageData);
            }
          }
          
          if (convertedImages.length !== product.images.length || convertedImages.some((img, i) => img !== product.images[i])) {
            product.images = convertedImages;
            hasChanges = true;
          }
        }
        
        // Save changes
        if (hasChanges) {
          await product.save();
          convertedCount++;
          console.log(`  ✅ Saved changes`);
        } else {
          console.log(`  ℹ️ No changes needed`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${product.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Conversion complete!`);
    console.log(`✅ Converted: ${convertedCount} products`);
    console.log(`❌ Errors: ${errorCount} products`);
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
    process.exit(1);
  }
}

// Run the script
fixBase64Images();