const express = require('express');
const router = express.Router();
const {
  convertBase64ToFiles,
  replaceExternalLinks,
  analyzeImageSizes
} = require('../controllers/imageOptimizationController');

// Rasm optimallashtirish yo'llari
router.post('/convert-base64', convertBase64ToFiles);
router.post('/replace-external-links', replaceExternalLinks);
router.get('/analyze', analyzeImageSizes);

module.exports = router;