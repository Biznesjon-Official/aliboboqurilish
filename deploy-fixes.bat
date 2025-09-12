@echo off
echo 🚀 Deploying fixes to VPS...

echo 🔧 Uploading fixed Nginx configuration...
scp nginx-api-fix.conf root@45.92.173.33:/opt/alibobo/

echo 🔧 Uploading update script...
scp vps-update.sh root@45.92.173.33:/opt/alibobo/

echo 🔧 Running update script on VPS...
ssh root@45.92.173.33 "chmod +x /opt/alibobo/vps-update.sh && /opt/alibobo/vps-update.sh"

echo ✅ Fixes deployed successfully!
echo 🔄 Please refresh your browser to see the changes.
pause