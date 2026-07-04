const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { recurringExpenseSchema } = require('../schemas');
const {
  getRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  toggleRecurringExpense,
} = require('../controllers/recurringController');

router.use(authenticate);

router.get('/', getRecurringExpenses);
router.post('/', validate(recurringExpenseSchema), createRecurringExpense);
router.put('/:id', updateRecurringExpense);
router.patch('/:id/toggle', toggleRecurringExpense);
router.delete('/:id', deleteRecurringExpense);

module.exports = router;
