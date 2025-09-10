// Load environment variables
require('dotenv').config({ path: './backend/.env.development' });

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function findBase64Product() {
  try {
    console.log('🔍 Finding product with base64 images...\n');

    await client.connect();
    const db = client.db('alibobo');
    const collection = db.collection('products');

    // Find product with base64 image
    const product = await collection.findOne({
      $or: [
        { image: { $regex: '^data:image/' } },
        { images: { $elemMatch: { $regex: '^data:image/' } } }
      ]
    });

    if (product) {
      console.log(`📦 Product: ${product.name}`);
      console.log(`   ID: ${product._id}`);
      
      if (product.image) {
        const isBase64 = product.image.startsWith('data:image/');
        console.log(`   Main image: ${isBase64 ? `BASE64 (${Math.round(product.image.length/1024)}KB)` : 'FILE_PATH'}`);
        if (isBase64) {
          console.log(`   Preview: ${product.image.substring(0, 100)}...`);
        }
      } else {
        console.log(`   Main image: null`);
      }

      if (product.images && product.images.length > 0) {
        console.log(`   Images array: ${product.images.length} items`);
        product.images.forEach((img, idx) => {
          if (img) {
            const isBase64 = img.startsWith('data:image/');
            console.log(`     [${idx}]: ${isBase64 ? `BASE64 (${Math.round(img.length/1024)}KB)` : 'FILE_PATH'}`);
          }
        });
      } else {
        console.log(`   Images array: empty`);
      }

      console.log('\n✅ Base64 product found!');
      
      // Test API call for this specific product
      console.log('\n🔍 Testing API for this product...');
      const productId = product._id;
      
      try {
        const response = await fetch(`http://localhost:5000/api/products/${productId}`);
        const apiProduct = await response.json();
        
        console.log(`API Response:`);
        console.log(`   Name: ${apiProduct.name}`);
        console.log(`   Main image: ${apiProduct.image || 'null'}`);
        console.log(`   Images array: ${apiProduct.images?.length || 0} items`);
        
      } catch (apiError) {
        console.log(`❌ API Error: ${apiError.message}`);
      }
      
    } else {
      console.log('❌ No products with base64 images found');
    }

  } catch (error) {
    console.error('❌ Search failed:', error.message);
  } finally {
    await client.close();
  }
}

findBase64Product();