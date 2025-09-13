const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './backend/config.env' });

async function checkImagesInDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('alibobo');
    
    console.log('🔍 Checking images in database...');
    
    // Count total products
    const total = await db.collection('products').countDocuments();
    console.log(`📊 Total products: ${total}`);
    
    // Find products with images
    const withImages = await db.collection('products').find({
      $or: [
        { image: { $exists: true, $ne: null, $ne: '', $ne: '/assets/default-product.svg' } },
        { images: { $exists: true, $ne: [], $ne: null } }
      ]
    }).limit(5).toArray();
    
    console.log(`📸 Products with images: ${withImages.length}`);
    
    if (withImages.length > 0) {
      console.log('\n🖼️ Sample products with images:');
      withImages.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Image: ${product.image || 'None'}`);
        if (product.images && product.images.length > 0) {
          console.log(`   Images array: ${product.images.length} items`);
        }
      });
    }
    
    // Find products with base64 images
    const withBase64 = await db.collection('products').find({
      $or: [
        { image: { $regex: '^data:image/' } },
        { images: { $elemMatch: { $regex: '^data:image/' } } }
      ]
    }).limit(3).toArray();
    
    console.log(`\n📱 Products with base64 images: ${withBase64.length}`);
    
    // Find products with file path images
    const withFilePaths = await db.collection('products').find({
      $or: [
        { image: { $regex: '^/uploads/' } },
        { images: { $elemMatch: { $regex: '^/uploads/' } } }
      ]
    }).limit(3).toArray();
    
    console.log(`📁 Products with file path images: ${withFilePaths.length}`);
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkImagesInDB();