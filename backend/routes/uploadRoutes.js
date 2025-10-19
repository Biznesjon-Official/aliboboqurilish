const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Test route to verify upload routes are working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Upload routes are working!', 
    timestamp: new Date().toISOString() 
  });
});

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = [
    'uploads/products/original',
    'uploads/products/thumbnail',  // 's' ni olib tashlash
    'uploads/products/medium',
    'uploads/products/large'
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✅ Directory created/verified: ${dir}`);
    } catch (err) {
      console.error(`❌ Error creating directory ${dir}:`, err);
    }
  }
};

// Initialize upload directories when module loads
ensureUploadDirs().then(() => {
  console.log('🎯 All upload directories initialized successfully');
}).catch(err => {
  console.error('❌ Failed to initialize upload directories:', err);
});

// Configure multer for memory storage (we'll process and save manually)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Faqat rasm fayllari qabul qilinadi'), false);
    }
    
    // Check file extension
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(ext)) {
      return cb(new Error('Qo\'llab-quvvatlanmaydigan fayl formati'), false);
    }
    
    cb(null, true);
  }
});

// Image processing and optimization
const processImage = async (buffer, filename) => {
  console.log('🎨 Starting image processing for:', filename);
  
  const baseFilename = path.parse(filename).name;
  const timestamp = Date.now();
  const uniqueId = uuidv4().split('-')[0];
  const baseName = `${baseFilename}_${timestamp}_${uniqueId}`;
  
  console.log('📝 Generated base name:', baseName);
  
  const sizes = {
    thumbnail: { width: 150, height: 150, quality: 80 },
    medium: { width: 400, height: 400, quality: 85 },
    large: { width: 800, height: 800, quality: 90 },
    original: { quality: 95 } // Keep original size but optimize
  };
  
  const results = {};
  
  for (const [sizeName, config] of Object.entries(sizes)) {
    try {
      console.log(`🔧 Processing size: ${sizeName}`);
      let processor = sharp(buffer);
      
      // Resize if dimensions specified
      if (config.width && config.height) {
        console.log(`📏 Resizing to: ${config.width}x${config.height}`);
        processor = processor.resize(config.width, config.height, {
          fit: 'cover',
          position: 'center'
        });
      }
      
      // Convert to WebP for better compression, fallback to JPEG
      const webpFilename = `${baseName}_${sizeName}.webp`;
      const jpegFilename = `${baseName}_${sizeName}.jpg`;
      
      // Papka nomini to'g'rilash (thumbnail emas, thumbnails)
      const folderName = sizeName === 'thumbnail' ? 'thumbnail' : sizeName;
      const webpPath = path.join('uploads', 'products', folderName, webpFilename);
      const jpegPath = path.join('uploads', 'products', folderName, jpegFilename);
      
      console.log(`💾 Saving to: ${webpPath}`);
      
      // Ensure directory exists before saving
      const webpDir = path.dirname(webpPath);
      const jpegDir = path.dirname(jpegPath);
      
      try {
        await fs.mkdir(webpDir, { recursive: true });
        await fs.mkdir(jpegDir, { recursive: true });
      } catch (dirErr) {
        console.error(`❌ Directory creation error for ${webpDir}:`, dirErr);
      }
      
      // Save WebP version
      await processor
        .webp({ quality: config.quality })
        .toFile(webpPath);
      
      // Save JPEG fallback
      await processor
        .jpeg({ quality: config.quality })
        .toFile(jpegPath);
      
      results[sizeName] = {
        webp: `/${webpPath.replace(/\\/g, '/')}`,
        jpeg: `/${jpegPath.replace(/\\/g, '/')}`
      };
      
    } catch (err) {
      console.error(`Error processing ${sizeName}:`, err);
      throw new Error(`Rasm qayta ishlanmadi: ${sizeName}`);
    }
  }
  
  return results;
};

// Single image upload endpoint
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    console.log('🔍 Upload endpoint hit');
    console.log('📁 Request file:', req.file ? 'EXISTS' : 'MISSING');
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({
        error: 'Rasm fayli topilmadi',
        message: 'Iltimos, rasm faylini tanlang'
      });
    }
    
    console.log('📸 Processing image:', req.file.originalname);
    console.log('📊 File size:', req.file.size);
    console.log('🎯 File mimetype:', req.file.mimetype);
    
    // Process and optimize image
    const processedImages = await processImage(req.file.buffer, req.file.originalname);
    
    // Return the medium size URL as the main image URL
    const imageUrl = processedImages.medium.webp;
    
    console.log('✅ Image processed successfully:', imageUrl);
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      sizes: processedImages,
      originalName: req.file.originalname,
      fileSize: req.file.size
    });
    
  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({
      error: 'Rasm yuklanmadi',
      message: error.message || 'Server xatoligi'
    });
  }
});

// Multiple images upload endpoint
router.post('/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'Rasm fayllari topilmadi',
        message: 'Iltimos, kamida bitta rasm faylini tanlang'
      });
    }
    
    console.log('📸 Processing multiple images:', req.files.length);
    
    const results = [];
    const errors = [];
    
    // Process each image
    for (const file of req.files) {
      try {
        const processedImages = await processImage(file.buffer, file.originalname);
        results.push({
          originalName: file.originalname,
          imageUrl: processedImages.medium.webp,
          sizes: processedImages,
          fileSize: file.size
        });
      } catch (err) {
        errors.push({
          filename: file.originalname,
          error: err.message
        });
      }
    }
    
    console.log('✅ Images processed:', results.length, 'errors:', errors.length);
    
    res.json({
      success: true,
      images: results,
      errors: errors,
      totalProcessed: results.length,
      totalErrors: errors.length
    });
    
  } catch (error) {
    console.error('❌ Multiple images upload error:', error);
    res.status(500).json({
      error: 'Rasmlar yuklanmadi',
      message: error.message || 'Server xatoligi'
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Fayl juda katta',
        message: 'Rasm hajmi 5MB dan oshmasin'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Juda ko\'p fayl',
        message: 'Bir vaqtda maksimal 10 ta rasm yuklash mumkin'
      });
    }
  }
  
  res.status(400).json({
    error: 'Fayl yuklash xatoligi',
    message: error.message || 'Noma\'lum xatolik'
  });
});

module.exports = router;