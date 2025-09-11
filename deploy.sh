#!/bin/bash

# Alibobo Deployment Script
# This script automates the deployment process on a VPS

set -e  # Exit on any error

echo "🚀 Starting Alibobo deployment..."

# Check if we're running as root
if [ "$EUID" -eq 0 ]; then
  echo "❌ Please don't run this script as root"
  exit 1
fi

# Update system packages
echo "🔄 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install necessary packages
echo "📦 Installing required packages..."
sudo apt install -y nodejs npm nginx git curl

# Install PM2 globally
echo "🔧 Installing PM2..."
sudo npm install -g pm2

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/alibobo
sudo chown -R $USER:$USER /opt/alibobo

# Clone or update repository
if [ -d "/opt/alibobo/.git" ]; then
  echo "🔄 Updating existing repository..."
  cd /opt/alibobo
  git pull
else
  echo "📥 Cloning repository..."
  git clone https://github.com/your-username/alibobo.git /opt/alibobo
  cd /opt/alibobo
fi

# Install frontend dependencies
echo "⚙️ Installing frontend dependencies..."
npm install

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Install backend dependencies
echo "⚙️ Installing backend dependencies..."
cd backend
npm install

# Create uploads directory
echo "📂 Creating uploads directory..."
mkdir -p uploads/products

# Copy environment files
echo "📋 Setting up environment configuration..."
cp .env.production .env

# Go back to project root
cd ..

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo cp nginx-deploy.conf /etc/nginx/sites-available/aliboboqurilish.uz
sudo rm -f /etc/nginx/sites-enabled/aliboboqurilish.uz
sudo ln -s /etc/nginx/sites-available/aliboboqurilish.uz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 startOrRestart ecosystem.config.js --env production
pm2 save

echo "✅ Deployment completed successfully!"
echo "📝 Next steps:"
echo "  1. Run 'sudo certbot --nginx -d aliboboqurilish.uz -d www.aliboboqurilish.uz' to set up SSL"
echo "  2. Check application status with 'pm2 status'"
echo "  3. View logs with 'pm2 logs'"