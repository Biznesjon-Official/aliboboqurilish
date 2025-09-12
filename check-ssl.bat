@echo off
echo 🔍 Checking SSL certificate...

echo 🔧 Testing HTTPS connection...
curl -s -o /dev/null -w "HTTPS Status: %{http_code}\n" https://aliboboqurilish.uz

echo 🔧 Testing HTTP to HTTPS redirect...
curl -s -o /dev/null -w "HTTP Redirect Status: %{http_code}\n" -L http://aliboboqurilish.uz

echo 🔧 Checking certificate expiration...
ssh root@45.92.173.33 "sudo certbot certificates"

echo ✅ SSL check completed!
pause