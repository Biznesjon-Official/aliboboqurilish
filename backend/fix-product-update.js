// Mahsulot yangilash muammosini hal qilish uchun test script
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.development' });

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Product model
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  oldPrice: { type: Number },
  description: { type: String },
  category: { type: String, required: true },
  image: { type: String },
  images: [{ type: String }],
  stock: { type: Number, default: 0 },
  unit: { type: String, default: 'dona' },
  badge: { type: String },
  rating: { type: Number, default: 0 },
  isNew: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  hasVariants: { type: Boolean, default: false },
  variants: [{
    name: String,
    options: [{
      value: String,
      price: Number,
      oldPrice: Number,
      stock: Number,
      image: String,
      images: [String]
    }]
  }],
  status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' },
  isDeleted: { type: Boolean, default: false },
  slug: { type: String }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// Test mahsulot yangilash funksiyasi
const testProductUpdate = async () => {
  try {
    console.log('🔍 Mahsulotlarni qidiryapman...');
    
    // Birinchi mahsulotni topish
    const product = await Product.findOne({ isDeleted: { $ne: true } }).limit(1);
    
    if (!product) {
      console.log('❌ Hech qanday mahsulot topilmadi');
      return;
    }
    
    console.log('📦 Topilgan mahsulot:', {
      id: product._id,
      name: product.name,
      price: product.price,
      category: product.category
    });
    
    // Mahsulotni yangilash
    const updateData = {
      name: product.name + ' (Test yangilandi)',
      price: product.price + 1000,
      description: 'Test yangilash: ' + new Date().toISOString(),
      updatedAt: new Date()
    };
    
    console.log('🔄 Mahsulotni yangilamoqda...');
    
    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      updateData,
      { new: true, lean: true }
    );
    
    if (updatedProduct) {
      console.log('✅ Mahsulot muvaffaqiyatli yangilandi:', {
        id: updatedProduct._id,
        name: updatedProduct.name,
        price: updatedProduct.price,
        updatedAt: updatedProduct.updatedAt
      });
    } else {
      console.log('❌ Mahsulot yangilanmadi');
    }
    
  } catch (error) {
    console.error('❌ Test xatoligi:', error);
  }
};

// Test rasm yuklash funksiyasi
const testImageUpload = async () => {
  try {
    console.log('🖼️ Rasm yuklash API sini test qilyapman...');
    
    const fetch = require('node-fetch');
    const FormData = require('form-data');
    const fs = require('fs');
    const path = require('path');
    
    // Test rasm yaratish (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x5D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const formData = new FormData();
    formData.append('image', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    const response = await fetch('http://localhost:5000/api/upload/image', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Rasm yuklash muvaffaqiyatli:', result);
    } else {
      const error = await response.text();
      console.log('❌ Rasm yuklash xatoligi:', response.status, error);
    }
    
  } catch (error) {
    console.error('❌ Rasm yuklash test xatoligi:', error.message);
  }
};

// Asosiy test funksiyasi
const runTests = async () => {
  await connectDB();
  
  console.log('🧪 Testlarni boshlayapman...\n');
  
  await testProductUpdate();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testImageUpload();
  
  console.log('\n🏁 Testlar tugadi');
  process.exit(0);
};

// Testlarni ishga tushirish
runTests().catch(error => {
  console.error('❌ Test xatoligi:', error);
  process.exit(1);
});