@echo off
echo 🚀 Quick deployment to aliboboqurilish.uz
echo ==========================================

echo.
echo Since you don't have SSH tools installed, here are the manual steps:
echo.
echo 📋 MANUAL DEPLOYMENT STEPS:
echo ===========================
echo.
echo 1. First, make sure your changes are pushed to GitHub:
echo    git add .
echo    git commit -m "Updated index.html with new favicon paths"
echo    git push origin main
echo.
echo 2. Connect to your VPS using any SSH client:
echo    Host: 45.92.173.33
echo    User: root
echo    Password: 20100804
echo.
echo 3. Once connected, run these commands:
echo.
echo    # Navigate to project
echo    cd /opt/alibobo
echo.
echo    # Pull latest changes
echo    git pull origin main
echo.
echo    # Rebuild frontend
echo    npm run build
echo.
echo    # Restart the application
echo    pm2 restart alibobo-backend
echo.
echo    # Check status
echo    pm2 ls
echo    pm2 logs alibobo-backend --lines 10
echo.
echo 🌐 Your website will be available at: http://aliboboqurilish.uz
echo.
echo 📝 Alternative: Use PuTTY or Windows Terminal with SSH
echo.
pause