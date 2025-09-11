@echo off
echo 🧪 Checking API endpoints...

echo 🔍 Testing health endpoint...
curl -k https://aliboboqurilish.uz/api/health

echo.
echo 🔍 Testing products endpoint...
curl -k https://aliboboqurilish.uz/api/products/fast?limit=5

echo.
echo 🔍 Testing craftsmen endpoint...
curl -k https://aliboboqurilish.uz/api/craftsmen?limit=5

echo.
echo ✅ API checks completed!
pause