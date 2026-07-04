const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { debtSchema } = require('../schemas');
const {
  getDebts,
  createDebt,
  updateDebt,
  deleteDebt,
} = require('../controllers/debtController');

// All routes are protected
router.use(authenticate);

router.get('/', getDebts);
router.post('/', validate(debtSchema), createDebt);
router.put('/:id', validate(debtSchema), updateDebt);
router.delete('/:id', deleteDebt);

module.exports = router;
