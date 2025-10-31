#!/bin/bash

# Deployment script for image display fix
echo "🚀 Deploying image display fix..."

# 1. Build frontend with production environment
echo "📦 Building frontend..."
npm run build

# 2. Copy build files to server (if needed)
echo "📁 Build completed"

# 3. Restart backend server
echo "🔄 Restarting backend server..."
cd backend
npm restart || (echo "⚠️ npm restart failed, trying pm2..." && pm2 restart alibobo-backend)

# 4. Clear nginx cache (if applicable)
echo "🧹 Clearing nginx cache..."
sudo nginx -s reload || echo "⚠️ nginx reload failed"

echo "✅ Deployment completed!"
echo ""
echo "🔍 To test the fix:"
echo "1. Open browser developer tools"
echo "2. Go to Network tab"
echo "3. Visit https://aliboboqurilish.uz"
echo "4. Check image requests - they should use relative URLs like /uploads/..."
echo "5. Check console for debug messages"
echo ""
echo "🐛 If images still don't load:"
echo "1. Check nginx error logs: sudo tail -f /var/log/nginx/error.log"
echo "2. Check backend logs: cd backend && npm logs"
echo "3. Test direct image URL: curl -I https://aliboboqurilish.uz/uploads/products/original/[filename]"