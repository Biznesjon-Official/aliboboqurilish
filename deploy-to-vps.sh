#!/bin/bash

# VPS Deploy Script for Alibobo
# Server: root@45.92.173.33
# Domain: aliboboqurilish.uz

echo "🚀 Starting VPS deployment for Alibobo..."

# VPS connection details
VPS_HOST="45.92.173.33"
VPS_USER="root"
VPS_PASSWORD="20100804"
PROJECT_DIR="/opt/alibobo"
GITHUB_REPO="https://github.com/ozodbek2410/alibobo.git"
DOMAIN="aliboboqurilish.uz"

# Function to execute commands on VPS
execute_on_vps() {
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$1"
}

# Function to copy files to VPS
copy_to_vps() {
    sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no -r "$1" "$VPS_USER@$VPS_HOST:$2"
}

echo "📋 Step 1: Checking current PM2 processes..."
execute_on_vps "pm2 ls"

echo "🛑 Step 2: Stopping and deleting all PM2 processes..."
execute_on_vps "pm2 stop all && pm2 delete all"

echo "🗑️ Step 3: Backing up and removing old project..."
execute_on_vps "cd /opt && [ -d alibobo ] && mv alibobo alibobo-backup-$(date +%Y%m%d-%H%M%S) || echo 'No existing project found'"

echo "📥 Step 4: Cloning fresh project from GitHub..."
execute_on_vps "cd /opt && git clone $GITHUB_REPO"

echo "📦 Step 5: Installing dependencies..."
execute_on_vps "cd $PROJECT_DIR && npm install"
execute_on_vps "cd $PROJECT_DIR/backend && npm install"

echo "🔧 Step 6: Creating production environment files..."

# Create backend production environment
execute_on_vps "cat > $PROJECT_DIR/backend/.env.production << 'EOF'
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://ozodbek:9KS0xaLkMnnqqE3L@cluster0.dlopces.mongodb.net/alibobo?retryWrites=true&w=majority&appName=Cluster0

# Security settings
TRUST_PROXY=true
ENABLE_CLUSTERING=true
CORS_ORIGIN=https://aliboboqurilish.uz,https://www.aliboboqurilish.uz,http://aliboboqurilish.uz,http://www.aliboboqurilish.uz

# Performance settings
RATE_LIMIT_MAX=1000
DEBUG=false
SKIP_INDEX_CREATION=false
EOF"

# Create frontend production environment
execute_on_vps "cat > $PROJECT_DIR/.env.production << 'EOF'
REACT_APP_API_BASE=https://aliboboqurilish.uz/api
REACT_APP_SOCKET_URL=https://aliboboqurilish.uz
GENERATE_SOURCEMAP=false
EOF"

echo "🏗️ Step 7: Building frontend for production..."
execute_on_vps "cd $PROJECT_DIR && npm run build"

echo "⚙️ Step 8: Creating PM2 ecosystem file..."
execute_on_vps "cat > $PROJECT_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'alibobo-backend',
      script: './backend/server.js',
      cwd: '$PROJECT_DIR',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
};
EOF"

echo "📁 Step 9: Creating necessary directories..."
execute_on_vps "mkdir -p $PROJECT_DIR/logs"
execute_on_vps "mkdir -p $PROJECT_DIR/backend/uploads"

echo "🌐 Step 10: Setting up Nginx configuration..."
execute_on_vps "cat > /etc/nginx/sites-available/aliboboqurilish.uz << 'EOF'
server {
    listen 80;
    server_name aliboboqurilish.uz www.aliboboqurilish.uz;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name aliboboqurilish.uz www.aliboboqurilish.uz;
    
    # SSL Configuration (you'll need to add SSL certificates)
    # ssl_certificate /path/to/your/certificate.crt;
    # ssl_certificate_key /path/to/your/private.key;
    
    # For now, we'll use HTTP only
    listen 80;
    
    root $PROJECT_DIR/build;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header Referrer-Policy \"no-referrer-when-downgrade\" always;
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin \"*\" always;
        add_header Access-Control-Allow-Methods \"GET, POST, PUT, DELETE, OPTIONS\" always;
        add_header Access-Control-Allow-Headers \"Origin, X-Requested-With, Content-Type, Accept, Authorization\" always;
        
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    # Socket.IO proxy
    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Uploads proxy
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Cache static files
        expires 7d;
        add_header Cache-Control \"public, immutable\";
    }
    
    # Static files
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control \"public, immutable\";
        }
    }
    
    # Security
    location ~ /\. {
        deny all;
    }
}
EOF"

echo "🔗 Step 11: Enabling Nginx site..."
execute_on_vps "ln -sf /etc/nginx/sites-available/aliboboqurilish.uz /etc/nginx/sites-enabled/"
execute_on_vps "nginx -t && systemctl reload nginx"

echo "🚀 Step 12: Starting application with PM2..."
execute_on_vps "cd $PROJECT_DIR && pm2 start ecosystem.config.js"
execute_on_vps "pm2 save"
execute_on_vps "pm2 startup"

echo "📊 Step 13: Checking deployment status..."
execute_on_vps "pm2 ls"
execute_on_vps "pm2 logs --lines 10"

echo "🎉 Deployment completed!"
echo ""
echo "📋 Deployment Summary:"
echo "====================="
echo "🌐 Website: http://aliboboqurilish.uz"
echo "🔧 Backend API: http://aliboboqurilish.uz/api"
echo "📁 Project Directory: $PROJECT_DIR"
echo "🔄 PM2 Process: alibobo-backend"
echo ""
echo "📝 Next Steps:"
echo "1. Configure SSL certificates for HTTPS"
echo "2. Set up domain DNS to point to $VPS_HOST"
echo "3. Monitor logs: pm2 logs alibobo-backend"
echo "4. Check status: pm2 status"
echo ""
echo "🔧 Useful Commands:"
echo "pm2 restart alibobo-backend  # Restart app"
echo "pm2 logs alibobo-backend     # View logs"
echo "pm2 monit                    # Monitor resources"