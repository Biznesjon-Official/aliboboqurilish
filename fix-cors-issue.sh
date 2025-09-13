#!/bin/bash

# Fix CORS Issue Script
echo "🔧 Fixing CORS issue for Alibobo..."

VPS_HOST="45.92.173.33"
VPS_USER="root"
VPS_PASSWORD="20100804"

# Create fix script
cat > temp_cors_fix.sh << 'EOF'
#!/bin/bash

echo "🔧 Fixing CORS configuration..."

# Update Nginx configuration to handle both domains properly
cat > /etc/nginx/sites-available/aliboboqurilish.uz << 'NGINXEOF'
server {
    listen 80;
    server_name aliboboqurilish.uz www.aliboboqurilish.uz;
    
    root /opt/alibobo/build;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # API proxy with proper CORS
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Enhanced CORS headers
        add_header Access-Control-Allow-Origin "https://www.aliboboqurilish.uz" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://www.aliboboqurilish.uz" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH" always;
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control" always;
            add_header Access-Control-Allow-Credentials "true" always;
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type "text/plain charset=UTF-8";
            return 204;
        }
    }
    
    # Socket.IO proxy with CORS
    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS for Socket.IO
        add_header Access-Control-Allow-Origin "https://www.aliboboqurilish.uz" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }
    
    # Uploads proxy
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS for uploads
        add_header Access-Control-Allow-Origin "https://www.aliboboqurilish.uz" always;
        
        # Cache static files
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # Static files
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Security - deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
NGINXEOF

echo "🔧 Updating backend CORS configuration..."
cd /opt/alibobo

# Update backend environment to include www subdomain
cat > backend/.env.production << 'ENVEOF'
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://ozodbek:9KS0xaLkMnnqqE3L@cluster0.dlopces.mongodb.net/alibobo?retryWrites=true&w=majority&appName=Cluster0

# Security settings
TRUST_PROXY=true
ENABLE_CLUSTERING=true
CORS_ORIGIN=https://www.aliboboqurilish.uz,https://aliboboqurilish.uz,http://www.aliboboqurilish.uz,http://aliboboqurilish.uz

# Performance settings
RATE_LIMIT_MAX=1000
DEBUG=false
SKIP_INDEX_CREATION=false
ENVEOF

echo "🔧 Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    echo "🔄 Reloading Nginx..."
    systemctl reload nginx
    
    echo "🔄 Restarting backend with new CORS settings..."
    pm2 restart alibobo-backend --update-env
    
    echo "📊 Checking services..."
    pm2 ls
    
    echo "🌐 Testing API endpoint..."
    sleep 3
    curl -I -H "Origin: https://www.aliboboqurilish.uz" http://localhost/api/products/fast?limit=1
    
    echo ""
    echo "✅ CORS fix completed!"
    echo "🌐 Website: https://www.aliboboqurilish.uz"
    echo "🔧 API: https://www.aliboboqurilish.uz/api"
else
    echo "❌ Nginx configuration has errors. Please check manually."
    nginx -t
fi

EOF

# Execute on VPS
echo "📤 Uploading CORS fix script..."
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no temp_cors_fix.sh "$VPS_USER@$VPS_HOST:/tmp/"

echo "▶️ Executing CORS fix on VPS..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "chmod +x /tmp/temp_cors_fix.sh && /tmp/temp_cors_fix.sh"

# Clean up
rm -f temp_cors_fix.sh

echo ""
echo "🎉 CORS fix completed!"
echo "🌐 Test your website: https://www.aliboboqurilish.uz"