#!/bin/bash

# SSL Certificate Setup Script
echo "🔒 Setting up SSL certificate for aliboboqurilish.uz..."

VPS_HOST="45.92.173.33"
VPS_USER="root"
VPS_PASSWORD="20100804"

# Create SSL setup script
cat > temp_ssl_setup.sh << 'EOF'
#!/bin/bash

echo "🔒 Installing SSL certificate for aliboboqurilish.uz..."

# Update system
apt update

# Install snapd if not installed
if ! command -v snap &> /dev/null; then
    echo "📦 Installing snapd..."
    apt install snapd -y
    systemctl enable snapd
    systemctl start snapd
    sleep 5
fi

# Install certbot
echo "📦 Installing certbot..."
snap install core; snap refresh core
snap install --classic certbot

# Create symlink
ln -sf /snap/bin/certbot /usr/bin/certbot

# Stop nginx temporarily
echo "🛑 Stopping nginx temporarily..."
systemctl stop nginx

# Get SSL certificate
echo "🔒 Obtaining SSL certificate..."
certbot certonly --standalone \
    --email ozodbek2410@gmail.com \
    --agree-tos \
    --no-eff-email \
    -d aliboboqurilish.uz \
    -d www.aliboboqurilish.uz

# Update Nginx configuration with SSL
echo "🔧 Updating Nginx configuration with SSL..."
cat > /etc/nginx/sites-available/aliboboqurilish.uz << 'NGINXEOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name aliboboqurilish.uz www.aliboboqurilish.uz;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name aliboboqurilish.uz www.aliboboqurilish.uz;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/aliboboqurilish.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aliboboqurilish.uz/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
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

# Test nginx configuration
echo "🔧 Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Start nginx
    echo "🚀 Starting Nginx..."
    systemctl start nginx
    systemctl enable nginx
    
    # Setup auto-renewal
    echo "🔄 Setting up SSL auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --nginx") | crontab -
    
    echo "📊 SSL Certificate Status:"
    certbot certificates
    
    echo ""
    echo "✅ SSL setup completed successfully!"
    echo "🌐 Your website is now available at:"
    echo "   https://aliboboqurilish.uz"
    echo "   https://www.aliboboqurilish.uz"
    echo ""
    echo "🔒 SSL certificate will auto-renew every 90 days"
    
else
    echo "❌ Nginx configuration has errors"
    nginx -t
    exit 1
fi

EOF

# Execute on VPS
echo "📤 Uploading SSL setup script..."
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no temp_ssl_setup.sh "$VPS_USER@$VPS_HOST:/tmp/"

echo "▶️ Setting up SSL on VPS..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "chmod +x /tmp/temp_ssl_setup.sh && /tmp/temp_ssl_setup.sh"

# Clean up
rm -f temp_ssl_setup.sh

echo ""
echo "🎉 SSL setup completed!"
echo "🌐 Your website: https://aliboboqurilish.uz"