const express = require('express');
const router = express.Router();

// Simple orders routes
router.get('/', (req, res) => {
  res.json({ orders: [], message: 'Orders endpoint' });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Order created' });
});

module.exports = router;
