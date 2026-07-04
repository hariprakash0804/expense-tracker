const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100],
    },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR',
    validate: {
      len: [3, 3],
    },
  },
  theme: {
    type: DataTypes.ENUM('dark', 'light'),
    defaultValue: 'dark',
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'refresh_token',
  },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

// Instance method to compare password
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.refreshToken;
  delete values.refresh_token;
  return values;
};

module.exports = User;
