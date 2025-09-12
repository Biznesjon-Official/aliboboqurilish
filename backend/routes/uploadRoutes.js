const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/products/original';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Faqat rasm fayllari ruxsat etilgan (JPEG, JPG, PNG, GIF, WebP)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// POST /api/upload/variant-images - Upload variant images
router.post('/variant-images', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Hech qanday fayl yuklanmadi' 
      });
    }

    // Generate URLs for uploaded files
    const imageUrls = req.files.map(file => {
      return `/uploads/products/original/${file.filename}`;
    });

    console.log('✅ Variant images uploaded:', imageUrls);
    
    res.json({
      success: true,
      message: 'Rasmlar muvaffaqiyatli yuklandi',
      images: imageUrls
    });
  } catch (error) {
    console.error('❌ Upload variant images error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Rasmlarni yuklashda xatolik',
      error: error.message 
    });
  }
});

// POST /api/upload/product-image - Upload single product image
router.post('/product-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Hech qanday fayl yuklanmadi' 
      });
    }

    const imageUrl = `/uploads/products/original/${req.file.filename}`;

    console.log('✅ Product image uploaded:', imageUrl);
    
    res.json({
      success: true,
      message: 'Rasm muvaffaqiyatli yuklandi',
      image: imageUrl
    });
  } catch (error) {
    console.error('❌ Upload product image error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Rasmni yuklashda xatolik',
      error: error.message 
    });
  }
});

// DELETE /api/upload/image/:filename - Delete image
router.delete('/image/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/products/original', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false,
        message: 'Fayl topilmadi' 
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    console.log('✅ Image deleted:', filename);
    
    res.json({
      success: true,
      message: 'Rasm muvaffaqiyatli o\'chirildi'
    });
  } catch (error) {
    console.error('❌ Delete image error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Rasmni o\'chirishda xatolik',
      error: error.message 
    });
  }
});

module.exports = router;