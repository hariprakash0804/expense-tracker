import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { debtService } from '../services/dataService';
import { formatCurrency } from '../utils/helpers';
import Header from '../components/layout/Header';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { HiOutlineTrash, HiOutlinePlus, HiOutlineX } from 'react-icons/hi';
import './DebtPlanner.css';

const DebtPlanner = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extraPayment, setExtraPayment] = useState(2000); // Default extra payoff amount
  const [showModal, setShowModal] = useState(false);
  const [newDebtForm, setNewDebtForm] = useState({
    name: '',
    balance: '',
    interestRate: '',
    minPayment: '',
    currency: user?.currency || 'INR',
  });

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const { data } = await debtService.getDebts();
      setDebts(data.data.debts || []);
    } catch {
      toast.error('Failed to load debts list');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    if (!newDebtForm.name || !newDebtForm.balance || !newDebtForm.interestRate || !newDebtForm.minPayment) {
      toast.error('Please fill required fields.');
      return;
    }

    try {
      await debtService.createDebt({
        name: newDebtForm.name,
        balance: parseFloat(newDebtForm.balance),
        interestRate: parseFloat(newDebtForm.interestRate),
        minPayment: parseFloat(newDebtForm.minPayment),
        currency: newDebtForm.currency
      });

      toast.success('Debt recorded successfully!');
      setShowModal(false);
      setNewDebtForm({
        name: '',
        balance: '',
        interestRate: '',
        minPayment: '',
        currency: user?.currency || 'INR',
      });
      fetchDebts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record debt');
    }
  };

  const handleDeleteDebt = async (id) => {
    if (!window.confirm('Delete this debt record?')) return;
    try {
      await debtService.deleteDebt(id);
      toast.success('Debt removed');
      fetchDebts();
    } catch {
      toast.error('Delete failed');
    }
  };

  // Run Snowball vs Avalanche Simulators
  const runRepaymentSimulation = (strategyType) => {
    if (debts.length === 0) return { timeline: [], totalInterest: 0, months: 0 };

    // Deep clone active debts
    let activeDebts = debts.map(d => ({
      id: d.id,
      name: d.name,
      balance: parseFloat(d.balance),
      interestRate: parseFloat(d.interestRate) / 100 / 12, // monthly rate
      minPayment: parseFloat(d.minPayment)
    }));

    let totalInterestPaid = 0;
    let monthsElapsed = 0;
    const timeline = [];
    const extraBudget = parseFloat(extraPayment) || 0;

    // Log month 0 balance
    const startBalance = activeDebts.reduce((sum, d) => sum + d.balance, 0);
    timeline.push({ month: 0, balance: Math.round(startBalance) });

    while (activeDebts.some(d => d.balance > 0) && monthsElapsed < 360) {
      monthsElapsed++;
      let monthlyInterestThisMonth = 0;
      let minPaymentsRequired = 0;

      // 1. Apply interest & calculate minimums
      activeDebts.forEach(d => {
        if (d.balance > 0) {
          const interest = d.balance * d.interestRate;
          d.balance += interest;
          totalInterestPaid += interest;
          monthlyInterestThisMonth += interest;
          minPaymentsRequired += d.minPayment;
        }
      });

      // Total money available this month = Minimum payments + Extra budget
      let totalAvailablePool = minPaymentsRequired + extraBudget;
      let remainingToDistribute = totalAvailablePool;

      // 2. Pay minimums first (or remaining balance if it is smaller than min)
      activeDebts.forEach(d => {
        if (d.balance > 0) {
          const payment = Math.min(d.balance, d.minPayment);
          d.balance -= payment;
          remainingToDistribute -= payment;
        }
      });

      // 3. Sort outstanding debts based on selected priority strategy
      if (strategyType === 'avalanche') {
        // Avalanche: Highest APR first
        activeDebts.sort((a, b) => b.interestRate - a.interestRate);
      } else if (strategyType === 'snowball') {
        // Snowball: Lowest Balance first
        activeDebts.sort((a, b) => a.balance - b.balance);
      }

      // 4. Distribute leftover extra pool to prioritized target
      for (let d of activeDebts) {
        if (d.balance > 0 && remainingToDistribute > 0) {
          const extraPay = Math.min(d.balance, remainingToDistribute);
          d.balance -= extraPay;
          remainingToDistribute -= extraPay;
        }
      }

      const totalBalanceRemaining = activeDebts.reduce((sum, d) => sum + d.balance, 0);
      timeline.push({ month: monthsElapsed, balance: Math.round(totalBalanceRemaining) });
      
      if (totalBalanceRemaining <= 0) break;
    }

    return {
      timeline,
      totalInterest: Math.round(totalInterestPaid),
      months: monthsElapsed
    };
  };

  const snowballRes = runRepaymentSimulation('snowball');
  const avalancheRes = runRepaymentSimulation('avalanche');
  const minimumsRes = runRepaymentSimulation('minimums'); // fallback: priority strategy is disabled, minimums only

  // Format Recharts comparative timeline dataset
  const buildChartData = () => {
    const data = [];
    const maxMonths = Math.max(snowballRes.timeline.length, avalancheRes.timeline.length, minimumsRes.timeline.length);
    
    for (let m = 0; m < maxMonths; m += 3) {
      if (m > 120) break; // cap chart at 10 years for readability
      data.push({
        name: `Mo ${m}`,
        'Snowball Method': snowballRes.timeline[m]?.balance ?? 0,
        'Avalanche Method': avalancheRes.timeline[m]?.balance ?? 0,
        'Minimum Only': minimumsRes.timeline[m]?.balance ?? 0
      });
    }
    return data;
  };

  const chartData = buildChartData();
  const totalOutstanding = debts.reduce((sum, d) => sum + parseFloat(d.balance), 0);
  const totalMinPayments = debts.reduce((sum, d) => sum + parseFloat(d.minPayment), 0);
  const avgInterestRate = debts.length > 0 
    ? debts.reduce((sum, d) => sum + parseFloat(d.interestRate), 0) / debts.length : 0;

  const tooltipStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
  };

  return (
    <>
      <Header title="Debt Repayment Planner" subtitle="Compare strategy timelines: Snowball vs Avalanche payoff methods" />
      <div className="debt-page">
        
        {/* Metric widgets block */}
        <div className="debt-page__metrics stagger-children">
          <div className="glass-card stat-card">
            <p className="stat-card__label">Total Debt</p>
            <p className="stat-card__value" style={{ color: 'var(--accent-danger)' }}>
              {formatCurrency(totalOutstanding, user?.currency)}
            </p>
            <span className="text-xs text-secondary">{debts.length} liabilities</span>
          </div>

          <div className="glass-card stat-card">
            <p className="stat-card__label">Total Minimum Monthly</p>
            <p className="stat-card__value">
              {formatCurrency(totalMinPayments, user?.currency)}
            </p>
            <span className="text-xs text-secondary">Payoff baseline</span>
          </div>

          <div className="glass-card stat-card">
            <p className="stat-card__label">Average APR Interest</p>
            <p className="stat-card__value">{avgInterestRate.toFixed(2)}%</p>
            <span className="text-xs text-secondary">Weighted average rate</span>
          </div>
        </div>

        {debts.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__icon">🛡️</p>
            <p className="empty-state__title">No Active Liabilities Registered</p>
            <p className="empty-state__description">Log your credit card dues or personal loans to project interest payoff curves.</p>
            <button className="btn btn--primary" onClick={() => setShowModal(true)}>Record First Liability</button>
          </div>
        ) : (
          <div className="debt-page__workspace">
            {/* Payoff Timelines Comparison Grid */}
            <div className="debt-page__strategies">
              <div className="glass-card debt-page__strategy-card debt-page__strategy-card--avalanche">
                <h4 className="font-semibold text-sm mb-1">🏔️ Debt Avalanche (Highest Interest First)</h4>
                <p className="text-xs text-secondary mb-3">Optimal math choice. Prioritizes highest APR first.</p>
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-2xl font-bold">{avalancheRes.months} Months</span>
                  <span className="text-xs text-secondary">Payoff Period</span>
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span>Interest Paid:</span>
                  <span className="font-semibold">{formatCurrency(avalancheRes.totalInterest, user?.currency)}</span>
                </div>
              </div>

              <div className="glass-card debt-page__strategy-card debt-page__strategy-card--snowball">
                <h4 className="font-semibold text-sm mb-1">❄️ Debt Snowball (Smallest Balance First)</h4>
                <p className="text-xs text-secondary mb-3">Psychological choice. Pay small debts fast for early wins.</p>
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-2xl font-bold">{snowballRes.months} Months</span>
                  <span className="text-xs text-secondary">Payoff Period</span>
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span>Interest Paid:</span>
                  <span className="font-semibold">{formatCurrency(snowballRes.totalInterest, user?.currency)}</span>
                </div>
              </div>

              <div className="glass-card debt-page__strategy-card">
                <h4 className="font-semibold text-sm mb-1">🏦 Minimums Only</h4>
                <p className="text-xs text-secondary mb-3">Standard baseline. Making minimum monthly payments only.</p>
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-2xl font-bold">{minimumsRes.months >= 360 ? '30+ Years' : `${minimumsRes.months} Months`}</span>
                  <span className="text-xs text-secondary">Payoff Period</span>
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span>Interest Paid:</span>
                  <span className="font-semibold">{formatCurrency(minimumsRes.totalInterest, user?.currency)}</span>
                </div>
              </div>
            </div>

            {/* Interactive sliders for extra payments */}
            <div className="glass-card--static p-5 flex flex-col gap-3 mt-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-sm">Target Extra Monthly Repayment</h4>
                  <p className="text-xs text-secondary">Allocate cash from net savings to speed up payoff rates.</p>
                </div>
                <span className="text-lg font-bold text-primary">{formatCurrency(extraPayment, user?.currency)}</span>
              </div>
              <input type="range" min="0" max="25000" step="500" className="form-slider" value={extraPayment}
                onChange={e => setExtraPayment(parseFloat(e.target.value))} />
            </div>

            {/* Line chart visualization */}
            <div className="glass-card--static p-5 mt-4">
              <h4 className="font-semibold text-sm mb-4">Payoff Curves Over Time</h4>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} />
                    <YAxis stroke="var(--text-tertiary)" fontSize={11} />
                    <Tooltip formatter={v => formatCurrency(v, user?.currency)} contentStyle={tooltipStyle} />
                    <Legend />
                    <Line type="monotone" name="Avalanche Method" dataKey="Avalanche Method" stroke="var(--accent-primary)" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" name="Snowball Method" dataKey="Snowball Method" stroke="var(--accent-secondary)" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" name="Minimum Only" dataKey="Minimum Only" stroke="var(--accent-danger)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Debts CRUD Table */}
            <div className="glass-card--static mt-4 overflow-x-auto">
              <div className="flex justify-between items-center p-4">
                <h4 className="font-semibold text-sm">Liabilities List</h4>
                <button className="btn btn--primary btn--sm" onClick={() => setShowModal(true)}>
                  <HiOutlinePlus /> Add Liability
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Liability Name</th><th>Balance Dues</th><th>Annual APR</th><th>Min Monthly</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map(d => (
                    <tr key={d.id}>
                      <td className="font-medium">{d.name}</td>
                      <td className="font-semibold" style={{ color: 'var(--accent-danger)' }}>{formatCurrency(d.balance, d.currency)}</td>
                      <td>{d.interestRate}%</td>
                      <td>{formatCurrency(d.minPayment, d.currency)}</td>
                      <td>
                        <button className="btn btn--ghost btn--icon" onClick={() => handleDeleteDebt(d.id)}
                          style={{ color: 'var(--accent-danger)' }} title="Remove"><HiOutlineTrash size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Debt Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Record Dues/Liability</h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowModal(false)}><HiOutlineX /></button>
            </div>
            <form className="modal__body" onSubmit={handleAddDebt} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Liability Name *</label>
                <input type="text" className="form-input" placeholder="e.g. Chase Credit Card A, Education Loan"
                  value={newDebtForm.name} onChange={e => setNewDebtForm(f => ({ ...f, name: e.target.value }))} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Principal Balance *</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00"
                    value={newDebtForm.balance} onChange={e => setNewDebtForm(f => ({ ...f, balance: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Interest APR (%) *</label>
                  <input type="number" step="0.01" className="form-input" placeholder="e.g. 18.5"
                    value={newDebtForm.interestRate} onChange={e => setNewDebtForm(f => ({ ...f, interestRate: e.target.value }))} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Min. Monthly Payment *</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00"
                    value={newDebtForm.minPayment} onChange={e => setNewDebtForm(f => ({ ...f, minPayment: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-select" value={newDebtForm.currency} onChange={e => setNewDebtForm(f => ({ ...f, currency: e.target.value }))}>
                    <option value="INR">🇮🇳 INR</option><option value="USD">🇺🇸 USD</option>
                    <option value="EUR">🇪🇺 EUR</option><option value="GBP">🇬🇧 GBP</option>
                    <option value="JPY">🇯🇵 JPY</option>
                  </select>
                </div>
              </div>

              <div className="modal__footer" style={{ padding: 0, borderTop: 'none', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">Record Liability</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DebtPlanner;
