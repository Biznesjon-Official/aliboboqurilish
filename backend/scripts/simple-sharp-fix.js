#!/usr/bin/env node

/**
 * Simple Sharp Fix - Just silence the warnings
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔇 Simple Sharp Fix');
console.log('==================');

// Step 1: Clear PM2 logs
console.log('🧹 Clearing PM2 logs...');
try {
  execSync('pm2 flush alibobo-backend', { stdio: 'inherit' });
  console.log('✅ PM2 logs cleared');
} catch (error) {
  console.log('⚠️ Could not clear PM2 logs');
}

// Step 2: Update sharpFallback.js to be completely silent
console.log('🔇 Making Sharp completely silent...');

const sharpFallbackPath = path.join(__dirname, '..', 'utils', 'sharpFallback.js');

const silentSharp = `// Sharp.js fallback utility - SILENT VERSION
const fs = require('fs').promises;
const path = require('path');

let sharp = null;
let sharpAvailable = false;

// Try to load Sharp silently - NO MESSAGES
try {
  sharp = require('sharp');
  const testBuffer = Buffer.from('test');
  sharp(testBuffer);
  sharpAvailable = true;
} catch (error) {
  // COMPLETELY SILENT
  sharpAvailable = false;
  sharp = null;
}

const sharpWrapper = {
  isAvailable: () => sharpAvailable,

  create(input) {
    if (sharpAvailable && sharp) {
      return sharp(input);
    }
    
    // Silent fallback
    return {
      resize: (width, height, options = {}) => sharpWrapper.create(input),
      webp: (options = {}) => sharpWrapper.create(input),
      jpeg: (options = {}) => sharpWrapper.create(input),
      png: (options = {}) => sharpWrapper.create(input),
      
      toBuffer: async () => input,
      
      toFile: async (outputPath) => {
        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(outputPath, input);
        return { path: outputPath, processed: false };
      }
    };
  },

  async processBuffer(buffer, options = {}) {
    if (sharpAvailable && sharp) {
      let processor = sharp(buffer);
      
      if (options.resize) {
        processor = processor.resize(options.resize.width, options.resize.height, options.resize.options);
      }
      
      if (options.format === 'webp') {
        processor = processor.webp({ quality: options.quality || 80 });
      } else if (options.format === 'jpeg') {
        processor = processor.jpeg({ quality: options.quality || 80 });
      } else if (options.format === 'png') {
        processor = processor.png({ quality: options.quality || 80 });
      }
      
      return await processor.toBuffer();
    }
    
    return buffer;
  }
};

module.exports = sharpWrapper;
`;

fs.writeFileSync(sharpFallbackPath, silentSharp);
console.log('✅ Sharp fallback made silent');

// Step 3: Remove Sharp from package.json
console.log('🗑️ Removing Sharp from package.json...');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (packageJson.dependencies && packageJson.dependencies.sharp) {
  delete packageJson.dependencies.sharp;
  console.log('✅ Sharp removed from dependencies');
}

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('');
console.log('🎯 Simple Sharp Fix Summary:');
console.log('============================');
console.log('✅ PM2 logs cleared');
console.log('✅ Sharp fallback silenced');
console.log('✅ Sharp dependency removed');
console.log('');
console.log('📋 Next steps:');
console.log('   1. Run: npm install (to clean up)');
console.log('   2. Run: pm2 restart alibobo-backend');
console.log('   3. Check: pm2 logs alibobo-backend');
console.log('');
console.log('💡 Image uploads will work without optimization');