const { Sequelize } = require('sequelize');
require('dotenv').config();

// Determine if we should use SSL. TiDB Cloud requires SSL connections.
const useSSL = process.env.DB_SSL === 'true' || 
  (process.env.DB_HOST && (
    process.env.DB_HOST.includes('tidbcloud.com') || 
    process.env.DB_HOST.includes('tidb')
  ));

const sequelize = new Sequelize(
  process.env.DB_NAME || 'expense_tracker',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: useSSL ? {
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
      },
    } : {},
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL database connected successfully');
    
    // Sync all models (force: false to not drop tables)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database models synchronized');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
