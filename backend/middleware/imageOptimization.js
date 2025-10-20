const sharpWrapper = require('../utils/sharpFallback');
const path = require('path');
const fs = require('fs').promises;

// Rasm optimallashtirish middleware
const imageOptimization = (options = {}) => {
  const {
    quality = 80,
    enableWebP = true,
    enableResize = true,
    maxWidth = 1920,
    maxHeight = 1920
  } = options;

  return async (req, res, next) => {
    try {
      const filePath = path.join(__dirname, '../../uploads', req.path);
      
      // Fayl mavjudligini tekshirish
      try {
        await fs.access(filePath);
      } catch {
        return next(); // Fayl topilmasa, keyingi middleware ga o'tish
      }

      // Faqat rasm fayllarini qayta ishlash
      const ext = path.extname(req.path).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        return next();
      }

      // WebP formatini qo'llab-quvvatlashni tekshirish
      const acceptsWebP = req.headers.accept && req.headers.accept.includes('image/webp');
      
      // Query parametrlarini olish
      const width = parseInt(req.query.w) || null;
      const height = parseInt(req.query.h) || null;
      const requestedQuality = parseInt(req.query.q) || quality;

      // Kesh fayl nomini yaratish
      const cacheKey = `${req.path}_${width || 'auto'}_${height || 'auto'}_${requestedQuality}_${acceptsWebP ? 'webp' : ext}`;
      const cacheDir = path.join(__dirname, '../../uploads/.cache');
      const cachePath = path.join(cacheDir, cacheKey.replace(/[^a-zA-Z0-9._-]/g, '_'));

      // Kesh papkasini yaratish
      try {
        await fs.mkdir(cacheDir, { recursive: true });
      } catch {}

      // Keshdan qaytarish
      try {
        await fs.access(cachePath);
        const stats = await fs.stat(cachePath);
        
        // Kesh 7 kun davomida amal qiladi
        if (Date.now() - stats.mtime.getTime() < 7 * 24 * 60 * 60 * 1000) {
          res.setHeader('Content-Type', acceptsWebP ? 'image/webp' : `image/${ext.slice(1)}`);
          res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 yil
          res.setHeader('X-Image-Cache', 'HIT');
          
          // CORS headers qo'shish
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          
          return res.sendFile(cachePath);
        }
      } catch {}

      // Rasmni qayta ishlash
      let pipeline = sharpWrapper.create(filePath);

      // O'lchamni o'zgartirish
      if (enableResize && (width || height)) {
        const resizeWidth = width && width <= maxWidth ? width : null;
        const resizeHeight = height && height <= maxHeight ? height : null;
        
        pipeline = pipeline.resize(resizeWidth, resizeHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Format va sifatni o'rnatish
      if (acceptsWebP && enableWebP) {
        pipeline = pipeline.webp({ quality: Math.min(requestedQuality, 90) });
      } else if (ext === '.jpg' || ext === '.jpeg') {
        pipeline = pipeline.jpeg({ quality: Math.min(requestedQuality, 90) });
      } else if (ext === '.png') {
        pipeline = pipeline.png({ quality: Math.min(requestedQuality, 90) });
      }

      // Optimallashtirilgan rasmni yaratish
      const optimizedBuffer = await pipeline.toBuffer();

      // Keshga saqlash
      try {
        await fs.writeFile(cachePath, optimizedBuffer);
      } catch (error) {
        console.warn('Keshga saqlashda xatolik:', error.message);
      }

      // Javobni yuborish
      res.setHeader('Content-Type', acceptsWebP ? 'image/webp' : `image/${ext.slice(1)}`);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 yil
      res.setHeader('X-Image-Cache', 'MISS');
      
      // CORS headers qo'shish
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      
      res.send(optimizedBuffer);

    } catch (error) {
      console.error('Rasm optimallashtirish xatoligi:', error);
      next(); // Xatolik bo'lsa, asl faylni qaytarish
    }
  };
};

module.exports = imageOptimization;