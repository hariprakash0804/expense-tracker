const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Budget = sequelize.define('Budget', {
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
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  period: {
    type: DataTypes.ENUM('weekly', 'monthly', 'yearly'),
    defaultValue: 'monthly',
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 11,
    },
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR',
  },
}, {
  tableName: 'budgets',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['user_id', 'month', 'year'] },
    { unique: true, fields: ['user_id', 'category', 'month', 'year'] },
  ],
});

module.exports = Budget;
