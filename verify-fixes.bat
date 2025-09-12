@echo off
echo 🔍 Verifying fixes...

echo 🔧 Testing HTTPS connection...
curl -s -o /dev/null -w "HTTPS Status: %{http_code}\n" https://aliboboqurilish.uz/api/health

echo 🔧 Testing HTTP to HTTPS redirect...
curl -s -o /dev/null -w "HTTP Redirect Status: %{http_code}\n" -L http://aliboboqurilish.uz

echo 🔧 Checking backend status on VPS...
ssh root@45.92.173.33 "pm2 status alibobo-backend"

echo 🔧 Checking Nginx status...
ssh root@45.92.173.33 "sudo systemctl is-active nginx"

echo ✅ Verification completed!
pause