import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { expenseService, savingsService, debtService, budgetService } from '../services/dataService';
import { formatCurrency } from '../utils/helpers';
import Header from '../components/layout/Header';
import { HiOutlineBadgeCheck } from 'react-icons/hi';
import './Achievements.css';

const Achievements = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);

  // States to evaluate rules
  const [stats, setStats] = useState(null);
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [statsRes, savingsRes, debtsRes, budgetsRes] = await Promise.allSettled([
        expenseService.getStats({ startDate: '1970-01-01', endDate: new Date().toISOString().split('T')[0] }),
        savingsService.getGoals(),
        debtService.getDebts(),
        budgetService.getBudgetStatus({ month: new Date().getMonth(), year: new Date().getFullYear() })
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data?.data);
      if (savingsRes.status === 'fulfilled') setGoals(savingsRes.value.data?.data?.goals || []);
      if (debtsRes.status === 'fulfilled') setDebts(debtsRes.value.data?.data?.debts || []);
      if (budgetsRes.status === 'fulfilled') setBudgetStatus(budgetsRes.value.data?.data);

    } catch (err) {
      toast.error('Failed to load milestones statistics');
    } finally {
      setLoading(false);
    }
  };

  // Evaluate Milestones conditions
  const totalIncome = stats?.summary?.totalIncome || 0;
  const totalSpent = stats?.summary?.totalSpent || 0;
  const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0);
  const activeDebtsCount = debts.filter(d => parseFloat(d.balance) > 0).length;
  const netCashFlow = Math.max(0, totalIncome - totalSpent);
  const monthlySavingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;
  const overallBudgetPercentage = budgetStatus?.summary?.overallPercentage || 0;

  // List of Achievements
  const milestones = [
    {
      id: 'first_steps',
      title: 'First Steps',
      description: 'Record both an income entry and an expense to start tracking cash flow.',
      unlocked: totalIncome > 0 && totalSpent > 0,
      icon: '🌱',
      progress: totalIncome > 0 && totalSpent > 0 ? 100 : totalIncome > 0 || totalSpent > 0 ? 50 : 0,
      progressText: totalIncome > 0 && totalSpent > 0 ? 'Completed' : '1 / 2 actions'
    },
    {
      id: 'debt_free',
      title: 'Debt Buster',
      description: 'Clear all outstanding liabilities. Have zero active debts.',
      unlocked: debts.length > 0 && activeDebtsCount === 0,
      icon: '🛡️',
      progress: debts.length > 0 && activeDebtsCount === 0 ? 100 : 0,
      progressText: activeDebtsCount === 0 ? 'Debt Free' : `${activeDebtsCount} active debt(s)`
    },
    {
      id: 'emergency_fund',
      title: 'Emergency Shield',
      description: 'Maintain liquid cash balance equal to at least 3 months of average spending.',
      unlocked: totalSpent > 0 && netCashFlow >= (totalSpent / 3),
      icon: '🏰',
      progress: totalSpent > 0 ? Math.min(100, Math.round((netCashFlow / (totalSpent / 3)) * 100)) : 0,
      progressText: `${formatCurrency(netCashFlow, user?.currency)} / ${formatCurrency(Math.round(totalSpent / 3), user?.currency)}`
    },
    {
      id: 'super_saver',
      title: 'Super Saver',
      description: 'Save 30% or more of your gross income this period.',
      unlocked: monthlySavingsRate >= 30,
      icon: '🌟',
      progress: Math.min(100, Math.round((monthlySavingsRate / 30) * 100)),
      progressText: `${monthlySavingsRate.toFixed(0)}% / 30% target`
    },
    {
      id: 'budget_master',
      title: 'Budget Master',
      description: 'Keep your combined monthly spending below your total budget limits.',
      unlocked: overallBudgetPercentage > 0 && overallBudgetPercentage < 100,
      icon: '👑',
      progress: overallBudgetPercentage > 0 ? Math.min(100, Math.round(overallBudgetPercentage)) : 0,
      progressText: overallBudgetPercentage > 0 ? `${overallBudgetPercentage.toFixed(0)}% budget consumed` : 'No budget set'
    },
    {
      id: 'goal_starter',
      title: 'Milestone Starter',
      description: 'Define at least one savings goal to track your wealth progress.',
      unlocked: goals.length > 0,
      icon: '🎯',
      progress: goals.length > 0 ? 100 : 0,
      progressText: goals.length > 0 ? `${goals.length} active target(s)` : '0 goals set'
    },
    {
      id: 'centurion_savings',
      title: 'Wealth Builder',
      description: 'Accumulate ₹1,00,000 (or $1,200) in savings goals contributions.',
      unlocked: totalSaved >= (user?.currency === 'USD' ? 1200 : 100000),
      icon: '💎',
      progress: Math.min(100, Math.round((totalSaved / (user?.currency === 'USD' ? 1200 : 100000)) * 100)),
      progressText: `${formatCurrency(totalSaved, user?.currency)} / ${formatCurrency(user?.currency === 'USD' ? 1200 : 100000, user?.currency)}`
    }
  ];

  const unlockedCount = milestones.filter(m => m.unlocked).length;
  const totalMilestones = milestones.length;
  const unlockPercentage = Math.round((unlockedCount / totalMilestones) * 100);

  return (
    <>
      <Header title="Achievements & Milestones" subtitle="Unlock badges and build healthy financial habits" />
      <div className="achievements-page">
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)' }}>
            <div className="spinner spinner--lg" />
          </div>
        ) : (
          <div className="achievements-page__workspace">
            {/* Gamification Progress Hero */}
            <div className="glass-card achievements-page__hero">
              <div className="achievements-page__hero-content">
                <div className="achievements-page__hero-icon">
                  <HiOutlineBadgeCheck size={48} className="text-primary" style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Financial Health Progress</h3>
                  <p className="text-sm text-secondary">
                    You have unlocked <strong>{unlockedCount}</strong> of <strong>{totalMilestones}</strong> milestones. Keep logging transactions to unlock more!
                  </p>
                  
                  {/* Progress bar visual */}
                  <div className="achievements-page__hero-bar mt-4">
                    <div className="flex justify-between items-baseline text-xs mb-1">
                      <span className="font-semibold">{unlockPercentage}% Complete</span>
                      <span className="text-secondary">{unlockedCount} / {totalMilestones} unlocked</span>
                    </div>
                    <div className="progress-bar" style={{ height: '8px' }}>
                      <div className="progress-bar__fill progress-bar__fill--good" style={{ width: `${unlockPercentage}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glowing Badges Grid */}
            <div className="achievements-page__grid mt-6 stagger-children">
              {milestones.map(m => (
                <div key={m.id} className={`glass-card achievements-page__badge-card ${m.unlocked ? 'achievements-page__badge-card--unlocked' : 'achievements-page__badge-card--locked'}`}>
                  <div className="achievements-page__badge-header">
                    <div className="achievements-page__badge-symbol">{m.icon}</div>
                    <span className={`badge ${m.unlocked ? 'badge--success' : 'badge--info'}`} style={{ alignSelf: 'flex-start' }}>
                      {m.unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>

                  <div className="achievements-page__badge-body mt-3">
                    <h4 className="font-bold text-sm">{m.title}</h4>
                    <p className="text-xs text-secondary mt-1">{m.description}</p>
                  </div>

                  {/* Progress tracker inside badge */}
                  <div className="achievements-page__badge-footer mt-4">
                    <div className="progress-bar" style={{ height: '4px', marginBottom: '6px' }}>
                      <div className={`progress-bar__fill ${m.unlocked ? 'progress-bar__fill--good' : 'progress-bar__fill--warning'}`}
                        style={{ width: `${m.progress}%` }} />
                    </div>
                    <div className="flex justify-between text-xxs text-secondary">
                      <span>Status</span>
                      <span className="font-semibold">{m.progressText}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </>
  );
};

export default Achievements;
