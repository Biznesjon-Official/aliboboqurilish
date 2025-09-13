#!/bin/bash

echo "🎨 Deploying Adaptive Logo System..."

# Step 1: Build the project with new components
echo "📦 Building React project with adaptive logo..."
npm run build

# Step 2: Upload updated components
echo "📤 Uploading adaptive logo components..."
scp src/components/AdaptiveLogo.jsx root@aliboboqurilish.uz:/opt/alibobo/src/components/
scp src/components/Header.jsx root@aliboboqurilish.uz:/opt/alibobo/src/components/

# Step 3: Upload build files
echo "📤 Uploading build files..."
scp -r build/* root@aliboboqurilish.uz:/opt/alibobo/build/

# Step 4: Create logo files directory and set permissions
echo "📁 Setting up logo directories..."
ssh root@aliboboqurilish.uz << 'EOF'
# Create logos directory if it doesn't exist
mkdir -p /opt/alibobo/public/logos
chmod 755 /opt/alibobo/public/logos

# Set proper permissions for build directory
chmod -R 755 /opt/alibobo/build/
chmod -R 755 /opt/alibobo/public/

echo "✅ Directories created and permissions set"
EOF

# Step 5: Test the deployment
echo "🧪 Testing adaptive logo deployment..."
curl -I https://www.aliboboqurilish.uz/ | head -5

echo ""
echo "🎉 Adaptive Logo System deployed!"
echo ""
echo "📋 Next steps:"
echo "1. Open create-adaptive-logos.html in your browser"
echo "2. Generate logo files:"
echo "   - logo.png (for dark backgrounds)"
echo "   - white-mode-logo.png (for light backgrounds)" 
echo "   - alibobo.png (text logo for dark backgrounds)"
echo "   - alibobo-white.png (text logo for light backgrounds)"
echo "3. Upload generated logos to server:"
echo "   scp logo.png root@aliboboqurilish.uz:/opt/alibobo/public/"
echo "   scp white-mode-logo.png root@aliboboqurilish.uz:/opt/alibobo/public/"
echo "   scp alibobo.png root@aliboboqurilish.uz:/opt/alibobo/public/"
echo "   scp alibobo-white.png root@aliboboqurilish.uz:/opt/alibobo/public/"
echo ""
echo "🌟 Features:"
echo "- ✅ Automatic background detection"
echo "- ✅ Smooth transitions between logo variants"
echo "- ✅ Responsive sizing (large, medium, small)"
echo "- ✅ Fallback to default logos if adaptive logos fail"
echo "- ✅ Works on both desktop and mobile"