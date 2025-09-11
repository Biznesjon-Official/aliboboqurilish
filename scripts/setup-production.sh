#!/bin/bash

# Setup script for Alibobo production environment
echo "🔧 Setting up Alibobo production environment..."

# Check if we're on the production server
if [ "$HOSTNAME" != "vps05950" ]; then
    echo "⚠️  This script should only be run on the production server"
    echo "💡 Run this command to execute on production server:"
    echo "   ssh root@45.92.173.33 'cd /opt/alibobo && bash scripts/setup-production.sh'"
    exit 1
fi

# Navigate to the project directory
cd /opt/alibobo || exit 1

# Create the backend .env file with production configuration
cat > backend/.env << 'EOF'
# Production Environment Configuration for Backend
NODE_ENV=production

# Server Configuration
PORT=5000
TRUST_PROXY=true

# MongoDB Configuration
MONGODB_URI=mongodb+srv://ozodbek:4C6ZNSo5zF15lJvW@cluster0.dlopces.mongodb.net/alibobo?retryWrites=true&w=majority&appName=Cluster0

# Production Features
DEBUG=false
ENABLE_LOGGING=true

# CORS Configuration for Production
CORS_ORIGIN=https://www.aliboboqurilish.uz,https://aliboboqurilish.uz,http://localhost:3000,http://127.0.0.1:3000

# Rate Limiting (stricter in production)
RATE_LIMIT_MAX=1000

# Clustering (enabled in production for better performance)
ENABLE_CLUSTERING=true

# File Upload Configuration
MAX_FILE_SIZE=50mb
UPLOAD_PATH=./uploads

# Cache Configuration (enabled in production)
CACHE_IMAGES=true
CACHE_MAX_AGE=604800
EOF

echo "✅ Production environment file created successfully!"

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Install production dependencies
echo "📦 Installing production dependencies..."
npm install --production

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start backend/server.js --name alibobo-backend --env production

# Save the PM2 configuration
pm2 save

echo "✅ Production setup completed successfully!"
echo "📊 Application status:"
pm2 list