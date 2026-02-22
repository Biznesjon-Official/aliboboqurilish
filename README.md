# Alibobo - Craftsmen & Products Platform

Modern e-commerce platform for craftsmen and products with real-time updates.

## Features

- Product catalog with fast loading
- Craftsmen directory
- Real-time notifications via Socket.IO
- Admin dashboard
- Image optimization
- JWT authentication
- Rate limiting
- CORS protection

## Tech Stack

**Frontend:**
- React 18
- React Query
- Socket.IO Client
- Tailwind CSS

**Backend:**
- Node.js + Express
- MongoDB
- Socket.IO
- JWT Authentication
- Sharp (Image processing)

## Development Setup

### Prerequisites
- Node.js 14+
- MongoDB Atlas account
- Telegram Bot Token (optional)

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-org/alibobo.git
cd alibobo
```

2. Install dependencies
```bash
npm install
cd backend && npm install && cd ..
```

3. Create environment files
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

4. Update `.env` and `backend/.env` with your configuration

5. Start development servers
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`
Backend runs on `http://localhost:5001`

## Production Deployment

### Build for Production

```bash
npm run build:prod
```

### Environment Setup

Update `backend/.env` with production values:
- `NODE_ENV=production`
- `MONGODB_URI` - Production MongoDB connection
- `JWT_SECRET` - Strong secret key
- `ALLOWED_ORIGINS` - Your production domain
- `TELEGRAM_BOT_TOKEN` - Telegram bot token (optional)

### Start Production Server

```bash
npm run start:prod
```

### Using PM2 (Recommended)

```bash
npm install -g pm2
pm2 start backend/server.js --name alibobo
pm2 save
pm2 startup
```

### Using Nginx (Reverse Proxy)

Configure Nginx to proxy requests to port 5001 and serve static files from `build/` directory.

## API Documentation

See `API_DOCUMENTATION.md` for detailed API endpoints.

## Project Structure

```
├── src/                    # Frontend source
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── services/         # API services
│   └── config/           # Configuration
├── backend/              # Backend source
│   ├── controllers/      # Route controllers
│   ├── models/          # MongoDB models
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── server.js        # Main server file
├── public/              # Static files
└── build/               # Production build (after npm run build)
```

## Environment Variables

### Frontend (.env)
- `REACT_APP_API_BASE_URL` - Backend API URL
- `REACT_APP_SOCKET_URL` - Socket.IO server URL
- `REACT_APP_DEBUG_MODE` - Enable debug logging

### Backend (backend/.env)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `ALLOWED_ORIGINS` - CORS allowed origins
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `TELEGRAM_CHAT_ID` - Telegram chat ID

## Scripts

### Development
```bash
npm run dev              # Start both frontend and backend
npm run dev:backend      # Start only backend
npm run dev:frontend     # Start only frontend
```

### Production
```bash
npm run build            # Build frontend
npm run build:prod       # Build frontend and prepare backend
npm run start:prod       # Start production server
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5001
lsof -ti:5001 | xargs kill -9
```

### MongoDB Connection Issues
- Verify MongoDB URI in `.env`
- Check IP whitelist in MongoDB Atlas
- Ensure network connectivity

### Image Upload Issues
- Check `uploads/` directory permissions
- Verify `MAX_FILE_SIZE` setting
- Check disk space

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
