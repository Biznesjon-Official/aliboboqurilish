#!/usr/bin/env node

/**
 * Simple Image Fix - Just create directories and restart
 */

const fs = require('fs');
const path = require('path');

console.log('🖼️ Simple Image Fix');
console.log('==================');

// Create upload directories
const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
const dirs = ['original', 'thumbnail', 'medium', 'large'];

console.log('📁 Creating upload directories...');

for (const dir of dirs) {
    const dirPath = path.join(uploadsDir, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created: ${dir}`);
    } else {
        console.log(`✅ Exists: ${dir}`);
    }
}

console.log('');
console.log('🎯 Simple Image Fix Complete!');
console.log('=============================');
console.log('✅ All upload directories ready');
console.log('✅ Image serving middleware already added');
console.log('');
console.log('📋 Next steps:');
console.log('   1. Restart: pm2 restart alibobo-backend');
console.log('   2. Missing images will show placeholders');
console.log('   3. Re-upload images via admin panel');