const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Product = require('../models/Product');

const router = express.Router();

console.log('🔧 Image conversion routes loaded successfully');

// Multer konfiguratsiyasi
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/products');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `converted-${uniqueSuffix}.jpg`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Faqat rasm fayllari qabul qilinadi'), false);
    }
  }
});

// Base64 ni fayl formatiga konvertatsiya qilish
router.post('/convert-base64', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Rasm fayli topilmadi' });
    }

    const { productId, imageIndex } = req.body;
    const imageUrl = `/uploads/products/${req.file.filename}`;

    // Mahsulotni yangilash (agar productId berilgan bo'lsa)
    if (productId) {
      const product = await Product.findById(productId);
      if (product) {
        if (imageIndex && product.images && Array.isArray(product.images)) {
          // Massivdagi ma'lum indeksdagi rasmni yangilash
          product.images[parseInt(imageIndex)] = imageUrl;
        } else {
          // Asosiy rasmni yangilash
          product.image = imageUrl;
          if (!product.images) product.images = [];
          product.images[0] = imageUrl;
        }
        await product.save();
      }
    }

    res.json({
      success: true,
      imageUrl,
      message: 'Rasm muvaffaqiyatli konvertatsiya qilindi'
    });
  } catch (error) {
    console.error('Base64 konvertatsiya xatoligi:', error);
    res.status(500).json({ 
      error: 'Konvertatsiya amalga oshmadi',
      details: error.message 
    });
  }
});

// Barcha mahsulotlardagi base64 rasmlarni konvertatsiya qilish
router.post('/convert-all-base64', async (req, res) => {
  try {
    console.log('🔄 Barcha base64 rasmlarni konvertatsiya qilish boshlandi...');
    
    // Base64 rasmli mahsulotlarni topish
    const products = await Product.find({
      $or: [
        { image: { $regex: '^data:image/' } },
        { images: { $elemMatch: { $regex: '^data:image/' } } }
      ]
    });

    console.log(`📊 ${products.length} ta mahsulotda base64 rasmlar topildi`);

    let convertedCount = 0;
    let errorCount = 0;
    const results = [];

    for (const product of products) {
      try {
        let updated = false;

        // Asosiy rasmni konvertatsiya qilish
        if (product.image && product.image.startsWith('data:image/')) {
          const convertedUrl = await convertBase64ToFile(product.image, product._id, 'main');
          if (convertedUrl) {
            product.image = convertedUrl;
            updated = true;
            convertedCount++;
          }
        }

        // Qo'shimcha rasmlarni konvertatsiya qilish
        if (product.images && Array.isArray(product.images)) {
          for (let i = 0; i < product.images.length; i++) {
            if (product.images[i] && product.images[i].startsWith('data:image/')) {
              const convertedUrl = await convertBase64ToFile(product.images[i], product._id, i);
              if (convertedUrl) {
                product.images[i] = convertedUrl;
                updated = true;
                convertedCount++;
              }
            }
          }
        }

        // Mahsulotni saqlash
        if (updated) {
          await product.save();
          results.push({
            productId: product._id,
            productName: product.name,
            status: 'success',
            convertedImages: convertedCount
          });
        }
      } catch (error) {
        console.error(`❌ Mahsulot ${product._id} konvertatsiya xatoligi:`, error);
        errorCount++;
        results.push({
          productId: product._id,
          productName: product.name,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`✅ Konvertatsiya yakunlandi: ${convertedCount} ta rasm, ${errorCount} ta xatolik`);

    res.json({
      success: true,
      message: `${convertedCount} ta rasm muvaffaqiyatli konvertatsiya qilindi`,
      totalProducts: products.length,
      convertedImages: convertedCount,
      errors: errorCount,
      results
    });
  } catch (error) {
    console.error('❌ Barcha rasmlarni konvertatsiya qilishda xatolik:', error);
    res.status(500).json({ 
      error: 'Konvertatsiya amalga oshmadi',
      details: error.message 
    });
  }
});

// Base64 rasmlarni tahlil qilish
router.get('/analyze-base64', async (req, res) => {
  try {
    console.log('🔍 Base64 rasmlarni tahlil qilish...');
    
    // Base64 rasmli mahsulotlarni topish
    const products = await Product.find({
      $or: [
        { image: { $regex: '^data:image/' } },
        { images: { $elemMatch: { $regex: '^data:image/' } } }
      ]
    }).select('name image images');

    let totalBase64Images = 0;
    let totalSize = 0;
    const analysis = [];

    for (const product of products) {
      let productBase64Count = 0;
      let productSize = 0;

      // Asosiy rasmni tekshirish
      if (product.image && product.image.startsWith('data:image/')) {
        productBase64Count++;
        totalBase64Images++;
        const size = calculateBase64Size(product.image);
        productSize += size;
        totalSize += size;
      }

      // Qo'shimcha rasmlarni tekshirish
      if (product.images && Array.isArray(product.images)) {
        for (const img of product.images) {
          if (img && img.startsWith('data:image/')) {
            productBase64Count++;
            totalBase64Images++;
            const size = calculateBase64Size(img);
            productSize += size;
            totalSize += size;
          }
        }
      }

      if (productBase64Count > 0) {
        analysis.push({
          productId: product._id,
          productName: product.name,
          base64Images: productBase64Count,
          totalSize: formatFileSize(productSize)
        });
      }
    }

    res.json({
      success: true,
      summary: {
        totalProducts: products.length,
        totalBase64Images,
        totalSize: formatFileSize(totalSize),
        averageSize: totalBase64Images > 0 ? formatFileSize(totalSize / totalBase64Images) : '0 Bytes'
      },
      products: analysis
    });
  } catch (error) {
    console.error('❌ Base64 tahlil xatoligi:', error);
    res.status(500).json({ 
      error: 'Tahlil amalga oshmadi',
      details: error.message 
    });
  }
});

// Yordamchi funksiyalar
async function convertBase64ToFile(base64String, productId, imageIndex) {
  try {
    // Base64 dan buffer yaratish
    const base64Data = base64String.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Fayl nomini yaratish
    const filename = `converted-${productId}-${imageIndex}-${Date.now()}.jpg`;
    const filepath = path.join(__dirname, '../uploads/products', filename);
    
    // Faylni saqlash
    await fs.writeFile(filepath, buffer);
    
    return `/uploads/products/${filename}`;
  } catch (error) {
    console.error('Base64 fayl konvertatsiya xatoligi:', error);
    return null;
  }
}

function calculateBase64Size(base64String) {
  if (!base64String || !base64String.includes(',')) return 0;
  const base64Data = base64String.split(',')[1];
  return Math.round((base64Data.length * 3) / 4);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;