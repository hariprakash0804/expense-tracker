const { SavingsGoal, Expense } = require('../models');

// Get all savings goals for user
const getSavingsGoals = async (req, res, next) => {
  try {
    const goals = await SavingsGoal.findAll({
      where: { userId: req.user.id },
      order: [['targetDate', 'ASC']],
    });

    res.json({
      success: true,
      data: { goals },
    });
  } catch (error) {
    next(error);
  }
};

// Create a savings goal
const createSavingsGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, currentAmount = 0, targetDate, currency } = req.body;

    const goal = await SavingsGoal.create({
      userId: req.user.id,
      name,
      targetAmount,
      currentAmount,
      targetDate,
      currency: currency || req.user.currency || 'INR',
      status: parseFloat(currentAmount) >= parseFloat(targetAmount) ? 'achieved' : 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully.',
      data: { goal },
    });
  } catch (error) {
    next(error);
  }
};

// Update a savings goal
const updateSavingsGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, targetDate, status, currency } = req.body;
    
    const goal = await SavingsGoal.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found.',
      });
    }

    if (name) goal.name = name;
    if (targetAmount) goal.targetAmount = targetAmount;
    if (targetDate) goal.targetDate = targetDate;
    if (status) goal.status = status;
    if (currency) goal.currency = currency;

    // Check status if amount updated
    if (parseFloat(goal.currentAmount) >= parseFloat(goal.targetAmount)) {
      goal.status = 'achieved';
    } else if (goal.status === 'achieved') {
      goal.status = 'active';
    }

    await goal.save();

    res.json({
      success: true,
      message: 'Savings goal updated successfully.',
      data: { goal },
    });
  } catch (error) {
    next(error);
  }
};

// Contribute to or withdraw from a savings goal
const contributeToSavingsGoal = async (req, res, next) => {
  try {
    const { amount, type = 'contribute', createExpenseRef = false } = req.body;
    const goalId = req.params.id;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid contribution amount.',
      });
    }

    const goal = await SavingsGoal.findOne({
      where: { id: goalId, userId: req.user.id },
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found.',
      });
    }

    const parsedAmount = parseFloat(amount);
    let newAmount = parseFloat(goal.currentAmount);

    if (type === 'contribute') {
      newAmount += parsedAmount;
    } else if (type === 'withdraw') {
      if (newAmount < parsedAmount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient savings in goal to complete withdrawal.',
        });
      }
      newAmount -= parsedAmount;
    }

    goal.currentAmount = newAmount;
    
    // Update status based on target
    if (newAmount >= parseFloat(goal.targetAmount)) {
      goal.status = 'achieved';
    } else {
      goal.status = 'active';
    }

    await goal.save();

    // Optionally create an actual transaction in the system as "Savings"
    if (createExpenseRef && type === 'contribute') {
      await Expense.create({
        userId: req.user.id,
        amount: parsedAmount,
        description: `Savings goal contribution: ${goal.name}`,
        category: 'Savings',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        currency: goal.currency || req.user.currency || 'INR',
        notes: `Auto-created contribution for savings goal: ${goal.name}`,
      });
    }

    res.json({
      success: true,
      message: type === 'contribute' ? 'Contribution successful!' : 'Withdrawal successful!',
      data: { goal },
    });
  } catch (error) {
    next(error);
  }
};

// Delete a savings goal
const deleteSavingsGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found.',
      });
    }

    await goal.destroy();

    res.json({
      success: true,
      message: 'Savings goal deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  contributeToSavingsGoal,
  deleteSavingsGoal,
};
