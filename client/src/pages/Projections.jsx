import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { expenseService } from '../services/dataService';
import { formatCurrency } from '../utils/helpers';
import Header from '../components/layout/Header';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { HiOutlinePresentationChartLine, HiOutlineLightBulb, HiOutlineSparkles } from 'react-icons/hi';
import './Projections.css';

const Projections = () => {
  const { user } = useAuth();
  
  // Simulation Inputs
  const [initialBalance, setInitialBalance] = useState('50000');
  const [monthlyIncome, setMonthlyIncome] = useState('50000');
  const [monthlyExpenses, setMonthlyExpenses] = useState('35000');
  const [returnRate, setReturnRate] = useState(8); // Expected investment yield
  const [inflationRate, setInflationRate] = useState(5); // Average annual inflation
  const [years, setYears] = useState(5); // 1, 3, 5, 10 years

  useEffect(() => {
    fetchBaselineStats();
  }, []);

  const fetchBaselineStats = async () => {
    try {
      const { data } = await expenseService.getStats();
      const mtdIncome = data.data?.summary?.totalIncome || 50000;
      const mtdSpent = data.data?.summary?.totalSpent || 35000;
      
      setMonthlyIncome(mtdIncome.toString());
      setMonthlyExpenses(mtdSpent.toString());
    } catch (err) {
      console.error('Failed to load baseline metrics:', err);
    }
  };

  const calculateProjections = () => {
    let currentBalance = parseFloat(initialBalance) || 0;
    let accumulatedAdditions = 0;
    let accumulatedInterest = 0;
    const monthlyNetSavings = (parseFloat(monthlyIncome) || 0) - (parseFloat(monthlyExpenses) || 0);

    const data = [];
    const totalMonths = years * 12;
    const monthlyReturnRate = (parseFloat(returnRate) / 100) / 12;
    const monthlyInflationRate = (parseFloat(inflationRate) / 100) / 12;

    for (let m = 1; m <= totalMonths; m++) {
      // Compounding return this month
      const interestEarned = currentBalance * monthlyReturnRate;
      accumulatedInterest += interestEarned;
      
      // Update balance
      currentBalance = currentBalance + interestEarned + monthlyNetSavings;
      accumulatedAdditions += monthlyNetSavings;

      // Discount balance for inflation to get real purchasing power
      const inflationFactor = Math.pow(1 + monthlyInflationRate, m);
      const realValue = currentBalance / inflationFactor;

      // Group into yearly steps for the chart
      if (m % 12 === 0 || m === totalMonths) {
        data.push({
          name: `Year ${m / 12}`,
          'Total Balance': Math.round(currentBalance),
          'Contributions': Math.round(parseFloat(initialBalance) + accumulatedAdditions),
          'Interest Earned': Math.round(accumulatedInterest),
          'Purchasing Power (Real)': Math.round(realValue)
        });
      }
    }
    return data;
  };

  const projectionData = calculateProjections();
  const endingData = projectionData[projectionData.length - 1] || {};
  
  const endingBalance = endingData['Total Balance'] || 0;
  const endingContributions = endingData['Contributions'] || 0;
  const endingInterest = endingData['Interest Earned'] || 0;
  const endingRealValue = endingData['Purchasing Power (Real)'] || 0;

  const tooltipStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
  };

  return (
    <>
      <Header title="Wealth Projections" subtitle="Interactive wealth simulator and compounding projections" />
      <div className="projections-page">
        
        {/* Left Side: Parameters Form Control Panel */}
        <div className="projections-page__grid">
          <div className="glass-card--static projections-page__panel">
            <h3 className="projections-page__section-title">📊 Simulation Parameters</h3>
            <p className="text-xs text-secondary mb-4">Baseline values are pre-filled from your actual monthly cash flows.</p>
            
            <div className="projections-page__form">
              <div className="form-group">
                <label className="form-label">Initial Net Worth ({user?.currency})</label>
                <input type="number" className="form-input" value={initialBalance}
                  onChange={e => setInitialBalance(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Monthly Income</label>
                <input type="number" className="form-input" value={monthlyIncome}
                  onChange={e => setMonthlyIncome(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Monthly Expenses</label>
                <input type="number" className="form-input" value={monthlyExpenses}
                  onChange={e => setMonthlyExpenses(e.target.value)} />
              </div>

              <div className="form-group">
                <div className="flex justify-between items-center">
                  <label className="form-label">Expected Annual Return ({returnRate}%)</label>
                </div>
                <input type="range" min="0" max="25" step="0.5" className="form-slider" value={returnRate}
                  onChange={e => setReturnRate(parseFloat(e.target.value))} />
              </div>

              <div className="form-group">
                <div className="flex justify-between items-center">
                  <label className="form-label">Expected Inflation ({inflationRate}%)</label>
                </div>
                <input type="range" min="0" max="15" step="0.5" className="form-slider" value={inflationRate}
                  onChange={e => setInflationRate(parseFloat(e.target.value))} />
              </div>

              <div className="form-group">
                <label className="form-label">Forecast Horizon</label>
                <select className="form-select" value={years} onChange={e => setYears(parseInt(e.target.value))}>
                  <option value={1}>1 Year</option>
                  <option value={3}>3 Years</option>
                  <option value={5}>5 Years</option>
                  <option value={10}>10 Years</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Side: Projections Analytics & Visuals */}
          <div className="projections-page__main">
            {/* Compounding summary widgets */}
            <div className="projections-page__summaries stagger-children">
              <div className="glass-card stat-card">
                <div className="stat-card__icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-primary)' }}>
                  <HiOutlinePresentationChartLine />
                </div>
                <p className="stat-card__label">Projected Net Worth</p>
                <p className="stat-card__value">{formatCurrency(endingBalance, user?.currency)}</p>
                <span className="text-xs text-secondary">Ending in {years} year(s)</span>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-card__icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-secondary)' }}>
                  <HiOutlineSparkles />
                </div>
                <p className="stat-card__label">Interest Compounded</p>
                <p className="stat-card__value" style={{ color: 'var(--accent-primary)' }}>
                  +{formatCurrency(endingInterest, user?.currency)}
                </p>
                <span className="text-xs text-secondary">Return yield</span>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-card__icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-info)' }}>
                  <HiOutlineLightBulb />
                </div>
                <p className="stat-card__label">Real Purchasing Power</p>
                <p className="stat-card__value">{formatCurrency(endingRealValue, user?.currency)}</p>
                <span className="text-xs text-secondary">Inflation adjusted</span>
              </div>
            </div>

            {/* Compound Growth Area Chart */}
            <div className="glass-card--static projections-page__chart-card">
              <h3 className="projections-page__section-title">Growth Forecast Over Time</h3>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} />
                    <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                    <Tooltip formatter={v => formatCurrency(v, user?.currency)} contentStyle={tooltipStyle} />
                    <Legend verticalAlign="top" height={36} />
                    <Area type="monotone" name="Total Balance" dataKey="Total Balance" stroke="var(--accent-primary)" strokeWidth={2} fill="url(#colorBalance)" />
                    <Area type="monotone" name="Total Contributions" dataKey="Contributions" stroke="var(--accent-secondary)" strokeWidth={2} fill="url(#colorContributions)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Projections;
