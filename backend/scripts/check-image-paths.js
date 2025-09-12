const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.development') });

async function checkImages() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/alibobo';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const products = await Product.find({}).limit(5).select('name image images');
    
    console.log('\n📊 Sample products:');
    console.log('==================');
    
    products.forEach(p => {
      console.log(`\n🔍 ${p.name}:`);
      console.log(`   Main image: ${p.image ? p.image.substring(0, 100) : 'None'}`);
      if (p.images && p.images.length > 0) {
        console.log(`   Additional images: ${p.images.length}`);
        p.images.forEach((img, i) => {
          console.log(`     [${i}]: ${img ? img.substring(0, 100) : 'None'}`);
        });
      }
    });
    
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkImages();