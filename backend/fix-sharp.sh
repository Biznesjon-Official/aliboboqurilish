#!/bin/bash

echo "🔧 Fixing Sharp.js CPU compatibility issue..."

# Stop the backend service
echo "⏹️ Stopping alibobo-backend..."
pm2 stop alibobo-backend

# Remove Sharp completely
echo "🗑️ Removing Sharp.js..."
npm uninstall sharp
rm -rf node_modules/sharp

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Install additional dependencies for building from source
echo "📦 Installing build dependencies..."
apt-get update
apt-get install -y libvips-dev build-essential python3-dev pkg-config make g++

# Try different Sharp installation methods
echo "🔄 Attempting Sharp installation methods..."

# Method 1: Platform-specific installation
echo "📥 Method 1: Platform-specific installation..."
if npm install --os=linux --cpu=x64 sharp; then
    echo "✅ Method 1 successful"
else
    echo "❌ Method 1 failed, trying Method 2..."
    
    # Method 2: Build from source
    echo "📥 Method 2: Building from source..."
    if npm install sharp --build-from-source --verbose; then
        echo "✅ Method 2 successful"
    else
        echo "❌ Method 2 failed, trying Method 3..."
        
        # Method 3: With optional dependencies
        echo "📥 Method 3: With optional dependencies..."
        if npm install --include=optional sharp; then
            echo "✅ Method 3 successful"
        else
            echo "⚠️ All Sharp installation methods failed"
            echo "🔄 Backend will use fallback image handling (no optimization)"
        fi
    fi
fi

# Test Sharp availability
echo "🧪 Testing Sharp availability..."
node -e "
try {
  const sharp = require('sharp');
  console.log('✅ Sharp.js is working!');
  console.log('📊 Sharp version:', sharp.versions);
} catch (error) {
  console.log('⚠️ Sharp.js not available:', error.message);
  console.log('🔄 Fallback mode will be used');
}
"

# Restart the backend
echo "🚀 Restarting alibobo-backend..."
pm2 restart alibobo-backend

# Show logs
echo "📋 Showing recent logs..."
pm2 logs alibobo-backend --lines 20

echo "✅ Sharp.js fix completed!"
echo "📝 Check the logs above to verify the backend is running properly"
