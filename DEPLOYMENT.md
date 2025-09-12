# Alibobo Deployment Guide

This guide provides step-by-step instructions for deploying the Alibobo application to a VPS.

## Prerequisites

1. VPS with Ubuntu 20.04 or later
2. Domain name pointing to VPS IP address
3. SSH access to the VPS

## Deployment Steps

### 1. Prepare the VPS

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install necessary packages
sudo apt install -y nodejs npm nginx git curl

# Install PM2 globally for process management
sudo npm install -g pm2
```

### 2. Clone the Repository

```bash
# Create application directory
sudo mkdir -p /opt/alibobo

# Clone the repository
sudo git clone https://github.com/your-username/alibobo.git /opt/alibobo

# Set proper permissions
sudo chown -R $USER:$USER /opt/alibobo
```

### 3. Build the Frontend

```bash
# Navigate to project directory
cd /opt/alibobo

# Install frontend dependencies
npm install

# Build the frontend for production
npm run build
```

### 4. Set Up Backend

```bash
# Navigate to backend directory
cd /opt/alibobo/backend

# Install backend dependencies
npm install

# Create uploads directory
mkdir -p uploads/products
```

### 5. Configure Environment Variables

Create `/opt/alibobo/backend/.env` with the following content:

```
# MongoDB Atlas
MONGODB_URI=mongodb+srv://ozodbek:9KS0xaLkMnnqqE3L@cluster0.dlopces.mongodb.net/alibobo?retryWrites=true&w=majority&appName=Cluster0

# Production Environment
NODE_ENV=production

# Server Configuration
PORT=5001
TRUST_PROXY=true

# CORS Configuration
CORS_ORIGIN=https://aliboboqurilish.uz,http://localhost:3000,http://localhost:3001
```

### 6. Configure Nginx

Create `/etc/nginx/sites-available/aliboboqurilish.uz` with the following content:

```
server {
    listen 80;
    server_name aliboboqurilish.uz www.aliboboqurilish.uz;

    # Frontend static files
    location / {
        root /opt/alibobo/build;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }

    # API proxy with proper CORS handling
    location /api/ {
        proxy_pass http://localhost:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers for API
        add_header Access-Control-Allow-Origin "http://localhost:3001" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "http://localhost:3001";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
            add_header Access-Control-Allow-Credentials "true";
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
        
        # CORS headers for Socket.IO
        add_header Access-Control-Allow-Origin "http://localhost:3001" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }

    # Uploads proxy
    location /uploads/ {
        proxy_pass http://localhost:5001/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers for uploads
        add_header Access-Control-Allow-Origin "http://localhost:3001" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;
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

    # Let's Encrypt challenge location
    location ~ /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
```

Enable the Nginx configuration:

```bash
# Remove existing symbolic links
sudo rm -f /etc/nginx/sites-enabled/aliboboqurilish.uz

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/aliboboqurilish.uz /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 7. Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d aliboboqurilish.uz -d www.aliboboqurilish.uz
```

### 8. Start the Application with PM2

Create `/opt/alibobo/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'alibobo-backend',
    script: './backend/server.js',
    cwd: '/opt/alibobo',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1G'
  }]
};
```

Start the application:

```bash
# Navigate to project directory
cd /opt/alibobo

# Start backend with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
sudo pm2 startup systemd -u $USER --hp /home/$USER
```

### 9. Final Steps

```bash
# Check application status
pm2 status

# Check logs
pm2 logs

# Restart Nginx one more time
sudo systemctl restart nginx
```

## Troubleshooting

1. If you encounter CORS errors, verify the CORS_ORIGIN in the backend .env file includes your domain
2. If the frontend can't connect to the backend, check that the backend is running on port 5001
3. If images aren't loading, verify the Nginx configuration for the /uploads/ location
4. If you get 504 Gateway Timeout errors, increase the proxy timeout values in Nginx

## Updating the Application

To update the application:

```bash
# Navigate to project directory
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