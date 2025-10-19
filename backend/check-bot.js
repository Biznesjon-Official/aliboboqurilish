// Simple Telegram Bot Check
const https = require('https');

const BOT_TOKEN = '8084499185:AAH2oQQn7b0adh9I0V97wK5_4FqfLFn50nE';
const CHAT_ID = '-1002936933249';

// Test bot info
const botInfoUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getMe`;

console.log('🤖 Testing Telegram Bot...');
console.log('Bot Token:', BOT_TOKEN ? '✅ Set' : '❌ Not set');
console.log('Chat ID:', CHAT_ID);

https.get(botInfoUrl, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.ok) {
        console.log('✅ Bot is valid:', result.result.username);
        
        // Test sending message
        const message = 'Test message from Alibobo backend';
        const sendUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const postData = JSON.stringify({
          chat_id: CHAT_ID,
          text: message
        });
        
        const req = https.request(sendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
          }
        }, (res) => {
          let responseData = '';
          res.on('data', (chunk) => responseData += chunk);
          res.on('end', () => {
            try {
              const sendResult = JSON.parse(responseData);
              if (sendResult.ok) {
                console.log('✅ Test message sent successfully!');
              } else {
                console.log('❌ Failed to send message:', sendResult);
              }
            } catch (e) {
              console.log('❌ Error parsing send response:', e.message);
            }
          });
        });
        
        req.on('error', (e) => {
          console.log('❌ Request error:', e.message);
        });
        
        req.write(postData);
        req.end();
        
      } else {
        console.log('❌ Bot is invalid:', result);
      }
    } catch (e) {
      console.log('❌ Error parsing response:', e.message);
    }
  });
}).on('error', (e) => {
  console.log('❌ Request failed:', e.message);
});
