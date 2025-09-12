@echo off
REM VPS Deploy Script for Alibobo (Windows version)
REM Server: root@45.92.173.33
REM Domain: aliboboqurilish.uz

echo 🚀 Starting VPS deployment for Alibobo...

REM Check if sshpass is available (you might need to install it or use PuTTY)
where sshpass >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ sshpass not found. Please install it or use the manual steps below.
    echo.
    echo Manual deployment steps:
    echo 1. Connect to VPS: ssh root@45.92.173.33
    echo 2. Password: 20100804
    echo 3. Run the following commands:
    echo.
    goto :manual_steps
)

REM VPS connection details
set VPS_HOST=45.92.173.33
set VPS_USER=root
set VPS_PASSWORD=20100804
set PROJECT_DIR=/opt/alibobo
set GITHUB_REPO=https://github.com/ozodbek2410/alibobo.git
set DOMAIN=aliboboqurilish.uz

echo 📋 Step 1: Checking current PM2 processes...
sshpass -p "%VPS_PASSWORD%" ssh -o StrictHostKeyChecking=no %VPS_USER%@%VPS_HOST% "pm2 ls"

echo 🛑 Step 2: Stopping and deleting all PM2 processes...
sshpass -p "%VPS_PASSWORD%" ssh -o StrictHostKeyChecking=no %VPS_USER%@%VPS_HOST% "pm2 stop all && pm2 delete all"

echo 🗑️ Step 3: Backing up and removing old project...
sshpass -p "%VPS_PASSWORD%" ssh -o StrictHostKeyChecking=no %VPS_USER%@%VPS_HOST% "cd /opt && [ -d alibobo ] && mv alibobo alibobo-backup-$(date +%%Y%%m%%d-%%H%%M%%S) || echo 'No existing project found'"

echo 📥 Step 4: Cloning fresh project from GitHub...
sshpass -p "%VPS_PASSWORD%" ssh -o StrictHostKeyChecking=no %VPS_USER%@%VPS_HOST% "cd /opt && git clone %GITHUB_REPO%"

echo 📦 Step 5: Installing dependencies...
sshpass -p "%VPS_PASSWORD%" ssh -o StrictHostKeyChecking=no %VPS_USER%@%VPS_HOST% "cd %PROJECT_DIR% && npm install"
sshpass -p "%VPS_PASSWORD%" ssh -o StrictHostKeyChecking=no %VPS_USER%@%VPS_HOST% "cd %PROJECT_DIR%/backend && npm install"

echo 🎉 Basic deployment completed! Please continue with manual configuration.
goto :end

:manual_steps
echo.
echo ===============================================
echo MANUAL DEPLOYMENT STEPS
echo ===============================================
echo.
echo 1. Connect to your VPS:
echo    ssh root@45.92.173.33
echo    Password: 20100804
echo.
echo 2. Check current PM2 processes:
echo    pm2 ls
echo.
echo 3. Stop and delete all PM2 processes:
echo    pm2 stop all
echo    pm2 delete all
echo.
echo 4. Backup and remove old project:
echo    cd /opt
echo    mv alibobo alibobo-backup-$(date +%%Y%%m%%d-%%H%%M%%S)
echo.
echo 5. Clone fresh project:
echo    git clone https://github.com/ozodbek2410/alibobo.git
echo    cd alibobo
echo.
echo 6. Install dependencies:
echo    npm install
echo    cd backend && npm install && cd ..
echo.
echo 7. Create production environment file:
echo    nano backend/.env.production
echo.
echo    Add this content:
echo    NODE_ENV=production
echo    PORT=5000
echo    MONGODB_URI=mongodb+srv://ozodbek:9KS0xaLkMnnqqE3L@cluster0.dlopces.mongodb.net/alibobo?retryWrites=true^&w=majority^&appName=Cluster0
echo    TRUST_PROXY=true
echo    ENABLE_CLUSTERING=true
echo    CORS_ORIGIN=https://aliboboqurilish.uz,https://www.aliboboqurilish.uz
echo    RATE_LIMIT_MAX=1000
echo    DEBUG=false
echo.
echo 8. Create frontend production environment:
echo    nano .env.production
echo.
echo    Add this content:
echo    REACT_APP_API_BASE=https://aliboboqurilish.uz/api
echo    REACT_APP_SOCKET_URL=https://aliboboqurilish.uz
echo    GENERATE_SOURCEMAP=false
echo.
echo 9. Build frontend:
echo    npm run build
echo.
echo 10. Create PM2 ecosystem file:
echo     nano ecosystem.config.js
echo.
echo     Add this content:
echo     module.exports = {
echo       apps: [{
echo         name: 'alibobo-backend',
echo         script: './backend/server.js',
echo         instances: 'max',
echo         exec_mode: 'cluster',
echo         env: { NODE_ENV: 'production', PORT: 5000 }
echo       }]
echo     };
echo.
echo 11. Create directories:
echo     mkdir -p logs backend/uploads
echo.
echo 12. Start with PM2:
echo     pm2 start ecosystem.config.js
echo     pm2 save
echo     pm2 startup
echo.
echo 13. Configure Nginx (create /etc/nginx/sites-available/aliboboqurilish.uz):
echo     See the full Nginx configuration in deploy-to-vps.sh
echo.
echo 14. Enable site:
echo     ln -sf /etc/nginx/sites-available/aliboboqurilish.uz /etc/nginx/sites-enabled/
echo     nginx -t
echo     systemctl reload nginx
echo.
echo 15. Check status:
echo     pm2 ls
echo     pm2 logs
echo.

:end
echo.
echo 📝 Deployment script completed!
echo 🌐 Your site should be available at: http://aliboboqurilish.uz
echo.
pause