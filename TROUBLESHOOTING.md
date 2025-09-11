# Troubleshooting Guide for Alibobo Application

This guide helps you resolve common issues with your deployed Alibobo application.

## Common Issues and Solutions

### 1. CORS Errors

**Error Message**: 
> The 'Access-Control-Allow-Origin' header contains multiple values 'http://localhost:3001, http://localhost:3001', but only one is allowed.

**Cause**: 
The Nginx configuration is setting the `Access-Control-Allow-Origin` header multiple times, resulting in duplicate values.

**Solution**:
1. Run `update-nginx.bat` to apply the corrected Nginx configuration
2. Or manually remove the `always` parameter from `add_header` directives in your Nginx configuration

### 2. Socket.IO Connection Issues

**Error Message**:
> Socket connection error: TransportError: xhr poll error

**Solutions**:
1. Check if the backend is running: `pm2 status`
2. Verify the Socket.IO endpoint is accessible: `curl https://aliboboqurilish.uz/socket.io/`
3. Check Nginx configuration for Socket.IO proxy settings
4. Restart the backend: `pm2 restart alibobo-backend`

### 3. API Endpoint 404 Errors

**Error Message**:
> GET https://aliboboqurilish.uz/api/products/fast net::ERR_FAILED 404 (Not Found)

**Solutions**:
1. Check if the backend is running: `pm2 status`
2. Verify the API endpoints exist by checking the routes in your backend code
3. Check if MongoDB connection is working
4. Check backend logs: `pm2 logs alibobo-backend`

### 4. SSL/TLS Issues

**Error Message**:
> ERR_CERT_AUTHORITY_INVALID or similar SSL errors

**Solutions**:
1. Ensure SSL certificates are properly installed with Let's Encrypt
2. Check certificate expiration: `sudo certbot certificates`
3. Renew certificates if needed: `sudo certbot renew`

## Diagnostic Commands

### Check Application Status
```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs alibobo-backend

# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Test API Endpoints
```bash
# Test health endpoint
curl https://aliboboqurilish.uz/api/health

# Test products endpoint
curl https://aliboboqurilish.uz/api/products/fast?limit=5

# Test craftsmen endpoint
curl https://aliboboqurilish.uz/api/craftsmen?limit=5
```

### Check CORS Headers
```bash
# Check CORS headers for API endpoint
curl -H "Origin: http://localhost:3001" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: X-Requested-With" -X OPTIONS https://aliboboqurilish.uz/api/health -v

# Check CORS headers for Socket.IO endpoint
curl -H "Origin: http://localhost:3001" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: X-Requested-With" -X OPTIONS https://aliboboqurilish.uz/socket.io/ -v
```

## VPS Maintenance Commands

### Restart Services
```bash
# Restart Nginx
sudo systemctl restart nginx

# Restart backend
pm2 restart alibobo-backend

# Check service status
sudo systemctl status nginx
pm2 status
```

### Update Application
```bash
# Navigate to application directory
cd /opt/alibobo

# Pull latest changes
git pull

# Install/update dependencies
npm install
cd backend && npm install && cd ..

# Rebuild frontend
npm run build

# Restart backend
pm2 restart alibobo-backend

# Reload Nginx
sudo systemctl reload nginx
```

## Common File Locations

- **Nginx configuration**: `/etc/nginx/sites-available/aliboboqurilish.uz`
- **Application directory**: `/opt/alibobo`
- **Backend logs**: `pm2 logs alibobo-backend`
- **Nginx logs**: `/var/log/nginx/`
- **SSL certificates**: Managed by Let's Encrypt in `/etc/letsencrypt/`

## Emergency Recovery

If the application becomes completely unresponsive:

1. Check if the server is accessible:
   ```bash
   ssh root@45.92.173.33
   ```

2. Check system resources:
   ```bash
   df -h  # Check disk space
   free -h  # Check memory
   top  # Check CPU usage
   ```

3. Restart all services:
   ```bash
   sudo systemctl restart nginx
   pm2 restart alibobo-backend
   ```

4. If still not working, check logs for specific errors:
   ```bash
   pm2 logs alibobo-backend
   sudo tail -f /var/log/nginx/error.log
   ```