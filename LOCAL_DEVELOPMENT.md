# Local Development Setup

This document explains how to run the Alibobo application locally on localhost:3000.

## Quick Start

To run the application with the frontend on port 3000:

1. **Start both frontend and backend with backend starting first**:
   ```bash
   # In the project root directory
   npm run dev
   ```

   This command will:
   - Start the backend server on port 5001 first
   - Wait 5 seconds for the backend to initialize
   - Start the frontend on port 3000

   Or start them separately:

   **Start the backend server** (runs on port 5001):
   ```bash
   # In the project root directory
   npm run dev:backend-only
   ```

   **In a separate terminal, start the frontend** (runs on port 3000):
   ```bash
   # In the project root directory
   npm run dev:frontend-3000
   ```

2. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001/api
   - Backend health check: http://localhost:5001/api/health

## Environment Configuration

### Frontend (.env.development)
```
REACT_APP_API_BASE=http://localhost:5001/api
REACT_APP_SOCKET_URL=http://localhost:5001
```

The frontend is configured to communicate with the backend API at `http://localhost:5001/api` through proxy configuration.

### Backend (backend/.env.development)
```
# Server Configuration
PORT=5001

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001
```

The backend is configured to accept requests from localhost:3000 (and other common development ports).

## How It Works

1. **Frontend Development Server**: Runs on port 3000 with hot reloading
2. **Backend Server**: Runs on port 5001 with MongoDB connection
3. **Proxy Configuration**: The frontend uses a proxy (`src/setupProxy.js`) to forward API requests to the backend
4. **CORS Handling**: CORS is configured in the backend to allow requests from localhost:3000

## Available Scripts

- `npm run dev` - Start backend first, then frontend (port 3000) after a 5-second delay
- `npm run dev:backend-only` - Start only the backend server on port 5001
- `npm run dev:frontend-3000` - Start only the frontend on port 3000
- `npm run dev:frontend-3000:delayed` - Start the frontend on port 3000 after a 5-second delay (used by `npm run dev`)
- `npm start` - Start both frontend (port 3001 by default) and backend (port 5001) concurrently

## Testing the Setup

Once both servers are running:

1. Visit http://localhost:3000 in your browser
2. The frontend should load and communicate with the backend
3. You can test the API directly at http://localhost:5001/api/products

## Troubleshooting

### Common Issues

1. **Port conflicts**: 
   - If port 5001 is in use, change the PORT in `backend/.env.development`
   - If port 3000 is in use, the frontend will automatically use the next available port

2. **CORS errors**: 
   - Ensure `http://localhost:3000` is in the CORS_ORIGIN list in `backend/.env.development`

3. **MongoDB connection issues**: 
   - Verify the MONGODB_URI in `backend/.env.development` is correct
   - Check your MongoDB Atlas cluster is accessible

4. **API requests failing**: 
   - Ensure the backend is running before starting the frontend
   - Check that the proxy configuration in `src/setupProxy.js` matches your backend port

### Logs and Debugging

- Frontend logs will show in the terminal where you ran `npm run dev:frontend-3000`
- Backend logs will show in the terminal where you ran `npm run dev:backend-only`
- Proxy requests are logged with `[PROXY]` prefix in the frontend terminal

## Development Workflow

1. Make changes to frontend code (React components, etc.) - hot reload will update the browser
2. Make changes to backend code (API endpoints, etc.) - restart the backend server
3. Test functionality through the frontend UI at http://localhost:3000
4. Use browser developer tools to inspect network requests and debug issues

## Stopping the Servers

To stop either server, press `Ctrl+C` in the respective terminal.