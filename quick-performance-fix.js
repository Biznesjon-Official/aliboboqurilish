// TEZKOR PERFORMANCE FIX SCRIPT
// VPS'da ishga tushirish uchun

const { MongoClient } = require('mongodb');

async function quickPerformanceFix() {
    console.log('🚀 Tezkor performance fix boshlandi...');
    
    // MongoDB connection
    const uri = 'mongodb+srv://ozodbek:9KS0xaLkMnnqqE3L@cluster0.dlopces.mongodb.net/alibobo?retryWrites=true&w=majority&appName=Cluster0';
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db('alibobo');
        const products = db.collection('products');
        
        console.log('📊 Database indexlar yaratilmoqda...');
        
        // Performance indexlar qo'shish
        await products.createIndex({ "category": 1 });
        await products.createIndex({ "createdAt": -1 });
        await products.createIndex({ "price": 1 });
        await products.createIndex({ "updatedAt": -1, "status": 1 });
        await products.createIndex({ "name": "text", "description": "text" });
        
        console.log('✅ Database indexlar yaratildi');
        
        // Mahsulotlar sonini tekshirish
        const count = await products.countDocuments();
        console.log(`📦 Jami mahsulotlar: ${count}`);
        
        // Eng sekin query'larni tekshirish
        console.log('⏱️ Query performance test...');
        const start = Date.now();
        const fastProducts = await products.find({})
            .project({
                name: 1,
                price: 1,
                category: 1,
                images: { $slice: 1 }, // Faqat birinchi rasm
                createdAt: 1
            })
            .limit(12)
            .sort({ createdAt: -1 })
            .toArray();
        const end = Date.now();
        
        console.log(`⚡ Query vaqti: ${end - start}ms`);
        console.log(`📋 Yuklangan mahsulotlar: ${fastProducts.length}`);
        
    } catch (error) {
        console.error('❌ Xatolik:', error);
    } finally {
        await client.close();
    }
}

// Nginx cache config
const nginxCacheConfig = `
# /etc/nginx/sites-available/aliboboqurilish.uz ga qo'shish kerak

# Cache zone yaratish
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m use_temp_path=off;

server {
    # ... existing config ...
    
    # API caching
    location /api/products {
        proxy_cache api_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_key $uri$is_args$args;
        proxy_cache_bypass $http_cache_control;
        add_header X-Cache-Status $upstream_cache_status;
        
        proxy_pass http://localhost:5000/api/products;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }
}
`;

console.log('📝 Nginx cache config:');
console.log(nginxCacheConfig);

// PM2 ecosystem optimized config
const pm2Config = `
module.exports = {
  apps: [{
    name: 'alibobo-backend',
    script: './backend/server.js',
    instances: 'max', // Barcha CPU core'lardan foydalanish
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      // Performance optimizations
      NODE_OPTIONS: '--max-old-space-size=2048',
      UV_THREADPOOL_SIZE: 16
    },
    // Auto restart settings
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    
    // Logging
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_file: './logs/backend-combined.log',
    time: true,
    
    // Monitoring
    monitoring: false,
    pmx: false
  }]
};
`;

console.log('📝 PM2 optimized config:');
console.log(pm2Config);

// Run the fix
if (require.main === module) {
    quickPerformanceFix();
}

module.exports = { quickPerformanceFix };