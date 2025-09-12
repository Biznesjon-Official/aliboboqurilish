# Windows VPS Deploy Guide

## 1. VPS ga ulanish

### Option A: Windows Terminal/PowerShell
```powershell
ssh root@45.92.173.33
# Password: 20100804
```

### Option B: PuTTY
- Host: 45.92.173.33
- Port: 22
- Username: root
- Password: 20100804

## 2. VPS da bajarilishi kerak bo'lgan komandalar

VPS ga ulanganingizdan keyin quyidagi komandalarni ketma-ket bajaring:

### 2.1. Hozirgi holatni tekshirish
```bash
pm2 ls
```

### 2.2. Barcha PM2 jarayonlarini to'xtatish
```bash
pm2 stop all
pm2 delete all
```

### 2.3. Eski loyihani backup qilish
```bash
cd /opt
ls -la
mv alibobo alibobo-backup-$(date +%Y%m%d-%H%M%S)
```

### 2.4. Yangi loyihani GitHub'dan yuklash
```bash
git clone https://github.com/ozodbek2410/alibobo.git
cd alibobo
ls -la
```

### 2.5. Dependencies o'rnatish
```bash
npm install
cd backend
npm install
cd ..
```

### 2.6. Production environment fayllarini yaratish

#### Backend environment:
```bash
cat > backend/.env.production << 'EOF'
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://ozodbek:9KS0xaLkMnnqqE3L@cluster0.dlopces.mongodb.net/alibobo?retryWrites=true&w=majority&appName=Cluster0
TRUST_PROXY=true
ENABLE_CLUSTERING=true
CORS_ORIGIN=https://aliboboqurilish.uz,https://www.aliboboqurilish.uz,http://aliboboqurilish.uz,http://www.aliboboqurilish.uz
RATE_LIMIT_MAX=1000
DEBUG=false
SKIP_INDEX_CREATION=false
EOF
```

#### Frontend environment:
```bash
cat > .env.production << 'EOF'
REACT_APP_API_BASE=https://aliboboqurilish.uz/api
REACT_APP_SOCKET_URL=https://aliboboqurilish.uz
GENERATE_SOURCEMAP=false
EOF
```

### 2.7. Frontend build qilish
```bash
npm run build
```

### 2.8. PM2 ecosystem faylini yaratish
```bash
cat > ecosystem.config.js << 'EOF'
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
EOF
```

### 2.9. Kerakli papkalarni yaratish
```bash
mkdir -p logs backend/uploads
```

### 2.10. Nginx konfiguratsiyasini yaratish
```bash
cat > /etc/nginx/sites-available/aliboboqurilish.uz << 'EOF'
server {
    listen 80;
    server_name aliboboqurilish.uz www.aliboboqurilish.uz;
    
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
    
    # API proxy
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
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    # Socket.IO proxy
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
    
    # Uploads proxy
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
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
EOF
```

### 2.11. Nginx saytini yoqish
```bash
ln -sf /etc/nginx/sites-available/aliboboqurilish.uz /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 2.12. PM2 bilan ilovani ishga tushirish
```bash
cd /opt/alibobo
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2.13. Holatni tekshirish
```bash
pm2 ls
pm2 logs --lines 10
```

## 3. Tekshirish

Deploy tugagandan keyin:

1. **PM2 holatini tekshirish:**
   ```bash
   pm2 status
   ```

2. **Loglarni ko'rish:**
   ```bash
   pm2 logs alibobo-backend
   ```

3. **Nginx holatini tekshirish:**
   ```bash
   systemctl status nginx
   ```

4. **Saytni tekshirish:**
   - Browser'da: http://aliboboqurilish.uz
   - API: http://aliboboqurilish.uz/api/health

## 4. Foydali komandalar

```bash
# Ilovani qayta ishga tushirish
pm2 restart alibobo-backend

# Loglarni kuzatish
pm2 logs alibobo-backend --lines 50

# Resurs monitoring
pm2 monit

# Nginx qayta yuklash
systemctl reload nginx

# Nginx loglarini ko'rish
tail -f /var/log/nginx/error.log
```

## 5. Muammolarni hal qilish

Agar biror narsa ishlamasa:

1. **PM2 loglarini tekshiring:**
   ```bash
   pm2 logs alibobo-backend
   ```

2. **Nginx loglarini tekshiring:**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

3. **Port band emasligini tekshiring:**
   ```bash
   netstat -tlnp | grep :5000
   ```

4. **MongoDB ulanishini tekshiring:**
   ```bash
   cd /opt/alibobo/backend
   node -e "console.log(process.env.MONGODB_URI || 'No MongoDB URI found')"
   ```