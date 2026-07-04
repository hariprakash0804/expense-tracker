const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Income = sequelize.define('Income', {
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
      'Salary', 'Business', 'Investments', 'Freelance', 'Gift', 'Other'
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
      'Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other'
    ),
    defaultValue: 'Bank Transfer',
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
}, {
  tableName: 'incomes',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['date'] },
    { fields: ['category'] },
  ],
});

module.exports = Income;
