#!/bin/bash

# Comprehensive fix script for Alibobo application
echo "🚀 Starting comprehensive fix for Alibobo application..."

# 1. Fix Nginx configuration to eliminate duplicate CORS headers
echo "🔧 Fixing Nginx configuration..."
sudo tee /etc/nginx/sites-available/aliboboqurilish.uz > /dev/null <<'EOF'
server {
    listen 80;
    server_name aliboboqurilish.uz www.aliboboqurilish.uz;

    # Let's Encrypt challenge location
    location ~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP requests to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name aliboboqurilish.uz www.aliboboqurilish.uz;

    # SSL certificate paths (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/aliboboqurilish.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aliboboqurilish.uz/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Frontend static files
    location / {
        root /opt/alibobo/build;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-XSS-Protection "1; mode=block";
        add_header X-Content-Type-Options "nosniff";
        add_header Referrer-Policy "no-referrer-when-downgrade";
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'";
    }

    # API proxy with proper CORS handling
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Dynamic CORS headers - allow the actual origin
        add_header Access-Control-Allow-Origin $http_origin;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        add_header Access-Control-Allow-Credentials "true";
        add_header Access-Control-Max-Age 86400;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $http_origin;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Socket.IO proxy
    location /socket.io/ {
        proxy_pass http://localhost:5001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Dynamic CORS headers for Socket.IO
        add_header Access-Control-Allow-Origin $http_origin;
        add_header Access-Control-Allow-Credentials "true";
    }

    # Uploads proxy
    location /uploads/ {
        proxy_pass http://localhost:5001/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Dynamic CORS headers for uploads
        add_header Access-Control-Allow-Origin $http_origin;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        add_header Access-Control-Allow-Credentials "true";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5001/api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Create symbolic link if it doesn't exist
echo "🔗 Creating symbolic link..."
sudo rm -f /etc/nginx/sites-enabled/aliboboqurilish.uz
sudo ln -s /etc/nginx/sites-available/aliboboqurilish.uz /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "🔍 Testing Nginx configuration..."
sudo nginx -t

# 2. Check and fix MongoDB connection issues
echo "🔍 Checking MongoDB connection..."
cd /opt/alibobo/backend

# Check if MongoDB URI is properly configured
MONGO_URI=$(grep "MONGODB_URI\|MONGO_URI" .env | cut -d '=' -f2)
if [ -z "$MONGO_URI" ]; then
    echo "❌ MongoDB URI not found in .env file"
    echo "🔧 Adding MongoDB URI to .env file..."
    echo "MONGODB_URI=mongodb+srv://ozodbek:GGClW0p1qdzXtZ9W@ac-x48uxjk.dlopces.mongodb.net/alibobo?retryWrites=true&w=majority&appName=Cluster0" >> .env
    MONGO_URI="mongodb+srv://ozodbek:GGClW0p1qdzXtZ9W@ac-x48uxjk.dlopces.mongodb.net/alibobo?retryWrites=true&w=majority&appName=Cluster0"
fi

echo "🔗 Testing MongoDB connection..."
node -e "
const mongoose = require('mongoose');
mongoose.connect('$MONGO_URI', {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000
}).then(() => {
  console.log('✅ MongoDB connection successful');
  mongoose.connection.close();
}).catch(err => {
  console.log('❌ MongoDB connection failed:', err.message);
});
"

# 3. Restart backend with updated environment
echo "🔄 Restarting backend with updated environment..."
pm2 restart alibobo-backend --update-env

# 4. Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

# 5. Set up automatic certificate renewal if not already set
echo "⏰ Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null | grep -q certbot) || (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# 6. Verify services
echo "🔍 Verifying services..."
echo "Nginx status:"
sudo systemctl is-active nginx
echo "Backend status:"
pm2 status alibobo-backend

echo "✅ Comprehensive fix completed!"
echo "📋 Please check the following:"
echo "  1. Access your site at https://www.aliboboqurilish.uz"
echo "  2. Check browser console for any remaining errors"
echo "  3. Verify API endpoints are working"
echo "  4. Confirm Socket.IO connections are established"