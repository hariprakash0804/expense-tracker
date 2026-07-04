const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getExchangeRates,
  getCurrencies,
  getMetalPrices,
  getStockMarketData,
  getFinancialNews,
  getSavingsRates,
} = require('../controllers/marketController');

// Some routes are public, some protected
router.get('/exchange-rates', getExchangeRates);
router.get('/currencies', getCurrencies);
router.get('/metals', authenticate, getMetalPrices);
router.get('/stocks', authenticate, getStockMarketData);
router.get('/news', authenticate, getFinancialNews);
router.get('/savings-rates', authenticate, getSavingsRates);

module.exports = router;
