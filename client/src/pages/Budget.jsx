import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { budgetService } from '../services/dataService';
import { formatCurrency, categories, categoryIcons, getMonthName, monthNames } from '../utils/helpers';
import Header from '../components/layout/Header';
import { HiOutlineX, HiOutlineTrash } from 'react-icons/hi';
import './Budget.css';

const Budget = () => {
  const { user } = useAuth();
  const toast = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: 'Food', amount: '' });

  useEffect(() => { fetchBudgetStatus(); }, [month, year]);

  const fetchBudgetStatus = async () => {
    setLoading(true);
    try {
      const { data } = await budgetService.getBudgetStatus({ month, year });
      setBudgetStatus(data.data);
    } catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await budgetService.upsertBudget({
        category: form.category, amount: parseFloat(form.amount),
        period: 'monthly', month, year, currency: user?.currency,
      });
      toast.success('Budget saved!');
      setShowModal(false);
      fetchBudgetStatus();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save budget'); }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Remove this budget?')) return;
    try { await budgetService.deleteBudget(id); toast.success('Budget removed'); fetchBudgetStatus(); }
    catch { toast.error('Delete failed'); }
  };

  const summary = budgetStatus?.summary || {};

  return (
    <>
      <Header title="Budget" subtitle={`${getMonthName(month)} ${year}`} onAddClick={() => setShowModal(true)} addLabel="Set Budget" />
      <div className="budget-page">
        {/* Month Selector */}
        <div className="glass-card--static budget-page__month-bar">
          <select className="form-select" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
            {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select className="form-select" value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Summary Card */}
        <div className="glass-card budget-page__summary">
          <div className="budget-page__summary-item">
            <span className="text-sm text-secondary">Total Budget</span>
            <span className="budget-page__summary-value">{formatCurrency(summary.totalBudget || 0, user?.currency)}</span>
          </div>
          <div className="budget-page__summary-divider" />
          <div className="budget-page__summary-item">
            <span className="text-sm text-secondary">Total Spent</span>
            <span className="budget-page__summary-value" style={{ color: 'var(--accent-danger)' }}>{formatCurrency(summary.totalSpent || 0, user?.currency)}</span>
          </div>
          <div className="budget-page__summary-divider" />
          <div className="budget-page__summary-item">
            <span className="text-sm text-secondary">Remaining</span>
            <span className="budget-page__summary-value" style={{ color: (summary.totalRemaining || 0) >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>
              {formatCurrency(summary.totalRemaining || 0, user?.currency)}
            </span>
          </div>
          <div className="budget-page__summary-divider" />
          <div className="budget-page__summary-item">
            <span className="text-sm text-secondary">Used</span>
            <span className="budget-page__summary-value">{summary.overallPercentage || 0}%</span>
          </div>
        </div>

        {/* Budget Cards */}
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)' }}><div className="spinner" /></div>
        ) : budgetStatus?.budgetStatus?.length > 0 ? (
          <div className="budget-page__grid stagger-children">
            {budgetStatus.budgetStatus.map(b => (
              <div key={b.id} className="glass-card budget-page__card">
                <div className="budget-page__card-header">
                  <div className="flex items-center gap-3">
                    <span className="budget-page__card-icon">{categoryIcons[b.category] || '📦'}</span>
                    <div>
                      <h3 className="budget-page__card-title">{b.category}</h3>
                      <span className="text-xs text-secondary">{b.transactionCount} transactions</span>
                    </div>
                  </div>
                  <button className="btn btn--ghost btn--icon" onClick={() => handleDeleteBudget(b.id)} title="Remove"
                    style={{ color: 'var(--accent-danger)' }}><HiOutlineTrash size={16} /></button>
                </div>
                <div className="budget-page__card-amounts">
                  <span className="font-semibold">{formatCurrency(b.spent, user?.currency)}</span>
                  <span className="text-secondary text-sm">of {formatCurrency(b.budgetAmount, user?.currency)}</span>
                </div>
                <div className="progress-bar" style={{ height: '10px' }}>
                  <div className={`progress-bar__fill progress-bar__fill--${b.status}`}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }} />
                </div>
                <div className="flex justify-between">
                  <span className={`badge badge--${b.status === 'exceeded' ? 'danger' : b.status === 'warning' ? 'warning' : 'success'}`}>
                    {b.percentage}% used
                  </span>
                  <span className="text-sm" style={{ color: b.remaining >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>
                    {b.remaining >= 0 ? `${formatCurrency(b.remaining, user?.currency)} left` : `${formatCurrency(Math.abs(b.remaining), user?.currency)} over`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-state__icon">🎯</p>
            <p className="empty-state__title">No budgets set</p>
            <p className="empty-state__description">Set budgets for different categories to control your spending</p>
            <button className="btn btn--primary" onClick={() => setShowModal(true)}>Set Your First Budget</button>
          </div>
        )}
      </div>

      {/* Add Budget Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Set Budget</h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowModal(false)}><HiOutlineX /></button>
            </div>
            <form className="modal__body" onSubmit={handleAddBudget} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {categories.map(c => <option key={c} value={c}>{categoryIcons[c]} {c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Budget Amount ({user?.currency})</label>
                <input type="number" step="0.01" className="form-input" placeholder="Enter budget limit"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="modal__footer" style={{ padding: 0, borderTop: 'none' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">Save Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Budget;
