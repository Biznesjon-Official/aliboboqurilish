#!/usr/bin/env node

/**
 * Fix Missing Images - Restore and fix image paths
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🖼️ Missing Images Fix Script');
console.log('============================');

console.log('🎯 Goal: Fix missing product images and paths');

// Step 1: Check uploads directory structure
console.log('📁 Step 1: Checking uploads directory...');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
const requiredDirs = ['original', 'thumbnail', 'medium', 'large'];

for (const dir of requiredDirs) {
    const dirPath = path.join(uploadsDir, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    } else {
        const files = fs.readdirSync(dirPath);
        console.log(`📂 ${dir}: ${files.length} files`);
    }
}

// Step 2: Check for missing converted images
console.log('');
console.log('🔍 Step 2: Checking for converted images...');

const originalDir = path.join(uploadsDir, 'original');
if (fs.existsSync(originalDir)) {
    const originalFiles = fs.readdirSync(originalDir);
    console.log(`📋 Found ${originalFiles.length} original files`);

    // Check if converted versions exist
    for (const file of originalFiles) {
        const baseName = path.parse(file).name;
        const convertedName = `converted-${baseName}`;

        // Check in other directories
        for (const sizeDir of ['thumbnail', 'medium', 'large']) {
            const convertedPath = path.join(uploadsDir, sizeDir, `${convertedName}.jpg`);
            const webpPath = path.join(uploadsDir, sizeDir, `${convertedName}.webp`);

            if (!fs.existsSync(convertedPath) && !fs.existsSync(webpPath)) {
                console.log(`⚠️ Missing: ${sizeDir}/${convertedName}`);
            }
        }
    }
}

// Step 3: Create default/placeholder images
console.log('');
console.log('🎨 Step 3: Creating placeholder images...');

const createPlaceholder = async (width, height, outputPath) => {
    try {
        // Create a simple colored rectangle as placeholder
        const canvas = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="14" fill="#999">
        Rasm yuklanmoqda...
      </text>
    </svg>`;

        await fs.promises.writeFile(outputPath, canvas);
        console.log(`✅ Created placeholder: ${path.basename(outputPath)}`);
    } catch (error) {
        console.log(`❌ Failed to create placeholder: ${error.message}`);
    }
};

// Create default placeholders for each size
const placeholders = [
    { dir: 'thumbnail', width: 150, height: 150 },
    { dir: 'medium', width: 400, height: 400 },
    { dir: 'large', width: 800, height: 600 }
];

for (const { dir, width, height } of placeholders) {
    const placeholderPath = path.join(uploadsDir, dir, 'default-placeholder.svg');
    if (!fs.existsSync(placeholderPath)) {
        await createPlaceholder(width, height, placeholderPath);
    }
}

// Step 4: Create image serving middleware fix
console.log('');
console.log('🔧 Step 4: Creating image serving fix...');

const imageServingFix = `// Image serving middleware - handles missing images
const fs = require('fs');
const path = require('path');

const imageServingMiddleware = (req, res, next) => {
  // Check if this is an image request
  if (req.path.startsWith('/uploads/products/')) {
    const filePath = path.join(__dirname, '..', req.path);
    
    // If file doesn't exist, serve placeholder
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Missing image: ${ req.path } `);
      
      // Determine size from path
      let placeholderSize = 'medium';
      if (req.path.includes('/thumbnail/')) placeholderSize = 'thumbnail';
      else if (req.path.includes('/large/')) placeholderSize = 'large';
      
      const placeholderPath = path.join(__dirname, '..', 'uploads', 'products', placeholderSize, 'default-placeholder.svg');
      
      if (fs.existsSync(placeholderPath)) {
        res.setHeader('Content-Type', 'image/svg+xml');
        return res.sendFile(placeholderPath);
      }
    }
  }
  
  next();
};

module.exports = imageServingMiddleware;
`;

const middlewarePath = path.join(__dirname, '..', 'middleware', 'imageServing.js');
await fs.promises.writeFile(middlewarePath, imageServingFix);
console.log('✅ Image serving middleware created');

// Step 5: Update server.js to use the middleware
console.log('');
console.log('📝 Step 5: Instructions for server.js update...');

console.log('');
console.log('🎯 Missing Images Fix Summary:');
console.log('==============================');
console.log('✅ Upload directories verified');
console.log('✅ Placeholder images created');
console.log('✅ Image serving middleware created');
console.log('');
console.log('📋 Manual steps needed:');
console.log('   1. Add to server.js BEFORE static files:');
console.log('      const imageServing = require("./middleware/imageServing");');
console.log('      app.use(imageServing);');
console.log('');
console.log('   2. Restart backend: pm2 restart alibobo-backend');
console.log('');
console.log('   3. Re-upload missing product images via admin panel');
console.log('');
console.log('💡 Placeholders will show until real images are uploaded');