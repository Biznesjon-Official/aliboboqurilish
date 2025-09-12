const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.development') });

async function checkMigratedImages() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/alibobo';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find products that should have migrated images
    const products = await Product.find({
      $or: [
        { image: { $regex: '^/uploads/products/original/' } },
        { images: { $elemMatch: { $regex: '^/uploads/products/original/' } } }
      ]
    }).limit(10).select('name image images');
    
    console.log(`\n📊 Products with migrated images: ${products.length}`);
    console.log('================================================');
    
    products.forEach(p => {
      console.log(`\n🔍 ${p.name}:`);
      console.log(`   Main image: ${p.image || 'None'}`);
      if (p.images && p.images.length > 0) {
        console.log(`   Additional images: ${p.images.length}`);
        p.images.forEach((img, i) => {
          console.log(`     [${i}]: ${img}`);
        });
      }
    });
    
    // Also check total count
    const totalWithImages = await Product.countDocuments({
      $or: [
        { image: { $regex: '^/uploads/products/original/' } },
        { images: { $elemMatch: { $regex: '^/uploads/products/original/' } } }
      ]
    });
    
    console.log(`\n📈 Total products with migrated images: ${totalWithImages}`);
    
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMigratedImages();