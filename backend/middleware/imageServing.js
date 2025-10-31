// Image serving middleware - handles missing images gracefully
const fs = require('fs');
const path = require('path');

const imageServingMiddleware = (req, res, next) => {
    // Check if this is an image request
    if (req.path.startsWith('/uploads/products/')) {
        const filePath = path.join(__dirname, '..', req.path);

        // If file doesn't exist, serve default image
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ Missing image: ${req.path}`);

            // Serve default product image
            const defaultImagePath = path.join(__dirname, '..', '..', 'public', 'assets', 'default-product.svg');

            if (fs.existsSync(defaultImagePath)) {
                res.setHeader('Content-Type', 'image/svg+xml');
                res.setHeader('Cache-Control', 'public, max-age=3600');
                return res.sendFile(defaultImagePath);
            } else {
                // Create a simple SVG placeholder on the fly
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
            }
        }
    }

    next();
};

module.exports = imageServingMiddleware;