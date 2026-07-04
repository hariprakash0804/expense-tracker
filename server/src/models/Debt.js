const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Debt = sequelize.define('Debt', {
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
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0.00,
    },
  },
  interestRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'interest_rate',
    validate: {
      min: 0.00,
      max: 100.00,
    },
  },
  minPayment: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'min_payment',
    validate: {
      min: 0.00,
    },
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR',
  },
}, {
  tableName: 'debts',
  indexes: [
    { fields: ['user_id'] },
  ],
});

module.exports = Debt;
