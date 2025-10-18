require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');
const Product = require('../models/Product');

// MongoDB connection from .env
const MONGODB_URI = process.env.MONGODB_URI;

async function normalizeCategories() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all unique categories
    const categories = await Product.distinct('category');
    console.log('\n📊 Current categories:', categories);

    // Normalize each category to lowercase and fix naming
    const categoryMapping = {
      'dekorativ': 'dekorativ-mahsulotlar',
      'yevro remont': 'yevro-remont',
      'hammasi': null, // Remove this category
    };

    for (const category of categories) {
      if (!category) continue;
      
      let normalized = category.toLowerCase();
      
      // Apply custom mapping
      if (categoryMapping[normalized] !== undefined) {
        if (categoryMapping[normalized] === null) {
          // Delete products with this category
          const result = await Product.deleteMany({ category: category });
          console.log(`🗑️ Deleted "${category}" (${result.deletedCount} products)`);
          continue;
        } else {
          normalized = categoryMapping[normalized];
        }
      }
      
      if (category !== normalized) {
        const result = await Product.updateMany(
          { category: category },
          { $set: { category: normalized } }
        );
        
        console.log(`✅ Updated "${category}" → "${normalized}" (${result.modifiedCount} products)`);
      } else {
        const count = await Product.countDocuments({ category: category });
        console.log(`✓ "${category}" already correct (${count} products)`);
      }
    }

    // Get updated categories
    const updatedCategories = await Product.distinct('category');
    console.log('\n📊 Updated categories:', updatedCategories);

    // Show counts
    console.log('\n📈 Category counts:');
    for (const cat of updatedCategories) {
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

normalizeCategories();
