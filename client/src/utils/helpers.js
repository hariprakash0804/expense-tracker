// Currency formatting
export const formatCurrency = (amount, currency = 'INR') => {
  const num = parseFloat(amount) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
};

// Date formatting
export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatDateShort = (dateStr) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

export const formatDateTime = (dateStr) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Get today's date in YYYY-MM-DD format
export const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

// Get first day of current month
export const getFirstDayOfMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
};

// Get last day of current month
export const getLastDayOfMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
};

// Percentage calculation
export const calcPercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Trend percentage calculation
export const calcTrend = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

// Category icon mapping
export const categoryIcons = {
  Food: '🍔',
  Transport: '🚗',
  Shopping: '🛍️',
  Bills: '💡',
  Entertainment: '🎬',
  Health: '💊',
  Education: '📚',
  Travel: '✈️',
  Rent: '🏠',
  Groceries: '🛒',
  Subscriptions: '📺',
  Insurance: '🛡️',
  Savings: '💰',
  Investment: '📈',
  Other: '📦',
};

// Category colors matching CSS
export const categoryColors = {
  Food: '#f97316',
  Transport: '#3b82f6',
  Shopping: '#ec4899',
  Bills: '#eab308',
  Entertainment: '#8b5cf6',
  Health: '#10b981',
  Education: '#06b6d4',
  Travel: '#f43f5e',
  Rent: '#a855f7',
  Groceries: '#84cc16',
  Subscriptions: '#14b8a6',
  Insurance: '#6366f1',
  Savings: '#22c55e',
  Investment: '#0ea5e9',
  Other: '#6b7280',
};

export const categories = Object.keys(categoryIcons);

export const paymentMethods = [
  'Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet', 'Cheque', 'Other'
];

export const frequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

// Month names
export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Get month name from 0-indexed month
export const getMonthName = (month) => monthNames[month] || '';

// Abbreviate large numbers
export const abbreviateNumber = (num) => {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// Relative time
export const timeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateStr);
};
