// Telegram Environment Test Script
require('dotenv').config({ path: '.env.development' });

console.log('🔍 Environment Variables Test:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Not set');
console.log('TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID ? `✅ Set (${process.env.TELEGRAM_CHAT_ID})` : '❌ Not set');

// Test TelegramService
const TelegramService = require('./services/TelegramService');

// Test message
const testOrder = {
  _id: 'test-order-123',
  customerName: 'Test User',
  customerPhone: '+998901234567',
  customerAddress: 'Test Address',
  items: [
    {
      name: 'Test Product',
      quantity: 1,
      price: 50000,
      unit: 'dona'
    }
  ],
  totalAmount: 50000,
  notes: 'Test order',
  createdAt: new Date()
};

console.log('\n🧪 Testing Telegram notification...');
setTimeout(async () => {
  try {
    const telegramService = require('./services/TelegramService');
    await telegramService.sendOrderNotification(testOrder);
    console.log('✅ Test completed');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}, 2000);
