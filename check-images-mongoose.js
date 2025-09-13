const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Product schema
const productSchema = new mongoose.Schema({
  name: String,
  image: String,
  images: [String]
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);

async function checkImagesInDB() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Count total products
    const total = await Product.countDocuments();
    console.log(`📊 Total products: ${total}`);
    
    // Find products with images (not default)
    const withImages = await Product.find({
      $or: [
        { image: { $exists: true, $ne: null, $ne: '', $ne: '/assets/default-product.svg' } },
        { images: { $exists: true, $ne: [], $ne: null } }
      ]
    }).limit(5);
    
    console.log(`📸 Products with real images: ${withImages.length}`);
    
    if (withImages.length > 0) {
      console.log('\n🖼️ Sample products with images:');
      withImages.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Image: ${product.image || 'None'}`);
        if (product.images && product.images.length > 0) {
          console.log(`   Images array: ${product.images.length} items`);
          console.log(`   First image: ${product.images[0].substring(0, 80)}...`);
        }
      });
    }
    
    // Find products with base64 images
    const withBase64 = await Product.find({
      $or: [
        { image: { $regex: '^data:image/' } },
        { images: { $elemMatch: { $regex: '^data:image/' } } }
      ]
    }).limit(3);
    
    console.log(`\n📱 Products with base64 images: ${withBase64.length}`);
    
    // Find products with file path images
    const withFilePaths = await Product.find({
      $or: [
        { image: { $regex: '^/uploads/' } },
        { images: { $elemMatch: { $regex: '^/uploads/' } } }
      ]
    }).limit(3);
    
    console.log(`📁 Products with file path images: ${withFilePaths.length}`);
    
    // Check for default images
    const withDefaults = await Product.countDocuments({
      image: '/assets/default-product.svg'
    });
    
    console.log(`🖼️ Products with default image: ${withDefaults}`);
    
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkImagesInDB();