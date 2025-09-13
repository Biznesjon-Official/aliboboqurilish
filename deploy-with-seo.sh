#!/bin/bash

echo "🚀 Deploying Alibobo with Professional SEO..."

# Step 1: Build the project
echo "📦 Building React project..."
npm run build

# Step 2: Upload updated files
echo "📤 Uploading SEO-optimized files..."

# Upload updated public files
scp public/index.html root@aliboboqurilish.uz:/opt/alibobo/public/
scp public/manifest.json root@aliboboqurilish.uz:/opt/alibobo/public/
scp public/robots.txt root@aliboboqurilish.uz:/opt/alibobo/public/
scp public/sitemap.xml root@aliboboqurilish.uz:/opt/alibobo/public/
scp public/browserconfig.xml root@aliboboqurilish.uz:/opt/alibobo/public/

# Upload build files
echo "📤 Uploading build files..."
scp -r build/* root@aliboboqurilish.uz:/opt/alibobo/build/

# Step 3: Update backend with image fixes
echo "🔧 Updating backend controllers..."
scp backend/controllers/productControllerOptimized.js root@aliboboqurilish.uz:/opt/alibobo/backend/controllers/
scp backend/controllers/craftsmenController.js root@aliboboqurilish.uz:/opt/alibobo/backend/controllers/

# Step 4: Restart services
echo "🔄 Restarting services..."
ssh root@aliboboqurilish.uz << 'EOF'
# Restart backend
pm2 restart alibobo-backend

# Reload Nginx
sudo systemctl reload nginx

# Set proper permissions
chmod -R 755 /opt/alibobo/build/
chmod -R 755 /opt/alibobo/public/

echo "✅ Services restarted successfully"
EOF

# Step 5: Test the deployment
echo "🧪 Testing deployment..."
curl -I https://www.aliboboqurilish.uz/ | head -5

echo ""
echo "🎉 SEO Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Open create-logo-favicon.html and generate logo/favicon files"
echo "2. Upload generated icons to /opt/alibobo/public/"
echo "3. Open google-verification.html for Search Console setup"
echo "4. Submit sitemap: https://www.aliboboqurilish.uz/sitemap.xml"
echo "5. Test SEO: https://search.google.com/test/rich-results"
echo ""
echo "🔍 SEO URLs to check:"
echo "- Robots: https://www.aliboboqurilish.uz/robots.txt"
echo "- Sitemap: https://www.aliboboqurilish.uz/sitemap.xml"
echo "- Manifest: https://www.aliboboqurilish.uz/manifest.json"