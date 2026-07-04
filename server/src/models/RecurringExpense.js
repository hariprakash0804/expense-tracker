const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RecurringExpense = sequelize.define('RecurringExpense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0.01,
    },
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM(
      'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment',
      'Health', 'Education', 'Travel', 'Rent', 'Groceries',
      'Subscriptions', 'Insurance', 'Savings', 'Investment', 'Other'
    ),
    allowNull: false,
    defaultValue: 'Bills',
  },
  paymentMethod: {
    type: DataTypes.ENUM(
      'Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking',
      'Wallet', 'Cheque', 'Other'
    ),
    defaultValue: 'Cash',
    field: 'payment_method',
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR',
  },
  frequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'),
    allowNull: false,
    defaultValue: 'monthly',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date',
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'end_date',
  },
  nextDueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'next_due_date',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  lastProcessedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_processed_at',
  },
}, {
  tableName: 'recurring_expenses',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['next_due_date'] },
    { fields: ['is_active'] },
  ],
});

module.exports = RecurringExpense;
