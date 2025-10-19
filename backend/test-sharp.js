const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

console.log('Testing Sharp package...');

// Test if sharp is working
try {
  console.log('Sharp version:', sharp.version);
  console.log('Sharp formats:', sharp.format);
  console.log('✅ Sharp package loaded successfully');
} catch (error) {
  console.error('❌ Sharp package error:', error);
}

// Test directory creation
const testDir = 'uploads/products/test';
try {
  fs.mkdirSync(testDir, { recursive: true });
  console.log('✅ Directory creation works');
  fs.rmdirSync(testDir);
} catch (error) {
  console.error('❌ Directory creation error:', error);
}
