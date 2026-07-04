import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { expenseService, savingsService, debtService } from '../services/dataService';
import { formatCurrency } from '../utils/helpers';
import Header from '../components/layout/Header';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { HiOutlineScale, HiOutlineTrendingUp, HiOutlineTrendingDown, HiOutlineShieldCheck, HiOutlineExclamation } from 'react-icons/hi';
import './BalanceSheet.css';

const BalanceSheet = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  // Financial aggregates
  const [cashBalance, setCashBalance] = useState(0);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const [statsRes, savingsRes, debtsRes] = await Promise.allSettled([
        expenseService.getStats({ startDate: '1970-01-01', endDate: new Date().toISOString().split('T')[0] }), // fetch all-time stats for true cash balance
        savingsService.getGoals(),
        debtService.getDebts(),
      ]);

      if (statsRes.status === 'fulfilled') {
        const totalIncome = statsRes.value.data?.data?.summary?.totalIncome || 0;
        const totalSpent = statsRes.value.data?.data?.summary?.totalSpent || 0;
        // Cash balance is Net Cash Flow
        setCashBalance(Math.max(0, totalIncome - totalSpent));
      }

      if (savingsRes.status === 'fulfilled') {
        setSavingsGoals(savingsRes.value.data?.data?.goals || []);
      }

      if (debtsRes.status === 'fulfilled') {
        setDebts(debtsRes.value.data?.data?.debts || []);
      }

    } catch (err) {
      toast.error('Failed to load balance sheet details');
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const totalGoalSavings = savingsGoals.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0);
  const totalAssets = cashBalance + totalGoalSavings;
  const totalLiabilities = debts.reduce((sum, d) => sum + parseFloat(d.balance), 0);
  const netWorth = totalAssets - totalLiabilities;

  // Ratios
  const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
  
  const getDebtStatus = (ratio) => {
    if (ratio === 0 && totalLiabilities === 0) return { label: 'Debt Free! 🎉', level: 'good' };
    if (ratio < 30) return { label: 'Healthy (Low Leverage)', level: 'good' };
    if (ratio <= 50) return { label: 'Caution (Moderate Leverage)', level: 'warning' };
    return { label: 'Critical (Highly Leveraged)', level: 'danger' };
  };

  const solvency = getDebtStatus(debtToAssetRatio);

  // Asset allocation pie data
  const assetAllocationData = [
    { name: 'Liquid Cash', value: Math.round(cashBalance), color: '#10b981' },
    { name: 'Savings Goals', value: Math.round(totalGoalSavings), color: '#3b82f6' }
  ].filter(item => item.value > 0);

  const tooltipStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
  };

  return (
    <>
      <Header title="Balance Sheet" subtitle="A unified view of your assets, liabilities, and Net Worth" />
      <div className="balance-sheet-page">
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)' }}>
            <div className="spinner spinner--lg" />
          </div>
        ) : (
          <div className="balance-sheet-page__workspace">
            {/* Top Net Worth Banner Card */}
            <div className="glass-card balance-sheet-page__net-worth-banner">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h4 className="text-secondary text-xs font-semibold uppercase tracking-wider">YOUR EST. NET WORTH</h4>
                  <p className={`text-4xl font-extrabold mt-1 ${netWorth >= 0 ? 'text-primary' : 'text-danger'}`}
                    style={{ color: netWorth >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>
                    {formatCurrency(netWorth, user?.currency)}
                  </p>
                </div>
                
                {/* Solvency Ratio indicator */}
                <div className={`balance-sheet-page__solvency balance-sheet-page__solvency--${solvency.level}`}>
                  {solvency.level === 'good' ? <HiOutlineShieldCheck size={20} /> : <HiOutlineExclamation size={20} />}
                  <div>
                    <span className="block text-xs font-semibold uppercase">Solvency Rating</span>
                    <span className="block text-sm font-bold">{solvency.label}</span>
                    <span className="text-xs opacity-75">Debt-to-Asset: {debtToAssetRatio.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Asset vs Liability Comparison Grid */}
            <div className="balance-sheet-page__tables-grid mt-6">
              {/* ASSETS PANEL */}
              <div className="glass-card--static balance-sheet-page__section">
                <div className="flex justify-between items-center mb-4 border-b border-subtle pb-2">
                  <h3 className="font-bold flex items-center gap-2"><HiOutlineTrendingUp className="text-success" /> Assets</h3>
                  <span className="font-bold text-success" style={{ color: 'var(--accent-primary)' }}>
                    {formatCurrency(totalAssets, user?.currency)}
                  </span>
                </div>
                
                <div className="balance-sheet-page__list">
                  {/* Cash */}
                  <div className="balance-sheet-page__item p-3 rounded mb-2 bg-input">
                    <div className="flex justify-between">
                      <span className="font-medium text-sm">Liquid Cash</span>
                      <span className="font-bold text-sm text-success">{formatCurrency(cashBalance, user?.currency)}</span>
                    </div>
                    <span className="text-xs text-secondary">Accumulated cash balance (Income - Expense)</span>
                  </div>

                  {/* Savings Goals details */}
                  {savingsGoals.length > 0 ? (
                    savingsGoals.map(g => (
                      <div key={g.id} className="balance-sheet-page__item p-3 rounded mb-2 bg-input">
                        <div className="flex justify-between">
                          <span className="font-medium text-sm">🎯 Goal: {g.name}</span>
                          <span className="font-bold text-sm text-success">{formatCurrency(g.currentAmount, g.currency)}</span>
                        </div>
                        <span className="text-xs text-secondary">Target: {formatCurrency(g.targetAmount, g.currency)} ({Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))}% saved)</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-secondary italic text-center p-4">No target savings goals defined.</p>
                  )}
                </div>
              </div>

              {/* LIABILITIES PANEL */}
              <div className="glass-card--static balance-sheet-page__section">
                <div className="flex justify-between items-center mb-4 border-b border-subtle pb-2">
                  <h3 className="font-bold flex items-center gap-2"><HiOutlineTrendingDown className="text-danger" /> Liabilities</h3>
                  <span className="font-bold text-danger" style={{ color: 'var(--accent-danger)' }}>
                    {formatCurrency(totalLiabilities, user?.currency)}
                  </span>
                </div>
                
                <div className="balance-sheet-page__list">
                  {debts.length > 0 ? (
                    debts.map(d => (
                      <div key={d.id} className="balance-sheet-page__item p-3 rounded mb-2 bg-input">
                        <div className="flex justify-between">
                          <span className="font-medium text-sm">💳 Dues: {d.name}</span>
                          <span className="font-bold text-sm text-danger">{formatCurrency(d.balance, d.currency)}</span>
                        </div>
                        <span className="text-xs text-secondary">Rate: {d.interestRate}% APR • Min. Payment: {formatCurrency(d.minPayment, d.currency)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-secondary italic text-center p-4">No outstanding liabilities recorded.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Asset allocation donut visualization */}
            {assetAllocationData.length > 0 && (
              <div className="glass-card--static p-5 mt-6">
                <h3 className="font-bold text-sm mb-4">Asset Allocation Breakdown</h3>
                <div className="balance-sheet-page__chart-block">
                  <div style={{ width: 220, height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={assetAllocationData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {assetAllocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={v => formatCurrency(v, user?.currency)} contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="balance-sheet-page__chart-labels">
                    {assetAllocationData.map((item, idx) => (
                      <div key={idx} className="balance-sheet-page__legend-item">
                        <span className="balance-sheet-page__legend-dot" style={{ background: item.color }} />
                        <span className="text-xs text-secondary">{item.name}:</span>
                        <span className="text-xs font-semibold ml-1">{formatCurrency(item.value, user?.currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default BalanceSheet;
