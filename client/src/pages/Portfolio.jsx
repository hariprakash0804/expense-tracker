import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { portfolioService } from '../services/dataService';
import { formatCurrency } from '../utils/helpers';
import Header from '../components/layout/Header';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { HiOutlineTrash, HiOutlinePlus, HiOutlineX, HiOutlineTrendingUp, HiOutlineTrendingDown, HiOutlinePlusCircle } from 'react-icons/hi';
import './Portfolio.css';

const Portfolio = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    symbol: '',
    name: '',
    quantity: '',
    buyPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    currency: 'USD',
  });

  useEffect(() => {
    fetchHoldings();
  }, []);

  const fetchHoldings = async () => {
    setLoading(true);
    try {
      const { data } = await portfolioService.getPortfolio();
      setHoldings(data.data.holdings || []);
    } catch {
      toast.error('Failed to load portfolio holdings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    if (!newAsset.symbol || !newAsset.quantity || !newAsset.buyPrice || !newAsset.purchaseDate) {
      toast.error('Please fill required fields.');
      return;
    }

    try {
      await portfolioService.createHolding({
        symbol: newAsset.symbol.toUpperCase(),
        name: newAsset.name || newAsset.symbol.toUpperCase(),
        quantity: parseFloat(newAsset.quantity),
        buyPrice: parseFloat(newAsset.buyPrice),
        purchaseDate: newAsset.purchaseDate,
        currency: newAsset.currency
      });

      toast.success('Asset transaction logged!');
      setShowModal(false);
      setNewAsset({
        symbol: '',
        name: '',
        quantity: '',
        buyPrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        currency: 'USD',
      });
      fetchHoldings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record holding');
    }
  };

  const handleDeleteHolding = async (id) => {
    if (!window.confirm('Remove this stock holding?')) return;
    try {
      await portfolioService.deleteHolding(id);
      toast.success('Holding removed');
      fetchHoldings();
    } catch {
      toast.error('Failed to delete holding');
    }
  };

  // Aggregates
  const totalInvested = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const currentValuation = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const netROI = currentValuation - totalInvested;
  const netPercentROI = totalInvested > 0 ? (netROI / totalInvested) * 100 : 0;

  // Chart allocation weights
  const assetColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];
  const chartData = holdings.map((h, index) => ({
    name: h.symbol,
    value: Math.round(h.currentValue),
    color: assetColors[index % assetColors.length]
  })).filter(h => h.value > 0);

  const tooltipStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
  };

  return (
    <>
      <Header title="Portfolio Tracker" subtitle="Manage your stock holdings and monitor paper ROI in real-time" />
      <div className="portfolio-page">
        
        {/* Metric Widgets */}
        <div className="portfolio-page__metrics stagger-children">
          <div className="glass-card stat-card">
            <p className="stat-card__label">Current Valuation</p>
            <p className="stat-card__value" style={{ color: 'var(--accent-primary)' }}>
              {formatCurrency(currentValuation, 'USD')}
            </p>
            <span className="text-xs text-secondary">Live portfolio value</span>
          </div>

          <div className="glass-card stat-card">
            <p className="stat-card__label">Invested Capital</p>
            <p className="stat-card__value">
              {formatCurrency(totalInvested, 'USD')}
            </p>
            <span className="text-xs text-secondary">Cost basis capital</span>
          </div>

          <div className="glass-card stat-card">
            <p className="stat-card__label">Net Returns (ROI)</p>
            <p className={`stat-card__value ${netROI >= 0 ? 'text-success' : 'text-danger'}`}
              style={{ color: netROI >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>
              {netROI >= 0 ? '+' : ''}{formatCurrency(netROI, 'USD')} ({netPercentROI.toFixed(1)}%)
            </p>
            <span className="text-xs text-secondary">Paper profits</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16">
            <div className="spinner spinner--lg" />
          </div>
        ) : holdings.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__icon">📈</p>
            <p className="empty-state__title">No Holdings Recorded</p>
            <p className="empty-state__description">Log your share purchases (e.g. AAPL, TSLA) to compute real-time valuations.</p>
            <button className="btn btn--primary" onClick={() => setShowModal(true)}>Log First Stock</button>
          </div>
        ) : (
          <div className="portfolio-page__workspace">
            {/* Split layout: allocations vs holdings grid */}
            <div className="portfolio-page__allocation mt-4">
              
              {/* Weight chart */}
              {chartData.length > 0 && (
                <div className="glass-card--static p-5 flex flex-col items-center">
                  <h4 className="font-semibold text-sm mb-4 self-start">Portfolio Weight Distribution</h4>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={v => formatCurrency(v, 'USD')} contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3 justify-center">
                    {chartData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                        <span className="text-xs text-secondary">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Holdings list */}
              <div className="glass-card--static overflow-x-auto">
                <div className="flex justify-between items-center p-4 border-b border-subtle">
                  <h4 className="font-semibold text-sm">Holdings & Performance</h4>
                  <button className="btn btn--primary btn--sm" onClick={() => setShowModal(true)}>
                    <HiOutlinePlus /> Log Buy Order
                  </button>
                </div>
                
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Stock</th>
                      <th>Quantity</th>
                      <th>Cost Basis</th>
                      <th>Market Price</th>
                      <th>Current Value</th>
                      <th>Returns</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map(h => (
                      <tr key={h.id}>
                        <td>
                          <div className="font-bold">{h.symbol}</div>
                          <div className="text-xxs text-secondary">{h.name}</div>
                        </td>
                        <td>{h.quantity}</td>
                        <td>{formatCurrency(h.buyPrice, h.currency)}</td>
                        <td>{formatCurrency(h.currentPrice, h.currency)}</td>
                        <td className="font-semibold">{formatCurrency(h.currentValue, h.currency)}</td>
                        <td className={`font-semibold ${h.profitLoss >= 0 ? 'text-success' : 'text-danger'}`}
                          style={{ color: h.profitLoss >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>
                          {h.profitLoss >= 0 ? '+' : ''}{formatCurrency(h.profitLoss, h.currency)} ({h.profitLossPercent.toFixed(1)}%)
                        </td>
                        <td>
                          <button className="btn btn--ghost btn--icon" onClick={() => handleDeleteHolding(h.id)}
                            style={{ color: 'var(--accent-danger)' }} title="Remove"><HiOutlineTrash size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Add Holding Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Log Buy Order</h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowModal(false)}><HiOutlineX /></button>
            </div>
            <form className="modal__body" onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Ticker Symbol *</label>
                  <input type="text" className="form-input" placeholder="e.g. AAPL, TSLA"
                    value={newAsset.symbol} onChange={e => setNewAsset(f => ({ ...f, symbol: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input type="text" className="form-input" placeholder="e.g. Apple Inc."
                    value={newAsset.name} onChange={e => setNewAsset(f => ({ ...f, name: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Quantity (Shares) *</label>
                  <input type="number" step="0.0001" className="form-input" placeholder="0"
                    value={newAsset.quantity} onChange={e => setNewAsset(f => ({ ...f, quantity: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Buy Price (per Share) *</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00"
                    value={newAsset.buyPrice} onChange={e => setNewAsset(f => ({ ...f, buyPrice: e.target.value }))} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Purchase Date *</label>
                  <input type="date" className="form-input"
                    value={newAsset.purchaseDate} onChange={e => setNewAsset(f => ({ ...f, purchaseDate: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select className="form-select" value={newAsset.currency} onChange={e => setNewAsset(f => ({ ...f, currency: e.target.value }))}>
                    <option value="USD">🇺🇸 USD</option>
                    <option value="INR">🇮🇳 INR</option>
                    <option value="EUR">🇪🇺 EUR</option>
                  </select>
                </div>
              </div>

              <div className="modal__footer" style={{ padding: 0, borderTop: 'none', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">Log Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Portfolio;
