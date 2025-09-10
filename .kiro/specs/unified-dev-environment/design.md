# Design Document

## Overview

This design implements a unified development environment for the Alibobo project using concurrent process management and proper proxy configuration. The solution uses `concurrently` package to run both frontend and backend services simultaneously, with React's built-in proxy feature to handle API and static file requests.

## Architecture

### Development Server Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Machine                        │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   npm start     │    │        Process Manager         │ │
│  │  (root level)   │───▶│       (concurrently)          │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
│                                    │                        │
│                          ┌─────────┴─────────┐              │
│                          │                   │              │
│                          ▼                   ▼              │
│  ┌─────────────────────────────┐   ┌─────────────────────┐   │
│  │     Frontend (React)        │   │   Backend (Node.js) │   │
│  │   Port: 3000               │   │     Port: 5000      │   │
│  │   - React Dev Server       │   │   - Express Server  │   │
│  │   - Proxy to :5000         │   │   - Static /uploads │   │
│  │   - Hot Reload             │   │   - API Endpoints   │   │
│  └─────────────────────────────┘   └─────────────────────┘   │
│                          │                   │              │
│                          └─────────┬─────────┘              │
│                                    │                        │
│                          ┌─────────▼─────────┐              │
│                          │   Proxy Requests  │              │
│                          │  /api/* → :5000   │              │
│                          │ /uploads/* → :5000│              │
│                          └───────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Image Serving Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   React Proxy   │    │    Backend      │
│   Component     │    │   (Dev Server)  │    │   Static Files  │
│                 │    │                 │    │                 │
│  Request:       │───▶│  Proxy Rule:    │───▶│  Serve from:    │
│  /uploads/      │    │  /uploads/* →   │    │  ./uploads/     │
│  image.jpg      │    │  :5000          │    │  directory      │
│                 │    │                 │    │                 │
│  Fallback:      │    │                 │    │                 │
│  /assets/       │    │  Static Files   │    │                 │
│  default.png    │◀───│  from public/   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components and Interfaces

### 1. Root Package.json Configuration

**Purpose:** Configure the main entry point for the unified development environment.

**Key Changes:**
- Add `concurrently` as a development dependency
- Modify the `start` script to run both frontend and backend
- Add individual scripts for running services separately
- Configure proper script naming and logging

### 2. React Proxy Configuration

**Purpose:** Enable seamless communication between frontend and backend during development.

**Implementation Options:**
- **Option A:** Add `"proxy": "http://localhost:5000"` to frontend package.json
- **Option B:** Create `setupProxy.js` file for more granular control

**Recommended:** Option B for better control over specific routes.

### 3. Backend Static File Configuration

**Purpose:** Ensure backend properly serves uploaded images with correct headers.

**Current State:** Already configured in `server.js` with:
```javascript
app.use('/uploads', express.static('uploads', {
  maxAge: '7d',
  etag: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=604800');
  }
}));
```

**Enhancement:** Add development-specific cache headers when NODE_ENV is development.

### 4. Frontend Image Component Enhancement

**Purpose:** Improve error handling and fallback mechanisms for images.

**Current State:** `OptimizedImage.jsx` already has good fallback handling.

**Enhancement:** Add development-specific logging for image loading issues.

## Data Models

### Configuration Files Structure

```
alibobo/
├── package.json (root - unified scripts)
├── backend/
│   └── package.json (backend-specific scripts)
├── src/
│   └── setupProxy.js (proxy configuration)
└── .env.development (development environment variables)
```

### Environment Variables

```bash
# Development Environment Variables
NODE_ENV=development
REACT_APP_API_URL=http://localhost:5000
BACKEND_PORT=5000
FRONTEND_PORT=3000
```

### Script Configuration

```json
{
  "scripts": {
    "start": "concurrently \"npm run start:backend\" \"npm run start:frontend\"",
    "start:frontend": "cd . && npm run start:react",
    "start:backend": "cd backend && npm start",
    "start:react": "react-scripts start",
    "dev": "npm start",
    "build": "react-scripts build",
    "build:backend": "cd backend && npm run build"
  }
}
```

## Error Handling

### Service Startup Errors

1. **Backend Connection Issues:**
   - MongoDB connection failures
   - Port already in use (5000)
   - Missing environment variables

2. **Frontend Startup Issues:**
   - Port already in use (3000)
   - Missing dependencies
   - Build configuration errors

3. **Proxy Configuration Errors:**
   - Backend not responding
   - CORS configuration issues
   - Invalid proxy target

### Image Loading Errors

1. **Backend Image Serving:**
   - File not found (404)
   - Permission issues
   - Disk space issues

2. **Frontend Image Display:**
   - Network connectivity issues
   - Proxy configuration problems
   - Fallback image missing

### Error Recovery Strategies

1. **Automatic Retry:** For transient network issues
2. **Graceful Degradation:** Show fallback images when originals fail
3. **Clear Error Messages:** Provide actionable error information
4. **Service Isolation:** One service failure shouldn't crash the other

## Testing Strategy

### Development Environment Testing

1. **Startup Testing:**
   - Verify both services start successfully
   - Test individual service startup
   - Validate port binding

2. **Proxy Testing:**
   - Test API endpoint proxying
   - Verify static file proxying
   - Check CORS functionality

3. **Image Serving Testing:**
   - Test image loading from backend
   - Verify fallback image display
   - Test error scenarios

### Integration Testing

1. **End-to-End Workflow:**
   - Start unified environment
   - Load frontend application
   - Verify API communication
   - Test image display in product cards

2. **Error Scenario Testing:**
   - Backend unavailable
   - Image files missing
   - Network connectivity issues

### Performance Testing

1. **Startup Time:**
   - Measure time to both services ready
   - Compare with individual startup times

2. **Image Loading Performance:**
   - Test image loading speed
   - Verify caching behavior
   - Monitor memory usage

## Implementation Phases

### Phase 1: Basic Unified Startup
- Install and configure concurrently
- Update root package.json scripts
- Test basic dual service startup

### Phase 2: Proxy Configuration
- Implement React proxy setup
- Configure API and static file routing
- Test frontend-backend communication

### Phase 3: Image Serving Enhancement
- Enhance backend static file serving
- Improve frontend error handling
- Add development-specific optimizations

### Phase 4: Developer Experience
- Add colored logging
- Implement service health checks
- Create debugging utilities

## Security Considerations

### Development Environment Security

1. **CORS Configuration:**
   - Restrict to development origins only
   - Avoid wildcard origins in development

2. **Static File Serving:**
   - Ensure uploads directory is properly sandboxed
   - Validate file types and sizes

3. **Environment Variables:**
   - Keep sensitive data in environment files
   - Use different configurations for development/production

### Production Readiness

1. **Build Process:**
   - Ensure production builds exclude development dependencies
   - Verify proxy configurations are development-only

2. **Security Headers:**
   - Maintain security headers in production
   - Disable development-specific features