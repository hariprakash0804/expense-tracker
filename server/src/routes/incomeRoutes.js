const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { incomeSchema } = require('../schemas');
const {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
} = require('../controllers/incomeController');

// All routes are protected
router.use(authenticate);

router.get('/', getIncomes);
router.post('/', validate(incomeSchema), createIncome);
router.get('/:id', getIncome);
router.put('/:id', validate(incomeSchema), updateIncome);
router.delete('/:id', deleteIncome);

module.exports = router;
