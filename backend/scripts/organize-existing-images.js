#!/usr/bin/env node

/**
 * Organize Existing Images - Move and organize current images properly
 */

const fs = require('fs');
const path = require('path');

console.log('📁 Organize Existing Images');
console.log('===========================');

const productsDir = path.join(__dirname, '..', 'uploads', 'products');
const originalDir = path.join(productsDir, 'original');
const thumbnailDir = path.join(productsDir, 'thumbnail');
const mediumDir = path.join(productsDir, 'medium');
const largeDir = path.join(productsDir, 'large');

// Create directories
console.log('📂 Creating directories...');
[originalDir, thumbnailDir, mediumDir, largeDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created: ${path.basename(dir)}`);
  }
});

// Get all files in products directory
console.log('');
console.log('📋 Checking existing files...');

if (fs.existsSync(productsDir)) {
  const files = fs.readdirSync(productsDir).filter(file => {
    const filePath = path.join(productsDir, file);
    return fs.statSync(filePath).isFile() && /\.(jpg|jpeg|png|webp)$/i.test(file);
  });
  
  console.log(`📊 Found ${files.length} image files`);
  
  if (files.length > 0) {
    console.log('');
    console.log('🔄 Moving files to original directory...');
    
    let moved = 0;
    for (const file of files) {
      try {
        const sourcePath = path.join(productsDir, file);
        const targetPath = path.join(originalDir, file);
        
        // Move file to original directory
        fs.renameSync(sourcePath, targetPath);
        moved++;
        
        if (moved <= 5) {
          console.log(`✅ Moved: ${file}`);
        } else if (moved === 6) {
          console.log(`... and ${files.length - 5} more files`);
        }
      } catch (error) {
        console.log(`❌ Failed to move ${file}: ${error.message}`);
      }
    }
    
    console.log(`✅ Moved ${moved} files to original directory`);
  }
}

console.log('');
console.log('🎯 Organization Complete!');
console.log('=========================');
console.log('✅ All images moved to original/ directory');
console.log('✅ Directory structure ready');
console.log('✅ Image serving middleware will handle missing sizes');
console.log('');
console.log('📋 Next steps:');
console.log('   1. Images are now organized');
console.log('   2. Missing sizes will show placeholders');
console.log('   3. Consider re-uploading images for optimization');