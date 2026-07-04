const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PortfolioItem = sequelize.define('PortfolioItem', {
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
  symbol: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      len: [1, 10],
    },
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  quantity: {
    type: DataTypes.DECIMAL(12, 4),
    allowNull: false,
    validate: {
      min: 0.0001,
    },
  },
  buyPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'buy_price',
    validate: {
      min: 0.01,
    },
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'purchase_date',
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD', // Stocks default USD mostly, or INR
  },
}, {
  tableName: 'portfolio_items',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['symbol'] },
  ],
});

module.exports = PortfolioItem;
