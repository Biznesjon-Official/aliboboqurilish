@echo off
echo 🔐 Setting up SSL for Alibobo application...

echo 📤 Uploading SSL setup script...
scp ssl-setup.sh root@45.92.173.33:/opt/alibobo/

echo 🔧 Running SSL setup on VPS...
ssh root@45.92.173.33 "chmod +x /opt/alibobo/ssl-setup.sh && /opt/alibobo/ssl-setup.sh"

echo ✅ SSL setup completed!
echo 🌐 Please access your site at https://www.aliboboqurilish.uz
pause