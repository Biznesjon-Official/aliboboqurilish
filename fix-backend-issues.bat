@echo off
echo 🔧 Alibobo Backend Issues Fix Script
echo ====================================

cd backend

echo 📋 Step 1: Running startup checks...
node scripts/startup-checks.js

echo.
echo 📋 Step 2: Attempting to fix Sharp installation...
node scripts/fix-sharp.js

echo.
echo 📋 Step 3: Clearing PM2 logs...
pm2 flush alibobo-backend 2>nul || echo PM2 not running or logs already clear

echo.
echo 📋 Step 4: Restarting backend service...
pm2 list | findstr "alibobo-backend" >nul
if %errorlevel% == 0 (
    echo 🔄 Restarting PM2 process...
    pm2 restart alibobo-backend
    timeout /t 3 >nul
    echo 📊 Checking PM2 status...
    pm2 status alibobo-backend
) else (
    echo ⚠️ PM2 process not found. Starting manually...
    echo 💡 Run: pm2 start npm --name "alibobo-backend" -- run start:production
)

echo.
echo 📋 Step 5: Testing backend health...
timeout /t 5 >nul
curl -s http://localhost:5000/api/test >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend is responding
) else (
    echo ⚠️ Backend may not be responding yet (this is normal during startup)
)

echo.
echo 🎯 Fix script completed!
echo.
echo 📊 To monitor the backend:
echo    pm2 logs alibobo-backend
echo.
echo 🔧 If issues persist:
echo    1. Check PM2 logs: pm2 logs alibobo-backend
echo    2. Check system resources: Task Manager
echo    3. Restart PM2: pm2 restart alibobo-backend
echo    4. Check MongoDB connection
echo.
pause