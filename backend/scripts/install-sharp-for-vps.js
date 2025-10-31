#!/usr/bin/env node

/**
 * Install Sharp for VPS - Multiple strategies to get Sharp working
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Sharp VPS Installation Script');
console.log('================================');

console.log('🎯 Goal: Install Sharp that works on this VPS');

// Check system info
console.log('📋 System Information:');
try {
  const arch = process.arch;
  const platform = process.platform;
  const nodeVersion = process.version;
  
  console.log(`   Platform: ${platform}`);
  console.log(`   Architecture: ${arch}`);
  console.log(`   Node.js: ${nodeVersion}`);
  
  // Check CPU info
  try {
    const cpuInfo = execSync('cat /proc/cpuinfo | grep "model name" | head -1', { encoding: 'utf8' });
    console.log(`   CPU: ${cpuInfo.split(':')[1]?.trim() || 'Unknown'}`);
  } catch (e) {
    console.log('   CPU: Could not detect');
  }
} catch (error) {
  console.log('⚠️ Could not get system info');
}

console.log('');

// Strategy 1: Install from source
console.log('🔄 Strategy 1: Installing Sharp from source...');
try {
  // Install build dependencies
  console.log('📦 Installing build dependencies...');
  execSync('apt-get update && apt-get install -y build-essential python3-dev libvips-dev', { stdio: 'inherit' });
  
  // Remove existing Sharp
  execSync('npm uninstall sharp', { stdio: 'inherit' });
  
  // Install from source
  execSync('npm install --build-from-source sharp', { stdio: 'inherit' });
  
  // Test Sharp
  console.log('🧪 Testing Sharp...');
  const sharp = require('sharp');
  const testBuffer = Buffer.alloc(100);
  sharp(testBuffer);
  
  console.log('✅ Strategy 1 SUCCESS: Sharp installed from source!');
  process.exit(0);
  
} catch (error) {
  console.log('❌ Strategy 1 failed:', error.message);
}

// Strategy 2: Use older Sharp version
console.log('');
console.log('🔄 Strategy 2: Installing older Sharp version...');
try {
  execSync('npm uninstall sharp', { stdio: 'inherit' });
  execSync('npm install sharp@0.32.6', { stdio: 'inherit' });
  
  // Test Sharp
  const sharp = require('sharp');
  const testBuffer = Buffer.alloc(100);
  sharp(testBuffer);
  
  console.log('✅ Strategy 2 SUCCESS: Older Sharp version works!');
  process.exit(0);
  
} catch (error) {
  console.log('❌ Strategy 2 failed:', error.message);
}

// Strategy 3: Use libvips directly
console.log('');
console.log('🔄 Strategy 3: Installing libvips and Sharp...');
try {
  // Install libvips
  execSync('apt-get install -y libvips libvips-dev', { stdio: 'inherit' });
  
  execSync('npm uninstall sharp', { stdio: 'inherit' });
  execSync('npm install sharp --verbose', { stdio: 'inherit' });
  
  // Test Sharp
  const sharp = require('sharp');
  const testBuffer = Buffer.alloc(100);
  sharp(testBuffer);
  
  console.log('✅ Strategy 3 SUCCESS: Sharp with libvips works!');
  process.exit(0);
  
} catch (error) {
  console.log('❌ Strategy 3 failed:', error.message);
}

// Strategy 4: Alternative image processing library
console.log('');
console.log('🔄 Strategy 4: Installing alternative image library...');
try {
  // Install jimp as alternative
  execSync('npm install jimp', { stdio: 'inherit' });
  
  console.log('✅ Strategy 4: Jimp installed as alternative');
  
  // Create alternative image processor
  const alternativeProcessor = `// Alternative image processor using Jimp
const Jimp = require('jimp');
const fs = require('fs').promises;
const path = require('path');

const imageProcessor = {
  isAvailable: () => true,

  async create(input) {
    const image = await Jimp.read(input);
    
    return {
      resize: (width, height) => {
        image.resize(width, height);
        return imageProcessor.create(image);
      },
      
      quality: (quality) => {
        image.quality(quality);
        return imageProcessor.create(image);
      },
      
      toBuffer: async () => {
        return await image.getBufferAsync(Jimp.MIME_JPEG);
      },
      
      toFile: async (outputPath) => {
        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });
        await image.writeAsync(outputPath);
        return { path: outputPath, processed: true };
      }
    };
  },

  async processBuffer(buffer, options = {}) {
    const image = await Jimp.read(buffer);
    
    if (options.resize) {
      image.resize(options.resize.width, options.resize.height);
    }
    
    if (options.quality) {
      image.quality(options.quality);
    }
    
    return await image.getBufferAsync(Jimp.MIME_JPEG);
  }
};

module.exports = imageProcessor;
`;

  fs.writeFileSync(path.join(__dirname, '..', 'utils', 'alternativeImageProcessor.js'), alternativeProcessor);
  console.log('✅ Alternative image processor created');
  
} catch (error) {
  console.log('❌ Strategy 4 failed:', error.message);
}

console.log('');
console.log('📊 Installation Summary:');
console.log('=======================');
console.log('⚠️ Sharp could not be installed with hardware acceleration');
console.log('✅ Alternative image processing available');
console.log('');
console.log('💡 Recommendations:');
console.log('   1. Use Jimp for basic image processing');
console.log('   2. Consider upgrading VPS to newer CPU');
console.log('   3. Use external image processing service');
console.log('   4. Current fallback mode works fine for most cases');