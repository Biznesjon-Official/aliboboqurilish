const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './backend/.env.development' });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

// MIME type detection
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'image/jpeg';
};

// Convert file to base64
const convertFileToBase64 = async (filePath) => {
  try {
    // Remove leading slash and construct full path
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fullPath = path.join(__dirname, '..', cleanPath);
    
    console.log(`    Reading file: ${fullPath}`);
    
    // Check if file exists
    await fs.access(fullPath);
    
    // Read file buffer
    const fileBuffer = await fs.readFile(fullPath);
    const mimeType = getMimeType(fullPath);
    const base64String = fileBuffer.toString('base64');
    
    console.log(`    ✅ File converted: ${Math.round(fileBuffer.length / 1024)}KB -> ${Math.round(base64String.length / 1024)}KB base64`);
    
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.log(`    ❌ File error: ${error.message}`);
    return null;
  }
};

// Process single product
const restoreProductImages = async (product) => {
  let hasChanges = false;
  let convertedCount = 0;
  let errorCount = 0;
  
  console.log(`\n🔄 Processing: ${product.name}`);
  console.log(`  ID: ${product._id}`);
  
  // Convert main image if it's a file path
  if (product.image && product.image.startsWith('/uploads/')) {
    console.log(`  📸 Converting main image...`);
    const base64Data = await convertFileToBase64(product.image);
    if (base64Data) {
      product.image = base64Data;
      hasChanges = true;
      convertedCount++;
      console.log(`  ✅ Main image converted to base64`);
    } else {
      errorCount++;
      console.log(`  ❌ Main image conversion failed`);
    }
  } else if (product.image && product.image.startsWith('data:image/')) {
    console.log(`  ✅ Main image already base64`);
  } else {
    console.log(`  ⚠️  Main image: ${product.image ? 'Unknown format' : 'None'}`);
  }
  
  // Convert images array
  if (product.images && product.images.length > 0) {
    console.log(`  📸 Converting ${product.images.length} images in array...`);
    const newImages = [];
    
    for (let i = 0; i < product.images.length; i++) {
      const imagePath = product.images[i];
      
      if (imagePath && imagePath.startsWith('/uploads/')) {
        console.log(`    [${i}] Converting file path...`);
        const base64Data = await convertFileToBase64(imagePath);
        if (base64Data) {
          newImages.push(base64Data);
          convertedCount++;
          console.log(`    [${i}] ✅ Converted to base64`);
        } else {
          errorCount++;
          console.log(`    [${i}] ❌ Conversion failed`);
        }
      } else if (imagePath && imagePath.startsWith('data:image/')) {
        newImages.push(imagePath);
        console.log(`    [${i}] ✅ Already base64`);
      } else if (imagePath) {
        console.log(`    [${i}] ⚠️  Unknown format: ${imagePath.substring(0, 50)}...`);
      }
    }
    
    // Update images array if there were changes
    if (newImages.length !== product.images.length || 
        newImages.some((img, idx) => img !== product.images[idx])) {
      product.images = newImages;
      hasChanges = true;
      console.log(`  🔄 Images array updated: ${newImages.length} images`);
    }
  } else {
    console.log(`  📷 No images in array`);
  }
  
  return { hasChanges, convertedCount, errorCount };
};

// Main migration function
async function restoreBase64Images() {
  let totalProcessed = 0;
  let totalConverted = 0;
  let totalErrors = 0;
  let totalUpdated = 0;
  
  try {
    console.log('🚀 Starting Base64 Image Restoration...');
    console.log('📡 Connecting to MongoDB...');
    
    await client.connect();
    const db = client.db('alibobo');
    const collection = db.collection('products');
    
    // Get total count
    const totalCount = await collection.countDocuments();
    console.log(`📊 Found ${totalCount} products to process`);
    
    // Process products in batches
    const batchSize = 10;
    let skip = 0;
    
    while (skip < totalCount) {
      console.log(`\n📦 Processing batch ${Math.floor(skip / batchSize) + 1}/${Math.ceil(totalCount / batchSize)}`);
      
      const products = await collection.find({})
        .skip(skip)
        .limit(batchSize)
        .toArray();
      
      for (const product of products) {
        const result = await restoreProductImages(product);
        totalProcessed++;
        totalConverted += result.convertedCount;
        totalErrors += result.errorCount;
        
        // Save changes if any
        if (result.hasChanges) {
          try {
            await collection.updateOne(
              { _id: product._id },
              { 
                $set: { 
                  image: product.image,
                  images: product.images 
                } 
              }
            );
            totalUpdated++;
            console.log(`  💾 Saved changes to database`);
          } catch (error) {
            console.log(`  ❌ Database save error: ${error.message}`);
            totalErrors++;
          }
        } else {
          console.log(`  ⏭️  No changes needed`);
        }
      }
      
      skip += batchSize;
      
      // Progress update
      console.log(`\n📈 Progress: ${totalProcessed}/${totalCount} products processed`);
    }
    
  } catch (error) {
    console.error('💥 Migration error:', error.message);
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
  
  // Final summary
  console.log('\n🎉 Base64 Restoration Complete!');
  console.log(`✅ Processed: ${totalProcessed} products`);
  console.log(`🔄 Updated: ${totalUpdated} products`);
  console.log(`📸 Converted: ${totalConverted} images`);
  console.log(`❌ Errors: ${totalErrors} images`);
  
  if (totalErrors > 0) {
    console.log('\n⚠️  Some images could not be converted. Check the logs above for details.');
  }
  
  if (totalConverted > 0) {
    console.log('\n🎊 Images successfully restored to base64 format!');
    console.log('🌐 You can now view products without 404 errors.');
  }
}

// Run the migration
if (require.main === module) {
  restoreBase64Images().catch(console.error);
}

module.exports = { restoreBase64Images, convertFileToBase64 };