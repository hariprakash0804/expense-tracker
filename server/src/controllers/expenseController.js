const { Op, fn, col, literal } = require('sequelize');
const { Expense } = require('../models');
const { sequelize } = require('../config/db');

// Get all expenses with filtering, sorting, pagination
const getExpenses = async (req, res, next) => {
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

    // Category filter
    if (category) {
      where.category = category;
    }

    // Payment method filter
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    // Currency filter
    if (currency) {
      where.currency = currency;
    }

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount[Op.gte] = parseFloat(minAmount);
      if (maxAmount) where.amount[Op.lte] = parseFloat(maxAmount);
    }

    // Search in description and notes
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

    const { count, rows } = await Expense.findAndCountAll({
      where,
      order: [[orderField, orderDir]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        expenses: rows,
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

// Get single expense
const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.',
      });
    }

    res.json({ success: true, data: { expense } });
  } catch (error) {
    next(error);
  }
};

// Create expense
const createExpense = async (req, res, next) => {
  try {
    const expenseData = {
      ...req.body,
      userId: req.user.id,
      currency: req.body.currency || req.user.currency || 'INR',
    };

    const expense = await Expense.create(expenseData);

    res.status(201).json({
      success: true,
      message: 'Expense created successfully.',
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
};

// Update expense
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.',
      });
    }

    await expense.update(req.body);

    res.json({
      success: true,
      message: 'Expense updated successfully.',
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
};

// Delete expense
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found.',
      });
    }

    await expense.destroy();

    res.json({
      success: true,
      message: 'Expense deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// Bulk delete expenses
const bulkDeleteExpenses = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of expense IDs.',
      });
    }

    const deleted = await Expense.destroy({
      where: {
        id: { [Op.in]: ids },
        userId: req.user.id,
      },
    });

    res.json({
      success: true,
      message: `${deleted} expense(s) deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// Get expense statistics/summary
const getExpenseStats = async (req, res, next) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;
    const userId = req.user.id;

    // Default to current month if no dates provided
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split('T')[0];
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString().split('T')[0];

    const dateStart = startDate || defaultStart;
    const dateEnd = endDate || defaultEnd;

    // Total spent, count, average
    const [summary] = await sequelize.query(`
      SELECT 
        COALESCE(SUM(amount), 0) as totalSpent,
        COUNT(*) as totalCount,
        COALESCE(AVG(amount), 0) as averageAmount,
        COALESCE(MAX(amount), 0) as maxExpense,
        COALESCE(MIN(amount), 0) as minExpense
      FROM expenses 
      WHERE user_id = :userId 
        AND date >= :dateStart 
        AND date <= :dateEnd
    `, {
      replacements: { userId, dateStart, dateEnd },
      type: sequelize.constructor.QueryTypes.SELECT,
    });

    // Spending by category
    const categoryBreakdown = await sequelize.query(`
      SELECT 
        category,
        SUM(amount) as total,
        COUNT(*) as count,
        AVG(amount) as average
      FROM expenses 
      WHERE user_id = :userId 
        AND date >= :dateStart 
        AND date <= :dateEnd
      GROUP BY category
      ORDER BY total DESC
    `, {
      replacements: { userId, dateStart, dateEnd },
      type: sequelize.constructor.QueryTypes.SELECT,
    });

    // Spending by payment method
    const paymentBreakdown = await sequelize.query(`
      SELECT 
        payment_method as paymentMethod,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses 
      WHERE user_id = :userId 
        AND date >= :dateStart 
        AND date <= :dateEnd
      GROUP BY payment_method
      ORDER BY total DESC
    `, {
      replacements: { userId, dateStart, dateEnd },
      type: sequelize.constructor.QueryTypes.SELECT,
    });

    // Daily spending for the period
    const dailySpending = await sequelize.query(`
      SELECT 
        date,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses 
      WHERE user_id = :userId 
        AND date >= :dateStart 
        AND date <= :dateEnd
      GROUP BY date
      ORDER BY date ASC
    `, {
      replacements: { userId, dateStart, dateEnd },
      type: sequelize.constructor.QueryTypes.SELECT,
    });

    // Monthly spending (last 12 months)
    const monthlySpending = await sequelize.query(`
      SELECT 
        YEAR(date) as year,
        MONTH(date) as month,
        SUM(amount) as total,
        COUNT(*) as count
      FROM expenses 
      WHERE user_id = :userId 
        AND date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY YEAR(date), MONTH(date)
      ORDER BY year ASC, month ASC
    `, {
      replacements: { userId },
      type: sequelize.constructor.QueryTypes.SELECT,
    });

    // Previous period comparison (for trend indicator)
    const periodLength = Math.ceil(
      (new Date(dateEnd) - new Date(dateStart)) / (1000 * 60 * 60 * 24)
    );
    const prevStart = new Date(new Date(dateStart).getTime() - periodLength * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    const prevEnd = new Date(new Date(dateStart).getTime() - 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const [prevSummary] = await sequelize.query(`
      SELECT COALESCE(SUM(amount), 0) as totalSpent
      FROM expenses 
      WHERE user_id = :userId 
        AND date >= :prevStart 
        AND date <= :prevEnd
    `, {
      replacements: { userId, prevStart, prevEnd },
      type: sequelize.constructor.QueryTypes.SELECT,
    });

    // Total income for current period
    const [incomeSummary] = await sequelize.query(`
      SELECT COALESCE(SUM(amount), 0) as totalIncome
      FROM incomes
      WHERE user_id = :userId
        AND date >= :dateStart
        AND date <= :dateEnd
    `, {
      replacements: { userId, dateStart, dateEnd },
      type: sequelize.constructor.QueryTypes.SELECT,
    });

    // Monthly income for last 12 months
    const monthlyIncome = await sequelize.query(`
      SELECT 
        YEAR(date) as year,
        MONTH(date) as month,
        SUM(amount) as total
      FROM incomes
      WHERE user_id = :userId
        AND date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY YEAR(date), MONTH(date)
      ORDER BY year ASC, month ASC
    `, {
      replacements: { userId },
      type: sequelize.constructor.QueryTypes.SELECT,
    });

    res.json({
      success: true,
      data: {
        summary: {
          ...summary,
          totalSpent: parseFloat(summary.totalSpent) || 0,
          averageAmount: parseFloat(summary.averageAmount) || 0,
          maxExpense: parseFloat(summary.maxExpense) || 0,
          minExpense: parseFloat(summary.minExpense) || 0,
          totalIncome: parseFloat(incomeSummary?.totalIncome) || 0,
        },
        previousPeriodTotal: parseFloat(prevSummary.totalSpent) || 0,
        categoryBreakdown: categoryBreakdown.map(c => ({
          ...c,
          total: parseFloat(c.total),
          average: parseFloat(c.average),
        })),
        paymentBreakdown: paymentBreakdown.map(p => ({
          ...p,
          total: parseFloat(p.total),
        })),
        dailySpending: dailySpending.map(d => ({
          ...d,
          total: parseFloat(d.total),
        })),
        monthlySpending: monthlySpending.map(m => ({
          ...m,
          total: parseFloat(m.total),
        })),
        monthlyIncome: monthlyIncome.map(m => ({
          ...m,
          total: parseFloat(m.total),
        })),
        dateRange: { startDate: dateStart, endDate: dateEnd },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Bulk import expenses
const bulkImportExpenses = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { expenses } = req.body;

    if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a non-empty array of expenses to import.',
      });
    }

    const defaultCurrency = req.user.currency || 'INR';

    const records = expenses.map(e => ({
      userId: req.user.id,
      amount: parseFloat(e.amount),
      description: e.description || 'Imported Transaction',
      category: e.category || 'Other',
      date: e.date || new Date().toISOString().split('T')[0],
      paymentMethod: e.paymentMethod || e.payment_method || 'Cash',
      currency: e.currency || defaultCurrency,
      notes: e.notes || 'Imported via CSV',
      isRecurring: false,
    }));

    const imported = await Expense.bulkCreate(records, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: `Successfully imported ${imported.length} expenses.`,
      data: { count: imported.length },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Statistical AI Financial Insights Engine
const getExpenseInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const insights = [];

    // 1. Get current month range
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // 2. Get last month range
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    // Query 1: Budget Status comparison
    const budgets = await sequelize.query(`
      SELECT b.category, b.amount as budgetAmount, COALESCE(SUM(e.amount), 0) as spent
      FROM budgets b
      LEFT JOIN expenses e ON b.category = e.category 
        AND e.user_id = b.user_id 
        AND e.date >= :thisMonthStart 
        AND e.date <= :thisMonthEnd
      WHERE b.user_id = :userId AND b.month = :month AND b.year = :year
      GROUP BY b.category, b.amount
    `, {
      replacements: { userId, thisMonthStart, thisMonthEnd, month: now.getMonth(), year: now.getFullYear() },
      type: sequelize.constructor.QueryTypes.SELECT,
    });

    budgets.forEach(b => {
      const spent = parseFloat(b.spent);
      const limit = parseFloat(b.budgetAmount);
      if (limit > 0) {
        const pct = (spent / limit) * 100;
        if (pct >= 100) {
          insights.push({
            type: 'danger',
            title: 'Budget Exceeded!',
            message: `You've exceeded your monthly ${b.category} budget of ${formatCurrency(limit, req.user.currency)}. Current spending: ${formatCurrency(spent, req.user.currency)} (${pct.toFixed(0)}%).`,
            category: b.category,
          });
        } else if (pct >= 80) {
          insights.push({
            type: 'warning',
            title: 'Budget Warning',
            message: `You've consumed ${pct.toFixed(0)}% of your ${b.category} budget. You have ${formatCurrency(limit - spent, req.user.currency)} remaining.`,
            category: b.category,
          });
        }
      }
    });

    // Query 2: Compare Category spending This Month vs Last Month
    const monthlyComp = await sequelize.query(`
      SELECT 
        category,
        SUM(CASE WHEN date >= :thisMonthStart AND date <= :thisMonthEnd THEN amount ELSE 0 END) as spentThisMonth,
        SUM(CASE WHEN date >= :lastMonthStart AND date <= :lastMonthEnd THEN amount ELSE 0 END) as spentLastMonth
      FROM expenses
      WHERE user_id = :userId AND date >= :lastMonthStart AND date <= :thisMonthEnd
      GROUP BY category
    `, {
      replacements: { userId, thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd },
      type: sequelize.constructor.QueryTypes.SELECT,
    });

    monthlyComp.forEach(c => {
      const thisMonth = parseFloat(c.spentThisMonth) || 0;
      const lastMonth = parseFloat(c.spentLastMonth) || 0;

      if (lastMonth > 200 && thisMonth > lastMonth) {
        const pctInc = ((thisMonth - lastMonth) / lastMonth) * 100;
        if (pctInc >= 25) {
          insights.push({
            type: 'info',
            title: 'Spending Surge',
            message: `Your spending on ${c.category} has increased by ${pctInc.toFixed(0)}% compared to last month (${formatCurrency(thisMonth, req.user.currency)} vs ${formatCurrency(lastMonth, req.user.currency)}).`,
            category: c.category,
          });
        }
      }
    });

    // Query 3: Subscription Fatigue check
    const [subStats] = await sequelize.query(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM expenses
      WHERE user_id = :userId AND category = 'Subscriptions' AND date >= :thisMonthStart AND date <= :thisMonthEnd
    `, {
      replacements: { userId, thisMonthStart, thisMonthEnd },
      type: sequelize.constructor.QueryTypes.SELECT,
    });

    const subTotal = parseFloat(subStats?.total) || 0;
    if (subTotal > 1000) {
      insights.push({
        type: 'warning',
        title: 'Subscription Fatigue',
        message: `You spent ${formatCurrency(subTotal, req.user.currency)} across ${subStats.count} subscriptions this month. Review unused services to save money.`,
        category: 'Subscriptions',
      });
    }

    // Query 4: Discretionary vs Essential spend check
    // Essential: Bills, Rent, Groceries, Insurance, Health, Education
    // Discretionary: Food, Shopping, Entertainment, Travel, Other
    const [spendTypes] = await sequelize.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN category IN ('Bills', 'Rent', 'Groceries', 'Insurance', 'Health', 'Education') THEN amount ELSE 0 END), 0) as essential,
        COALESCE(SUM(CASE WHEN category IN ('Food', 'Shopping', 'Entertainment', 'Travel', 'Other') THEN amount ELSE 0 END), 0) as discretionary
      FROM expenses
      WHERE user_id = :userId AND date >= :thisMonthStart AND date <= :thisMonthEnd
    `, {
      replacements: { userId, thisMonthStart, thisMonthEnd },
      type: sequelize.constructor.QueryTypes.SELECT,
    });

    const essential = parseFloat(spendTypes?.essential) || 0;
    const discretionary = parseFloat(spendTypes?.discretionary) || 0;
    const totalSpend = essential + discretionary;

    if (totalSpend > 2000 && discretionary > essential) {
      const discPct = (discretionary / totalSpend) * 100;
      insights.push({
        type: 'info',
        title: 'Lifestyle Spending',
        message: `Discretionary items (Food, Shopping, Entertainment) account for ${discPct.toFixed(0)}% of your spending this month. Standard advice is keeping this below 30%.`,
        category: 'Other',
      });
    }

    // Default insight if list empty
    if (insights.length === 0) {
      insights.push({
        type: 'success',
        title: 'Finances Healthy!',
        message: "You're spending within limits and tracking details properly. Keep up the good work!",
        category: 'Savings',
      });
    }

    res.json({
      success: true,
      data: { insights },
    });
  } catch (error) {
    next(error);
  }
};

// Helper for formatting inside backend insights
const formatCurrency = (amount, currency = 'INR') => {
  const num = parseFloat(amount) || 0;
  return `${currency} ${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  bulkDeleteExpenses,
  getExpenseStats,
  bulkImportExpenses,
  getExpenseInsights,
};
