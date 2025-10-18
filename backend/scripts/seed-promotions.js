const mongoose = require('mongoose');
const path = require('path');

// Load environment configuration
if (process.env.NODE_ENV === 'development') {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });
} else {
  require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });
}

const Promotion = require('../models/Promotion');

// Sodda aksiyalar - faqat rasm, badge va maqsad URL
const samplePromotions = [
  {
    title: "Qurilish Materiallari",
    backgroundImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=400&fit=crop",
    badge: "CHEGIRMA",
    priority: 10,
    targetUrl: "/products?category=qurilish-materiallari",
    isActive: true
  },
  {
    title: "Elektr Asboblari",
    backgroundImage: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=400&fit=crop",
    badge: "YANGI",
    priority: 9,
    targetUrl: "/products?category=elektr-asboblari",
    isActive: true
  },
  {
    title: "Uy-ro'zg'or Buyumlari",
    backgroundImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=400&fit=crop",
    badge: "ISSIQ",
    priority: 8,
    targetUrl: "/products?category=uy-rozgor",
    isActive: true
  },
  {
    title: "Sport Mahsulotlari",
    backgroundImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop",
    badge: "TOP",
    priority: 7,
    targetUrl: "/products?category=sport",
    isActive: true
  },
  {
    title: "Elektronika",
    backgroundImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=400&fit=crop",
    badge: "CHEKLANGAN",
    priority: 6,
    targetUrl: "/products?category=electronics",
    isActive: true
  }
];

const seedPromotions = async () => {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      console.error('❌ MongoDB URI is missing. Expected MONGODB_URI or MONGO_URI in environment.');
      return process.exit(1);
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing promotions
    await Promotion.deleteMany({});
    console.log('🗑️ Cleared existing promotions');

    // Insert sample promotions
    const insertedPromotions = await Promotion.insertMany(samplePromotions);
    console.log(`✅ Inserted ${insertedPromotions.length} sample promotions`);

    // Display inserted promotions
    console.log('\n📋 Inserted Promotions:');
    insertedPromotions.forEach((promo, index) => {
      console.log(`${index + 1}. ${promo.title} - ${promo.badge} (Priority: ${promo.priority})`);
    });

    console.log('\n🎉 Promotion seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding promotions:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
};

// Run the seeding function
if (require.main === module) {
  seedPromotions();
}

module.exports = { seedPromotions, samplePromotions };