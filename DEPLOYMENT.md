# Production Deployment Guide

## VPS Deployment Steps

### 1. Prepare Your VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### 2. Clone Repository

```bash
cd /var/www
git clone https://github.com/your-org/alibobo.git
cd alibobo
```

### 3. Install Dependencies

```bash
npm install
cd backend && npm install && cd ..
```

### 4. Configure Environment

```bash
# Copy example files
cp .env.example .env
cp backend/.env.example backend/.env

# Edit with your production values
nano backend/.env
nano .env
```

Update the following in `backend/.env`:
- `MONGODB_URI` - Your MongoDB Atlas connection
- `JWT_SECRET` - Generate a strong secret: `openssl rand -base64 32`
- `ALLOWED_ORIGINS` - Your domain
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token (optional)
- `TELEGRAM_CHAT_ID` - Your Telegram chat ID (optional)

### 5. Build Frontend

```bash
npm run build
```

### 6. Start Backend with PM2

```bash
pm2 start backend/server.js --name "alibobo-backend" --env production
pm2 save
pm2 startup
```

### 7. Configure Nginx

Create `/etc/nginx/sites-available/alibobo`:

```nginx
upstream backend {
    server localhost:5001;
}

server {
    listen 80;
    server_name aliboboqurilish.uz www.aliboboqurilish.uz;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name aliboboqurilish.uz www.aliboboqurilish.uz;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/aliboboqurilish.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aliboboqurilish.uz/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    gzip_min_length 1000;

    # Frontend static files
    location / {
        root /var/www/alibobo/build;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://backend/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Uploads
    location /uploads/ {
        proxy_pass http://backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/alibobo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d aliboboqurilish.uz -d www.aliboboqurilish.uz
```

### 9. Monitor and Maintain

```bash
# View logs
pm2 logs alibobo-backend

# Monitor processes
pm2 monit

# Restart on reboot
pm2 startup
pm2 save
```

## Updating Production

### Pull Latest Changes

```bash
cd /var/www/alibobo
git pull origin main
```

### Rebuild Frontend

```bash
npm install
npm run build
```

### Restart Backend

```bash
pm2 restart alibobo-backend
```

### Reload Nginx

```bash
sudo systemctl reload nginx
```

## Troubleshooting

### Check Backend Status
```bash
pm2 status
pm2 logs alibobo-backend
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
```

### View Error Logs
```bash
sudo tail -f /var/log/nginx/error.log
pm2 logs alibobo-backend --err
```

### Restart Services
```bash
pm2 restart alibobo-backend
sudo systemctl restart nginx
```

## Performance Optimization

### Enable Caching
- Frontend: Static files cached for 1 hour
- API responses: Configured in backend
- Images: Cached for 30 days

### Database Optimization
- Ensure MongoDB indexes are created
- Monitor query performance
- Use connection pooling

### Monitoring
- Monitor CPU and memory usage
- Check disk space
- Monitor MongoDB performance
- Set up alerts for errors

## Security Checklist

- [ ] Change JWT_SECRET to a strong value
- [ ] Update ALLOWED_ORIGINS with your domain
- [ ] Enable SSL/TLS with Let's Encrypt
- [ ] Configure firewall rules
- [ ] Set up regular backups
- [ ] Monitor error logs
- [ ] Keep dependencies updated
- [ ] Use strong database passwords
- [ ] Enable rate limiting
- [ ] Configure CORS properly

## Backup Strategy

```bash
# Backup MongoDB
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/alibobo" --out /backups/alibobo-$(date +%Y%m%d)

# Backup uploads
tar -czf /backups/uploads-$(date +%Y%m%d).tar.gz /var/www/alibobo/backend/uploads/
```

## Support

For issues, check logs and refer to the main README.md
