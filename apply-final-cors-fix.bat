@echo off
echo Applying final CORS fix to VPS...

echo 1. Uploading fixed Nginx configuration...
scp nginx-cors-fix-final.conf root@45.92.173.33:/etc/nginx/sites-available/aliboboqurilish.uz

echo 2. Restarting Nginx...
ssh root@45.92.173.33 "sudo nginx -t && sudo systemctl reload nginx"

echo 3. Restarting backend server...
ssh root@45.92.173.33 "cd /opt/alibobo && pm2 restart alibobo-backend"

echo 4. Checking status...
ssh root@45.92.173.33 "sudo nginx -t && pm2 status"

echo Final CORS fix applied successfully!
pause