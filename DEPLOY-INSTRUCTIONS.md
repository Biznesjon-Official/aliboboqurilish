# Deployment Instructions for Alibobo Fixes

Follow these steps to deploy the fixes to your VPS:

## Step 1: Upload Configuration Files

1. Open Git Bash or your preferred terminal
2. Navigate to your project directory:
   ```bash
   cd /c/Users/user/Documents/GitHub/alibobo
   ```

3. Upload the Nginx configuration file:
   ```bash
   scp nginx-api-fix.conf root@45.92.173.33:/opt/alibobo/
   ```

4. Upload the update script:
   ```bash
   scp vps-update.sh root@45.92.173.33:/opt/alibobo/
   ```

## Step 2: Run the Update Script on VPS

1. SSH into your VPS:
   ```bash
   ssh root@45.92.173.33
   ```

2. Make the script executable:
   ```bash
   chmod +x /opt/alibobo/vps-update.sh
   ```

3. Run the update script:
   ```bash
   /opt/alibobo/vps-update.sh
   ```

## Step 3: Verify the Fixes

1. Test the API endpoints:
   ```bash
   curl https://aliboboqurilish.uz/api/health
   curl https://aliboboqurilish.uz/api/products?limit=5
   ```

2. Check Nginx configuration:
   ```bash
   sudo nginx -t
   ```

3. Check service status:
   ```bash
   pm2 status
   sudo systemctl status nginx
   ```

## Step 4: Refresh Your Browser

1. Clear your browser cache
2. Refresh the page at https://www.aliboboqurilish.uz
3. Check the browser console for any remaining errors

## Troubleshooting

If you encounter any issues:

1. Check Nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. Check backend logs:
   ```bash
   pm2 logs alibobo-backend
   ```

3. Restart services if needed:
   ```bash
   sudo systemctl restart nginx
   pm2 restart alibobo-backend
   ```

## Files Included

- [nginx-api-fix.conf](file:///c%3A/Users/user/Documents/GitHub/alibobo/nginx-api-fix.conf) - Corrected Nginx configuration
- [vps-update.sh](file:///c%3A/Users/user/Documents/GitHub/alibobo/vps-update.sh) - Update script for VPS
- [test-api.bat](file:///c%3A/Users/user/Documents/GitHub/alibobo/test-api.bat) - API testing script (Windows)