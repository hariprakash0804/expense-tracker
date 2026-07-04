const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { portfolioItemSchema } = require('../schemas');
const {
  getPortfolio,
  createHolding,
  updateHolding,
  deleteHolding,
} = require('../controllers/portfolioController');

// All routes are protected
router.use(authenticate);

router.get('/', getPortfolio);
router.post('/', validate(portfolioItemSchema), createHolding);
router.put('/:id', validate(portfolioItemSchema), updateHolding);
router.delete('/:id', deleteHolding);

module.exports = router;
