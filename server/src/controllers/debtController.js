const { Debt } = require('../models');

// Get all debts for a user
const getDebts = async (req, res, next) => {
  try {
    const debts = await Debt.findAll({
      where: { userId: req.user.id },
      order: [['interestRate', 'DESC']], // Default sort by highest rate (avalanche seed)
    });

    res.json({
      success: true,
      data: { debts },
    });
  } catch (error) {
    next(error);
  }
};

// Create a debt
const createDebt = async (req, res, next) => {
  try {
    const debtData = {
      ...req.body,
      userId: req.user.id,
      currency: req.body.currency || req.user.currency || 'INR',
    };

    const debt = await Debt.create(debtData);

    res.status(201).json({
      success: true,
      message: 'Debt record added successfully.',
      data: { debt },
    });
  } catch (error) {
    next(error);
  }
};

// Update a debt
const updateDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!debt) {
      return res.status(404).json({
        success: false,
        message: 'Debt record not found.',
      });
    }

    await debt.update(req.body);

    res.json({
      success: true,
      message: 'Debt record updated successfully.',
      data: { debt },
    });
  } catch (error) {
    next(error);
  }
};

// Delete a debt
const deleteDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!debt) {
      return res.status(404).json({
        success: false,
        message: 'Debt record not found.',
      });
    }

    await debt.destroy();

    res.json({
      success: true,
      message: 'Debt record deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDebts,
  createDebt,
  updateDebt,
  deleteDebt,
};
