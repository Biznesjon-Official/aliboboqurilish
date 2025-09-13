@echo off
echo 🔧 Fixing CORS issue for Alibobo...

set VPS_HOST=45.92.173.33
set VPS_USER=root
set VPS_PASSWORD=20100804

echo 📤 Connecting to VPS and fixing CORS...

plink -ssh -batch -pw %VPS_PASSWORD% %VPS_USER%@%VPS_HOST% "nginx -t && systemctl reload nginx && cd /opt/alibobo && pm2 restart alibobo-backend --update-env && pm2 ls"

echo 🎉 CORS fix completed! Test: https://www.aliboboqurilish.uz
pause