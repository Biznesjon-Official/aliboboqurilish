@echo off
echo 🔄 Quick update for Alibobo on VPS...

set VPS_HOST=45.92.173.33
set VPS_USER=root
set VPS_PASSWORD=20100804

echo 📤 Connecting to VPS and updating...

plink -ssh -batch -pw %VPS_PASSWORD% %VPS_USER%@%VPS_HOST% "cd /opt/alibobo && git pull origin main && npm install && cd backend && npm install && cd .. && npm run build && pm2 restart alibobo-backend && pm2 ls && pm2 logs alibobo-backend --lines 10"

echo 🎉 Update completed! Check: http://aliboboqurilish.uz
pause