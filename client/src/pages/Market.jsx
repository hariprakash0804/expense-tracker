import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { marketService } from '../services/dataService';
import { formatCurrency, timeAgo } from '../utils/helpers';
import Header from '../components/layout/Header';
import { HiOutlineRefresh, HiOutlineExternalLink, HiOutlineTrendingUp, HiOutlineTrendingDown } from 'react-icons/hi';
import './Market.css';

const Market = () => {
  const toast = useToast();
  const [exchangeRates, setExchangeRates] = useState(null);
  const [metals, setMetals] = useState(null);
  const [stocks, setStocks] = useState(null);
  const [news, setNews] = useState([]);
  const [savingsRates, setSavingsRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [baseCurrency, setBaseCurrency] = useState('USD');

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ratesRes, metalsRes, stocksRes, newsRes, savingsRes] = await Promise.allSettled([
        marketService.getExchangeRates({ base: baseCurrency, symbols: 'INR,EUR,GBP,JPY,AUD,CAD,CHF' }),
        marketService.getMetalPrices(),
        marketService.getStockMarketData(),
        marketService.getFinancialNews(),
        marketService.getSavingsRates(),
      ]);

      if (ratesRes.status === 'fulfilled') setExchangeRates(ratesRes.value.data.data);
      if (metalsRes.status === 'fulfilled') setMetals(metalsRes.value.data.data);
      if (stocksRes.status === 'fulfilled') setStocks(stocksRes.value.data.data);
      if (newsRes.status === 'fulfilled') setNews(newsRes.value.data.data.news);
      if (savingsRes.status === 'fulfilled') setSavingsRates(savingsRes.value.data.data);
    } catch (err) { toast.error('Some market data failed to load'); }
    finally { setLoading(false); }
  };

  const refreshData = () => { fetchAllData(); toast.info('Refreshing market data...'); };

  if (loading) {
    return (
      <>
        <Header title="Market & News" subtitle="Financial data, gold rates, stocks, and savings" />
        <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)' }}>
          <div className="spinner spinner--lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Market & News" subtitle="Financial data, gold rates, stocks, and savings" />
      <div className="market-page">
        <button className="btn btn--ghost" onClick={refreshData} style={{ alignSelf: 'flex-end' }}>
          <HiOutlineRefresh /> Refresh Data
        </button>

        {/* Exchange Rates */}
        <div className="glass-card--static market-page__section">
          <h3 className="market-page__section-title">💱 Exchange Rates</h3>
          <p className="text-xs text-secondary" style={{ margin: '-8px 0 16px 0' }}>Base: {baseCurrency} • Source: Frankfurter (ECB)</p>
          {exchangeRates?.rates ? (
            <div className="market-page__rates-grid">
              {Object.entries(exchangeRates.rates).map(([currency, rate]) => (
                <div key={currency} className="market-page__rate-card">
                  <span className="market-page__rate-currency">{currency}</span>
                  <span className="market-page__rate-value">{rate.toFixed(4)}</span>
                  <span className="text-xs text-secondary">1 {baseCurrency} = {rate.toFixed(2)} {currency}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-secondary">Unable to load exchange rates</p>}
        </div>

        {/* Metals */}
        <div className="glass-card--static market-page__section">
          <h3 className="market-page__section-title">🥇 Gold & Silver Prices</h3>
          {metals ? (
            <div className="market-page__metals-grid">
              {Object.values(metals).filter(m => m.symbol).map(metal => (
                <div key={metal.symbol} className="market-page__metal-card glass-card">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">{metal.name} ({metal.symbol})</h4>
                    <span className={`badge ${metal.change24h?.startsWith('+') ? 'badge--success' : 'badge--danger'}`}>
                      {metal.change24h}
                    </span>
                  </div>
                  <div className="market-page__metal-prices">
                    {Object.entries(metal.prices).map(([cur, price]) => (
                      <div key={cur} className="market-page__metal-price">
                        <span className="text-sm text-secondary">{cur}</span>
                        <span className="font-bold">{formatCurrency(price, cur)}</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-secondary">{metal.unit}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-secondary">Unable to load metal prices</p>}
        </div>

        {/* Stocks */}
        <div className="glass-card--static market-page__section">
          <h3 className="market-page__section-title">📈 Stock Market</h3>
          {stocks?.stocks ? (
            <>
              {!stocks.live && <p className="text-xs text-secondary" style={{ marginBottom: '12px' }}>⚠️ Sample data — {stocks.note}</p>}
              <div className="market-page__stocks-grid">
                {stocks.stocks.map((s, i) => (
                  <div key={i} className="market-page__stock-card glass-card">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold">{s.symbol}</span>
                        {s.name && <span className="text-xs text-secondary" style={{ display: 'block' }}>{s.name}</span>}
                      </div>
                      <span className={`flex items-center gap-1 font-semibold ${s.change >= 0 || s.changePercent >= 0 ? '' : ''}`}
                        style={{ color: (s.change >= 0 || s.changePercent >= 0) ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>
                        {s.change >= 0 || s.changePercent >= 0 ? <HiOutlineTrendingUp /> : <HiOutlineTrendingDown />}
                        {s.changePercent?.toFixed(2)}%
                      </span>
                    </div>
                    <p className="font-bold" style={{ fontSize: 'var(--fs-xl)' }}>
                      {formatCurrency(s.currentPrice, s.currency || 'USD')}
                    </p>
                    <span className="text-xs" style={{ color: s.change >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>
                      {s.change >= 0 ? '+' : ''}{s.change?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-secondary">Unable to load stock data</p>}
        </div>

        {/* Savings Rates */}
        {savingsRates?.banks && (
          <div className="glass-card--static market-page__section">
            <h3 className="market-page__section-title">🏦 Savings & FD Interest Rates</h3>
            <p className="text-xs text-secondary" style={{ margin: '-8px 0 16px 0' }}>{savingsRates.disclaimer}</p>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bank</th><th>Type</th><th>Savings Rate</th><th>FD (1 Year)</th><th>FD (5 Year)</th>
                  </tr>
                </thead>
                <tbody>
                  {savingsRates.banks.map((bank, i) => (
                    <tr key={i}>
                      <td className="font-medium">{bank.name}</td>
                      <td><span className="badge badge--info">{bank.type}</span></td>
                      <td className="font-semibold" style={{ color: 'var(--accent-primary)' }}>{bank.savingsRate}%</td>
                      <td>{bank.fdRate1Year}%</td>
                      <td>{bank.fdRate5Year}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Financial News */}
        <div className="glass-card--static market-page__section">
          <h3 className="market-page__section-title">📰 Financial News</h3>
          {news.length > 0 ? (
            <div className="market-page__news-grid">
              {news.map((article, i) => (
                <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                  className="market-page__news-card glass-card">
                  <div>
                    <h4 className="market-page__news-title">{article.headline}</h4>
                    <p className="market-page__news-summary">{article.summary}</p>
                  </div>
                  <div className="market-page__news-meta">
                    <span className="badge badge--info">{article.category || article.source}</span>
                    <span className="text-xs text-secondary">{timeAgo(article.datetime)}</span>
                    <HiOutlineExternalLink style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </a>
              ))}
            </div>
          ) : <p className="text-secondary">No news available</p>}
        </div>
      </div>
    </>
  );
};

export default Market;
