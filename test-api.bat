@echo off
echo Testing API endpoints...

echo.
echo Testing health endpoint:
curl -k https://aliboboqurilish.uz/api/health

echo.
echo Testing products endpoint:
curl -k https://aliboboqurilish.uz/api/products?limit=5

echo.
echo Testing craftsmen endpoint:
curl -k https://aliboboqurilish.uz/api/craftsmen?limit=5

echo.
echo Testing Socket.IO endpoint:
curl -k https://aliboboqurilish.uz/socket.io/

echo.
echo All tests completed.