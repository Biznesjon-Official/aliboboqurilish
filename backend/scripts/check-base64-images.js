const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.development') });

async function checkBase64Images() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/alibobo';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find products that have Base64 images
    const products = await Product.find({
      $or: [
        { image: { $regex: '^data:image/' } },
        { images: { $elemMatch: { $regex: '^data:image/' } } }
      ]
    }).limit(10).select('name image images');
    
    console.log(`\n📊 Products with Base64 images: ${products.length}`);
    console.log('===============================================');
    
    products.forEach(p => {
      console.log(`\n🔍 ${p.name}:`);
      if (p.image && p.image.startsWith('data:image/')) {
        console.log(`   Main image: Base64 (${p.image.length} chars)`);
      } else {
        console.log(`   Main image: ${p.image || 'None'}`);
      }
      
      if (p.images && p.images.length > 0) {
        console.log(`   Additional images: ${p.images.length}`);
        p.images.forEach((img, i) => {
          if (img && img.startsWith('data:image/')) {
            console.log(`     [${i}]: Base64 (${img.length} chars)`);
          } else {
            console.log(`     [${i}]: ${img || 'None'}`);
          }
        });
      }
    });
    
    // Also check total count
    const totalWithBase64 = await Product.countDocuments({
      $or: [
        { image: { $regex: '^data:image/' } },
        { images: { $elemMatch: { $regex: '^data:image/' } } }
      ]
    });
    
    console.log(`\n📈 Total products with Base64 images: ${totalWithBase64}`);
    
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkBase64Images();