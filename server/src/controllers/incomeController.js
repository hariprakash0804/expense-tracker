const { Op } = require('sequelize');
const { Income } = require('../models');

// Get all incomes with filtering, sorting, pagination
const getIncomes = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'DESC',
      category,
      paymentMethod,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      currency,
    } = req.query;

    const where = { userId: req.user.id };

    if (category) {
      where.category = category;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (currency) {
      where.currency = currency;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount[Op.gte] = parseFloat(minAmount);
      if (maxAmount) where.amount[Op.lte] = parseFloat(maxAmount);
    }

    if (search) {
      where[Op.or] = [
        { description: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const validSortFields = ['date', 'amount', 'category', 'created_at'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'date';
    const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Income.findAndCountAll({
      where,
      order: [[orderField, orderDir]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        incomes: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single income
const getIncome = async (req, res, next) => {
  try {
    const income = await Income.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found.',
      });
    }

    res.json({ success: true, data: { income } });
  } catch (error) {
    next(error);
  }
};

// Create income
const createIncome = async (req, res, next) => {
  try {
    const incomeData = {
      ...req.body,
      userId: req.user.id,
      currency: req.body.currency || req.user.currency || 'INR',
    };

    const income = await Income.create(incomeData);

    res.status(201).json({
      success: true,
      message: 'Income logged successfully.',
      data: { income },
    });
  } catch (error) {
    next(error);
  }
};

// Update income
const updateIncome = async (req, res, next) => {
  try {
    const income = await Income.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found.',
      });
    }

    await income.update(req.body);

    res.json({
      success: true,
      message: 'Income updated successfully.',
      data: { income },
    });
  } catch (error) {
    next(error);
  }
};

// Delete income
const deleteIncome = async (req, res, next) => {
  try {
    const income = await Income.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income record not found.',
      });
    }

    await income.destroy();

    res.json({
      success: true,
      message: 'Income deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
};
