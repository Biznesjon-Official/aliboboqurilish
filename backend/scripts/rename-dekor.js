require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function renameDekor() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Rename dekorativ-mahsulotlar → dekor
    const result = await Product.updateMany(
      { category: 'dekorativ-mahsulotlar' },
      { $set: { category: 'dekor' } }
    );

    console.log(`✅ Renamed "dekorativ-mahsulotlar" → "dekor" (${result.modifiedCount} products)`);

    // Show all categories
    const categories = await Product.distinct('category');
    console.log('\n📊 All categories:', categories);

    // Show counts
    console.log('\n📈 Category counts:');
    for (const cat of categories) {
      const count = await Product.countDocuments({ category: cat });
      console.log(`  - ${cat}: ${count} products`);
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

renameDekor();
