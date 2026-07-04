import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { savingsService } from '../services/dataService';
import { formatCurrency, formatDate, getToday } from '../utils/helpers';
import Header from '../components/layout/Header';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineX, HiOutlineTrendingUp, HiOutlineTrendingDown } from 'react-icons/hi';
import './Savings.css';

const Savings = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showContributionModal, setShowContributionModal] = useState(false);
  
  // Selected goal for contribution/withdrawal
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contributionForm, setContributionForm] = useState({
    amount: '',
    type: 'contribute', // contribute / withdraw
    createExpenseRef: true
  });

  const [newGoalForm, setNewGoalForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: getToday(),
    currency: user?.currency || 'INR'
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const { data } = await savingsService.getGoals();
      setGoals(data.data.goals);
    } catch {
      toast.error('Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoalForm.name || !newGoalForm.targetAmount || parseFloat(newGoalForm.targetAmount) <= 0) {
      toast.error('Please fill in name and a valid target amount.');
      return;
    }

    try {
      await savingsService.createGoal({
        name: newGoalForm.name,
        targetAmount: parseFloat(newGoalForm.targetAmount),
        currentAmount: parseFloat(newGoalForm.currentAmount || 0),
        targetDate: newGoalForm.targetDate,
        currency: newGoalForm.currency
      });

      toast.success('Savings goal created successfully!');
      setShowGoalModal(false);
      setNewGoalForm({
        name: '',
        targetAmount: '',
        currentAmount: '0',
        targetDate: getToday(),
        currency: user?.currency || 'INR'
      });
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save savings goal');
    }
  };

  const handleContributeSubmit = async (e) => {
    e.preventDefault();
    if (!contributionForm.amount || parseFloat(contributionForm.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      await savingsService.contribute(selectedGoal.id, {
        amount: parseFloat(contributionForm.amount),
        type: contributionForm.type,
        createExpenseRef: contributionForm.createExpenseRef
      });

      toast.success(contributionForm.type === 'contribute' ? 'Savings added!' : 'Funds withdrawn!');
      setShowContributionModal(false);
      setContributionForm({ amount: '', type: 'contribute', createExpenseRef: true });
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this savings goal?')) return;
    try {
      await savingsService.deleteGoal(id);
      toast.success('Savings goal deleted');
      fetchGoals();
    } catch {
      toast.error('Failed to delete savings goal');
    }
  };

  const openContribution = (goal, type) => {
    setSelectedGoal(goal);
    setContributionForm({ amount: '', type, createExpenseRef: true });
    setShowContributionModal(true);
  };

  return (
    <>
      <Header title="Savings Goals" subtitle="Create targets and save dynamically" onAddClick={() => setShowGoalModal(true)} addLabel="New Goal" />
      <div className="savings-page">
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)' }}>
            <div className="spinner spinner--lg" />
          </div>
        ) : goals.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__icon">🎯</p>
            <p className="empty-state__title">No Savings Goals Set</p>
            <p className="empty-state__description">Set a target savings goal for major purchases, emergency funds, or investments.</p>
            <button className="btn btn--primary" onClick={() => setShowGoalModal(true)}>Create Savings Goal</button>
          </div>
        ) : (
          <div className="savings-page__grid stagger-children">
            {goals.map(g => {
              const current = parseFloat(g.currentAmount);
              const target = parseFloat(g.targetAmount);
              const remaining = target - current;
              const percentage = Math.min(Math.round((current / target) * 100), 100);
              const isAchieved = current >= target || g.status === 'achieved';

              return (
                <div key={g.id} className={`glass-card savings-page__card ${isAchieved ? 'savings-page__card--achieved' : ''}`}>
                  <div className="savings-page__card-header">
                    <div>
                      <h3 className="savings-page__card-title">{g.name}</h3>
                      <span className="text-xs text-secondary">Target: {formatDate(g.targetDate)}</span>
                    </div>
                    <button className="btn btn--ghost btn--icon" onClick={() => handleDeleteGoal(g.id)} style={{ color: 'var(--accent-danger)' }}>
                      <HiOutlineTrash size={16} />
                    </button>
                  </div>

                  {/* Progress bar visual */}
                  <div className="savings-page__progress-container mt-3">
                    <div className="flex justify-between items-baseline text-xs mb-1">
                      <span className="font-semibold" style={{ color: isAchieved ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                        {percentage}% Saved
                      </span>
                      <span className="text-secondary">
                        {isAchieved ? 'Completed!' : `${formatCurrency(remaining, g.currency)} left`}
                      </span>
                    </div>
                    <div className="progress-bar" style={{ height: '12px' }}>
                      <div className={`progress-bar__fill ${isAchieved ? 'progress-bar__fill--good' : 'progress-bar__fill--warning'}`}
                        style={{ width: `${percentage}%` }} />
                    </div>
                  </div>

                  <div className="savings-page__card-amounts mt-4">
                    <div className="savings-page__amount-col">
                      <span className="text-xs text-secondary">SAVED</span>
                      <span className="font-bold text-sm" style={{ color: 'var(--accent-primary)' }}>
                        {formatCurrency(g.currentAmount, g.currency)}
                      </span>
                    </div>
                    <div className="savings-page__amount-col text-right">
                      <span className="text-xs text-secondary">TARGET</span>
                      <span className="font-bold text-sm">
                        {formatCurrency(g.targetAmount, g.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="savings-page__card-actions mt-4 flex gap-3">
                    <button className="btn btn--primary btn--sm flex-1" onClick={() => openContribution(g, 'contribute')}>
                      <HiOutlineTrendingUp /> Add
                    </button>
                    <button className="btn btn--ghost btn--sm flex-1" onClick={() => openContribution(g, 'withdraw')}>
                      <HiOutlineTrendingDown /> Withdraw
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      {showGoalModal && (
        <div className="modal-backdrop" onClick={() => setShowGoalModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Create Savings Goal</h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowGoalModal(false)}><HiOutlineX /></button>
            </div>
            <form className="modal__body" onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Goal Name *</label>
                <input type="text" className="form-input" placeholder="e.g. New Laptop, Emergency Fund"
                  value={newGoalForm.name} onChange={e => setNewGoalForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Target Amount *</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00"
                    value={newGoalForm.targetAmount} onChange={e => setNewGoalForm(f => ({ ...f, targetAmount: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Savings</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00"
                    value={newGoalForm.currentAmount} onChange={e => setNewGoalForm(f => ({ ...f, currentAmount: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Target Date *</label>
                  <input type="date" className="form-input" value={newGoalForm.targetDate}
                    onChange={e => setNewGoalForm(f => ({ ...f, targetDate: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-select" value={newGoalForm.currency} onChange={e => setNewGoalForm(f => ({ ...f, currency: e.target.value }))}>
                    <option value="INR">🇮🇳 INR</option><option value="USD">🇺🇸 USD</option>
                    <option value="EUR">🇪🇺 EUR</option><option value="GBP">🇬🇧 GBP</option>
                    <option value="JPY">🇯🇵 JPY</option>
                  </select>
                </div>
              </div>
              <div className="modal__footer" style={{ padding: 0, borderTop: 'none', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setShowGoalModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">Save Target</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribution / Withdrawal Modal */}
      {showContributionModal && selectedGoal && (
        <div className="modal-backdrop" onClick={() => setShowContributionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">
                {contributionForm.type === 'contribute' ? 'Add Contribution' : 'Withdraw Funds'}
              </h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowContributionModal(false)}><HiOutlineX /></button>
            </div>
            <form className="modal__body" onSubmit={handleContributeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p className="text-sm text-secondary">
                Goal: <strong>{selectedGoal.name}</strong> ({formatCurrency(selectedGoal.currentAmount, selectedGoal.currency)} saved of {formatCurrency(selectedGoal.targetAmount, selectedGoal.currency)})
              </p>
              
              <div className="form-group">
                <label className="form-label">Amount ({selectedGoal.currency}) *</label>
                <input type="number" step="0.01" className="form-input" placeholder="0.00"
                  value={contributionForm.amount} onChange={e => setContributionForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>

              {contributionForm.type === 'contribute' && (
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="createExpenseRef" checked={contributionForm.createExpenseRef}
                    onChange={e => setContributionForm(f => ({ ...f, createExpenseRef: e.target.checked }))} />
                  <label htmlFor="createExpenseRef" className="text-xs text-secondary cursor-pointer">
                    Also create a "Savings" transaction in expense logs
                  </label>
                </div>
              )}

              <div className="modal__footer" style={{ padding: 0, borderTop: 'none', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setShowContributionModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">
                  {contributionForm.type === 'contribute' ? 'Confirm Addition' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Savings;
