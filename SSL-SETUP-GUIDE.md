# SSL Setup Guide for Alibobo Application

This guide explains how to set up and maintain SSL certificates for your Alibobo application using Let's Encrypt.

## Issues Addressed

1. **SSL Certificate Missing**: Your SSL certificate was removed or expired
2. **HTTP Only Access**: Site was only accessible over HTTP, not HTTPS
3. **No Automatic Renewal**: Certificates were not set to automatically renew

## Solution Overview

This SSL setup includes:
- Installation of Let's Encrypt certificates using Certbot
- Proper Nginx configuration for HTTPS
- HTTP to HTTPS redirect
- Automatic certificate renewal
- Security headers for enhanced protection

## How to Set Up SSL

### Method 1: Automated Setup (Recommended)

1. Run `setup-ssl.bat` from your Windows machine
2. This will:
   - Upload the SSL setup script to your VPS
   - Run the script on your VPS
   - Set up automatic certificate renewal

### Method 2: Manual Setup

1. SSH into your VPS:
   ```bash
   ssh root@45.92.173.33
   ```

2. Install Certbot:
   ```bash
   sudo apt update
   sudo apt install -y certbot python3-certbot-nginx
   ```

3. Stop Nginx temporarily:
   ```bash
   sudo systemctl stop nginx
   ```

4. Obtain SSL certificate:
   ```bash
   sudo certbot certonly --standalone -d aliboboqurilish.uz -d www.aliboboqurilish.uz --non-interactive --agree-tos --email your-email@example.com
   ```

5. Create SSL-enabled Nginx configuration:
   ```bash
   sudo cp /opt/alibobo/nginx-api-fix.conf /etc/nginx/sites-available/aliboboqurilish.uz
   ```

6. Modify the configuration to include SSL settings (see [ssl-setup.sh](file:///c%3A/Users/user/Documents/GitHub/alibobo/ssl-setup.sh) for details)

7. Create symbolic link:
   ```bash
   sudo rm -f /etc/nginx/sites-enabled/aliboboqurilish.uz
   sudo ln -s /etc/nginx/sites-available/aliboboqurilish.uz /etc/nginx/sites-enabled/
   ```

8. Test and restart Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl start nginx
   ```

9. Set up automatic renewal:
   ```bash
   sudo crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -
   ```

## Verification

After setting up SSL:

1. Check HTTPS access:
   ```bash
   curl -s -o /dev/null -w "HTTPS Status: %{http_code}\n" https://aliboboqurilish.uz
   ```

2. Check HTTP redirect:
   ```bash
   curl -s -o /dev/null -w "HTTP Redirect Status: %{http_code}\n" -L http://aliboboqurilish.uz
   ```

3. Check certificate expiration:
   ```bash
   sudo certbot certificates
   ```

## Automatic Renewal

The setup includes automatic certificate renewal:
- Certificates are renewed every 90 days
- Renewal check runs daily at noon
- No manual intervention required

## Troubleshooting

If you encounter issues:

1. Check Nginx error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. Test Nginx configuration:
   ```bash
   sudo nginx -t
   ```

3. Manually renew certificates:
   ```bash
   sudo certbot renew --dry-run
   ```

4. Check certificate status:
   ```bash
   sudo certbot certificates
   ```

## Security Considerations

The SSL setup includes:
- Strong SSL protocols (TLSv1.2 and TLSv1.3)
- Secure cipher suites
- HTTP to HTTPS redirect
- Security headers for enhanced protection
- Automatic renewal to prevent expiration

## Files Included

- [ssl-setup.sh](file:///c%3A/Users/user/Documents/GitHub/alibobo/ssl-setup.sh) - Automated SSL setup script
- [setup-ssl.bat](file:///c%3A/Users/user/Documents/GitHub/alibobo/setup-ssl.bat) - Windows batch file to deploy SSL setup
- [check-ssl.bat](file:///c%3A/Users/user/Documents/GitHub/alibobo/check-ssl.bat) - SSL verification script