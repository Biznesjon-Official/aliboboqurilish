const express = require('express');
const router = express.Router();
const telegramService = require('../services/TelegramService');

// Test Telegram bot connection
router.post('/test', async (req, res) => {
  try {
    console.log('📤 Testing Telegram bot connection...');
    
    if (!telegramService.isInitialized) {
      return res.status(500).json({
        success: false,
        message: 'Telegram bot not initialized',
        details: {
          token: !!telegramService.token,
          chatId: !!telegramService.chatId
        }
      });
    }

    await telegramService.sendTestMessage();
    
    res.json({
      success: true,
      message: 'Test message sent successfully',
      chatId: telegramService.chatId
    });
  } catch (error) {
    console.error('❌ Telegram test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test message',
      error: error.message
    });
  }
});

// Send custom message
router.post('/send', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    if (!telegramService.isInitialized) {
      return res.status(500).json({
        success: false,
        message: 'Telegram bot not initialized'
      });
    }

    await telegramService.sendMessage(message);
    
    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('❌ Failed to send custom message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// Get Telegram bot status
router.get('/status', (req, res) => {
  res.json({
    initialized: telegramService.isInitialized,
    hasToken: !!telegramService.token,
    hasChatId: !!telegramService.chatId,
    chatId: telegramService.chatId,
    tokenPreview: telegramService.token ? `${telegramService.token.substring(0, 20)}...` : null
  });
});

module.exports = router;
