import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/helpers';
import Header from '../components/layout/Header';
import { HiOutlineCalculator, HiOutlineChartPie, HiOutlineSparkles, HiOutlineHome } from 'react-icons/hi';
import './Calculators.css';

const Calculators = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sip'); // sip, fire, emi

  // SIP States
  const [sipMonthly, setSipMonthly] = useState(10000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  // FIRE States
  const [currentAge, setCurrentAge] = useState(25);
  const [retireAge, setRetireAge] = useState(55);
  const [monthlyExpense, setMonthlyExpense] = useState(50000);
  const [inflationRate, setInflationRate] = useState(6);

  // EMI States
  const [loanAmount, setLoanAmount] = useState(1000000); // 10L
  const [loanRate, setLoanRate] = useState(8.5);
  const [loanYears, setLoanYears] = useState(15);

  // --- Calculations ---

  // 1. SIP Math
  const computeSip = () => {
    const p = parseFloat(sipMonthly);
    const r = parseFloat(sipRate) / 12 / 100;
    const n = parseInt(sipYears) * 12;

    if (r === 0) {
      const invested = p * n;
      return { total: invested, invested, gains: 0 };
    }

    const futureValue = p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const invested = p * n;
    const gains = futureValue - invested;

    return {
      total: Math.round(futureValue),
      invested: Math.round(invested),
      gains: Math.round(gains),
    };
  };

  // 2. FIRE Math
  const computeFire = () => {
    const yearsToRetire = Math.max(0, retireAge - currentAge);
    const inflatedMonthly = monthlyExpense * Math.pow(1 + parseFloat(inflationRate) / 100, yearsToRetire);
    const inflatedAnnual = inflatedMonthly * 12;
    // 4% Safe Withdrawal Rule = 25x Annual Expenses
    const targetCorpus = inflatedAnnual * 25;

    return {
      years: yearsToRetire,
      monthlyExpensesAtRetirement: Math.round(inflatedMonthly),
      annualExpensesAtRetirement: Math.round(inflatedAnnual),
      targetCorpus: Math.round(targetCorpus),
    };
  };

  // 3. EMI Math
  const computeEmi = () => {
    const p = parseFloat(loanAmount);
    const r = parseFloat(loanRate) / 12 / 100;
    const n = parseInt(loanYears) * 12;

    if (r === 0) {
      return { emi: p / n, total: p, interest: 0 };
    }

    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = emi * n;
    const interest = total - p;

    return {
      emi: Math.round(emi),
      total: Math.round(total),
      interest: Math.round(interest),
    };
  };

  const sipRes = computeSip();
  const fireRes = computeFire();
  const emiRes = computeEmi();

  return (
    <>
      <Header title="Financial Calculator Toolkit" subtitle="Simulate Mutual Fund SIPs, plan early retirement, or calculate EMIs" />
      <div className="calcs-page">
        
        {/* Horizontal tabs controller */}
        <div className="calcs-page__tabs flex gap-3 border-b border-subtle pb-3 mb-5">
          <button className={`btn ${activeTab === 'sip' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setActiveTab('sip')}>📈 SIP Calculator</button>
          <button className={`btn ${activeTab === 'fire' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setActiveTab('fire')}>🔥 FIRE Planner</button>
          <button className={`btn ${activeTab === 'emi' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setActiveTab('emi')}>🏦 EMI Loan Calculator</button>
        </div>

        <div className="calcs-page__grid">
          {/* TAB CONTENT: SIP CALCULATOR */}
          {activeTab === 'sip' && (
            <>
              {/* Sliders Panel */}
              <div className="glass-card--static calcs-page__panel">
                <h3 className="calcs-page__section-title">📊 SIP Parameters</h3>
                <div className="calcs-page__form mt-4">
                  <div className="form-group">
                    <div className="flex justify-between items-center">
                      <label className="form-label">Monthly Investment</label>
                      <span className="text-xs font-semibold">{formatCurrency(sipMonthly, user?.currency)}</span>
                    </div>
                    <input type="range" min="500" max="100000" step="500" className="form-slider" value={sipMonthly}
                      onChange={e => setSipMonthly(parseFloat(e.target.value))} />
                  </div>

                  <div className="form-group">
                    <div className="flex justify-between items-center">
                      <label className="form-label">Expected Annual Return</label>
                      <span className="text-xs font-semibold">{sipRate}%</span>
                    </div>
                    <input type="range" min="1" max="30" step="0.5" className="form-slider" value={sipRate}
                      onChange={e => setSipRate(parseFloat(e.target.value))} />
                  </div>

                  <div className="form-group">
                    <div className="flex justify-between items-center">
                      <label className="form-label">Time Horizon</label>
                      <span className="text-xs font-semibold">{sipYears} Years</span>
                    </div>
                    <input type="range" min="1" max="40" step="1" className="form-slider" value={sipYears}
                      onChange={e => setSipYears(parseInt(e.target.value))} />
                  </div>
                </div>
              </div>

              {/* Outputs Panel */}
              <div className="calcs-page__main stagger-children">
                <div className="glass-card stat-card">
                  <div className="stat-card__icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-primary)' }}>
                    <HiOutlineSparkles />
                  </div>
                  <p className="stat-card__label">Projected Future Value</p>
                  <p className="stat-card__value" style={{ color: 'var(--accent-primary)' }}>
                    {formatCurrency(sipRes.total, user?.currency)}
                  </p>
                  <span className="text-xs text-secondary">Accumulated wealth</span>
                </div>

                <div className="calcs-page__detailed-metrics">
                  <div className="glass-card p-4">
                    <span className="block text-xs text-secondary font-medium">Capital Invested</span>
                    <span className="block text-lg font-bold mt-1">{formatCurrency(sipRes.invested, user?.currency)}</span>
                  </div>
                  <div className="glass-card p-4">
                    <span className="block text-xs text-secondary font-medium">Wealth Gained</span>
                    <span className="block text-lg font-bold text-success mt-1">+{formatCurrency(sipRes.gains, user?.currency)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB CONTENT: FIRE RETIRE EARLY */}
          {activeTab === 'fire' && (
            <>
              {/* Sliders Panel */}
              <div className="glass-card--static calcs-page__panel">
                <h3 className="calcs-page__section-title">🔥 Retirement Parameters</h3>
                <div className="calcs-page__form mt-4">
                  <div className="form-group">
                    <div className="flex justify-between items-center">
                      <label className="form-label">Current Age</label>
                      <span className="text-xs font-semibold">{currentAge} Years</span>
                    </div>
                    <input type="range" min="18" max="75" step="1" className="form-slider" value={currentAge}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setCurrentAge(val);
                        if (val >= retireAge) setRetireAge(val + 5);
                      }} />
                  </div>

                  <div className="form-group">
                    <div className="flex justify-between items-center">
                      <label className="form-label">Retirement Age</label>
                      <span className="text-xs font-semibold">{retireAge} Years</span>
                    </div>
                    <input type="range" min={currentAge + 1} max="85" step="1" className="form-slider" value={retireAge}
                      onChange={e => setRetireAge(parseInt(e.target.value))} />
                  </div>

                  <div className="form-group">
                    <div className="flex justify-between items-center">
                      <label className="form-label">Monthly Expenses (Today)</label>
                      <span className="text-xs font-semibold">{formatCurrency(monthlyExpense, user?.currency)}</span>
                    </div>
                    <input type="range" min="5000" max="300000" step="5000" className="form-slider" value={monthlyExpense}
                      onChange={e => setMonthlyExpense(parseFloat(e.target.value))} />
                  </div>

                  <div className="form-group">
                    <div className="flex justify-between items-center">
                      <label className="form-label">Expected Annual Inflation</label>
                      <span className="text-xs font-semibold">{inflationRate}%</span>
                    </div>
                    <input type="range" min="0" max="15" step="0.5" className="form-slider" value={inflationRate}
                      onChange={e => setInflationRate(parseFloat(e.target.value))} />
                  </div>
                </div>
              </div>

              {/* Outputs Panel */}
              <div className="calcs-page__main stagger-children">
                <div className="glass-card stat-card">
                  <div className="stat-card__icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-secondary)' }}>
                    <HiOutlineChartPie />
                  </div>
                  <p className="stat-card__label">Target FIRE Corpus Required</p>
                  <p className="stat-card__value" style={{ color: 'var(--accent-secondary)' }}>
                    {formatCurrency(fireRes.targetCorpus, user?.currency)}
                  </p>
                  <span className="text-xs text-secondary">Based on standard 25x safe-withdrawal multiplier</span>
                </div>

                <div className="calcs-page__detailed-metrics">
                  <div className="glass-card p-4">
                    <span className="block text-xs text-secondary font-medium">Years to Retirement</span>
                    <span className="block text-lg font-bold mt-1">{fireRes.years} Years</span>
                  </div>
                  <div className="glass-card p-4">
                    <span className="block text-xs text-secondary font-medium">Monthly Cost at Retirement</span>
                    <span className="block text-lg font-bold text-danger mt-1">
                      {formatCurrency(fireRes.monthlyExpensesAtRetirement, user?.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB CONTENT: EMI LOAN CALCULATOR */}
          {activeTab === 'emi' && (
            <>
              {/* Sliders Panel */}
              <div className="glass-card--static calcs-page__panel">
                <h3 className="calcs-page__section-title">🏦 Loan Parameters</h3>
                <div className="calcs-page__form mt-4">
                  <div className="form-group">
                    <div className="flex justify-between items-center">
                      <label className="form-label">Loan Principal</label>
                      <span className="text-xs font-semibold">{formatCurrency(loanAmount, user?.currency)}</span>
                    </div>
                    <input type="range" min="10000" max="10000000" step="10000" className="form-slider" value={loanAmount}
                      onChange={e => setLoanAmount(parseFloat(e.target.value))} />
                  </div>

                  <div className="form-group">
                    <div className="flex justify-between items-center">
                      <label className="form-label">Interest Rate APR</label>
                      <span className="text-xs font-semibold">{loanRate}%</span>
                    </div>
                    <input type="range" min="1" max="20" step="0.1" className="form-slider" value={loanRate}
                      onChange={e => setLoanRate(parseFloat(e.target.value))} />
                  </div>

                  <div className="form-group">
                    <div className="flex justify-between items-center">
                      <label className="form-label">Tenure (Years)</label>
                      <span className="text-xs font-semibold">{loanYears} Years</span>
                    </div>
                    <input type="range" min="1" max="30" step="1" className="form-slider" value={loanYears}
                      onChange={e => setLoanYears(parseInt(e.target.value))} />
                  </div>
                </div>
              </div>

              {/* Outputs Panel */}
              <div className="calcs-page__main stagger-children">
                <div className="glass-card stat-card">
                  <div className="stat-card__icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-info)' }}>
                    <HiOutlineHome />
                  </div>
                  <p className="stat-card__label">Monthly EMI Payment</p>
                  <p className="stat-card__value" style={{ color: 'var(--accent-info)' }}>
                    {formatCurrency(emiRes.emi, user?.currency)} / mo
                  </p>
                  <span className="text-xs text-secondary">EMI amortization installment</span>
                </div>

                <div className="calcs-page__detailed-metrics">
                  <div className="glass-card p-4">
                    <span className="block text-xs text-secondary font-medium">Interest Payable</span>
                    <span className="block text-lg font-bold text-danger mt-1">{formatCurrency(emiRes.interest, user?.currency)}</span>
                  </div>
                  <div className="glass-card p-4">
                    <span className="block text-xs text-secondary font-medium">Total Payment Cost</span>
                    <span className="block text-lg font-bold mt-1">{formatCurrency(emiRes.total, user?.currency)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
};

export default Calculators;
