// Direct database test to check base64 images
require('dotenv').config({ path: './.env.development' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function testDirectDB() {
  try {
    console.log('🔍 Direct database test for base64 images...\n');

    await client.connect();
    const db = client.db('alibobo');
    const collection = db.collection('products');

    // Get one product with images
    const product = await collection.findOne({
      $and: [
        { $or: [{ status: 'active' }, { status: { $exists: false } }] },
        { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] },
        { $or: [
          { image: { $regex: '^data:image/' } },
          { images: { $elemMatch: { $regex: '^data:image/' } } }
        ]}
      ]
    });

    if (product) {
      console.log(`📦 Product: ${product.name}`);
      console.log(`   ID: ${product._id}`);
      
      if (product.image) {
        const isBase64 = product.image.startsWith('data:image/');
        console.log(`   Main image: ${isBase64 ? `BASE64 (${Math.round(product.image.length/1024)}KB)` : 'FILE_PATH'}`);
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

      console.log('\n✅ Base64 images found in database!');
    } else {
      console.log('❌ No products with base64 images found');
    }

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await client.close();
  }
}

testDirectDB();