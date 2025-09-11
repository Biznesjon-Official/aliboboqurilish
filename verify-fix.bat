@echo off
echo 🧪 Verifying CORS fix...

echo 🔍 Testing API endpoint...
curl -H "Origin: http://localhost:3001" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: X-Requested-With" -X OPTIONS https://aliboboqurilish.uz/api/health

echo.
echo 🔍 Testing Socket.IO endpoint...
curl -H "Origin: http://localhost:3001" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: X-Requested-With" -X OPTIONS https://aliboboqurilish.uz/socket.io/

echo.
echo ✅ Verification completed! Check the response headers above.
echo    Make sure there's only one 'Access-Control-Allow-Origin' header.
pause