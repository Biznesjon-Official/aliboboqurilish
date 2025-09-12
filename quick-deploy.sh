#!/bin/bash

# Quick VPS Deploy Script
# This script will connect to your VPS and run all deployment commands

echo "🚀 Quick VPS Deployment for Alibobo"
echo "=================================="

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass is not installed. Installing..."
    
    # Try to install sshpass based on the system
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y sshpass
    elif command -v yum &> /dev/null; then
        sudo yum install -y sshpass
    elif command -v brew &> /dev/null; then
        brew install hudochenkov/sshpass/sshpass
    else
        echo "❌ Cannot install sshpass automatically. Please install it manually."
        echo "Then run this script again or use the manual commands in vps-manual-commands.txt"
        exit 1
    fi
fi

# VPS Details
VPS_HOST="45.92.173.33"
VPS_USER="root"
VPS_PASSWORD="20100804"

echo "🔗 Connecting to VPS: $VPS_USER@$VPS_HOST"

# Create a temporary script to run on the VPS
cat > temp_deploy_script.sh << 'EOF'
#!/bin/bash

echo "🔍 Checking current PM2 processes..."
pm2 ls

echo "🛑 Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

echo "📁 Backing up existing project..."
cd /opt
if [ -d "alibobo" ]; then
    mv alibobo alibobo-backup-$(date +%Y%m%d-%H%M%S)
    echo "✅ Backup created"
else
    echo "ℹ️ No existing project found"
fi

echo "📥 Cloning fresh project from GitHub..."
git clone https://github.com/ozodbek2410/alibobo.git
cd alibobo

echo "📦 Installing dependencies..."
npm install
cd backend && npm install && cd ..

echo "⚙️ Creating production environment files..."

# Backend environment
cat > backend/.env.production << 'ENVEOF'
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://ozodbek:9KS0xaLkMnnqqE3L@cluster0.dlopces.mongodb.net/alibobo?retryWrites=true&w=majority&appName=Cluster0
TRUST_PROXY=true
ENABLE_CLUSTERING=true
CORS_ORIGIN=https://aliboboqurilish.uz,https://www.aliboboqurilish.uz,http://aliboboqurilish.uz,http://www.aliboboqurilish.uz
RATE_LIMIT_MAX=1000
DEBUG=false
SKIP_INDEX_CREATION=false
ENVEOF

# Frontend environment
cat > .env.production << 'ENVEOF'
REACT_APP_API_BASE=https://aliboboqurilish.uz/api
REACT_APP_SOCKET_URL=https://aliboboqurilish.uz
GENERATE_SOURCEMAP=false
ENVEOF

echo "🏗️ Building frontend..."
npm run build

echo "📋 Creating PM2 ecosystem file..."
cat > ecosystem.config.js << 'PMEOF'
module.exports = {
  apps: [
    {
      name: 'alibobo-backend',
      script: './backend/server.js',
      cwd: '/opt/alibobo',
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
PMEOF

echo "📁 Creating directories..."
mkdir -p logs backend/uploads

echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/aliboboqurilish.uz << 'NGINXEOF'
server {
    listen 80;
    server_name aliboboqurilish.uz www.aliboboqurilish.uz;
    
    root /opt/alibobo/build;
    index index.html;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
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
        
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
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
    
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    location / {
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    location ~ /\. {
        deny all;
    }
}
NGINXEOF

echo "🔗 Enabling Nginx site..."
ln -sf /etc/nginx/sites-available/aliboboqurilish.uz /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "🚀 Starting application..."
cd /opt/alibobo
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "📊 Deployment status:"
pm2 ls
echo ""
echo "🎉 Deployment completed!"
echo "🌐 Website: http://aliboboqurilish.uz"
echo "🔧 API: http://aliboboqurilish.uz/api"
echo ""
echo "📝 To monitor:"
echo "pm2 logs alibobo-backend"
echo "pm2 monit"

# Clean up
rm -f /tmp/temp_deploy_script.sh
EOF

# Copy script to VPS and execute
echo "📤 Uploading deployment script to VPS..."
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no temp_deploy_script.sh "$VPS_USER@$VPS_HOST:/tmp/"

echo "▶️ Executing deployment on VPS..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "chmod +x /tmp/temp_deploy_script.sh && /tmp/temp_deploy_script.sh"

# Clean up local temp file
rm -f temp_deploy_script.sh

echo ""
echo "🎉 Deployment completed!"
echo "🌐 Your website should be available at: http://aliboboqurilish.uz"
echo ""
echo "📋 Next steps:"
echo "1. Point your domain DNS to $VPS_HOST"
echo "2. Set up SSL certificate for HTTPS"
echo "3. Monitor the application: ssh $VPS_USER@$VPS_HOST then run 'pm2 monit'"