const { Op } = require('sequelize');
const { Budget, Expense } = require('../models');
const { sequelize } = require('../config/db');

// Get budgets for a specific month/year
const getBudgets = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) ?? now.getMonth();
    const year = parseInt(req.query.year) || now.getFullYear();

    const budgets = await Budget.findAll({
      where: {
        userId: req.user.id,
        month,
        year,
      },
      order: [['category', 'ASC']],
    });

    res.json({
      success: true,
      data: { budgets, month, year },
    });
  } catch (error) {
    next(error);
  }
};

// Create or update a budget
const upsertBudget = async (req, res, next) => {
  try {
    const { category, amount, period, month, year, currency } = req.body;

    const [budget, created] = await Budget.findOrCreate({
      where: {
        userId: req.user.id,
        category,
        month,
        year,
      },
      defaults: {
        userId: req.user.id,
        category,
        amount,
        period: period || 'monthly',
        month,
        year,
        currency: currency || req.user.currency || 'INR',
      },
    });

    if (!created) {
      budget.amount = amount;
      if (period) budget.period = period;
      if (currency) budget.currency = currency;
      await budget.save();
    }

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Budget created successfully.' : 'Budget updated successfully.',
      data: { budget },
    });
  } catch (error) {
    next(error);
  }
};

// Delete a budget
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found.',
      });
    }

    await budget.destroy();

    res.json({
      success: true,
      message: 'Budget deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// Get budget status — budget vs actual spending
const getBudgetStatus = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) ?? now.getMonth();
    const year = parseInt(req.query.year) || now.getFullYear();
    const userId = req.user.id;

    // Get all budgets for this month
    const budgets = await Budget.findAll({
      where: { userId, month, year },
    });

    // Calculate date range for this month
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    // Get actual spending by category
    const spending = await sequelize.query(`
      SELECT 
        category,
        SUM(amount) as spent,
        COUNT(*) as transactionCount
      FROM expenses 
      WHERE user_id = :userId 
        AND date >= :startDate 
        AND date <= :endDate
      GROUP BY category
    `, {
      replacements: { userId, startDate, endDate },
      type: sequelize.constructor.QueryTypes.SELECT,
    });

    // Get total spending
    const [totalResult] = await sequelize.query(`
      SELECT COALESCE(SUM(amount), 0) as totalSpent
      FROM expenses 
      WHERE user_id = :userId 
        AND date >= :startDate 
        AND date <= :endDate
    `, {
      replacements: { userId, startDate, endDate },
      type: sequelize.constructor.QueryTypes.SELECT,
    });

    // Merge budgets with actual spending
    const spendingMap = {};
    spending.forEach(s => {
      spendingMap[s.category] = {
        spent: parseFloat(s.spent),
        transactionCount: parseInt(s.transactionCount),
      };
    });

    const budgetStatus = budgets.map(budget => {
      const categorySpending = spendingMap[budget.category] || { spent: 0, transactionCount: 0 };
      const budgetAmount = parseFloat(budget.amount);
      const percentage = budgetAmount > 0 ? (categorySpending.spent / budgetAmount) * 100 : 0;

      return {
        id: budget.id,
        category: budget.category,
        budgetAmount,
        spent: categorySpending.spent,
        remaining: budgetAmount - categorySpending.spent,
        percentage: Math.round(percentage * 100) / 100,
        transactionCount: categorySpending.transactionCount,
        status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'good',
      };
    });

    // Calculate total budget
    const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const totalSpent = parseFloat(totalResult.totalSpent) || 0;

    res.json({
      success: true,
      data: {
        budgetStatus,
        summary: {
          totalBudget,
          totalSpent,
          totalRemaining: totalBudget - totalSpent,
          overallPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 10000) / 100 : 0,
        },
        month,
        year,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  upsertBudget,
  deleteBudget,
  getBudgetStatus,
};
