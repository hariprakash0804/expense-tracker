const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { savingsGoalSchema } = require('../schemas');
const {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  contributeToSavingsGoal,
  deleteSavingsGoal,
} = require('../controllers/savingsController');

// All endpoints require auth
router.use(authenticate);

router.get('/', getSavingsGoals);
router.post('/', validate(savingsGoalSchema), createSavingsGoal);
router.put('/:id', validate(savingsGoalSchema), updateSavingsGoal);
router.post('/:id/contribute', contributeToSavingsGoal);
router.delete('/:id', deleteSavingsGoal);

module.exports = router;
