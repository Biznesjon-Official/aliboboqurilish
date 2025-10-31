#!/bin/bash

echo "🔧 Alibobo Backend Issues Fix Script"
echo "===================================="

# Navigate to backend directory
cd backend

echo "📋 Step 1: Running startup checks..."
node scripts/startup-checks.js

echo ""
echo "📋 Step 2: Attempting to fix Sharp installation..."
node scripts/fix-sharp.js

echo ""
echo "📋 Step 3: Clearing PM2 logs..."
pm2 flush alibobo-backend 2>/dev/null || echo "PM2 not running or logs already clear"

echo ""
echo "📋 Step 4: Restarting backend service..."
if pm2 list | grep -q "alibobo-backend"; then
    echo "🔄 Restarting PM2 process..."
    pm2 restart alibobo-backend
    sleep 3
    echo "📊 Checking PM2 status..."
    pm2 status alibobo-backend
else
    echo "⚠️ PM2 process not found. Starting manually..."
    echo "💡 Run: pm2 start npm --name 'alibobo-backend' -- run start:production"
fi

echo ""
echo "📋 Step 5: Testing backend health..."
sleep 5
curl -s http://localhost:5000/api/test >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend is responding"
else
    echo "⚠️ Backend may not be responding yet (this is normal during startup)"
fi

echo ""
echo "🎯 Fix script completed!"
echo ""
echo "📊 To monitor the backend:"
echo "   pm2 logs alibobo-backend"
echo ""
echo "🔧 If issues persist:"
echo "   1. Check PM2 logs: pm2 logs alibobo-backend"
echo "   2. Check system resources: htop"
echo "   3. Restart PM2: pm2 restart alibobo-backend"
echo "   4. Check MongoDB connection"
echo ""