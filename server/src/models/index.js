const User = require('./User');
const Expense = require('./Expense');
const Budget = require('./Budget');
const RecurringExpense = require('./RecurringExpense');
const SavingsGoal = require('./SavingsGoal');
const Income = require('./Income');
const Debt = require('./Debt');
const PortfolioItem = require('./PortfolioItem');

// Associations
User.hasMany(Expense, { foreignKey: 'user_id', as: 'expenses', onDelete: 'CASCADE' });
Expense.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Budget, { foreignKey: 'user_id', as: 'budgets', onDelete: 'CASCADE' });
Budget.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(RecurringExpense, { foreignKey: 'user_id', as: 'recurringExpenses', onDelete: 'CASCADE' });
RecurringExpense.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(SavingsGoal, { foreignKey: 'user_id', as: 'savingsGoals', onDelete: 'CASCADE' });
SavingsGoal.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Income, { foreignKey: 'user_id', as: 'incomes', onDelete: 'CASCADE' });
Income.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Debt, { foreignKey: 'user_id', as: 'debts', onDelete: 'CASCADE' });
Debt.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(PortfolioItem, { foreignKey: 'user_id', as: 'portfolioItems', onDelete: 'CASCADE' });
PortfolioItem.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

RecurringExpense.hasMany(Expense, { foreignKey: 'recurring_id', as: 'generatedExpenses' });
Expense.belongsTo(RecurringExpense, { foreignKey: 'recurring_id', as: 'recurringSource' });

module.exports = {
  User,
  Expense,
  Budget,
  RecurringExpense,
  SavingsGoal,
  Income,
  Debt,
  PortfolioItem,
};
