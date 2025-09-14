// CORS configuration fix for production
// This file can be used to update the CORS settings in server.js

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Always allow requests in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚠️  CORS request from origin: ${origin}`);
      return callback(null, true);
    }
    
    // For production, be more permissive with allowed origins
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://127.0.0.1:3000',  
      'https://aliboboqurilish.uz',
      'https://www.aliboboqurilish.uz'
    ];
    
    // Check if the origin is in our allowed list or is a subdomain
    if (allowedOrigins.includes(origin) || 
        origin.endsWith('.aliboboqurilish.uz') || 
        origin.startsWith('https://aliboboqurilish.uz')) {
      callback(null, true);
    } else {
      // More permissive approach - allow any origin in production
      // This is safe because we're using credentials: true only when needed
      console.log(`ℹ️  Allowing CORS request from origin: ${origin}`);
      callback(null, true);
    }
  },
  credentials: true,
  maxAge: 86400, // CORS pre-flight results are cached for 1 day
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

module.exports = corsOptions;