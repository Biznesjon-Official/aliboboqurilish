#!/usr/bin/env node

/**
 * Create MongoDB indexes for the Craftsman collection to speed common queries
 */

const mongoose = require('mongoose');
const path = require('path');

// Load development env by default if none is loaded
try {
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });
  }
} catch (_) {}

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGODB_URI) {
  console.error('❌ Missing MONGODB_URI/MONGO_URI');
  process.exit(1);
}

async function main() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected');

    const db = mongoose.connection.db;
    const collection = db.collection('craftsmen');

    console.log('\n📊 Current indexes:');
    const existing = await collection.indexes();
    existing.forEach(idx => console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}`));

    const byKey = (idx) => JSON.stringify(idx.key);
    const ensureIndex = async (keys, options = {}) => {
      const keyStr = JSON.stringify(keys);
      const exists = existing.find(i => byKey(i) === keyStr);
      if (exists) {
        console.log(`ℹ️  Index with same key already exists, skipping: ${options.name || keyStr}`);
        return;
      }
      try {
        await collection.createIndex(keys, { background: true, ...options });
        console.log(`✅ Created index: ${options.name || keyStr}`);
      } catch (e) {
        const msg = e?.message || '';
        if (e.code === 85 || /IndexOptionsConflict/i.test(msg) || /already exists with a different name/i.test(msg)) {
          console.log(`⚠️  Index conflict for ${options.name || keyStr}, skipping (existing index retained).`);
          return;
        }
        if (/already exists/i.test(msg)) {
          console.log(`ℹ️  Index already exists for ${options.name || keyStr}, skipping.`);
          return;
        }
        throw e;
      }
    };

    console.log('\n🔧 Creating indexes for common queries...');

    // Filter by status and sort by joinDate (descending)
    await ensureIndex({ status: 1, joinDate: -1 }, { name: 'status_joinDate_desc' });

    // Basic field indexes (if missing)
    await ensureIndex({ status: 1 }, { name: 'status_only' });
    await ensureIndex({ createdAt: 1 }, { name: 'createdAt_asc' });
    await ensureIndex({ updatedAt: 1 }, { name: 'updatedAt_asc' });

    console.log('\n📋 Final indexes:');
    const final = await collection.indexes();
    final.forEach(idx => console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}`));

    console.log('\n✅ Craftsman indexes created successfully!');
  } catch (err) {
    console.error('❌ Error creating craftsman indexes:', err?.message || err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  main();
}
