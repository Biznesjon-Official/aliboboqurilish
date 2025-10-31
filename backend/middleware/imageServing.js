// Image serving middleware - handles missing images gracefully
const fs = require('fs');
const path = require('path');

const imageServingMiddleware = (req, res, next) => {
    // Check if this is an image request
    if (req.path.startsWith('/uploads/products/')) {
        let filePath = path.join(__dirname, '..', req.path);

        // If file doesn't exist, try to find alternative
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ Missing image: ${req.path}`);
            
            // Try to find original image if this is a converted request
            let foundAlternative = false;
            
            if (req.path.includes('converted-')) {
                // Extract the original ID from converted filename
                const fileName = path.basename(req.path);
                const convertedMatch = fileName.match(/converted-([a-f0-9]+)-/);
                
                if (convertedMatch) {
                    const originalId = convertedMatch[1];
                    const originalDir = path.join(__dirname, '..', 'uploads', 'products', 'original');
                    
                    // Look for any file with this ID in original directory
                    if (fs.existsSync(originalDir)) {
                        const originalFiles = fs.readdirSync(originalDir);
                        const matchingFile = originalFiles.find(file => file.includes(originalId));
                        
                        if (matchingFile) {
                            const originalPath = path.join(originalDir, matchingFile);
                            console.log(`✅ Found original: ${matchingFile}`);
                            
                            // Serve the original image
                            const ext = path.extname(matchingFile).toLowerCase();
                            let contentType = 'image/jpeg';
                            if (ext === '.png') contentType = 'image/png';
                            else if (ext === '.webp') contentType = 'image/webp';
                            else if (ext === '.gif') contentType = 'image/gif';
                            
                            res.setHeader('Content-Type', contentType);
                            res.setHeader('Cache-Control', 'public, max-age=86400');
                            return res.sendFile(originalPath);
                        }
                    }
                }
            }
            
            // If no alternative found, serve placeholder
            if (!foundAlternative) {
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
    }

    next();
};

module.exports = imageServingMiddleware;