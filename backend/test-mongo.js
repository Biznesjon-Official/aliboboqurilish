const { MongoClient } = require('mongodb');

// MongoDB Atlas URI from config.env
const uri = 'mongodb+srv://ozodbek:BRyeesHkkHRGyudh@cluster0.dlopces.mongodb.net/alibobo?retryWrites=true&w=majority&appName=Cluster0';

console.log('🔍 Testing MongoDB Atlas connection...');
console.log('📍 URI:', uri.replace(/:[^@]*@/, ':****@'));

const client = new MongoClient(uri);

async function testConnection() {
  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test database access
    const db = client.db('alibobo');
    console.log('📊 Database name:', db.databaseName);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections found:', collections.length);
    collections.forEach(col => console.log('  -', col.name));
    
    // Test a simple query on products collection
    const products = db.collection('products');
    const productCount = await products.countDocuments();
    console.log('📦 Products count:', productCount);
    
    // Test craftsmen collection
    const craftsmen = db.collection('craftsmen');
    const craftsmenCount = await craftsmen.countDocuments();
    console.log('👷 Craftsmen count:', craftsmenCount);
    
    console.log('🎉 MongoDB Atlas connection test completed successfully!');
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:');
    console.error('Error:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.codeName) console.error('Code Name:', error.codeName);
  } finally {
    await client.close();
    console.log('🔒 Connection closed');
  }
}

testConnection();
