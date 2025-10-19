const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Simple file storage without Sharp processing
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/products/medium';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Faqat rasm fayllari qabul qilinadi'), false);
    }
    cb(null, true);
  }
});

// Simple image upload endpoint
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    console.log('🔍 Simple upload endpoint hit');
    console.log('📁 Request file:', req.file ? 'EXISTS' : 'MISSING');
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({
        error: 'Rasm fayli topilmadi',
        message: 'Iltimos, rasm faylini tanlang'
      });
    }
    
    console.log('📸 File saved:', req.file.filename);
    console.log('📊 File size:', req.file.size);
    console.log('📍 File path:', req.file.path);
    
    // Return the file URL
    const imageUrl = `/uploads/products/medium/${req.file.filename}`;
    
    console.log('✅ Image uploaded successfully:', imageUrl);
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      filename: req.file.filename
    });
    
  } catch (error) {
    console.error('❌ Simple upload error:', error);
    res.status(500).json({
      error: 'Rasm yuklanmadi',
      message: error.message || 'Server xatoligi'
    });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Simple upload routes are working!', 
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;
