import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { expenseService, budgetService } from '../services/dataService';
import { formatCurrency, calcTrend, categoryIcons, categoryColors, formatDate, getMonthName } from '../utils/helpers';
import Header from '../components/layout/Header';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { HiOutlineCash, HiOutlineTrendingUp, HiOutlineTrendingDown, HiOutlineCalculator, HiOutlineCollection } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import InsightsCard from '../components/dashboard/InsightsCard';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, budgetRes, expensesRes] = await Promise.all([
        expenseService.getStats(),
        budgetService.getBudgetStatus(),
        expenseService.getExpenses({ limit: 5, sortBy: 'date', sortOrder: 'DESC' }),
      ]);

      setStats(statsRes.data.data);
      setBudgetStatus(budgetRes.data.data);
      setRecentExpenses(expensesRes.data.data.expenses);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="spinner spinner--lg" />
      </div>
    );
  }

  const totalSpent = stats?.summary?.totalSpent || 0;
  const totalIncome = stats?.summary?.totalIncome || 0;
  const netSavings = totalIncome - totalSpent;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const prevTotal = stats?.previousPeriodTotal || 0;
  const trend = calcTrend(totalSpent, prevTotal);

  const pieData = (stats?.categoryBreakdown || []).map(c => ({
    name: c.category,
    value: c.total,
    color: categoryColors[c.category] || categoryColors.Other,
  }));

  // Create combined cash flow trend (last 12 months)
  const spendingMap = {};
  (stats?.monthlySpending || []).forEach(m => {
    spendingMap[`${m.year}-${m.month}`] = m.total;
  });

  const cashFlowData = (stats?.monthlyIncome || []).map(m => {
    const spend = spendingMap[`${m.year}-${m.month}`] || 0;
    return {
      name: getMonthName(m.month - 1)?.substring(0, 3),
      income: m.total,
      expense: spend,
    };
  });

  const now = new Date();

  return (
    <>
      <Header
        title={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}
        subtitle={`${getMonthName(now.getMonth())} ${now.getFullYear()} Overview`}
        onAddClick={() => navigate('/expenses')}
        addLabel="Add Expense"
      />

      <div className="dashboard">
        {/* Financial Insights */}
        <InsightsCard />

        {/* Stat Cards */}
        <div className="dashboard__stats stagger-children">
          <div className="glass-card stat-card">
            <div className="stat-card__icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-primary)' }}>
              <HiOutlineTrendingUp />
            </div>
            <p className="stat-card__label">Total Income</p>
            <p className="stat-card__value">{formatCurrency(totalIncome, user?.currency)}</p>
            <span className="text-xs text-secondary">This month</span>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-card__icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)' }}>
              <HiOutlineTrendingDown />
            </div>
            <p className="stat-card__label">Total Spent</p>
            <p className="stat-card__value">{formatCurrency(totalSpent, user?.currency)}</p>
            <span className={`stat-card__trend stat-card__trend--${trend >= 0 ? 'up' : 'down'}`}>
              {trend >= 0 ? <HiOutlineTrendingUp /> : <HiOutlineTrendingDown />}
              {Math.abs(trend)}% vs last period
            </span>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-card__icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-secondary)' }}>
              <HiOutlineCash />
            </div>
            <p className="stat-card__label">Net Savings</p>
            <p className="stat-card__value" style={{ color: netSavings >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>
              {formatCurrency(netSavings, user?.currency)}
            </p>
            <span className="text-xs text-secondary">Income - Expenses</span>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-card__icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-warning)' }}>
              <HiOutlineCalculator />
            </div>
            <p className="stat-card__label">Savings Rate</p>
            <p className="stat-card__value">{savingsRate}%</p>
            <div className="progress-bar" style={{ marginTop: '8px' }}>
              <div
                className={`progress-bar__fill progress-bar__fill--${savingsRate >= 50 ? 'good' : savingsRate >= 20 ? 'warning' : 'danger'}`}
                style={{ width: `${Math.max(0, Math.min(savingsRate, 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="dashboard__charts">
          {/* Category Pie Chart */}
          <div className="glass-card--static dashboard__chart-card">
            <h3 className="dashboard__section-title">Spending by Category</h3>
            {pieData.length > 0 ? (
              <div className="dashboard__pie-container">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value, user?.currency)}
                      contentStyle={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dashboard__pie-legend">
                  {pieData.map((entry, i) => (
                    <div key={i} className="dashboard__legend-item">
                      <span className="dashboard__legend-dot" style={{ background: entry.color }} />
                      <span className="dashboard__legend-label">{categoryIcons[entry.name]} {entry.name}</span>
                      <span className="dashboard__legend-value">{formatCurrency(entry.value, user?.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p className="empty-state__icon">📊</p>
                <p className="empty-state__title">No data yet</p>
                <p className="empty-state__description">Add expenses to see category breakdown</p>
              </div>
            )}
          </div>

          {/* Monthly Trend Area Chart */}
          <div className="glass-card--static dashboard__chart-card">
            <h3 className="dashboard__section-title">Monthly Cash Flow Trend</h3>
            {cashFlowData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={cashFlowData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-danger)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--accent-danger)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value, user?.currency)}
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Area
                    type="monotone"
                    name="Income"
                    dataKey="income"
                    stroke="var(--accent-primary)"
                    strokeWidth={2}
                    fill="url(#colorIncome)"
                  />
                  <Area
                    type="monotone"
                    name="Expenses"
                    dataKey="expense"
                    stroke="var(--accent-danger)"
                    strokeWidth={2}
                    fill="url(#colorExpense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p className="empty-state__icon">📈</p>
                <p className="empty-state__title">No trend data</p>
                <p className="empty-state__description">Trends will appear after you log transactions</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="dashboard__bottom">
          {/* Recent Transactions */}
          <div className="glass-card--static dashboard__recent">
            <div className="flex justify-between items-center" style={{ padding: 'var(--space-5) var(--space-5) 0' }}>
              <h3 className="dashboard__section-title" style={{ margin: 0 }}>Recent Transactions</h3>
              <button className="btn btn--ghost btn--sm" onClick={() => navigate('/expenses')}>View All</button>
            </div>
            {recentExpenses.length > 0 ? (
              <div className="dashboard__transactions">
                {recentExpenses.map(exp => (
                  <div key={exp.id} className="dashboard__transaction">
                    <div className="dashboard__transaction-icon">
                      {categoryIcons[exp.category] || '📦'}
                    </div>
                    <div className="dashboard__transaction-info">
                      <span className="dashboard__transaction-desc">{exp.description}</span>
                      <span className="dashboard__transaction-meta">
                        {exp.category} • {formatDate(exp.date)}
                      </span>
                    </div>
                    <span className="dashboard__transaction-amount">
                      -{formatCurrency(exp.amount, exp.currency || user?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <p className="empty-state__icon">💳</p>
                <p className="empty-state__title">No transactions</p>
                <p className="empty-state__description">Your recent expenses will appear here</p>
              </div>
            )}
          </div>

          {/* Budget Overview */}
          <div className="glass-card--static dashboard__budget-overview">
            <div className="flex justify-between items-center" style={{ padding: 'var(--space-5) var(--space-5) 0' }}>
              <h3 className="dashboard__section-title" style={{ margin: 0 }}>Budget Overview</h3>
              <button className="btn btn--ghost btn--sm" onClick={() => navigate('/budget')}>Manage</button>
            </div>
            {budgetStatus?.budgetStatus?.length > 0 ? (
              <div className="dashboard__budgets">
                {budgetStatus.budgetStatus.slice(0, 5).map(b => (
                  <div key={b.id} className="dashboard__budget-item">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {categoryIcons[b.category] || '📦'} {b.category}
                      </span>
                      <span className="text-xs text-secondary">
                        {formatCurrency(b.spent, user?.currency)} / {formatCurrency(b.budgetAmount, user?.currency)}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-bar__fill progress-bar__fill--${b.status}`}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <p className="empty-state__icon">🎯</p>
                <p className="empty-state__title">No budgets set</p>
                <p className="empty-state__description">Set budgets to track your spending limits</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
