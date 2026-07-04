import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { expenseService } from '../services/dataService';
import { formatCurrency } from '../utils/helpers';
import Header from '../components/layout/Header';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { HiOutlineDocumentText, HiOutlineCalculator, HiOutlineLightBulb, HiOutlineSparkles } from 'react-icons/hi';
import './TaxPlanner.css';

const TaxPlanner = () => {
  const { user } = useAuth();
  
  // Inputs
  const [grossIncome, setGrossIncome] = useState('1200000'); // Default ₹12L salary
  const [deduction80C, setDeduction80C] = useState('150000'); // Max ₹1.5L
  const [deduction80D, setDeduction80D] = useState('25000');  // Max ₹50k
  const [homeLoanInterest, setHomeLoanInterest] = useState('0'); // Section 24b Max ₹2L
  const [hraExemption, setHraExemption] = useState('0'); // House Rent Allowance

  useEffect(() => {
    fetchBaselineIncome();
  }, []);

  const fetchBaselineIncome = async () => {
    try {
      const { data } = await expenseService.getStats();
      const mtdIncome = data.data?.summary?.totalIncome || 0;
      if (mtdIncome > 0) {
        // Project annual salary from current MTD income
        const projectedAnnual = mtdIncome * 12;
        setGrossIncome(Math.round(projectedAnnual).toString());
      }
    } catch (err) {
      console.error('Failed to load baseline income stats:', err);
    }
  };

  // Tax calculations for Old Regime (FY 2024-25 / 2025-26)
  const calculateOldRegimeTax = (gross) => {
    const stdDeduction = 50000;
    const limit80C = Math.min(parseFloat(deduction80C) || 0, 150000);
    const limit80D = Math.min(parseFloat(deduction80D) || 0, 50000);
    const limitHomeLoan = Math.min(parseFloat(homeLoanInterest) || 0, 200000);
    const limitHra = parseFloat(hraExemption) || 0;

    const totalDeductions = stdDeduction + limit80C + limit80D + limitHomeLoan + limitHra;
    const taxableIncome = Math.max(0, gross - totalDeductions);

    // Old Regime slabs
    // Upto 2.5L: Nil
    // 2.5L to 5L: 5%
    // 5L to 10L: 20%
    // Above 10L: 30%
    let tax = 0;
    const breakdown = [];

    if (taxableIncome <= 500000) {
      // Tax rebate u/s 87A makes tax zero if taxable income is <= 5L
      return { tax: 0, taxableIncome, deductions: totalDeductions, breakdown: [{ name: '0% Slab', value: 0 }] };
    }

    if (taxableIncome > 1000000) {
      const slabAmt = (taxableIncome - 1000000) * 0.3;
      tax += slabAmt;
      breakdown.push({ name: '30% Slab (Above 10L)', value: Math.round(slabAmt) });
    }
    if (taxableIncome > 500000) {
      const slabAmt = (Math.min(taxableIncome, 1000000) - 500000) * 0.2;
      tax += slabAmt;
      breakdown.push({ name: '20% Slab (5L - 10L)', value: Math.round(slabAmt) });
    }
    if (taxableIncome > 250000) {
      const slabAmt = (Math.min(taxableIncome, 500000) - 250000) * 0.05;
      tax += slabAmt;
      breakdown.push({ name: '5% Slab (2.5L - 5L)', value: Math.round(slabAmt) });
    }

    // Health & Education Cess @ 4%
    const cess = tax * 0.04;
    const totalTax = tax + cess;

    return {
      tax: Math.round(totalTax),
      taxableIncome,
      deductions: totalDeductions,
      breakdown: breakdown.length > 0 ? breakdown : [{ name: 'No Tax', value: 0 }]
    };
  };

  // Tax calculations for New Regime (FY 24-25 / 25-26 slab updates)
  const calculateNewRegimeTax = (gross) => {
    // New regime has higher standard deduction of ₹75,000 but no other deductions
    const stdDeduction = 75000;
    const taxableIncome = Math.max(0, gross - stdDeduction);

    // New Regime slabs (Budget 2024 updates)
    // 0 to 3L: Nil
    // 3L to 6L: 5%
    // 6L to 9L: 10%
    // 9L to 12L: 15%
    // 12L to 15L: 20%
    // Above 15L: 30%
    let tax = 0;
    const breakdown = [];

    // Tax rebate u/s 87A: Net taxable income up to 7L is tax-free (tax rebate up to 25k)
    if (taxableIncome <= 700000) {
      return { tax: 0, taxableIncome, deductions: stdDeduction, breakdown: [{ name: '0% Slab', value: 0 }] };
    }

    if (taxableIncome > 1500000) {
      const slabAmt = (taxableIncome - 1500000) * 0.3;
      tax += slabAmt;
      breakdown.push({ name: '30% Slab (Above 15L)', value: Math.round(slabAmt) });
    }
    if (taxableIncome > 1200000) {
      const slabAmt = (Math.min(taxableIncome, 1500000) - 1200000) * 0.2;
      tax += slabAmt;
      breakdown.push({ name: '20% Slab (12L - 15L)', value: Math.round(slabAmt) });
    }
    if (taxableIncome > 900000) {
      const slabAmt = (Math.min(taxableIncome, 1200000) - 900000) * 0.15;
      tax += slabAmt;
      breakdown.push({ name: '15% Slab (9L - 12L)', value: Math.round(slabAmt) });
    }
    if (taxableIncome > 600000) {
      const slabAmt = (Math.min(taxableIncome, 900000) - 600000) * 0.1;
      tax += slabAmt;
      breakdown.push({ name: '10% Slab (6L - 9L)', value: Math.round(slabAmt) });
    }
    if (taxableIncome > 300000) {
      const slabAmt = (Math.min(taxableIncome, 600000) - 300000) * 0.05;
      tax += slabAmt;
      breakdown.push({ name: '5% Slab (3L - 6L)', value: Math.round(slabAmt) });
    }

    // Health & Education Cess @ 4%
    const cess = tax * 0.04;
    const totalTax = tax + cess;

    return {
      tax: Math.round(totalTax),
      taxableIncome,
      deductions: stdDeduction,
      breakdown: breakdown.length > 0 ? breakdown : [{ name: 'No Tax', value: 0 }]
    };
  };

  const grossVal = parseFloat(grossIncome) || 0;
  const oldRegime = calculateOldRegimeTax(grossVal);
  const newRegime = calculateNewRegimeTax(grossVal);

  const bestRegime = oldRegime.tax < newRegime.tax ? 'Old Regime' : 'New Regime';
  const taxSaved = Math.abs(oldRegime.tax - newRegime.tax);
  const recommendedBreakdown = oldRegime.tax < newRegime.tax ? oldRegime.breakdown : newRegime.breakdown;

  // Recharts colors
  const slabColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
  const chartData = recommendedBreakdown.map((item, idx) => ({
    ...item,
    color: slabColors[idx % slabColors.length]
  })).filter(item => item.value > 0);

  const tooltipStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
  };

  return (
    <>
      <Header title="Tax Planner" subtitle="Compare Old vs New tax regimes to optimize your liability" />
      <div className="tax-page">
        <div className="tax-page__grid">
          
          {/* Left panel: Income & Deductions Form */}
          <div className="glass-card--static tax-page__panel">
            <h3 className="tax-page__section-title">✍️ Declare Income & Deductions</h3>
            <div className="tax-page__form mt-4">
              <div className="form-group">
                <label className="form-label">Gross Annual Income</label>
                <input type="number" className="form-input" value={grossIncome}
                  onChange={e => setGrossIncome(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Section 80C (ELSS, PF, Dues) — Old Regime</label>
                <input type="number" className="form-input" max="150000" placeholder="Max ₹1,50,000" value={deduction80C}
                  onChange={e => setDeduction80C(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Section 80D (Health Insurance) — Old Regime</label>
                <input type="number" className="form-input" max="50000" placeholder="Max ₹50,000" value={deduction80D}
                  onChange={e => setDeduction80D(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Section 24b (Home Loan Interest) — Old Regime</label>
                <input type="number" className="form-input" max="200000" placeholder="Max ₹2,00,000" value={homeLoanInterest}
                  onChange={e => setHomeLoanInterest(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">HRA Exemption — Old Regime</label>
                <input type="number" className="form-input" placeholder="House rent allowance" value={hraExemption}
                  onChange={e => setHraExemption(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Right panel: Comparison details */}
          <div className="tax-page__main">
            {/* Top suggestion banner */}
            <div className="glass-card tax-page__recommendation">
              <div className="flex items-center gap-3">
                <HiOutlineSparkles className="tax-page__star-icon" />
                <div>
                  <h4 className="font-bold">Recommended: {bestRegime}</h4>
                  <p className="text-sm text-secondary">
                    Choosing the <strong>{bestRegime}</strong> will save you <strong>{formatCurrency(taxSaved, user?.currency)}</strong> annually.
                  </p>
                </div>
              </div>
            </div>

            {/* Old vs New side by side comparison */}
            <div className="tax-page__comparison-cards stagger-children">
              <div className={`glass-card stat-card ${bestRegime === 'Old Regime' ? 'stat-card--selected' : ''}`}>
                <p className="stat-card__label">Old Tax Regime</p>
                <p className="stat-card__value text-danger">{formatCurrency(oldRegime.tax, user?.currency)}</p>
                <span className="text-xs text-secondary mt-1">Taxable: {formatCurrency(oldRegime.taxableIncome, user?.currency)}</span>
                <span className="text-xs text-secondary">Deductions: {formatCurrency(oldRegime.deductions, user?.currency)}</span>
              </div>

              <div className={`glass-card stat-card ${bestRegime === 'New Regime' ? 'stat-card--selected' : ''}`}>
                <p className="stat-card__label">New Tax Regime</p>
                <p className="stat-card__value text-danger">{formatCurrency(newRegime.tax, user?.currency)}</p>
                <span className="text-xs text-secondary mt-1">Taxable: {formatCurrency(newRegime.taxableIncome, user?.currency)}</span>
                <span className="text-xs text-secondary">Deductions: {formatCurrency(newRegime.deductions, user?.currency)}</span>
              </div>
            </div>

            {/* Recommended Regime Slab breakdown chart */}
            <div className="glass-card--static tax-page__chart-card">
              <h3 className="tax-page__section-title">Tax Slab Distribution ({bestRegime})</h3>
              {chartData.length > 0 ? (
                <div className="tax-page__chart-container">
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={v => formatCurrency(v, user?.currency)} contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="tax-page__chart-legend">
                    {chartData.map((item, idx) => (
                      <div key={idx} className="tax-page__legend-item">
                        <span className="tax-page__legend-dot" style={{ background: item.color }} />
                        <span className="text-xs text-secondary">{item.name}:</span>
                        <span className="text-xs font-semibold">{formatCurrency(item.value, user?.currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ minHeight: '180px' }}>
                  <HiOutlineCalculator className="empty-state__icon text-secondary" style={{ fontSize: '2rem' }} />
                  <p className="empty-state__title">Zero Tax Liability</p>
                  <p className="empty-state__description">Based on inputs, you do not owe any income tax.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default TaxPlanner;
