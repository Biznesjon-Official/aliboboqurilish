@echo off
echo 🔒 Setting up SSL certificate for aliboboqurilish.uz...

set VPS_HOST=45.92.173.33
set VPS_USER=root
set VPS_PASSWORD=20100804

echo 📤 Connecting to VPS and setting up SSL...
echo This may take a few minutes...

plink -ssh -batch -pw %VPS_PASSWORD% %VPS_USER%@%VPS_HOST% "apt update && apt install snapd -y && systemctl enable snapd && systemctl start snapd && sleep 5 && snap install core && snap refresh core && snap install --classic certbot && ln -sf /snap/bin/certbot /usr/bin/certbot && systemctl stop nginx && certbot certonly --standalone --email ozodbek2410@gmail.com --agree-tos --no-eff-email -d aliboboqurilish.uz -d www.aliboboqurilish.uz"

echo 🔒 SSL certificate obtained! Now configuring Nginx...

echo 🎉 SSL setup completed! 
echo 🌐 Your website: https://aliboboqurilish.uz
pause