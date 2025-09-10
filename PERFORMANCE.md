# Development Performance Optimizations

## Quick Start Options

### 🚀 Turbo Mode (Fastest - ~3 seconds)
```bash
npm run start:turbo
```
This uses direct environment variables and skips all unnecessary development overhead.

### ⚡ Fast Mode (~4-5 seconds)
```bash
npm run start:fast
```
This uses optimized settings while maintaining some development features.

### 🏃 Clean Mode (~3-4 seconds)
```bash
npm run start:clean
```
Optimized startup without delays, perfect for daily development.

### 📦 Standard Mode (~3-4 seconds)
```bash
npm start
```
Now fully optimized with no delays, includes fast product loading.

## Performance Optimizations Applied

### Backend Optimizations
- **Clustering disabled in development**: Removes multi-process overhead
- **Faster MongoDB connection**: Reduced timeouts and smaller connection pools
- **Skip index creation**: Bypasses database index checks for faster startup
- **Simplified security middleware**: Minimal helmet configuration in development
- **Optimized environment loading**: Skips dotenv if variables already set

### Frontend Optimizations
- **Disabled source maps**: Faster webpack compilation
- **Fast refresh disabled**: Reduces initial build time
- **Simplified concurrently setup**: Less process management overhead

### Environment Variables for Speed
```bash
NODE_ENV=development
SKIP_INDEX_CREATION=true
ENABLE_CLUSTERING=false
DEBUG=false
GENERATE_SOURCEMAP=false
FAST_REFRESH=false
```

## Testing Performance

Run the performance test to compare startup times:
```bash
npm run test:performance
```

This will test all three modes and show you the timing differences.

## Troubleshooting

### If turbo mode doesn't work:
1. Check that your MongoDB URI is correct in the command
2. Ensure no other processes are using ports 3000 or 5000
3. Try fast mode instead: `npm run start:fast`

### If you need debugging:
Use the debug version with logging enabled:
```bash
npm run dev:debug
```

## Production Notes

These optimizations are **development-only**. Production builds will still use:
- Full security middleware
- Clustering enabled
- Complete index creation
- Proper caching headers
- All performance optimizations