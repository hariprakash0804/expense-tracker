const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { expenseSchema } = require('../schemas');
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  bulkDeleteExpenses,
  getExpenseStats,
  bulkImportExpenses,
  getExpenseInsights,
} = require('../controllers/expenseController');

// All routes are protected
router.use(authenticate);

// Stats & Insights routes (must be before :id to avoid conflict)
router.get('/stats', getExpenseStats);
router.get('/insights', getExpenseInsights);
router.post('/bulk-import', bulkImportExpenses);

// CRUD routes
router.get('/', getExpenses);
router.post('/', validate(expenseSchema), createExpense);
router.post('/bulk-delete', bulkDeleteExpenses);
router.get('/:id', getExpense);
router.put('/:id', validate(expenseSchema), updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
