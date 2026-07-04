const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const recurringRoutes = require('./routes/recurringRoutes');
const marketRoutes = require('./routes/marketRoutes');
const savingsRoutes = require('./routes/savingsRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const debtRoutes = require('./routes/debtRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Expense Tracker API is running!',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/portfolio', portfolioRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
