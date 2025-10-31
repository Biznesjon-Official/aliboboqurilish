// Sharp.js fallback utility for CPU compatibility issues
const fs = require('fs').promises;
const path = require('path');

let sharp = null;
let sharpAvailable = false;

// Try to load Sharp, fallback to no-op if it fails
try {
  sharp = require('sharp');
  // Test if Sharp actually works by creating a simple instance
  const testBuffer = Buffer.from('test');
  sharp(testBuffer);
  sharpAvailable = true;
  console.log('✅ Sharp.js loaded and tested successfully');
} catch (error) {
  console.warn('⚠️ Sharp.js not available or incompatible:', error.message);
  if (error.message.includes('linux-x64') || error.message.includes('microarchitecture')) {
    console.log('🔧 CPU architecture incompatibility detected - using fallback mode');
  }
  console.log('🔄 Using fallback image handling (no optimization)');
  sharpAvailable = false;
  sharp = null; // Ensure it's null
}

// Fallback image processor that just copies files without optimization
const fallbackProcessor = {
  async processImage(buffer, outputPath, options = {}) {
    // Just save the original buffer without processing
    await fs.writeFile(outputPath, buffer);
    return { path: outputPath, processed: false };
  },

  async resize(buffer, width, height, options = {}) {
    // Return original buffer (no resizing)
    return buffer;
  },

  async optimize(buffer, quality = 80) {
    // Return original buffer (no optimization)
    return buffer;
  },

  async toWebP(buffer, quality = 80) {
    // Return original buffer (can't convert to WebP)
    return buffer;
  }
};

// Sharp wrapper with fallback
const sharpWrapper = {
  isAvailable: () => sharpAvailable,

  // Create a processor instance
  create(input) {
    if (sharpAvailable && sharp) {
      return sharp(input);
    }
    
    // Return fallback processor
    return {
      resize: (width, height, options = {}) => {
        console.log(`⚠️ Resize requested but Sharp unavailable: ${width}x${height}`);
        return sharpWrapper.create(input);
      },
      
      webp: (options = {}) => {
        console.log('⚠️ WebP conversion requested but Sharp unavailable');
        return sharpWrapper.create(input);
      },
      
      jpeg: (options = {}) => {
        console.log('⚠️ JPEG optimization requested but Sharp unavailable');
        return sharpWrapper.create(input);
      },
      
      png: (options = {}) => {
        console.log('⚠️ PNG optimization requested but Sharp unavailable');
        return sharpWrapper.create(input);
      },
      
      toBuffer: async () => {
        console.log('⚠️ Image processing skipped - returning original');
        return input;
      },
      
      toFile: async (outputPath) => {
        console.log('⚠️ Image processing skipped - saving original to:', outputPath);
        
        // Ensure directory exists
        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });
        
        // Save original buffer
        await fs.writeFile(outputPath, input);
        return { path: outputPath, processed: false };
      }
    };
  },

  // Direct methods for backward compatibility
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
    
    // Fallback: return original buffer
    console.log('⚠️ Image processing skipped - Sharp unavailable');
    return buffer;
  }
};

module.exports = sharpWrapper;
