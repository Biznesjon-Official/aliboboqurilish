#!/bin/bash

# Comprehensive fix script for Alibobo application
echo "🚀 Starting comprehensive fix for Alibobo application..."

# 1. Fix Nginx configuration
echo "🔧 Fixing Nginx configuration..."
sudo cp /opt/alibobo/nginx-api-fix.conf /etc/nginx/sites-available/aliboboqurilish.uz
sudo rm -f /etc/nginx/sites-enabled/aliboboqurilish.uz
sudo ln -s /etc/nginx/sites-available/aliboboqurilish.uz /etc/nginx/sites-enabled/
sudo nginx -t

# 2. Check if backend is running
echo "🔍 Checking backend status..."
if pm2 status | grep -q "alibobo-backend"; then
    echo "🔄 Restarting backend..."
    pm2 restart alibobo-backend
else
    echo "🚀 Starting backend..."
    cd /opt/alibobo
    pm2 start ecosystem.config.js --env production
fi

# 3. Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

# 4. Check if MongoDB is accessible
echo "🔍 Checking MongoDB connection..."
cd /opt/alibobo/backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (uri) {
  console.log('MongoDB URI found:', uri.substring(0, 50) + '...');
} else {
  console.log('❌ MongoDB URI not found in environment variables');
}
"

# 5. Verify API endpoints
echo "🔍 Verifying API endpoints..."
curl -s -o /dev/null -w "Health endpoint: %{http_code}\n" https://aliboboqurilish.uz/api/health
curl -s -o /dev/null -w "Products endpoint: %{http_code}\n" https://aliboboqurilish.uz/api/products

echo "✅ Fix completed! Please refresh your browser."