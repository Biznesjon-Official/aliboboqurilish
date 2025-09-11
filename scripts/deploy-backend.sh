#!/bin/bash

# Deployment script for Alibobo backend
echo "🚀 Starting Alibobo backend deployment..."

# Check if we're on the production server
if [ "$HOSTNAME" != "alibobo-server" ]; then
    echo "⚠️  This script should only be run on the production server"
    exit 1
fi

# Navigate to the project directory
cd /opt/alibobo || exit 1

# Pull the latest code from repository
echo "📥 Pulling latest code..."
git pull origin main

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install --production

# Copy production environment file
echo "📋 Copying production environment configuration..."
cp backend/.env.production backend/.env

# Restart the backend service
echo "🔄 Restarting backend service..."
pm2 restart alibobo-backend || pm2 start backend/server.js --name alibobo-backend

# Show status
pm2 list

echo "✅ Deployment completed successfully!"