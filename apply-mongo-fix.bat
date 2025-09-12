@echo off
echo Applying MongoDB connection fix...

REM Copy the improved configuration to the VPS
echo Copying improved MongoDB configuration to VPS...
scp backend/config-improved.env root@45.92.173.33:/opt/alibobo/backend/config.env

REM SSH into the VPS and restart the backend service
echo Restarting backend service...
ssh root@45.92.173.33 "cd /opt/alibobo && pm2 restart alibobo-backend && echo 'Backend service restarted successfully'"

echo Done! Please check your application now.