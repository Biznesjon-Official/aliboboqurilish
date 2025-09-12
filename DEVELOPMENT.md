# Alibobo Unified Development Environment

This document describes the unified development environment setup for the Alibobo project.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB connection (configured in backend/.env.development)

### Starting the Development Environment

```bash
# Start both frontend and backend with one command
npm start
```

This will start:
- **Frontend (React)**: http://localhost:3000
- **Backend (Node.js/Express)**: http://localhost:5000

### Alternative Commands

```bash
# Start services individually
npm run start:frontend    # Frontend only
npm run start:backend     # Backend only

# Safe mode (doesn't kill other service if one fails)
npm run dev:safe

# Debug mode (with verbose logging)
npm run dev:debug

# Check if services are running
npm run health

# Validate setup configuration
npm run test:setup
```

## 🔧 Configuration

### Environment Files

- **Frontend**: `.env.development` - React app configuration
- **Backend**: `backend/.env.development` - Server configuration

### Proxy Configuration

The frontend automatically proxies requests to the backend:
- `/api/*` → `http://localhost:5000/api/*`
- `/uploads/*` → `http://localhost:5000/uploads/*`
- `/health` → `http://localhost:5000/api/health`

## 🖼️ Image Handling

### Image Serving
- Backend serves images from `/uploads` directory
- Frontend proxies image requests to backend
- Fallback image: `/assets/default-product.svg`

### Development Features
- Enhanced error logging for image loading issues
- Automatic fallback to default image on errors
- Backend health check for image loading failures

## 🛠️ Development Features

### Process Management
- **Colored Logs**: Backend (blue), Frontend (green)
- **Clean Logging**: Minimal logs by default, verbose mode available
- **Auto Restart**: Services restart automatically on crash (3 attempts)
- **Graceful Shutdown**: Ctrl+C stops both services cleanly

### Error Handling
- Clear error messages for service startup failures
- Proxy error handling with helpful messages
- Image loading error recovery

### Debugging
- Development-specific logging enabled
- Source maps enabled for easier debugging
- Hot reload for frontend changes

## 📁 Project Structure

```
alibobo/
├── package.json              # Root package with unified scripts
├── .env.development          # Frontend environment config
├── src/
│   ├── setupProxy.js         # Proxy configuration
│   └── components/
│       ├── OptimizedImage.jsx # Enhanced image component
│       ├── ProductCard.jsx    # Product card with image handling
│       └── ModernProductCard.jsx
├── backend/
│   ├── package.json          # Backend-specific scripts
│   ├── .env.development      # Backend environment config
│   └── server.js             # Enhanced with dev logging
├── public/
│   └── assets/
│       └── default-product.svg # Fallback image
└── scripts/
    ├── check-services.js     # Health check utility
    └── test-setup.js         # Setup validation
```

## 🧪 Testing & Validation

### Setup Validation
```bash
npm run test:setup
```
Validates:
- Dependencies installation
- Script configuration
- Environment files
- Proxy setup
- Image fallback configuration

### Service Health Check
```bash
npm run health
```
Checks if both services are responding correctly.

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes on ports 3000 and 5000
   npx kill-port 3000 5000
   ```

2. **Backend Not Starting**
   - Check MongoDB connection in `backend/.env.development`
   - Ensure all backend dependencies are installed: `cd backend && npm install`

3. **Images Not Loading**
   - Check if backend is running: `npm run health`
   - Verify proxy configuration in `src/setupProxy.js`
   - Check browser console for error messages

4. **Proxy Errors**
   - Ensure backend is running before starting frontend
   - Check CORS configuration in backend server.js

### Debug Mode

By default, logging is minimal for a cleaner development experience. To enable verbose logging:

```bash
# Enable debug mode for both services
npm run dev:debug

# Or enable individually
REACT_APP_DEBUG_MODE=true npm run start:frontend
cd backend && DEBUG=true npm run start:backend
```

**Debug mode includes:**
- Detailed proxy request logging
- Image loading success/failure logs
- MongoDB connection details
- Backend request logging

## 📝 Scripts Reference

| Script | Description |
|--------|-------------|
| `npm start` | Start both services with auto-restart |
| `npm run dev:safe` | Start both services (safe mode) |
| `npm run dev:debug` | Start both services with verbose logging |
| `npm run start:frontend` | Start frontend only |
| `npm run start:backend` | Start backend only |
| `npm run health` | Check service health |
| `npm run test:setup` | Validate setup configuration |
| `npm run build` | Build frontend for production |
| `npm run build:backend` | Build backend (if applicable) |

## 🔄 Development Workflow

1. **Start Development**
   ```bash
   npm start
   ```

2. **Verify Services**
   ```bash
   npm run health
   ```

3. **Open Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

4. **Make Changes**
   - Frontend changes trigger hot reload
   - Backend changes require manual restart

5. **Debug Issues**
   - Check console logs (colored by service)
   - Use browser dev tools for frontend issues
   - Check backend logs for API issues

## 🚀 Production Deployment

The unified development environment is for development only. For production:

1. Build frontend: `npm run build`
2. Deploy backend separately with production environment
3. Configure proper reverse proxy (nginx, etc.)
4. Use production environment variables

---

**Happy Coding! 🎉**

For issues or questions, check the troubleshooting section above or review the setup validation with `npm run test:setup`.

# Development Setup

This document explains how to run the Alibobo application locally on localhost:3000.

## Prerequisites

- Node.js (version 14 or higher)
- MongoDB Atlas account (connection string provided in environment files)

## Running the Application on localhost:3000

To run the application with the frontend on port 3000:

1. **Start the backend server** (runs on port 5001):
   ```bash
   npm run dev:backend-only
   ```

2. **In a separate terminal, start the frontend** (runs on port 3000):
   ```bash
   npm run dev:frontend-3000
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001/api
   - Backend Socket.IO: http://localhost:5001

## Environment Configuration

### Frontend (.env.development)
```
REACT_APP_API_BASE=http://localhost:5001/api
REACT_APP_SOCKET_URL=http://localhost:5001
```

### Backend (backend/.env.development)
```
# Server Configuration
PORT=5001

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001
```

## Available Scripts

- `npm run dev:backend-only` - Start only the backend server
- `npm run dev:frontend-3000` - Start only the frontend on port 3000
- `npm start` - Start both frontend (port 3001) and backend (port 5001) concurrently

## Proxy Configuration

The frontend uses a proxy configuration (`src/setupProxy.js`) to forward API requests to the backend:
- `/api` routes are proxied to `http://localhost:5001`
- `/uploads` routes are proxied to `http://localhost:5001`
- `/socket.io` routes are proxied to `http://localhost:5001` with WebSocket support

## Troubleshooting

1. **Port conflicts**: If port 5001 is already in use, update the backend PORT in `backend/.env.development` and the proxy target in `src/setupProxy.js`.

2. **CORS errors**: Ensure the backend CORS configuration in `backend/.env.development` includes your frontend origin.

3. **MongoDB connection issues**: Verify the MONGODB_URI in `backend/.env.development` is correct and your MongoDB Atlas cluster is accessible.
