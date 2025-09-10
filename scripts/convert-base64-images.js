#!/usr/bin/env node

/**
 * Script to convert base64 images in the database to file paths
 * This fixes the "BSONObjectTooLarge" error caused by base64 image data
 */

const http = require('http');

async function convertBase64Images() {
  try {
    console.log('🔄 Starting base64 image conversion...');
    
    const result = await makeRequest();
    
    if (!result) {
      throw new Error('No response from server');
    }
    
    console.log('✅ Conversion completed!');
    console.log(`📊 Total found: ${result.totalFound}`);
    console.log(`✅ Converted: ${result.converted}`);
    console.log(`❌ Errors: ${result.errors}`);
    
    if (result.results && result.results.length > 0) {
      console.log('\n📋 Detailed results:');
      result.results.forEach((item, index) => {
        if (item.errors && item.errors.length > 0) {
          console.log(`❌ ${item.name}: ${item.errors.join(', ')}`);
        } else {
          console.log(`✅ ${item.name}: Converted successfully`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error converting base64 images:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Make sure the backend server is running on port 5000');
      console.log('   Run: npm run dev:backend-only');
    }
    
    process.exit(1);
  }
}

// Run the conversion
convertBase64Images();