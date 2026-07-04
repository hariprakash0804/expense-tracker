import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { expenseService } from '../services/dataService';
import { formatCurrency, categoryColors, categoryIcons, getMonthName } from '../utils/helpers';
import Header from '../components/layout/Header';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import './Analytics.css';

const Analytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => { fetchStats(); }, [period]);

  const getDateRange = () => {
    const now = new Date();
    let start, end = new Date().toISOString().split('T')[0];
    switch (period) {
      case 'week':
        start = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0]; break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; break;
      case '3months':
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0]; break;
      case '6months':
        start = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0]; break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]; break;
      case 'custom':
        return customRange;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }
    return { startDate: start, endDate: end };
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const range = getDateRange();
      const { data } = await expenseService.getStats(range);
      setStats(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const tooltipStyle = {
    background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
    borderRadius: '8px', color: 'var(--text-primary)',
  };

  const pieData = (stats?.categoryBreakdown || []).map(c => ({
    name: c.category, value: c.total, color: categoryColors[c.category] || '#6b7280',
  }));

  const dailyData = (stats?.dailySpending || []).map(d => ({
    name: new Date(d.date).getDate().toString(), amount: d.total,
  }));

  const spendingMap = {};
  (stats?.monthlySpending || []).forEach(m => {
    spendingMap[`${m.year}-${m.month}`] = m.total;
  });

  const cashFlowData = (stats?.monthlyIncome || []).map(m => {
    const spend = spendingMap[`${m.year}-${m.month}`] || 0;
    return {
      name: getMonthName(m.month - 1)?.substring(0, 3),
      Income: m.total,
      Expenses: spend,
    };
  });

  const paymentData = (stats?.paymentBreakdown || []).map(p => ({
    name: p.paymentMethod, value: p.total, color:
      p.paymentMethod === 'UPI' ? '#8b5cf6' : p.paymentMethod === 'Cash' ? '#10b981' :
      p.paymentMethod === 'Credit Card' ? '#f43f5e' : p.paymentMethod === 'Debit Card' ? '#3b82f6' : '#6b7280',
  }));

  const horizontalData = [...(stats?.categoryBreakdown || [])].sort((a, b) => b.total - a.total).slice(0, 8).map(c => ({
    name: c.category, amount: c.total, fill: categoryColors[c.category] || '#6b7280',
  }));

  return (
    <>
      <Header title="Analytics" subtitle="Insights into your spending patterns" />
      <div className="analytics-page">
        {/* Period Selector */}
        <div className="glass-card--static analytics-page__period-bar">
          {['week', 'month', '3months', '6months', 'year'].map(p => (
            <button key={p} className={`btn ${period === p ? 'btn--primary' : 'btn--ghost'} btn--sm`}
              onClick={() => setPeriod(p)}>
              {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : p === '3months' ? '3 Months' :
               p === '6months' ? '6 Months' : 'This Year'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)' }}><div className="spinner spinner--lg" /></div>
        ) : (
          <div className="analytics-page__charts">
            {/* Category Pie */}
            <div className="glass-card--static analytics-page__chart">
              <h3 className="analytics-page__chart-title">Spending by Category</h3>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={110} paddingAngle={3} dataKey="value">
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={v => formatCurrency(v, user?.currency)} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="analytics-page__legend">
                    {pieData.map((e, i) => (
                      <div key={i} className="analytics-page__legend-item">
                        <span className="analytics-page__legend-dot" style={{ background: e.color }} />
                        <span>{categoryIcons[e.name]} {e.name}</span>
                        <span className="font-semibold">{formatCurrency(e.value, user?.currency)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="empty-state"><p>No data for this period</p></div>}
            </div>

            {/* Daily Bar */}
            <div className="glass-card--static analytics-page__chart">
              <h3 className="analytics-page__chart-title">Daily Spending</h3>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} />
                    <YAxis stroke="var(--text-tertiary)" fontSize={11} />
                    <Tooltip formatter={v => formatCurrency(v, user?.currency)} contentStyle={tooltipStyle} />
                    <Bar dataKey="amount" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No daily data</p></div>}
            </div>

            {/* Monthly Cash Flow Trend */}
            <div className="glass-card--static analytics-page__chart">
              <h3 className="analytics-page__chart-title">Income vs Expenses (Monthly)</h3>
              {cashFlowData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} />
                    <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                    <Tooltip formatter={v => formatCurrency(v, user?.currency)} contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="Income" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" fill="var(--accent-danger)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No monthly data</p></div>}
            </div>

            {/* Payment Method Donut */}
            <div className="glass-card--static analytics-page__chart">
              <h3 className="analytics-page__chart-title">Payment Methods</h3>
              {paymentData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={paymentData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3} dataKey="value">
                        {paymentData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={v => formatCurrency(v, user?.currency)} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="analytics-page__legend">
                    {paymentData.map((e, i) => (
                      <div key={i} className="analytics-page__legend-item">
                        <span className="analytics-page__legend-dot" style={{ background: e.color }} />
                        <span>{e.name}</span>
                        <span className="font-semibold">{formatCurrency(e.value, user?.currency)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="empty-state"><p>No data</p></div>}
            </div>

            {/* Top Categories Horizontal Bar */}
            <div className="glass-card--static analytics-page__chart analytics-page__chart--wide">
              <h3 className="analytics-page__chart-title">Top Spending Categories</h3>
              {horizontalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={horizontalData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis type="number" stroke="var(--text-tertiary)" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="var(--text-tertiary)" fontSize={12} width={100} />
                    <Tooltip formatter={v => formatCurrency(v, user?.currency)} contentStyle={tooltipStyle} />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                      {horizontalData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No category data</p></div>}
            </div>

            {/* Insights */}
            <div className="glass-card--static analytics-page__chart">
              <h3 className="analytics-page__chart-title">Quick Insights</h3>
              <div className="analytics-page__insights">
                <div className="analytics-page__insight">
                  <span className="analytics-page__insight-icon">💰</span>
                  <div><p className="text-sm text-secondary">Total Spent</p>
                    <p className="font-bold">{formatCurrency(stats?.summary?.totalSpent || 0, user?.currency)}</p></div>
                </div>
                <div className="analytics-page__insight">
                  <span className="analytics-page__insight-icon">📊</span>
                  <div><p className="text-sm text-secondary">Average Expense</p>
                    <p className="font-bold">{formatCurrency(stats?.summary?.averageAmount || 0, user?.currency)}</p></div>
                </div>
                <div className="analytics-page__insight">
                  <span className="analytics-page__insight-icon">🔝</span>
                  <div><p className="text-sm text-secondary">Highest Expense</p>
                    <p className="font-bold">{formatCurrency(stats?.summary?.maxExpense || 0, user?.currency)}</p></div>
                </div>
                <div className="analytics-page__insight">
                  <span className="analytics-page__insight-icon">📉</span>
                  <div><p className="text-sm text-secondary">Lowest Expense</p>
                    <p className="font-bold">{formatCurrency(stats?.summary?.minExpense || 0, user?.currency)}</p></div>
                </div>
                <div className="analytics-page__insight">
                  <span className="analytics-page__insight-icon">🔢</span>
                  <div><p className="text-sm text-secondary">Total Transactions</p>
                    <p className="font-bold">{stats?.summary?.totalCount || 0}</p></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Analytics;
