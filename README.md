# Alibobo - Product Management System

A modern web application for managing products with real-time stock updates, built with React, Node.js, and MongoDB.

## Features

- Real-time stock management with Socket.IO
- Product CRUD operations
- Craftsmen management
- Order tracking
- Statistics dashboard
- Responsive admin panel
- Image upload and optimization

## Prerequisites

- Node.js (version 14 or higher)
- MongoDB Atlas account

## Quick Start

### Running on localhost:3000

1. **Set up the development environment** (ensures MongoDB indexes and seeds sample data):
   ```bash
   npm run setup:dev
   ```

2. **Start both frontend and backend concurrently**:
   ```bash
   npm run dev
   ```

   Or start them separately:
   
   **Start the backend server** (runs on port 5000):
   ```bash
   npm run dev:backend-only
   ```

   **In a separate terminal, start the frontend** (runs on port 3000):
   ```bash
   npm run dev:frontend-3000
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

### Running with default ports (frontend on 3001)

```bash
npm start
```

This will start both the frontend (port 3001) and backend (port 5000) concurrently.

## Project Structure

```
alibobo/
├── backend/              # Node.js backend server
│   ├── controllers/      # Request handlers
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── server.js        # Main server file
├── public/              # Static assets
├── src/                 # React frontend
│   ├── components/      # React components
│   ├── hooks/           # Custom hooks
│   ├── pages/           # Page components
│   ├── services/        # API service calls
│   └── App.js           # Main app component
├── uploads/             # Uploaded images (gitignored)
└── package.json         # Frontend dependencies
```

## Environment Configuration

### Frontend Environment Variables

Create a `.env.development` file in the root directory:
```
REACT_APP_API_BASE=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### Backend Environment Variables

Create a `backend/.env.development` file:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001
```

## Available Scripts

### Frontend Scripts
- `npm run dev:frontend-3000` - Start frontend on port 3000
- `npm run dev:frontend-only` - Start frontend on port 3001
- `npm run build` - Build frontend for production

### Backend Scripts
- `npm run dev:backend-only` - Start backend server
- `npm run backend-only` - Start backend with development settings
- `npm run db:ensure-indexes` - Ensure MongoDB indexes for optimal performance
- `npm run db:seed` - Seed database with sample data

### Combined Scripts
- `npm start` - Start both frontend (3001) and backend (5000)
- `npm run dev` - Start backend first, then frontend (3000) after a 5-second delay
- `npm run setup:dev` - Set up development environment (indexes + seed data)

## Development

See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for detailed development setup instructions.

## Production Deployment

For production deployment, the application should be configured with:
- Proper SSL certificates
- Nginx reverse proxy
- MongoDB Atlas cluster
- Environment variables set for production

## Troubleshooting

See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for common issues and solutions.

## License

MIT