#!/bin/bash

echo "🔧 Fixing CORS duplicate headers issue..."

# Backup current Nginx config
sudo cp /etc/nginx/sites-available/aliboboqurilish.uz /etc/nginx/sites-available/aliboboqurilish.uz.backup.$(date +%Y%m%d_%H%M%S)

# Create a clean Nginx config without CORS headers
sudo tee /etc/nginx/sites-available/aliboboqurilish.uz > /dev/null << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name aliboboqurilish.uz www.aliboboqurilish.uz;
    
    # API and Socket.IO - no redirect, proxy directly
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Everything else redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name aliboboqurilish.uz www.aliboboqurilish.uz;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/aliboboqurilish.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aliboboqurilish.uz/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    root /opt/alibobo/build;
    index index.html;
    
    # API proxy - CORS handled by backend
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Socket.IO proxy - CORS handled by backend
    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static file serving
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

echo "✅ Created clean Nginx config without CORS headers"

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    
    # Reload Nginx
    echo "🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
    
    # Restart backend to ensure CORS is properly configured
    echo "🔄 Restarting backend..."
    pm2 restart alibobo-backend
    echo "✅ Backend restarted"
    
    # Wait a moment for services to start
    sleep 3
    
    # Test the API
    echo "🧪 Testing API endpoint..."
    curl -I -H "Origin: https://www.aliboboqurilish.uz" https://aliboboqurilish.uz/api/products/fast?limit=1
    
    echo ""
    echo "🎉 CORS fix completed!"
    echo "📝 The backend now handles CORS headers, Nginx just proxies requests"
    echo "🔍 Check browser console - CORS errors should be resolved"
    
else
    echo "❌ Nginx configuration test failed"
    echo "🔄 Restoring backup..."
    sudo cp /etc/nginx/sites-available/aliboboqurilish.uz.backup.* /etc/nginx/sites-available/aliboboqurilish.uz
    exit 1
fi