const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  currency: z.string().length(3).optional().default('INR'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  currency: z.string().length(3).optional(),
  theme: z.enum(['dark', 'light']).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(128),
});

const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(500),
  category: z.enum([
    'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment',
    'Health', 'Education', 'Travel', 'Rent', 'Groceries',
    'Subscriptions', 'Insurance', 'Savings', 'Investment', 'Other'
  ]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  paymentMethod: z.enum([
    'Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking',
    'Wallet', 'Cheque', 'Other'
  ]).optional().default('Cash'),
  currency: z.string().length(3).optional(),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional().default([]),
});

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required').max(50),
  amount: z.number().min(0, 'Amount must be non-negative'),
  period: z.enum(['weekly', 'monthly', 'yearly']).optional().default('monthly'),
  month: z.number().int().min(0).max(11),
  year: z.number().int().min(2020).max(2100),
  currency: z.string().length(3).optional(),
});

const recurringExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(500),
  category: z.enum([
    'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment',
    'Health', 'Education', 'Travel', 'Rent', 'Groceries',
    'Subscriptions', 'Insurance', 'Savings', 'Investment', 'Other'
  ]),
  paymentMethod: z.enum([
    'Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking',
    'Wallet', 'Cheque', 'Other'
  ]).optional().default('Cash'),
  currency: z.string().length(3).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').optional().nullable(),
});

const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  targetAmount: z.number().positive('Target must be positive'),
  currentAmount: z.number().nonnegative().optional().default(0),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be YYYY-MM-DD'),
  currency: z.string().length(3).optional(),
});

const incomeSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(500),
  category: z.enum(['Salary', 'Business', 'Investments', 'Freelance', 'Gift', 'Other']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  paymentMethod: z.enum(['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other']).optional().default('Bank Transfer'),
  currency: z.string().length(3).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

const debtSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  balance: z.number().nonnegative('Balance must be at least 0'),
  interestRate: z.number().nonnegative('Interest rate must be at least 0').max(100, 'Interest rate cannot exceed 100'),
  minPayment: z.number().nonnegative('Minimum payment must be at least 0'),
  currency: z.string().length(3).optional(),
});

const portfolioItemSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(10),
  name: z.string().optional().nullable(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  buyPrice: z.number().positive('Buy price must be positive'),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Purchase date must be YYYY-MM-DD'),
  currency: z.string().length(3).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  expenseSchema,
  budgetSchema,
  recurringExpenseSchema,
  savingsGoalSchema,
  incomeSchema,
  debtSchema,
  portfolioItemSchema,
};
