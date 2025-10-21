const Order = require('../models/Order');
const Product = require('../models/Product');
const NotificationService = require('../services/NotificationService');
const socketService = require('../services/SocketService'); // Real-time updates
const telegramService = require('../services/TelegramService'); // Telegram notifications
const { addActivity } = require('../routes/recentActivitiesRoutes');
const mongoose = require('mongoose');

// Simple in-memory cache with TTL
const cache = {
  orders: {
    data: {},
    expiry: {}
  },
  orderStats: {
    data: null,
    expiry: 0
  }
};

const CACHE_TTL = 60 * 1000; // 60 seconds cache TTL for orders
const STATS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL for stats

// Helper to generate cache key from query parameters
const generateCacheKey = (params) => {
  return Object.entries(params || {})
    .filter(([_, value]) => value !== undefined && value !== null)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
};

// Helper to get or set cache
const getCachedOrCompute = async (cacheKey, queryParams, ttl, computeFn) => {
  const queryHash = generateCacheKey(queryParams);
  const now = Date.now();
  
  // Return from cache if valid
  if (cache[cacheKey].data[queryHash] && cache[cacheKey].expiry[queryHash] > now) {
    console.log(`Cache hit for ${cacheKey} with key ${queryHash}`);
    return cache[cacheKey].data[queryHash];
  }
  
  // Compute fresh data
  console.log(`Cache miss for ${cacheKey} with key ${queryHash}`);
  const freshData = await computeFn();
  
  // Update cache
  cache[cacheKey].data[queryHash] = freshData;
  cache[cacheKey].expiry[queryHash] = now + ttl;
  
  return freshData;
};

// Invalidate specific cache entries or everything
const invalidateCache = (cacheKey = null, queryHash = null) => {
  if (!cacheKey) {
    // Invalidate all caches
    Object.keys(cache).forEach(key => {
      cache[key].data = {};
      cache[key].expiry = {};
    });
    return;
  }
  
  if (!queryHash) {
    // Invalidate entire cacheKey
    cache[cacheKey].data = {};
    cache[cacheKey].expiry = {};
    return;
  }
  
  // Invalidate specific queryHash
  if (cache[cacheKey].data[queryHash]) {
    delete cache[cacheKey].data[queryHash];
    delete cache[cacheKey].expiry[queryHash];
  }
};

// GET all orders with pagination and filtering
const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Extract query params for cache key
    const queryParams = { page, limit, status, search, sortBy, sortOrder };
    
    // Use caching for common queries to reduce DB load
    const ordersData = await getCachedOrCompute('orders', queryParams, CACHE_TTL, async () => {
      // Build MongoDB query
      const query = {};
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      // Optimize search query
      if (search) {
        // Use text index if the search seems to be a text search
        if (search.length > 3) {
          // Check if text search or phone number
          const isPhoneSearch = /^\+?\d+$/.test(search);
          
          if (isPhoneSearch) {
            // Direct index match on phone number
            query.customerPhone = { $regex: search, $options: 'i' };
          } else {
            // Use text index for other searches
            query.$text = { $search: search };
          }
        } else {
          // For short searches, use regex but only on indexed fields
          query.$or = [
            { customerName: { $regex: search, $options: 'i' } },
            { customerPhone: { $regex: search, $options: 'i' } }
          ];
        }
      }
      
      // Set up sorting for optimized index use
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Perform both queries concurrently for better performance
      const [orders, count] = await Promise.all([
        Order.find(query)
          .sort(sortOptions)
          .limit(parseInt(limit))
          .skip((parseInt(page) - 1) * parseInt(limit))
          .lean() // Return plain JavaScript objects instead of Mongoose documents for better performance
          .exec(),
        Order.countDocuments(query)
      ]);
      
      return {
        orders,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page),
        totalCount: count
      };
    });
    
    res.json(ordersData);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      error: 'Failed to fetch orders',
      message: error.message 
    });
  }
};

// GET single order by ID
const getOrderById = async (req, res) => {
  try {
    // Generate cache key
    const orderId = req.params.id;
    const queryParams = { id: orderId };
    
    // Use cache for individual order lookups
    const order = await getCachedOrCompute('orders', queryParams, CACHE_TTL, async () => {
      return await Order.findById(orderId).lean();
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Buyurtma topilmadi' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      error: 'Failed to fetch order',
      message: error.message 
    });
  }
};

// POST create new order with optimized inventory synchronization
const createOrder = async (req, res) => {
  console.log('🛒 CREATE ORDER REQUEST RECEIVED');
  console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  
  const session = await mongoose.startSession();
  
  try {
    // CRITICAL: Store events to emit after successful commit
    let postCommitEvents = [];
    let createdOrder = null; // Store the actual order object
    
    const result = await session.withTransaction(async () => {
      const orderData = req.body;
      
      // Enhanced validation
      if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        throw new Error('Buyurtmada hech bo\'lmaganda bitta mahsulot bo\'lishi kerak');
      }
      
      if (!orderData.customerName || !orderData.customerPhone) {
        throw new Error('Mijoz nomi va telefon raqami kiritilishi shart');
      }
      
      // Validate items and extract product IDs for batch fetch
      const productIds = [];
      for (const item of orderData.items) {
        if (!item.productId) {
          throw new Error(`Mahsulot ID kiritilmagan: ${item.name || 'Noma\'lum mahsulot'}`);
        }
        if (!mongoose.Types.ObjectId.isValid(item.productId)) {
          throw new Error(`Noto\'g\'ri mahsulot ID: ${item.productId}`);
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Noto\'g\'ri miqdor: ${item.name || 'Noma\'lum mahsulot'}`);
        }
        productIds.push(item.productId);
      }
      
      // Step 1: Batch fetch all products for better performance
      const products = await Product.find({
        _id: { $in: productIds },
        status: 'active',
        isDeleted: { $ne: true }
      }).session(session);
      
      // Create product lookup map
      const productMap = new Map();
      products.forEach(product => {
        productMap.set(product._id.toString(), product);
      });
      
      // Step 2: Validate stock availability and prepare updates
      const stockUpdates = [];
      let totalOrderAmount = 0;
      
      for (const item of orderData.items) {
        const product = productMap.get(item.productId.toString());
        
        if (!product) {
          throw new Error(`Mahsulot topilmadi yoki mavjud emas: ${item.name}`);
        }
        
        let availableStock = 0;
        let stockUpdateQuery = null;
        
        // Handle variant products
        if (product.hasVariants && product.variants && product.variants.length > 0) {
          let selectedVariantOption = item.variantOption;
          
          // If no variant is provided, auto-select the first available variant (fallback)
          if (!selectedVariantOption) {
            console.warn(`No variant selected for ${product.name}, auto-selecting first available variant`);
            
            // Find the first variant with available options
            for (const variant of product.variants) {
              if (variant.options && variant.options.length > 0) {
                const firstOption = variant.options.find(opt => (opt.stock || 0) > 0);
                if (firstOption) {
                  selectedVariantOption = firstOption.value;
                  console.log(`Auto-selected variant: ${selectedVariantOption} for ${product.name}`);
                  break;
                }
              }
            }
            
            // If still no variant found, throw error
            if (!selectedVariantOption) {
              throw new Error(`Variant tanlanmagan va avtomatik tanlash mumkin emas: ${product.name}`);
            }
          }
          
          let variantFound = false;
          for (const variant of product.variants) {
            const option = variant.options.find(opt => opt.value === selectedVariantOption);
            if (option) {
              variantFound = true;
              availableStock = option.stock || 0;
              
              // Prepare variant stock update
              stockUpdateQuery = {
                filter: { 
                  _id: product._id,
                  'variants.options.value': selectedVariantOption 
                },
                update: { 
                  $inc: { 'variants.$[variant].options.$[option].stock': -item.quantity } 
                },
                options: {
                  arrayFilters: [
                    { 'variant.options.value': selectedVariantOption },
                    { 'option.value': selectedVariantOption }
                  ],
                  session
                }
              };
              
              // Update the item's variantOption for tracking
              item.variantOption = selectedVariantOption;
              break;
            }
          }
          
          if (!variantFound) {
            throw new Error(`Variant topilmadi: ${selectedVariantOption} - ${product.name}`);
          }
        } else {
          // Handle regular products
          availableStock = product.stock || 0;
          
          // Prepare regular stock update
          stockUpdateQuery = {
            filter: { _id: product._id },
            update: { $inc: { stock: -item.quantity } },
            options: { session }
          };
        }
        
        // Check stock availability
        if (availableStock < item.quantity) {
          throw new Error(`Yetarli miqdor yo\'q: ${product.name}${item.variantOption ? ` (${item.variantOption})` : ''}. Mavjud: ${availableStock}, Talab: ${item.quantity}`);
        }
        
        // Verify price consistency (optional security check)
        const expectedPrice = product.hasVariants ? 
          product.variants.flatMap(v => v.options).find(o => o.value === item.variantOption)?.price || product.price :
          product.price;
        
        if (Math.abs(item.price - expectedPrice) > 0.01) {
          console.warn(`Price mismatch for ${product.name}: expected ${expectedPrice}, got ${item.price}`);
        }
        
        totalOrderAmount += item.price * item.quantity;
        stockUpdates.push({
          query: stockUpdateQuery,
          productId: product._id,
          productName: product.name,
          delta: -item.quantity, // Negative for stock decrease
          newStock: availableStock - item.quantity,
          variantOption: item.variantOption
        });
      }
      
      // Verify total amount (optional security check)
      if (orderData.totalAmount && Math.abs(orderData.totalAmount - totalOrderAmount) > 0.01) {
        console.warn(`Total amount mismatch: expected ${totalOrderAmount}, got ${orderData.totalAmount}`);
      }
      
      // Step 3: Execute all stock updates atomically in parallel
      const updatePromises = stockUpdates.map(({ query }) => {
        const { filter, update, options } = query;
        return Product.updateOne(filter, update, options);
      });
      
      const updateResults = await Promise.all(updatePromises);
      
      // Verify all updates succeeded
      for (let i = 0; i < updateResults.length; i++) {
        const result = updateResults[i];
        if (result.matchedCount === 0) {
          throw new Error(`Stock update failed for item: ${orderData.items[i].name}`);
        }
        if (result.modifiedCount === 0) {
          // This might happen if the stock was already 0 and we're trying to decrease it further
          throw new Error(`Unable to update stock for item: ${orderData.items[i].name}`);
        }
      }
      
      // Step 4: Create the order
      const order = new Order({
        ...orderData,
        totalAmount: totalOrderAmount // Use calculated amount
      });
      
      // Send Telegram notification BEFORE saving to database
      console.log('🔔 Sending Telegram notification BEFORE saving to database...');
      try {
        console.log('📨 Calling telegramService.sendOrderNotification with order data');
        await telegramService.sendOrderNotification({
          _id: 'temp-' + Date.now(), // Temporary ID for notification
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerAddress: orderData.customerAddress,
          items: orderData.items,
          totalAmount: totalOrderAmount,
          status: orderData.status,
          orderDate: orderData.orderDate,
          createdAt: new Date(), // Add current timestamp for Telegram
          notes: orderData.notes || '' // Add notes field
        });
        console.log('✅ Telegram notification sent successfully BEFORE database save');
      } catch (telegramError) {
        console.error('❌ Failed to send Telegram notification BEFORE save:', telegramError);
        throw new Error('Telegram notification failed - order not saved: ' + telegramError.message);
      }

      const savedOrder = await order.save({ session });
      createdOrder = savedOrder; // Store for use outside transaction
      
      // CRITICAL: Prepare post-commit events (but don't emit yet)
      postCommitEvents = [
        { type: 'order:updated', data: { orderId: savedOrder._id, status: 'created' } },
        ...stockUpdates.map(({ productId, delta, newStock, variantOption }) => ({
          type: 'stock:updated',
          data: { productId, delta, newQuantity: newStock, variantOption, orderId: savedOrder._id }
        })),
        { 
          type: 'stock:bulk_updated', 
          data: { 
            updates: stockUpdates.map(({ productId, delta, newStock, variantOption }) => ({ 
              productId, 
              stockDelta: delta, 
              newQuantity: newStock, 
              variantOption 
            })),
            orderId: savedOrder._id 
          } 
        }
      ];
      
      console.log(`✅ TX_COMMIT: Order created successfully: ${savedOrder._id}`);
      console.log('🔄 Transaction completed, preparing to return order...');
      
      return savedOrder;
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      readPreference: 'primary',
      maxCommitTimeMS: 10000 // 10 second timeout
    });
    
    console.log('🔍 Transaction result:', result);
    console.log('🔍 Result type:', typeof result);
    console.log('🔍 Result _id:', result?._id);
    
    // CRITICAL: EMIT EVENTS ONLY AFTER SUCCESSFUL COMMIT
    console.log(`📡 EMIT_START: Broadcasting ${postCommitEvents.length} real-time events`);
    console.log('🎯 Order creation transaction completed, starting post-commit tasks...');
    postCommitEvents.forEach(({ type, data }) => {
      switch (type) {
        case 'order:updated':
          socketService.emitOrderUpdate(data.orderId, data.status, data.ts);
          break;
        case 'stock:updated':
          socketService.emitStockUpdate(data.productId, data.delta, data.newQuantity, data.orderId, data.variantOption);
          // Check for low stock alert
          if (data.newQuantity <= 5 && data.newQuantity > 0) {
            // We'd need to get product name for the alert - for now just log
            console.log(`⚠️ Low stock alert: Product ${data.productId} has ${data.newQuantity} items left`);
          }
          break;
        case 'stock:bulk_updated':
          socketService.emitBulkStockUpdate(data.updates, data.orderId);
          break;
      }
    });
    console.log(`✅ EMIT_COMPLETE: Real-time updates sent for order ${result._id}`);
    
    // Step 5: Generate notification and clear cache (outside transaction)
    try {
      NotificationService.notifyNewOrder(result);
    } catch (notificationError) {
      console.error('Failed to create order notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Telegram notification already sent BEFORE database save
    console.log('✅ Telegram notification was sent BEFORE database save');
    
    // Invalidate cache after successful order creation
    invalidateCache();
    
    // Add to recent activities
    try {
      addActivity({
        category: 'buyurtmalar',
        icon: 'fa-shopping-cart',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        title: 'Yangi buyurtma',
        desc: `${result.customerName} - ${result.totalAmount.toLocaleString()} so'm`,
        time: 'Hozir',
        entityType: 'order',
        entityId: result._id,
        entityName: `Buyurtma #${result._id.toString().slice(-6)}`,
      });
    } catch (activityError) {
      console.error('⚠️ Recent activity error (non-critical):', activityError.message);
    }
    
    res.status(201).json({
      success: true,
      message: 'Buyurtma muvaffaqiyatli yaratildi va mahsulot miqdorlari yangilandi',
      order: result
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ 
      success: false,
      error: 'Buyurtma yaratishda xatolik',
      message: error.message 
    });
  } finally {
    await session.endSession();
  }
};

// PUT update order
const updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findByIdAndUpdate(
      orderId,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Buyurtma topilmadi' });
    }
    
    // Invalidate cache for this order and any list that might contain it
    invalidateCache('orders');
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(400).json({ 
      error: 'Failed to update order',
      message: error.message 
    });
  }
};

// PUT update order status with optimized stock management
const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const result = await session.withTransaction(async () => {
      const { status } = req.body;
      const orderId = req.params.id;
      
      // Get current order to check for status changes
      const currentOrder = await Order.findById(orderId).session(session);
      
      if (!currentOrder) {
        throw new Error('Buyurtma topilmadi');
      }
      
      // Prevent invalid status transitions
      if (currentOrder.status === 'completed' && status === 'cancelled') {
        throw new Error('Yakunlangan buyurtmani bekor qilish mumkin emas');
      }
      
      if (currentOrder.status === 'cancelled' && status !== 'cancelled') {
        throw new Error('Bekor qilingan buyurtma holatini o\'zgartirib bo\'lmaydi');
      }
      
      const updateData = { status };
      
      if (status === 'completed') {
        updateData.completedDate = new Date();
      } else if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
        // If changing to cancelled, restore inventory using optimized approach
        updateData.cancelledDate = new Date();
        
        // Batch fetch all products for efficiency
        const productIds = currentOrder.items.map(item => item.productId);
        const products = await Product.find({
          _id: { $in: productIds }
        }).session(session);
        
        // Create product lookup map
        const productMap = new Map();
        products.forEach(product => {
          productMap.set(product._id.toString(), product);
        });
        
        // Prepare stock restoration updates
        const stockRestorations = [];
        
        for (const item of currentOrder.items) {
          const product = productMap.get(item.productId.toString());
          
          if (!product) {
            console.warn(`Product not found for inventory restoration: ${item.name} (ID: ${item.productId})`);
            continue;
          }
          
          let stockUpdateQuery = null;
          
          // Handle variant products
          if (product.hasVariants && product.variants && product.variants.length > 0 && item.variantOption) {
            // Verify variant exists
            let variantFound = false;
            for (const variant of product.variants) {
              if (variant.options.find(opt => opt.value === item.variantOption)) {
                variantFound = true;
                break;
              }
            }
            
            if (variantFound) {
              stockUpdateQuery = {
                filter: { 
                  _id: product._id,
                  'variants.options.value': item.variantOption 
                },
                update: { 
                  $inc: { 'variants.$[variant].options.$[option].stock': item.quantity } 
                },
                options: {
                  arrayFilters: [
                    { 'variant.options.value': item.variantOption },
                    { 'option.value': item.variantOption }
                  ],
                  session
                }
              };
            }
          } else {
            // Handle regular products
            stockUpdateQuery = {
              filter: { _id: product._id },
              update: { $inc: { stock: item.quantity } },
              options: { session }
            };
          }
          
          if (stockUpdateQuery) {
            stockRestorations.push(stockUpdateQuery);
          }
        }
        
        // Execute all stock restorations in parallel
        if (stockRestorations.length > 0) {
          const restorationPromises = stockRestorations.map(({ filter, update, options }) => {
            return Product.updateOne(filter, update, options);
          });
          
          await Promise.all(restorationPromises);
        }
      }
      
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true, session }
      );
      
      console.log(`✅ Order status updated: ${updatedOrder._id} -> ${status}`);
      
      return { updatedOrder, oldStatus: currentOrder.status };
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      maxCommitTimeMS: 10000
    });
    
    // Generate notification (outside transaction)
    try {
      NotificationService.notifyOrderStatusUpdate(result.updatedOrder, result.oldStatus, result.updatedOrder.status);
    } catch (notificationError) {
      console.error('Failed to create order status update notification:', notificationError);
    }

    // Send Telegram status update notification
    try {
      await telegramService.sendOrderStatusUpdate(result.updatedOrder, result.updatedOrder.status);
    } catch (telegramError) {
      console.error('Failed to send Telegram status update:', telegramError);
    }
    
    // Invalidate cache
    invalidateCache();
    
    res.json({
      success: true,
      message: 'Buyurtma holati muvaffaqiyatli yangilandi',
      order: result.updatedOrder
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(400).json({ 
      success: false,
      error: 'Buyurtma holatini yangilashda xatolik',
      message: error.message 
    });
  } finally {
    await session.endSession();
  }
};

// DELETE order
const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findByIdAndDelete(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Buyurtma topilmadi' });
    }
    
    // Invalidate all order caches
    invalidateCache('orders');
    invalidateCache('orderStats');
    
    res.json({ message: 'Buyurtma muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ 
      error: 'Failed to delete order',
      message: error.message 
    });
  }
};

// GET order statistics
const getOrderStats = async (req, res) => {
  try {
    // Use stats cache to avoid expensive aggregations
    const stats = await getCachedOrCompute('orderStats', { key: 'stats' }, STATS_CACHE_TTL, async () => {
      // Use Promise.all for concurrent queries
      const [
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        cancelledOrders,
        revenueResults
      ] = await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: 'pending' }),
        Order.countDocuments({ status: 'processing' }),
        Order.countDocuments({ status: 'completed' }),
        Order.countDocuments({ status: 'cancelled' }),
        Order.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ])
      ]);
      
      return {
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue: revenueResults[0]?.total || 0
      };
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch order statistics',
      message: error.message 
    });
  }
};

// PUT cancel order and restore inventory with optimized synchronization
const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  let productMap = new Map(); // Declare here to use outside transaction
  let order = null; // Declare here to use outside transaction
  
  try {
    const result = await session.withTransaction(async () => {
      const orderId = req.params.id;
      
      // Step 1: Find and validate the order
      order = await Order.findById(orderId).session(session);
      
      if (!order) {
        throw new Error('Buyurtma topilmadi');
      }
      
      if (order.status === 'cancelled') {
        throw new Error('Buyurtma allaqachon bekor qilingan');
      }
      
      if (order.status === 'completed') {
        throw new Error('Yakunlangan buyurtmani bekor qilish mumkin emas');
      }
      
      // Step 2: Batch fetch all products for efficiency
      const productIds = order.items.map(item => item.productId);
      const products = await Product.find({
        _id: { $in: productIds }
      }).session(session);
      
      // Create product lookup map
      products.forEach(product => {
        productMap.set(product._id.toString(), product);
      });
      
      // Step 3: Prepare stock restoration updates
      const stockRestorations = [];
      
      for (const item of order.items) {
        const product = productMap.get(item.productId.toString());
        
        if (!product) {
          console.warn(`Product not found for inventory restoration: ${item.name} (ID: ${item.productId})`);
          continue; // Skip missing products but don't fail the cancellation
        }
        
        let stockUpdateQuery = null;
        
        // Handle variant products
        if (product.hasVariants && product.variants && product.variants.length > 0 && item.variantOption) {
          // Verify variant exists before restoration
          let variantFound = false;
          for (const variant of product.variants) {
            if (variant.options.find(opt => opt.value === item.variantOption)) {
              variantFound = true;
              break;
            }
          }
          
          if (variantFound) {
            stockUpdateQuery = {
              filter: { 
                _id: product._id,
                'variants.options.value': item.variantOption 
              },
              update: { 
                $inc: { 'variants.$[variant].options.$[option].stock': item.quantity } 
              },
              options: {
                arrayFilters: [
                  { 'variant.options.value': item.variantOption },
                  { 'option.value': item.variantOption }
                ],
                session
              }
            };
          } else {
            console.warn(`Variant not found for restoration: ${item.variantOption} - ${product.name}`);
          }
        } else {
          // Handle regular products
          stockUpdateQuery = {
            filter: { _id: product._id },
            update: { $inc: { stock: item.quantity } },
            options: { session }
          };
        }
        
        if (stockUpdateQuery) {
          stockRestorations.push(stockUpdateQuery);
        }
      }
      
      // Step 4: Execute all stock restorations atomically in parallel
      if (stockRestorations.length > 0) {
        const restorationPromises = stockRestorations.map(({ filter, update, options }) => {
          return Product.updateOne(filter, update, options);
        });
        
        const restorationResults = await Promise.all(restorationPromises);
        
        // Log any failed restorations for monitoring
        restorationResults.forEach((result, index) => {
          if (result.matchedCount === 0) {
            console.warn(`Stock restoration failed - product not found: ${order.items[index].name}`);
          } else if (result.modifiedCount === 0) {
            console.warn(`Stock restoration had no effect: ${order.items[index].name}`);
          }
        });
      }
      
      // Step 5: Update order status to cancelled
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { 
          status: 'cancelled',
          cancelledDate: new Date()
        },
        { new: true, session }
      );
      
      console.log(`✅ Order cancelled successfully: ${updatedOrder._id}`);
      
      return updatedOrder;
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      maxCommitTimeMS: 10000 // 10 second timeout
    });
    
    // Step 6: Emit stock restoration events and notifications (outside transaction)
    try {
      // Emit stock restoration events for real-time updates
      if (result && order && order.items) {
        const stockRestorationEvents = [];
        for (const item of order.items) {
          const product = productMap.get(item.productId.toString());
          if (product) {
            let newQuantity = 0;
            // Calculate new stock quantity after restoration
            if (product.hasVariants && item.variantOption) {
              for (const variant of product.variants) {
                const option = variant.options.find(opt => opt.value === item.variantOption);
                if (option) {
                  newQuantity = (option.stock || 0) + item.quantity;
                  break;
                }
              }
            } else {
              newQuantity = (product.stock || 0) + item.quantity;
            }
            
            stockRestorationEvents.push({
              productId: product._id,
              stockDelta: item.quantity, // Positive for restoration
              newQuantity,
              variantOption: item.variantOption || null
            });
          }
        }
        
        // Emit bulk stock update for all restored items
        if (stockRestorationEvents.length > 0) {
          socketService.emitBulkStockUpdate(stockRestorationEvents, result._id);
          console.log(`📦 Stock restoration events emitted for cancelled order ${result._id}`);
        }
      }
      
      NotificationService.notifyAdmin({
        title: 'Buyurtma bekor qilindi',
        message: `Buyurtma #${result._id} bekor qilindi`,
        type: 'order_cancelled',
        icon: 'fa-times-circle',
        color: 'danger',
        data: result,
        action: {
          label: 'Ko\'rish',
          url: `/admin/orders/${result._id}`,
        },
      });
    } catch (notificationError) {
      console.error('Failed to create order cancellation notification:', notificationError);
      // Don't fail the request if notification fails
    }

    
    // Invalidate cache after successful cancellation
    invalidateCache();
    
    res.json({
      success: true,
      message: 'Buyurtma muvaffaqiyatli bekor qilindi va mahsulot miqdorlari qaytarildi',
      order: result
    });
    
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(400).json({ 
      success: false,
      error: 'Buyurtmani bekor qilishda xatolik',
      message: error.message 
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  getOrderStats
};
