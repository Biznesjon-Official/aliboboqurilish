const express = require('express');
const router = express.Router();
const { getOrders, createOrder, updateOrderStatus, deleteOrder } = require('../controllers/ordersController');

// Get all orders with pagination and filtering
router.get('/', getOrders);

// Create new order
router.post('/', createOrder);

// Update order status
router.put('/:id/status', updateOrderStatus);

// Delete order
router.delete('/:id', deleteOrder);

module.exports = router;
