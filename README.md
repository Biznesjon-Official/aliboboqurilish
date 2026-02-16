# Alibobo - E-Commerce Platform

Production-ready MERN stack e-commerce platform with real-time updates, authentication, and comprehensive monitoring.

## Features

- ✅ Full-stack MERN (MongoDB, Express, React, Node.js)
- ✅ Real-time updates with Socket.IO
- ✅ JWT Authentication & Authorization
- ✅ Comprehensive error handling & logging
- ✅ Rate limiting & security headers
- ✅ Docker & Docker Compose support
- ✅ CI/CD with GitHub Actions
- ✅ Performance monitoring
- ✅ Automated backups
- ✅ Production-ready configuration

## Quick Start

### Development

```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Setup environment
cp .env.example .env
cp backend/.env.example backend/.env

# Start development server
npm run dev
```

### Production

```bash
# Build frontend
npm run build

# Setup environment
cp backend/.env.example backend/.env
# Edit backend/.env with production values

# Start with PM2
pm2 start ecosystem.config.js --env production

# Or with Docker
docker-compose up -d
```

## Environment Variables

### Frontend (.env)
```env
REACT_APP_API_BASE_URL=https://api.yourdomain.com
REACT_APP_SOCKET_URL=https://yourdomain.com
REACT_APP_DEBUG_MODE=false
```

### Backend (backend/.env)
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
ALLOWED_ORIGINS=https://yourdomain.com
TELEGRAM_BOT_TOKEN=optional
TELEGRAM_CHAT_ID=optional
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify token

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status

### Health
- `GET /api/health` - Health check

## Deployment

See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for detailed deployment instructions.

### Quick Deploy with Docker

```bash
# Build image
docker build -t alibobo:latest .

# Run container
docker run -d \
  -p 5001:5001 \
  -e MONGODB_URI=mongodb+srv://... \
  -e JWT_SECRET=your_secret \
  alibobo:latest
```

## Monitoring

### Logs
```bash
# View application logs
tail -f logs/app.log

# View error logs
tail -f logs/error.log
```

### Performance
```bash
# Check PM2 status
pm2 status
pm2 monit
```

### Health Check
```bash
curl http://localhost:5001/api/health
```

## Security

- ✅ Environment variables for secrets
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ MongoDB injection prevention
- ✅ HTTPS/SSL support
- ✅ Input validation

## Database

### MongoDB Atlas Setup
1. Create cluster at mongodb.com
2. Create database user
3. Whitelist IP addresses
4. Get connection string
5. Add to `.env` as `MONGODB_URI`

### Indexes
```bash
cd backend
npm run db:indexes
```

### Backups
```bash
# Manual backup
npm run backup

# Automatic backups (configured in code)
```

## Testing

```bash
# Run tests
npm test

# Run backend tests
cd backend && npm test
```

## Performance

- Compression enabled
- Caching strategies
- Database indexing
- Rate limiting
- Connection pooling

## Troubleshooting

### MongoDB Connection Issues
- Check connection string
- Verify IP whitelist in MongoDB Atlas
- Check network connectivity

### High Memory Usage
```bash
pm2 restart alibobo
```

### SSL Certificate Issues
```bash
sudo certbot renew
```

## Contributing

1. Create feature branch
2. Make changes
3. Run tests
4. Submit pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
