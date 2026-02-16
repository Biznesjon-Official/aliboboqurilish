# Production Setup Guide

## Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Nginx server
- PM2 for process management
- SSL certificate (Let's Encrypt)

## Environment Setup

### 1. Clone and Install
```bash
git clone <your-repo>
cd alibobo
npm install
cd backend && npm install && cd ..
```

### 2. Configure Environment Variables

Create `backend/.env` from `backend/.env.example`:
```bash
cp backend/.env.example backend/.env
```

Fill in your actual values:
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/alibobo
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### 3. Build Frontend
```bash
npm run build
```

### 4. Setup PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 5. Configure Nginx
```bash
sudo cp nginx-alibobo.conf /etc/nginx/sites-available/alibobo
sudo ln -s /etc/nginx/sites-available/alibobo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL with Let's Encrypt
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7. Setup Monitoring
```bash
# Install Sentry for error tracking
npm install @sentry/node

# Setup log rotation
sudo apt-get install logrotate
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] SSL certificate installed
- [ ] PM2 configured and running
- [ ] Nginx reverse proxy working
- [ ] Monitoring/logging setup
- [ ] Rate limiting configured
- [ ] CORS origins whitelisted
- [ ] Admin credentials changed
- [ ] Database indexes created

## Monitoring

### Check Service Status
```bash
pm2 status
pm2 logs
```

### View Logs
```bash
tail -f logs/app.log
tail -f logs/error.log
```

### Database Backups
```bash
# MongoDB Atlas automatic backups are enabled
# Manual backup:
mongodump --uri "mongodb+srv://..." --out ./backup
```

## Security Best Practices

1. **Credentials**: Use environment variables, never commit secrets
2. **CORS**: Whitelist only your domains
3. **Rate Limiting**: Adjust based on your traffic
4. **SSL**: Always use HTTPS in production
5. **Monitoring**: Setup error tracking and alerting
6. **Backups**: Regular database backups
7. **Updates**: Keep dependencies updated

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check connection string
# Verify IP whitelist in MongoDB Atlas
# Check network connectivity
```

### High Memory Usage
```bash
pm2 monit
pm2 restart alibobo
```

### SSL Certificate Issues
```bash
sudo certbot renew --dry-run
sudo certbot renew
```

## Support
For issues, check logs and error tracking system.
