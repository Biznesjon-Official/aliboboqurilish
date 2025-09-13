#!/bin/bash

# Fix Dependencies Issue Script
echo "🔧 Fixing Mongoose dependencies issue..."

VPS_HOST="45.92.173.33"
VPS_USER="root"
VPS_PASSWORD="20100804"

# Create fix script
cat > temp_deps_fix.sh << 'EOF'
#!/bin/bash

echo "🔧 Fixing backend dependencies..."

cd /opt/alibobo/backend

echo "🗑️ Cleaning old dependencies..."
rm -rf node_modules package-lock.json
npm cache clean --force

echo "📦 Reinstalling all dependencies..."
npm install

echo "🔧 Checking mongoose specifically..."
npm list mongoose

echo "🔄 Restarting backend..."
pm2 restart alibobo-backend

echo "⏳ Waiting for startup..."
sleep 5

echo "📊 Checking status..."
pm2 ls

echo "📝 Recent logs:"
pm2 logs alibobo-backend --lines 15

echo "🌐 Testing API endpoint..."
curl -I http://localhost:5000/api/products/fast?limit=1

echo "✅ Dependencies fix completed!"

EOF

# Execute on VPS
echo "📤 Uploading dependencies fix script..."
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no temp_deps_fix.sh "$VPS_USER@$VPS_HOST:/tmp/"

echo "▶️ Executing dependencies fix on VPS..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "chmod +x /tmp/temp_deps_fix.sh && /tmp/temp_deps_fix.sh"

# Clean up
rm -f temp_deps_fix.sh

echo ""
echo "🎉 Dependencies fix completed!"
echo "🌐 Test your website: https://www.aliboboqurilish.uz"