# CORS Duplicate Headers Fix

## Problem
The website was showing CORS errors with duplicate `Access-Control-Allow-Origin` headers:
```
The 'Access-Control-Allow-Origin' header contains multiple values 'https://www.aliboboqurilish.uz, https://www.aliboboqurilish.uz', but only one is allowed
```

This happened because both Nginx and the backend were setting CORS headers.

## Solution
1. **Remove CORS headers from Nginx** - Let Nginx just proxy requests
2. **Configure CORS properly in the backend** - Handle all CORS logic in Node.js
3. **Clean configuration** - Avoid duplicate header conflicts

## Changes Made

### 1. Backend Changes (`backend/server.js`)
- ✅ Configured CORS middleware to handle all environments
- ✅ Added proper origin validation
- ✅ Set correct CORS headers and methods
- ✅ Added preflight request handling

### 2. Nginx Configuration
- ✅ Removed all `add_header Access-Control-Allow-*` directives
- ✅ Clean proxy configuration for API and Socket.IO
- ✅ No CORS headers in Nginx - backend handles everything

### 3. Deployment Scripts
- ✅ `fix-cors-duplicate-headers.sh` - Fixes Nginx config and restarts services
- ✅ `deploy-cors-fix.sh` - Deploys changes to production server
- ✅ `test-cors-fix.sh` - Tests CORS configuration

## How to Deploy

### Option 1: Quick Deploy (Recommended)
```bash
# Run this from your local machine
bash deploy-cors-fix.sh
```

### Option 2: Manual Steps
```bash
# 1. Upload backend changes
scp backend/server.js root@aliboboqurilish.uz:/opt/alibobo/backend/

# 2. Upload fix script
scp fix-cors-duplicate-headers.sh root@aliboboqurilish.uz:/opt/alibobo/

# 3. SSH to server and run fix
ssh root@aliboboqurilish.uz
cd /opt/alibobo
chmod +x fix-cors-duplicate-headers.sh
./fix-cors-duplicate-headers.sh
```

### Option 3: Individual Commands (if needed)
```bash
# On the server:
sudo cp /etc/nginx/sites-available/aliboboqurilish.uz /etc/nginx/sites-available/aliboboqurilish.uz.backup
# (Apply new Nginx config - see fix-cors-duplicate-headers.sh)
sudo nginx -t
sudo systemctl reload nginx
pm2 restart alibobo-backend
```

## Testing

### 1. Browser Test
- Visit https://www.aliboboqurilish.uz
- Open browser console (F12)
- Should see no CORS errors
- Products should load properly

### 2. Command Line Test
```bash
# Test API endpoint
curl -I -H "Origin: https://www.aliboboqurilish.uz" https://aliboboqurilish.uz/api/products/fast?limit=1

# Should see single Access-Control-Allow-Origin header
```

### 3. Automated Test
```bash
# Run on server
bash test-cors-fix.sh
```

## Expected Results

### ✅ Success Indicators
- No CORS errors in browser console
- Products load on the website
- Socket.IO connects successfully
- Single `Access-Control-Allow-Origin` header in responses

### ❌ If Still Having Issues
1. Check PM2 logs: `pm2 logs alibobo-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify Nginx config: `sudo nginx -t`
4. Restart services: `pm2 restart alibobo-backend && sudo systemctl reload nginx`

## Technical Details

### CORS Flow
1. Browser sends request to `https://aliboboqurilish.uz/api/*`
2. Nginx proxies to `localhost:5000/api/*`
3. Backend Node.js handles CORS headers
4. Response includes proper CORS headers
5. Browser allows the request

### Key Configuration
- **Nginx**: Pure proxy, no CORS headers
- **Backend**: Full CORS handling with origin validation
- **Origins**: `https://aliboboqurilish.uz` and `https://www.aliboboqurilish.uz`
- **Methods**: GET, POST, PUT, DELETE, OPTIONS, PATCH
- **Credentials**: Enabled for authentication

## Rollback Plan
If something goes wrong:
```bash
# Restore Nginx backup
sudo cp /etc/nginx/sites-available/aliboboqurilish.uz.backup.* /etc/nginx/sites-available/aliboboqurilish.uz
sudo nginx -t
sudo systemctl reload nginx
```

The backup files are automatically created with timestamps by the fix script.