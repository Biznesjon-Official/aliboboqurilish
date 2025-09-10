const express = require('express');
const { getProductsFast } = require('../controllers/productControllerOptimized');

const router = express.Router();

// Ultra-fast products endpoint
router.get('/fast', getProductsFast);

module.exports = router;