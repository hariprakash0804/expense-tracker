// Market data controller — proxies external API calls for gold, stocks, currency, and news

// Fetch exchange rates from Frankfurter API (free, no key required)
const getExchangeRates = async (req, res, next) => {
  try {
    const { base = 'USD', symbols } = req.query;
    let url = `https://api.frankfurter.dev/latest?base=${base}`;
    if (symbols) url += `&symbols=${symbols}`;

    const response = await fetch(url);
    const data = await response.json();

    res.json({
      success: true,
      data: {
        base: data.base,
        date: data.date,
        rates: data.rates,
      },
    });
  } catch (error) {
    console.error('Exchange rate API error:', error.message);
    res.status(503).json({
      success: false,
      message: 'Unable to fetch exchange rates. Please try again later.',
    });
  }
};

// Get available currencies from Frankfurter
const getCurrencies = async (req, res, next) => {
  try {
    const response = await fetch('https://api.frankfurter.dev/currencies');
    const data = await response.json();

    res.json({
      success: true,
      data: { currencies: data },
    });
  } catch (error) {
    console.error('Currencies API error:', error.message);
    res.status(503).json({
      success: false,
      message: 'Unable to fetch currencies.',
    });
  }
};

// Gold and silver prices (using Frankfurter for XAU/XAG or fallback to static data)
const getMetalPrices = async (req, res, next) => {
  try {
    // Try fetching from a public metals API
    const response = await fetch(
      'https://api.frankfurter.dev/latest?base=USD&symbols=INR,EUR,GBP'
    );
    const forexData = await response.json();

    // Gold and silver approximate market prices (updated format)
    // In production, you'd use a metals API like goldapi.io
    const metalPrices = {
      gold: {
        symbol: 'XAU',
        name: 'Gold',
        unit: 'per troy oz',
        prices: {
          USD: 2650.00,
          INR: 2650.00 * (forexData.rates?.INR || 83.5),
          EUR: 2650.00 * (1 / (forexData.rates?.EUR ? (1 / forexData.rates.EUR) : 0.92)),
        },
        change24h: '+0.45%',
        lastUpdated: new Date().toISOString(),
      },
      silver: {
        symbol: 'XAG',
        name: 'Silver',
        unit: 'per troy oz',
        prices: {
          USD: 31.50,
          INR: 31.50 * (forexData.rates?.INR || 83.5),
          EUR: 31.50 * (1 / (forexData.rates?.EUR ? (1 / forexData.rates.EUR) : 0.92)),
        },
        change24h: '+1.20%',
        lastUpdated: new Date().toISOString(),
      },
    };

    res.json({
      success: true,
      data: metalPrices,
    });
  } catch (error) {
    console.error('Metal prices API error:', error.message);
    res.status(503).json({
      success: false,
      message: 'Unable to fetch metal prices.',
    });
  }
};

// Stock market overview — major indices
const getStockMarketData = async (req, res, next) => {
  try {
    // Curated market data — in production, use Finnhub or Alpha Vantage
    const finnhubKey = process.env.FINNHUB_API_KEY;
    let marketData = {};

    if (finnhubKey) {
      // Fetch real data from Finnhub
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
      const quotes = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const resp = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`
            );
            const data = await resp.json();
            return {
              symbol,
              currentPrice: data.c,
              change: data.d,
              changePercent: data.dp,
              high: data.h,
              low: data.l,
              open: data.o,
              previousClose: data.pc,
            };
          } catch {
            return { symbol, error: 'Failed to fetch' };
          }
        })
      );

      marketData = { stocks: quotes, source: 'Finnhub', live: true };
    } else {
      // Fallback sample data
      marketData = {
        stocks: [
          { symbol: 'SENSEX', name: 'BSE Sensex', currentPrice: 79245.30, change: 325.45, changePercent: 0.41, currency: 'INR' },
          { symbol: 'NIFTY', name: 'Nifty 50', currentPrice: 24150.75, change: 98.20, changePercent: 0.41, currency: 'INR' },
          { symbol: 'S&P500', name: 'S&P 500', currentPrice: 5850.25, change: 28.50, changePercent: 0.49, currency: 'USD' },
          { symbol: 'AAPL', name: 'Apple Inc.', currentPrice: 232.50, change: 3.20, changePercent: 1.40, currency: 'USD' },
          { symbol: 'GOOGL', name: 'Alphabet Inc.', currentPrice: 178.85, change: -1.50, changePercent: -0.83, currency: 'USD' },
        ],
        source: 'Sample Data',
        live: false,
        note: 'Set FINNHUB_API_KEY in .env for live stock data',
      };
    }

    marketData.lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      data: marketData,
    });
  } catch (error) {
    console.error('Stock market API error:', error.message);
    res.status(503).json({
      success: false,
      message: 'Unable to fetch stock market data.',
    });
  }
};

// Financial news
const getFinancialNews = async (req, res, next) => {
  try {
    const finnhubKey = process.env.FINNHUB_API_KEY;
    let news = [];

    if (finnhubKey) {
      const response = await fetch(
        `https://finnhub.io/api/v1/news?category=general&token=${finnhubKey}`
      );
      const data = await response.json();
      news = data.slice(0, 10).map(item => ({
        id: item.id,
        headline: item.headline,
        summary: item.summary,
        source: item.source,
        url: item.url,
        image: item.image,
        datetime: new Date(item.datetime * 1000).toISOString(),
        category: item.category,
      }));
    } else {
      // Fallback sample news
      news = [
        {
          id: 1,
          headline: 'Gold Prices Hit New Record Amid Global Uncertainty',
          summary: 'Gold prices surged to fresh all-time highs as investors sought safe-haven assets amid geopolitical tensions and inflation concerns.',
          source: 'Financial Times',
          url: '#',
          datetime: new Date().toISOString(),
          category: 'Commodities',
        },
        {
          id: 2,
          headline: 'RBI Keeps Repo Rate Unchanged at 6.5%',
          summary: 'The Reserve Bank of India maintained its benchmark lending rate, citing persistent inflation risks while noting strong economic growth momentum.',
          source: 'Economic Times',
          url: '#',
          datetime: new Date(Date.now() - 3600000).toISOString(),
          category: 'Economy',
        },
        {
          id: 3,
          headline: 'Tech Stocks Rally as AI Boom Continues',
          summary: 'Major technology stocks led market gains as strong earnings reports reinforced optimism about artificial intelligence investment returns.',
          source: 'Bloomberg',
          url: '#',
          datetime: new Date(Date.now() - 7200000).toISOString(),
          category: 'Technology',
        },
        {
          id: 4,
          headline: 'Savings Account Interest Rates Compared — Best Options for 2026',
          summary: 'A comprehensive comparison of savings account interest rates across major banks, with digital banks offering up to 7% returns.',
          source: 'Mint',
          url: '#',
          datetime: new Date(Date.now() - 14400000).toISOString(),
          category: 'Personal Finance',
        },
        {
          id: 5,
          headline: 'Stock Market Outlook: Analysts Predict Strong H2 Performance',
          summary: 'Wall Street analysts are forecasting continued gains in the second half, driven by strong corporate earnings and potential rate cuts.',
          source: 'CNBC',
          url: '#',
          datetime: new Date(Date.now() - 21600000).toISOString(),
          category: 'Markets',
        },
      ];
    }

    res.json({
      success: true,
      data: {
        news,
        source: finnhubKey ? 'Finnhub' : 'Sample Data',
        live: !!finnhubKey,
      },
    });
  } catch (error) {
    console.error('Financial news API error:', error.message);
    res.status(503).json({
      success: false,
      message: 'Unable to fetch financial news.',
    });
  }
};

// Savings rates — curated data
const getSavingsRates = async (req, res, next) => {
  try {
    const savingsRates = {
      banks: [
        { name: 'State Bank of India', type: 'Public', savingsRate: 2.70, fdRate1Year: 6.80, fdRate5Year: 6.50 },
        { name: 'HDFC Bank', type: 'Private', savingsRate: 3.00, fdRate1Year: 6.60, fdRate5Year: 7.00 },
        { name: 'ICICI Bank', type: 'Private', savingsRate: 3.00, fdRate1Year: 6.70, fdRate5Year: 7.00 },
        { name: 'Kotak Mahindra Bank', type: 'Private', savingsRate: 3.50, fdRate1Year: 7.10, fdRate5Year: 6.20 },
        { name: 'Axis Bank', type: 'Private', savingsRate: 3.00, fdRate1Year: 6.70, fdRate5Year: 7.00 },
        { name: 'Yes Bank', type: 'Private', savingsRate: 4.00, fdRate1Year: 7.25, fdRate5Year: 7.25 },
        { name: 'IndusInd Bank', type: 'Private', savingsRate: 4.00, fdRate1Year: 7.25, fdRate5Year: 7.25 },
        { name: 'AU Small Finance Bank', type: 'Small Finance', savingsRate: 7.00, fdRate1Year: 7.50, fdRate5Year: 7.25 },
      ],
      lastUpdated: new Date().toISOString(),
      disclaimer: 'Rates are indicative and may vary. Please check with individual banks for current rates.',
    };

    res.json({
      success: true,
      data: savingsRates,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExchangeRates,
  getCurrencies,
  getMetalPrices,
  getStockMarketData,
  getFinancialNews,
  getSavingsRates,
};
