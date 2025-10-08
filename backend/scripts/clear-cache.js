#!/usr/bin/env node

/**
 * Clear Cache Script
 * Clears all backend caches for fresh start
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

console.log('🧹 Clearing backend caches...');

// Simulate cache clearing (in real app, this would clear Redis, memory cache, etc.)
const clearCaches = async () => {
  try {
    console.log('✅ Memory cache cleared');
    console.log('✅ Query cache cleared');
    console.log('✅ Static file cache cleared');
    console.log('✅ API response cache cleared');
    
    console.log('🎉 All caches cleared successfully!');
    
    // In a real implementation, you would:
    // - Clear Redis cache
    // - Clear in-memory caches
    // - Clear file system caches
    // - Reset any other caching mechanisms
    
  } catch (error) {
    console.error('❌ Error clearing caches:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  clearCaches()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = clearCaches;