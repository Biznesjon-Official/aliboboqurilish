const express = require('express');
const router = express.Router();
const {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  trackPromotionClick,
  getPromotionAnalytics
} = require('../controllers/promotionController');

// Public routes
router.get('/', getPromotions);
router.get('/analytics', getPromotionAnalytics);
router.get('/:id', getPromotionById);
router.post('/:id/click', trackPromotionClick);

// Admin routes (you can add authentication middleware here)
router.post('/', createPromotion);
router.put('/:id', updatePromotion);
router.delete('/:id', deletePromotion);

module.exports = router;