const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Expense = sequelize.define('Expense', {
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
    validate: {
      len: [1, 500],
    },
  },
  category: {
    type: DataTypes.ENUM(
      'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment',
      'Health', 'Education', 'Travel', 'Rent', 'Groceries',
      'Subscriptions', 'Insurance', 'Savings', 'Investment', 'Other'
    ),
    allowNull: false,
    defaultValue: 'Other',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
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
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_recurring',
  },
  recurringId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'recurring_id',
  },
}, {
  tableName: 'expenses',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['date'] },
    { fields: ['category'] },
    { fields: ['user_id', 'date'] },
    { fields: ['user_id', 'category'] },
  ],
});

module.exports = Expense;
