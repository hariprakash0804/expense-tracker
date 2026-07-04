import api from './api';

export const expenseService = {
  getExpenses: (params = {}) => api.get('/expenses', { params }),

  getExpense: (id) => api.get(`/expenses/${id}`),

  createExpense: (data) => api.post('/expenses', data),

  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),

  deleteExpense: (id) => api.delete(`/expenses/${id}`),

  bulkDelete: (ids) => api.post('/expenses/bulk-delete', { ids }),

  getStats: (params = {}) => api.get('/expenses/stats', { params }),

  bulkImport: (expenses) => api.post('/expenses/bulk-import', { expenses }),

  getInsights: () => api.get('/expenses/insights'),
};

export const budgetService = {
  getBudgets: (params = {}) => api.get('/budgets', { params }),

  upsertBudget: (data) => api.post('/budgets', data),

  deleteBudget: (id) => api.delete(`/budgets/${id}`),

  getBudgetStatus: (params = {}) => api.get('/budgets/status', { params }),
};

export const recurringService = {
  getRecurring: (params = {}) => api.get('/recurring', { params }),

  createRecurring: (data) => api.post('/recurring', data),

  updateRecurring: (id, data) => api.put(`/recurring/${id}`, data),

  deleteRecurring: (id) => api.delete(`/recurring/${id}`),

  toggleRecurring: (id) => api.patch(`/recurring/${id}/toggle`),
};

export const marketService = {
  getExchangeRates: (params = {}) => api.get('/market/exchange-rates', { params }),

  getCurrencies: () => api.get('/market/currencies'),

  getMetalPrices: () => api.get('/market/metals'),

  getStockMarketData: () => api.get('/market/stocks'),

  getFinancialNews: () => api.get('/market/news'),

  getSavingsRates: () => api.get('/market/savings-rates'),
};

export const authService = {
  updateProfile: (data) => api.put('/auth/profile', data),

  changePassword: (data) => api.put('/auth/change-password', data),
};

export const savingsService = {
  getGoals: () => api.get('/savings'),
  createGoal: (data) => api.post('/savings', data),
  updateGoal: (id, data) => api.put(`/savings/${id}`, data),
  contribute: (id, data) => api.post(`/savings/${id}/contribute`, data),
  deleteGoal: (id) => api.delete(`/savings/${id}`),
};

export const incomeService = {
  getIncomes: (params = {}) => api.get('/incomes', { params }),
  getIncome: (id) => api.get(`/incomes/${id}`),
  createIncome: (data) => api.post('/incomes', data),
  updateIncome: (id, data) => api.put(`/incomes/${id}`, data),
  deleteIncome: (id) => api.delete(`/incomes/${id}`),
};

export const debtService = {
  getDebts: () => api.get('/debts'),
  createDebt: (data) => api.post('/debts', data),
  updateDebt: (id, data) => api.put(`/debts/${id}`, data),
  deleteDebt: (id) => api.delete(`/debts/${id}`),
};

export const portfolioService = {
  getPortfolio: () => api.get('/portfolio'),
  createHolding: (data) => api.post('/portfolio', data),
  updateHolding: (id, data) => api.put(`/portfolio/${id}`, data),
  deleteHolding: (id) => api.delete(`/portfolio/${id}`),
};
