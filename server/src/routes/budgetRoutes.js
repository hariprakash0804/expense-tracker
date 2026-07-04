const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { budgetSchema } = require('../schemas');
const {
  getBudgets,
  upsertBudget,
  deleteBudget,
  getBudgetStatus,
} = require('../controllers/budgetController');

router.use(authenticate);

router.get('/', getBudgets);
router.get('/status', getBudgetStatus);
router.post('/', validate(budgetSchema), upsertBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
