const { Op } = require('sequelize');
const { RecurringExpense, Expense } = require('../models');

// Get all recurring expenses for the user
const getRecurringExpenses = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const where = { userId: req.user.id };

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const recurring = await RecurringExpense.findAll({
      where,
      order: [['nextDueDate', 'ASC']],
    });

    res.json({
      success: true,
      data: { recurring },
    });
  } catch (error) {
    next(error);
  }
};

// Create recurring expense
const createRecurringExpense = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      userId: req.user.id,
      nextDueDate: req.body.startDate,
      currency: req.body.currency || req.user.currency || 'INR',
    };

    const recurring = await RecurringExpense.create(data);

    res.status(201).json({
      success: true,
      message: 'Recurring expense created successfully.',
      data: { recurring },
    });
  } catch (error) {
    next(error);
  }
};

// Update recurring expense
const updateRecurringExpense = async (req, res, next) => {
  try {
    const recurring = await RecurringExpense.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!recurring) {
      return res.status(404).json({
        success: false,
        message: 'Recurring expense not found.',
      });
    }

    await recurring.update(req.body);

    res.json({
      success: true,
      message: 'Recurring expense updated successfully.',
      data: { recurring },
    });
  } catch (error) {
    next(error);
  }
};

// Delete (deactivate) recurring expense
const deleteRecurringExpense = async (req, res, next) => {
  try {
    const recurring = await RecurringExpense.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!recurring) {
      return res.status(404).json({
        success: false,
        message: 'Recurring expense not found.',
      });
    }

    // Soft deactivate rather than hard delete
    recurring.isActive = false;
    await recurring.save();

    res.json({
      success: true,
      message: 'Recurring expense deactivated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// Toggle active status
const toggleRecurringExpense = async (req, res, next) => {
  try {
    const recurring = await RecurringExpense.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!recurring) {
      return res.status(404).json({
        success: false,
        message: 'Recurring expense not found.',
      });
    }

    recurring.isActive = !recurring.isActive;
    await recurring.save();

    res.json({
      success: true,
      message: `Recurring expense ${recurring.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { recurring },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  toggleRecurringExpense,
};
