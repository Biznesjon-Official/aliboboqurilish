// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '.env.development') });

console.log('🔧 Environment check:');
console.log('📌 TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Not set');
console.log('📌 TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID ? `✅ Set (${process.env.TELEGRAM_CHAT_ID})` : '❌ Not set');

// Test order with notes and proper date
const testOrder = {
  _id: 'test-order-fix-123',
  customerName: 'Metall baza',
  customerPhone: '+998 (91) 401-05-50',
  customerAddress: 'Alibobo metall baza',
  items: [
    {
      name: 'Hayat Yaxta Lak 1kg',
      quantity: 1,
      price: 46000,
      unit: 'dona'
    }
  ],
  totalAmount: 46000,
  notes: 'Tezroq yetkazib berish kerak', // Test with actual notes
  createdAt: new Date(), // Current timestamp
  orderDate: new Date()
};

// Test order without notes
const testOrderNoNotes = {
  _id: 'test-order-no-notes-123',
  customerName: 'Test User',
  customerPhone: '+998901234567',
  customerAddress: 'Test Address',
  items: [
    {
      name: 'Test Product',
      quantity: 2,
      price: 25000,
      unit: 'dona'
    }
  ],
  totalAmount: 50000,
  notes: '', // Empty notes
  createdAt: new Date(),
  orderDate: new Date()
};

console.log('\n🧪 Testing Telegram notification fixes...');
console.log('📋 Test 1: Order with notes');
console.log('📋 Test 2: Order without notes');

setTimeout(async () => {
  try {
    const telegramService = require('./services/TelegramService');
    
    console.log('\n📨 Sending test order WITH notes...');
    await telegramService.sendOrderNotification(testOrder);
    
    console.log('\n📨 Sending test order WITHOUT notes...');
    await telegramService.sendOrderNotification(testOrderNoNotes);
    
    console.log('\n✅ All tests completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}, 2000);
