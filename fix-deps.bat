@echo off
echo 🔧 Fixing Mongoose dependencies issue...

set VPS_HOST=45.92.173.33
set VPS_USER=root
set VPS_PASSWORD=20100804

echo 📤 Connecting to VPS and fixing dependencies...

plink -ssh -batch -pw %VPS_PASSWORD% %VPS_USER%@%VPS_HOST% "cd /opt/alibobo/backend && rm -rf node_modules package-lock.json && npm cache clean --force && npm install && pm2 restart alibobo-backend && pm2 logs alibobo-backend --lines 10"

echo 🎉 Dependencies fix completed! Test: https://www.aliboboqurilish.uz
pause