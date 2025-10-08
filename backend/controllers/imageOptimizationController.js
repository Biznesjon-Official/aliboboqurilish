const Product = require('../models/Product');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Base64 rasmlarni fayl sifatida saqlash va optimallashtirish
const convertBase64ToFiles = async (req, res) => {
  try {
    console.log('🔄 Starting base64 to file conversion...');
    
    // Base64 rasmli mahsulotlarni topish
    const productsWithBase64 = await Product.find({
      $or: [
        { image: { $regex: '^data:image/' } },
        { images: { $elemMatch: { $regex: '^data:image/' } } }
      ]
    }).select('_id name image images').lean();

    console.log(`📊 Found ${productsWithBase64.length} products with base64 images`);

    let convertedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Uploads papkasini yaratish
    const uploadsDir = path.join(__dirname, '../../uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    for (const product of productsWithBase64) {
      try {
        let hasChanges = false;
        const updates = {};

        // Asosiy rasmni konvertatsiya qilish
        if (product.image && product.image.startsWith('data:image/')) {
          const convertedPath = await convertBase64ToFile(product.image, product._id, 'main');
          if (convertedPath) {
            updates.image = convertedPath;
            hasChanges = true;
          }
        }

        // Qo'shimcha rasmlarni konvertatsiya qilish
        if (Array.isArray(product.images)) {
          const convertedImages = [];
          for (let i = 0; i < product.images.length; i++) {
            const img = product.images[i];
            if (typeof img === 'string' && img.startsWith('data:image/')) {
              const convertedPath = await convertBase64ToFile(img, product._id, `gallery_${i}`);
              if (convertedPath) {
                convertedImages.push(convertedPath);
                hasChanges = true;
              } else {
                convertedImages.push(img); // Eski qiymatni saqlash
              }
            } else {
              convertedImages.push(img);
            }
          }
          if (hasChanges) {
            updates.images = convertedImages;
          }
        }

        // Mahsulotni yangilash
        if (hasChanges) {
          await Product.findByIdAndUpdate(product._id, updates);
          convertedCount++;
          console.log(`✅ Converted product: ${product.name} (${product._id})`);
        }

      } catch (error) {
        errorCount++;
        errors.push({
          productId: product._id,
          productName: product.name,
          error: error.message
        });
        console.error(`❌ Error converting product ${product._id}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: 'Base64 to file conversion completed',
      stats: {
        totalProducts: productsWithBase64.length,
        convertedProducts: convertedCount,
        errorCount,
        errors: errors.slice(0, 10) // Faqat birinchi 10 ta xatolikni ko'rsatish
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Base64 conversion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert base64 images',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Base64 ni faylga konvertatsiya qilish yordamchi funksiyasi
async function convertBase64ToFile(base64Data, productId, imageType) {
  try {
    // Base64 formatini tekshirish
    const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 format');
    }

    const imageExtension = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');

    // Fayl hajmini tekshirish (5MB limit)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      console.warn(`⚠️ Image too large (${Math.round(imageBuffer.length / 1024 / 1024)}MB), skipping`);
      return null;
    }

    // Fayl nomini yaratish
    const hash = crypto.createHash('md5').update(imageBuffer).digest('hex');
    const fileName = `${productId}_${imageType}_${hash}.${imageExtension}`;
    const filePath = path.join(__dirname, '../../uploads', fileName);

    // Faylni saqlash
    await fs.writeFile(filePath, imageBuffer);

    // Nisbiy yo'lni qaytarish
    return `/uploads/${fileName}`;

  } catch (error) {
    console.error('Error converting base64 to file:', error);
    return null;
  }
}

// Tashqi linklar uchun placeholder yaratish
const replaceExternalLinks = async (req, res) => {
  try {
    console.log('🔄 Starting external link replacement...');
    
    const blockedDomains = ['uzum.uz', 'ozon.ru', 'wildberries.ru', 'aliexpress.com'];
    const query = {
      $or: [
        { image: { $regex: blockedDomains.map(d => `https?://[^/]*${d}`).join('|') } },
        { images: { $elemMatch: { $regex: blockedDomains.map(d => `https?://[^/]*${d}`).join('|') } } }
      ]
    };

    const productsWithExternalLinks = await Product.find(query)
      .select('_id name image images')
      .lean();

    console.log(`📊 Found ${productsWithExternalLinks.length} products with external links`);

    let replacedCount = 0;
    const defaultImage = '/assets/default-product.svg';

    for (const product of productsWithExternalLinks) {
      try {
        let hasChanges = false;
        const updates = {};

        // Asosiy rasmni tekshirish
        if (product.image && blockedDomains.some(domain => product.image.includes(domain))) {
          updates.image = defaultImage;
          hasChanges = true;
        }

        // Qo'shimcha rasmlarni tekshirish
        if (Array.isArray(product.images)) {
          const filteredImages = product.images.filter(img => 
            !blockedDomains.some(domain => img.includes(domain))
          );
          
          if (filteredImages.length !== product.images.length) {
            updates.images = filteredImages;
            hasChanges = true;
          }
        }

        // Mahsulotni yangilash
        if (hasChanges) {
          await Product.findByIdAndUpdate(product._id, updates);
          replacedCount++;
          console.log(`✅ Replaced external links for: ${product.name} (${product._id})`);
        }

      } catch (error) {
        console.error(`❌ Error replacing links for product ${product._id}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: 'External link replacement completed',
      stats: {
        totalProducts: productsWithExternalLinks.length,
        replacedProducts: replacedCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ External link replacement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to replace external links',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Rasm hajmlarini tekshirish
const analyzeImageSizes = async (req, res) => {
  try {
    console.log('🔍 Analyzing image sizes...');

    const products = await Product.find({})
      .select('_id name image images')
      .lean();

    const analysis = {
      totalProducts: products.length,
      base64Images: 0,
      externalImages: 0,
      localImages: 0,
      largeBase64Images: 0,
      blockedDomains: 0,
      averageBase64Size: 0,
      largestBase64Size: 0
    };

    let totalBase64Size = 0;
    const blockedDomains = ['uzum.uz', 'ozon.ru', 'wildberries.ru', 'aliexpress.com'];

    for (const product of products) {
      // Asosiy rasmni tekshirish
      if (product.image) {
        if (product.image.startsWith('data:image/')) {
          analysis.base64Images++;
          const size = product.image.length;
          totalBase64Size += size;
          if (size > analysis.largestBase64Size) {
            analysis.largestBase64Size = size;
          }
          if (size > 100000) { // 100KB dan katta
            analysis.largeBase64Images++;
          }
        } else if (product.image.startsWith('http')) {
          if (blockedDomains.some(domain => product.image.includes(domain))) {
            analysis.blockedDomains++;
          } else {
            analysis.externalImages++;
          }
        } else {
          analysis.localImages++;
        }
      }

      // Qo'shimcha rasmlarni tekshirish
      if (Array.isArray(product.images)) {
        for (const img of product.images) {
          if (typeof img === 'string') {
            if (img.startsWith('data:image/')) {
              analysis.base64Images++;
              const size = img.length;
              totalBase64Size += size;
              if (size > analysis.largestBase64Size) {
                analysis.largestBase64Size = size;
              }
              if (size > 100000) {
                analysis.largeBase64Images++;
              }
            } else if (img.startsWith('http')) {
              if (blockedDomains.some(domain => img.includes(domain))) {
                analysis.blockedDomains++;
              } else {
                analysis.externalImages++;
              }
            } else {
              analysis.localImages++;
            }
          }
        }
      }
    }

    if (analysis.base64Images > 0) {
      analysis.averageBase64Size = Math.round(totalBase64Size / analysis.base64Images);
    }

    // Hajmlarni KB/MB formatida ko'rsatish
    analysis.averageBase64SizeKB = Math.round(analysis.averageBase64Size / 1024);
    analysis.largestBase64SizeKB = Math.round(analysis.largestBase64Size / 1024);
    analysis.totalBase64SizeMB = Math.round(totalBase64Size / 1024 / 1024);

    res.json({
      success: true,
      analysis,
      recommendations: {
        convertBase64: analysis.base64Images > 0 ? 'Convert base64 images to files for better performance' : null,
        replaceExternal: analysis.blockedDomains > 0 ? 'Replace blocked external domain images' : null,
        optimizeLarge: analysis.largeBase64Images > 0 ? `${analysis.largeBase64Images} large base64 images need optimization` : null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Image analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze images',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  convertBase64ToFiles,
  replaceExternalLinks,
  analyzeImageSizes
};