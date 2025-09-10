const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: './backend/.env.development' });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function checkCurrentState() {
  try {
    console.log('🔍 Checking current database state...');
    await client.connect();
    const db = client.db('alibobo');
    
    // Get first 5 products
    const products = await db.collection('products').find({}).limit(5).toArray();
    
    console.log(`\n📊 Found ${products.length} products to check:`);
    
    products.forEach((product, index) => {
      console.log(`\n=== Product ${index + 1}: ${product.name} ===`);
      console.log(`ID: ${product._id}`);
      
      // Check main image
      if (product.image) {
        const isBase64 = product.image.startsWith('data:image/');
        const isFilePath = product.image.startsWith('/uploads/');
        console.log(`Main image: ${isBase64 ? 'BASE64' : isFilePath ? 'FILE_PATH' : 'OTHER'}`);
        console.log(`  Value: ${product.image.substring(0, 80)}...`);
      } else {
        console.log(`Main image: NONE`);
      }
      
      // Check images array
      if (product.images && product.images.length > 0) {
        console.log(`Images array: ${product.images.length} items`);
        product.images.forEach((img, imgIndex) => {
          if (img) {
            const isBase64 = img.startsWith('data:image/');
            const isFilePath = img.startsWith('/uploads/');
            console.log(`  [${imgIndex}]: ${isBase64 ? 'BASE64' : isFilePath ? 'FILE_PATH' : 'OTHER'}`);
          }
        });
      } else {
        console.log(`Images array: EMPTY`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkCurrentState();