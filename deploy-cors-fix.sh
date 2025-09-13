#!/bin/bash

echo "🚀 Deploying CORS fix to production..."

# Step 1: Upload the updated backend code
echo "📤 Uploading backend changes..."
scp backend/server.js root@aliboboqurilish.uz:/opt/alibobo/backend/

# Step 2: Upload and run the CORS fix script
echo "📤 Uploading CORS fix script..."
scp fix-cors-duplicate-headers.sh root@aliboboqurilish.uz:/opt/alibobo/

# Step 3: Execute the fix on the server
echo "🔧 Executing CORS fix on server..."
ssh root@aliboboqurilish.uz << 'EOF'
cd /opt/alibobo
chmod +x fix-cors-duplicate-headers.sh
./fix-cors-duplicate-headers.sh
EOF

echo ""
echo "🎉 CORS fix deployment completed!"
echo "🌐 Visit https://www.aliboboqurilish.uz to test"
echo "🔍 Check browser console - CORS errors should be resolved"