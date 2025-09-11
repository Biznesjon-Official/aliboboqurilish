@echo off
echo 🚀 Starting Alibobo deployment preparation...

echo 📁 Creating deployment package...

REM Create a deployment directory
if exist "deployment" rmdir /s /q "deployment"
mkdir "deployment"

REM Copy necessary files
xcopy ".env.production" "deployment\" /Y
xcopy "ecosystem.config.js" "deployment\" /Y
xcopy "nginx-deploy.conf" "deployment\" /Y
xcopy "DEPLOYMENT.md" "deployment\" /Y

REM Copy backend files
xcopy "backend\.env.production" "deployment\backend\" /Y

echo 📦 Deployment package created in 'deployment' folder

echo 📝 Deployment instructions:
echo 1. Copy the contents of the 'deployment' folder to your VPS
echo 2. Follow the instructions in DEPLOYMENT.md to complete the deployment
echo 3. Run the commands on your VPS as specified in the guide

echo ✅ Ready for deployment!
pause