// Image serving middleware - handles missing images gracefully
const fs = require('fs');
const path = require('path');

const imageServingMiddleware = (req, res, next) => {
    // Debug: Log all image requests
    if (req.path.startsWith('/uploads/products/')) {
        console.log(`🖼️ Image request: ${req.path}`);
        
        let filePath = path.join(__dirname, '..', req.path);

        // If file doesn't exist, try to find alternative
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ Missing image: ${req.path}`);
            
            // Try to find ANY image as fallback
            const originalDir = path.join(__dirname, '..', 'uploads', 'products', 'original');
            
            if (fs.existsSync(originalDir)) {
                const originalFiles = fs.readdirSync(originalDir).filter(file => 
                    /\.(jpg|jpeg|png|webp|gif)$/i.test(file)
                );
                
                if (originalFiles.length > 0) {
                    // For now, serve the first available image as fallback
                    const fallbackFile = originalFiles[0];
                    const fallbackPath = path.join(originalDir, fallbackFile);
                    
                    console.log(`🔄 Serving fallback image: ${fallbackFile}`);
                    
                    const ext = path.extname(fallbackFile).toLowerCase();
                    let contentType = 'image/jpeg';
                    if (ext === '.png') contentType = 'image/png';
                    else if (ext === '.webp') contentType = 'image/webp';
                    else if (ext === '.gif') contentType = 'image/gif';
                    
                    res.setHeader('Content-Type', contentType);
                    res.setHeader('Cache-Control', 'public, max-age=3600');
                    return res.sendFile(fallbackPath);
                }
            }
            
            // Serve placeholder
            console.log(`📋 Serving placeholder for: ${req.path}`);
            const placeholder = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f8f9fa"/>
          <text x="50%" y="45%" text-anchor="middle" font-family="Arial" font-size="16" fill="#6c757d">
            Rasm yuklanmoqda...
          </text>
          <text x="50%" y="60%" text-anchor="middle" font-family="Arial" font-size="12" fill="#adb5bd">
            Image not available
          </text>
        </svg>`;

            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=300');
            return res.send(placeholder);
        } else {
            console.log(`✅ File exists: ${req.path}`);
        }
    }

    next();
};

module.exports = imageServingMiddleware;