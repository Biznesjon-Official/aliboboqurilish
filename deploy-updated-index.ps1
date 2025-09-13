# PowerShell script to deploy updated index.html to VPS
# VPS: root@45.92.173.33

$VPS_HOST = "45.92.173.33"
$VPS_USER = "root"
$VPS_PASSWORD = "20100804"

Write-Host "🚀 Deploying updated index.html to aliboboqurilish.uz..." -ForegroundColor Green

# Check if we have the necessary tools
$hasPlink = Get-Command plink -ErrorAction SilentlyContinue
$hasPscp = Get-Command pscp -ErrorAction SilentlyContinue

if (-not $hasPlink -or -not $hasPscp) {
    Write-Host "❌ PuTTY tools (plink/pscp) not found." -ForegroundColor Red
    Write-Host "Please install PuTTY or use manual deployment steps below:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "MANUAL DEPLOYMENT STEPS:" -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Connect to VPS:" -ForegroundColor White
    Write-Host "   ssh root@45.92.173.33" -ForegroundColor Gray
    Write-Host "   Password: 20100804" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Navigate to project and pull latest changes:" -ForegroundColor White
    Write-Host "   cd /opt/alibobo" -ForegroundColor Gray
    Write-Host "   git pull origin main" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Rebuild frontend:" -ForegroundColor White
    Write-Host "   npm run build" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Restart PM2:" -ForegroundColor White
    Write-Host "   pm2 restart alibobo-backend" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Check status:" -ForegroundColor White
    Write-Host "   pm2 ls" -ForegroundColor Gray
    Write-Host "   pm2 logs alibobo-backend --lines 20" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🌐 Website will be available at: http://aliboboqurilish.uz" -ForegroundColor Green
    return
}

try {
    Write-Host "📋 Step 1: Checking VPS connection..." -ForegroundColor Yellow
    $result = & plink -ssh -batch -pw $VPS_PASSWORD "$VPS_USER@$VPS_HOST" "echo 'Connection successful'"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ VPS connection successful" -ForegroundColor Green
    } else {
        throw "VPS connection failed"
    }

    Write-Host "📁 Step 2: Navigating to project directory..." -ForegroundColor Yellow
    & plink -ssh -batch -pw $VPS_PASSWORD "$VPS_USER@$VPS_HOST" "cd /opt/alibobo && pwd"

    Write-Host "📥 Step 3: Pulling latest changes from GitHub..." -ForegroundColor Yellow
    & plink -ssh -batch -pw $VPS_PASSWORD "$VPS_USER@$VPS_HOST" "cd /opt/alibobo; git pull origin main"

    Write-Host "🏗️ Step 4: Building frontend with updated index.html..." -ForegroundColor Yellow
    & plink -ssh -batch -pw $VPS_PASSWORD "$VPS_USER@$VPS_HOST" "cd /opt/alibobo; npm run build"

    Write-Host "🔄 Step 5: Restarting PM2 processes..." -ForegroundColor Yellow
    & plink -ssh -batch -pw $VPS_PASSWORD "$VPS_USER@$VPS_HOST" "pm2 restart alibobo-backend"

    Write-Host "📊 Step 6: Checking deployment status..." -ForegroundColor Yellow
    & plink -ssh -batch -pw $VPS_PASSWORD "$VPS_USER@$VPS_HOST" "pm2 ls"

    Write-Host ""
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌐 Your website is available at: http://aliboboqurilish.uz" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 To monitor:" -ForegroundColor White
    Write-Host "   pm2 logs alibobo-backend" -ForegroundColor Gray
    Write-Host "   pm2 monit" -ForegroundColor Gray

} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please try manual deployment steps above." -ForegroundColor Yellow
}