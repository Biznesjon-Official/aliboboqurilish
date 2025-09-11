@echo off
echo 🔄 Updating Nginx configuration to fix CORS issues...

REM Copy the corrected Nginx configuration
echo 📋 Copying nginx-final-fix.conf to your VPS...
scp nginx-final-fix.conf root@45.92.173.33:/etc/nginx/sites-available/aliboboqurilish.uz

REM Update the Nginx configuration on the VPS
echo 🔧 Updating Nginx configuration on VPS...
ssh root@45.92.173.33 "sudo rm -f /etc/nginx/sites-enabled/aliboboqurilish.uz && sudo ln -s /etc/nginx/sites-available/aliboboqurilish.uz /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl restart nginx"

echo ✅ Nginx configuration updated successfully!
echo 🔄 Please refresh your browser to see the changes.
pause