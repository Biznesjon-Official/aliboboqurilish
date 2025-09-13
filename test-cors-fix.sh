#!/bin/bash

echo "🧪 Testing CORS configuration..."

echo ""
echo "1️⃣ Testing API endpoint with Origin header:"
curl -I -H "Origin: https://www.aliboboqurilish.uz" https://aliboboqurilish.uz/api/products/fast?limit=1

echo ""
echo "2️⃣ Testing Socket.IO endpoint:"
curl -I -H "Origin: https://www.aliboboqurilish.uz" https://aliboboqurilish.uz/socket.io/?EIO=4&transport=polling

echo ""
echo "3️⃣ Testing OPTIONS preflight request:"
curl -X OPTIONS -H "Origin: https://www.aliboboqurilish.uz" -H "Access-Control-Request-Method: GET" https://aliboboqurilish.uz/api/products/fast

echo ""
echo "4️⃣ Checking backend logs for CORS messages:"
pm2 logs alibobo-backend --lines 5

echo ""
echo "✅ CORS test completed!"
echo "🔍 Look for 'Access-Control-Allow-Origin' header in responses above"
echo "❌ If you see duplicate headers or CORS errors, run: bash fix-cors-duplicate-headers.sh"