const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Product schema
const productSchema = new mongoose.Schema({
  name: String,
  image: String,
  images: [String]
}, { collection: 'products' });

const Product = mongoose.model('Product', productSchema);

async function showBase64Products() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find products with base64 images
    const withBase64 = await Product.find({
      $or: [
        { image: { $regex: '^data:image/' } },
        { images: { $elemMatch: { $regex: '^data:image/' } } }
      ]
    }).limit(5);
    
    console.log(`\n📱 Found ${withBase64.length} products with base64 images:`);
    
    withBase64.forEach((product, index) => {
      console.log(`\n=== Product ${index + 1}: ${product.name} ===`);
      console.log(`ID: ${product._id}`);
      
      if (product.image && product.image.startsWith('data:image/')) {
        console.log(`Main image: BASE64 (${product.image.length} chars)`);
      } else {
        console.log(`Main image: ${product.image || 'None'}`);
      }
      
      if (product.images && product.images.length > 0) {
        console.log(`Images array: ${product.images.length} items`);
        product.images.forEach((img, imgIndex) => {
          if (img && img.startsWith('data:image/')) {
            console.log(`  [${imgIndex}]: BASE64 (${img.length} chars)`);
          } else {
            console.log(`  [${imgIndex}]: ${img || 'Empty'}`);
          }
        });
      }
    });
    
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

showBase64Products();