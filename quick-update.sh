#!/bin/bash

# Quick Update Script for VPS
echo "🔄 Quick update for Alibobo on VPS..."

VPS_HOST="45.92.173.33"
VPS_USER="root"
VPS_PASSWORD="20100804"

# Create update script
cat > temp_update_script.sh << 'EOF'
#!/bin/bash

echo "📁 Navigating to project directory..."
cd /opt/alibobo

echo "📥 Pulling latest code from GitHub..."
git pull origin main

echo "📦 Updating dependencies..."
npm install
cd backend && npm install && cd ..

echo "🏗️ Rebuilding frontend..."
npm run build

echo "🔄 Restarting backend service..."
pm2 restart alibobo-backend

echo "📊 Checking status..."
pm2 ls

echo "📝 Recent logs:"
pm2 logs alibobo-backend --lines 10

echo "🌐 Testing website..."
curl -I http://aliboboqurilish.uz

echo "✅ Update completed!"
EOF

# Execute on VPS
echo "📤 Uploading update script..."
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no temp_update_script.sh "$VPS_USER@$VPS_HOST:/tmp/"

echo "▶️ Running update on VPS..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "chmod +x /tmp/temp_update_script.sh && /tmp/temp_update_script.sh"

# Clean up
rm -f temp_update_script.sh

echo "🎉 Update completed! Check: http://aliboboqurilish.uz"