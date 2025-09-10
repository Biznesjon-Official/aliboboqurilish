# Logging Configuration

## Overview

The unified development environment now uses **clean logging** by default to reduce terminal clutter while maintaining the ability to enable verbose logging when needed for debugging.

## Logging Modes

### 🔇 Clean Mode (Default)
```bash
npm start
```

**What's suppressed:**
- MongoDB connection details (except errors)
- Proxy request logs
- Image loading success logs
- ESLint warnings (non-blocking)
- Index creation messages

**What's still shown:**
- Service startup messages
- Critical errors
- Build completion status
- Server ready notifications

### 🔊 Debug Mode (Verbose)
```bash
npm run dev:debug
```

**Additional logging includes:**
- All proxy requests with URLs
- Image loading success/failure details
- MongoDB connection diagnostics
- Backend request logging
- Static file serving logs

## Configuration Files

### Frontend Logging
- **File**: `.env.development`
- **Key**: `REACT_APP_DEBUG_MODE=false`
- **Override**: `.env.local` (for personal preferences)

### Backend Logging
- **File**: `backend/.env.development`
- **Key**: `DEBUG=false`
- **Environment**: `NODE_ENV=development`

### Proxy Logging
- **File**: `src/setupProxy.js`
- **Level**: `logLevel: 'silent'` (default)
- **Debug**: Controlled by `REACT_APP_DEBUG_MODE`

## Enabling Debug Mode

### Temporary (Single Session)
```bash
# Both services with debug
npm run dev:debug

# Frontend only
REACT_APP_DEBUG_MODE=true npm run start:frontend

# Backend only
cd backend && DEBUG=true npm start
```

### Permanent (Until Changed)
```bash
# Edit .env.development
REACT_APP_DEBUG_MODE=true

# Edit backend/.env.development
DEBUG=true
```

## Log Categories

### 🟢 Always Shown
- Service startup/shutdown
- Critical errors
- Build status
- Health check results

### 🟡 Debug Mode Only
- HTTP request details
- Image loading logs
- Database connection details
- Proxy routing information

### 🔴 Suppressed
- ESLint warnings (non-blocking)
- Webpack compilation details
- MongoDB index creation
- Routine proxy requests

## Troubleshooting

### Too Quiet?
```bash
# Enable debug mode
npm run dev:debug
```

### Too Verbose?
```bash
# Check environment files
cat .env.development
cat backend/.env.development

# Should show DEBUG=false and REACT_APP_DEBUG_MODE=false
```

### ESLint Warnings
```bash
# Temporarily disable ESLint warnings
echo "ESLINT_NO_DEV_ERRORS=true" >> .env.local
```

## Log Colors

- **🔵 BACKEND**: Blue prefix for backend logs
- **🟢 FRONTEND**: Green prefix for frontend logs
- **🟡 WARNING**: Yellow for warnings
- **🔴 ERROR**: Red for errors

## Best Practices

1. **Use clean mode** for daily development
2. **Enable debug mode** when troubleshooting
3. **Check logs** if services don't start properly
4. **Use health check** to verify service status

```bash
# Quick health check
npm run health
```

## Custom Logging

### Add Your Own Debug Logs
```javascript
// Frontend
if (process.env.REACT_APP_DEBUG_MODE === 'true') {
  console.log('Debug info');
}

// Backend
if (process.env.DEBUG === 'true') {
  console.log('Debug info');
}
```

### Temporary Verbose Mode
```bash
# One-time verbose startup
DEBUG=true REACT_APP_DEBUG_MODE=true npm start
```

---

**Result**: Clean, focused development experience with debugging available when needed! 🎉