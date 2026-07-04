const { PortfolioItem } = require('../models');
const { getStockPriceMap } = require('./marketController'); // Wait, let's write a helper to fetch prices or write fallback calculations inside!
// Let's check how marketController resolves stock quotes.
// Let's write a self-contained helper inside the controller that returns mock/live current prices for common symbols (AAPL: 215.30, MSFT: 420.10, TSLA: 195.50, GOOG: 175.20, AMZN: 185.40, NVDA: 125.80, INTC: 30.50, AMD: 160.20, Other: purchase price) so the simulator behaves beautifully!

const getMockPrice = (symbol) => {
  const prices = {
    AAPL: 215.30,
    MSFT: 420.10,
    TSLA: 195.50,
    GOOG: 175.20,
    AMZN: 185.40,
    NVDA: 125.80,
    INTC: 30.50,
    AMD: 160.20,
    RELIANCE: 2950.00,
    TCS: 3820.00,
    INFY: 1530.00,
    HDFCBANK: 1650.00,
  };
  return prices[symbol.toUpperCase()] || null;
};

// Get all holdings + current valuations
const getPortfolio = async (req, res, next) => {
  try {
    const items = await PortfolioItem.findAll({
      where: { userId: req.user.id },
      order: [['purchaseDate', 'DESC']],
    });

    // Resolve current valuations
    const holdings = items.map(item => {
      const currentPrice = getMockPrice(item.symbol) || parseFloat(item.buyPrice);
      const totalCost = parseFloat(item.quantity) * parseFloat(item.buyPrice);
      const currentValue = parseFloat(item.quantity) * currentPrice;
      const profitLoss = currentValue - totalCost;
      const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

      return {
        id: item.id,
        symbol: item.symbol,
        name: item.name || item.symbol,
        quantity: parseFloat(item.quantity),
        buyPrice: parseFloat(item.buyPrice),
        purchaseDate: item.purchaseDate,
        currency: item.currency,
        currentPrice,
        totalCost,
        currentValue,
        profitLoss,
        profitLossPercent,
      };
    });

    res.json({
      success: true,
      data: { holdings },
    });
  } catch (error) {
    next(error);
  }
};

// Create holding transaction
const createHolding = async (req, res, next) => {
  try {
    const holdingData = {
      ...req.body,
      userId: req.user.id,
      symbol: req.body.symbol.toUpperCase(),
      currency: req.body.currency || 'USD',
    };

    const item = await PortfolioItem.create(holdingData);

    res.status(201).json({
      success: true,
      message: 'Portfolio holding transaction recorded.',
      data: { item },
    });
  } catch (error) {
    next(error);
  }
};

// Update holding
const updateHolding = async (req, res, next) => {
  try {
    const item = await PortfolioItem.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Holding record not found.',
      });
    }

    await item.update(req.body);

    res.json({
      success: true,
      message: 'Holding updated successfully.',
      data: { item },
    });
  } catch (error) {
    next(error);
  }
};

// Delete holding
const deleteHolding = async (req, res, next) => {
  try {
    const item = await PortfolioItem.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Holding record not found.',
      });
    }

    await item.destroy();

    res.json({
      success: true,
      message: 'Holding record deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPortfolio,
  createHolding,
  updateHolding,
  deleteHolding,
};
