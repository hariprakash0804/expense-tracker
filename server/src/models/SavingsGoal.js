const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SavingsGoal = sequelize.define('SavingsGoal', {
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255],
    },
  },
  targetAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'target_amount',
    validate: {
      min: 0.01,
    },
  },
  currentAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'current_amount',
    validate: {
      min: 0.00,
    },
  },
  targetDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'target_date',
  },
  status: {
    type: DataTypes.ENUM('active', 'achieved', 'paused'),
    defaultValue: 'active',
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR',
  },
}, {
  tableName: 'savings_goals',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['status'] },
  ],
});

module.exports = SavingsGoal;
