@echo off
echo Applying working CORS fix to Nginx configuration...

REM Copy the working Nginx configuration to the VPS
echo Copying Nginx configuration to VPS...
scp nginx-cors-fix-working.conf root@45.92.173.33:/etc/nginx/sites-available/alibobo

REM SSH into the VPS and apply the configuration
echo Applying Nginx configuration...
ssh root@45.92.173.33 "ln -sf /etc/nginx/sites-available/alibobo /etc/nginx/sites-enabled/alibobo && nginx -t && systemctl reload nginx && echo 'Nginx configuration applied successfully'"

echo Done! Please check your application now.