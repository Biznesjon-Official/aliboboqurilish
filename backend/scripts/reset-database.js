#!/usr/bin/env node

/**
 * Reset Database Script
 * WARNING: This will delete all data and recreate indexes
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/alibobo';

console.log('⚠️  WARNING: This will delete ALL data in the database!');
console.log('🔗 Connecting to:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

const resetDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections`);

    // Drop all collections
    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
      console.log(`🗑️  Dropped collection: ${collection.name}`);
    }

    console.log('✅ All collections dropped');

    // Recreate indexes (this will be done automatically when models are used)
    console.log('🔄 Database reset complete');
    console.log('📝 Indexes will be recreated automatically when the application starts');

  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askConfirmation = () => {
  return new Promise((resolve) => {
    rl.question('Are you sure you want to reset the database? Type "yes" to confirm: ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
};

// Run if called directly
if (require.main === module) {
  askConfirmation()
    .then(confirmed => {
      if (confirmed) {
        return resetDatabase();
      } else {
        console.log('❌ Database reset cancelled');
        process.exit(0);
      }
    })
    .then(() => {
      console.log('🎉 Database reset completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = resetDatabase;