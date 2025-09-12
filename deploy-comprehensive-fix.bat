@echo off
echo 🚀 Deploying comprehensive fix to VPS...

echo 🔧 Uploading comprehensive fix script...
scp vps-comprehensive-fix.sh root@45.92.173.33:/opt/alibobo/

echo 🔧 Running comprehensive fix on VPS...
ssh root@45.92.173.33 "chmod +x /opt/alibobo/vps-comprehensive-fix.sh && /opt/alibobo/vps-comprehensive-fix.sh"

echo ✅ Comprehensive fix deployed!
echo 🌐 Please access your site at https://www.aliboboqurilish.uz
pause