# SSL Setup Instructions for Alibobo Application

Follow these steps to set up SSL for your Alibobo application:

## Step 1: Upload SSL Setup Script

1. Open Git Bash or your preferred terminal
2. Navigate to your project directory:
   ```bash
   cd /c/Users/user/Documents/GitHub/alibobo
   ```

3. Upload the SSL setup script:
   ```bash
   scp ssl-setup.sh root@45.92.173.33:/opt/alibobo/
   ```

## Step 2: Run SSL Setup on VPS

1. SSH into your VPS:
   ```bash
   ssh root@45.92.173.33
   ```

2. Make the script executable:
   ```bash
   chmod +x /opt/alibobo/ssl-setup.sh
   ```

3. Run the SSL setup script:
   ```bash
   /opt/alibobo/ssl-setup.sh
   ```

## Step 3: Verify SSL Setup

1. Test HTTPS access:
   ```bash
   curl -s -o /dev/null -w "HTTPS Status: %{http_code}\n" https://aliboboqurilish.uz
   ```

2. Test HTTP redirect:
   ```bash
   curl -s -o /dev/null -w "HTTP Redirect Status: %{http_code}\n" -L http://aliboboqurilish.uz
   ```

3. Check certificate information:
   ```bash
   sudo certbot certificates
   ```

## Step 4: Access Your Site

1. Open your browser and go to: https://www.aliboboqurilish.uz
2. The site should now be accessible over HTTPS with a valid SSL certificate
3. HTTP requests should automatically redirect to HTTPS

## Troubleshooting

If you encounter any issues:

1. Check Nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. Test Nginx configuration:
   ```bash
   sudo nginx -t
   ```

3. Manually test certificate renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

## Automatic Renewal

The setup includes automatic certificate renewal:
- Certificates are checked daily for renewal
- No manual intervention is required
- Renewal happens automatically before expiration

## Files Included

- [ssl-setup.sh](file:///c%3A/Users/user/Documents/GitHub/alibobo/ssl-setup.sh) - Automated SSL setup script
- [SSL-SETUP-GUIDE.md](file:///c%3A/Users/user/Documents/GitHub/alibobo/SSL-SETUP-GUIDE.md) - Comprehensive SSL setup guide