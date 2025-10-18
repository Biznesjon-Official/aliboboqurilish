const TelegramBot = require('node-telegram-bot-api');

class TelegramService {
  constructor() {
    this.bot = null;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.isInitialized = false;
    
    console.log('🤖 TelegramService constructor called');
    console.log('📌 TELEGRAM_BOT_TOKEN:', this.token ? '✅ Set' : '❌ Not set');
    console.log('📌 TELEGRAM_CHAT_ID:', this.chatId ? `✅ Set (${this.chatId})` : '❌ Not set');
    
    if (this.token && this.chatId) {
      this.initialize();
    } else {
      console.warn('⚠️ Telegram credentials not configured. Bot will not send notifications.');
    }
  }

  initialize() {
    try {
      console.log('🔧 Initializing Telegram Bot...');
      this.bot = new TelegramBot(this.token, { polling: false });
      this.isInitialized = true;
      console.log('✅ Telegram Bot initialized successfully');
      console.log(`📍 Chat ID: ${this.chatId}`);
    } catch (error) {
      console.error('❌ Failed to initialize Telegram Bot:', error.message);
      this.isInitialized = false;
    }
  }

  /**
   * Yangi buyurtma haqida Telegramga xabar yuborish
   */
  async sendOrderNotification(order) {
    console.log('📨 sendOrderNotification called');
    console.log('🔍 Bot initialized:', this.isInitialized);
    console.log('🔍 Bot exists:', !!this.bot);
    
    if (!this.isInitialized || !this.bot) {
      console.warn('⚠️ Telegram Bot not initialized, skipping notification');
      return;
    }

    try {
      console.log('📝 Preparing order notification for order:', order._id);
      
      const itemsList = order.items
        .map((item, index) => {
          const variantText = item.variantOption ? ` (${item.variantOption})` : '';
          return `${index + 1}. ${item.name}${variantText}\n   Miqdor: ${item.quantity} ${item.unit || 'dona'}\n   Narx: ${(item.price * item.quantity).toLocaleString('uz-UZ')} so'm`;
        })
        .join('\n\n');

      const message = `
📦 <b>YANGI BUYURTMA</b>

👤 <b>Mijoz:</b> ${order.customerName}
📞 <b>Telefon:</b> <code>${order.customerPhone}</code>
📍 <b>Manzil:</b> ${order.customerAddress || 'Ko\'rsatilmagan'}

<b>Mahsulotlar:</b>
${itemsList}

💰 <b>Jami summa:</b> <code>${order.totalAmount.toLocaleString('uz-UZ')} so'm</code>

📝 <b>Izoh:</b> ${order.notes || 'Yo\'q'}

⏰ <b>Vaqti:</b> ${new Date(order.createdAt).toLocaleString('uz-UZ')}
      `;

      console.log('🚀 Sending message to Telegram chat:', this.chatId);
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });

      console.log(`✅ Order notification sent to Telegram for order ${order._id}`);
    } catch (error) {
      console.error('❌ Failed to send Telegram notification:', error.message);
      console.error('❌ Error details:', error);
    }
  }

  /**
   * Buyurtma holatini o'zgartirganda Telegramga xabar yuborish
   */
  async sendOrderStatusUpdate(order, newStatus) {
    if (!this.isInitialized || !this.bot) {
      console.warn('⚠️ Telegram Bot not initialized, skipping status update');
      return;
    }

    try {
      const statusEmoji = {
        pending: '⏳',
        processing: '🔄',
        completed: '✅',
        cancelled: '❌'
      };

      const statusText = {
        pending: 'Kutilmoqda',
        processing: 'Tayyorlanmoqda',
        completed: 'Yakunlandi',
        cancelled: 'Bekor qilindi'
      };

      const message = `
${statusEmoji[newStatus] || '📦'} <b>BUYURTMA HOLATI O'ZGARTIRILDI</b>

👤 <b>Mijoz:</b> ${order.customerName}
📞 <b>Telefon:</b> <code>${order.customerPhone}</code>

📊 <b>Yangi holat:</b> <code>${statusText[newStatus] || newStatus}</code>

💰 <b>Summa:</b> <code>${order.totalAmount.toLocaleString('uz-UZ')} so'm</code>

⏰ <b>Vaqti:</b> ${new Date().toLocaleString('uz-UZ')}
      `;

      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });

      console.log(`✅ Status update notification sent to Telegram for order ${order._id}`);
    } catch (error) {
      console.error('❌ Failed to send status update notification:', error.message);
    }
  }

  /**
   * Xom xabar yuborish (custom message)
   */
  async sendMessage(text) {
    if (!this.isInitialized || !this.bot) {
      console.warn('⚠️ Telegram Bot not initialized, skipping message');
      return;
    }

    try {
      await this.bot.sendMessage(this.chatId, text, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });

      console.log('✅ Message sent to Telegram');
    } catch (error) {
      console.error('❌ Failed to send message:', error.message);
    }
  }
}

// Singleton instance
const telegramService = new TelegramService();

module.exports = telegramService;
