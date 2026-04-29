const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');
const { broadcastTickerUpdate } = require('../ws/wsManager');

// GET /api/stocks - list all stocks
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ updatedAt: -1 });
    res.json(stocks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

// GET /api/stocks/:ticker - get single stock
router.get('/:ticker', async (req, res) => {
  try {
    const stock = await Stock.findOne({ ticker: req.params.ticker.toUpperCase() });
    if (!stock) return res.status(404).json({ error: 'Stock not found' });
    res.json(stock);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
});

// POST /api/stocks - create a new stock (one per user)
router.post('/', auth, async (req, res) => {
  try {
    const existing = await Stock.findOne({ owner: req.userId });
    if (existing) {
      return res.status(409).json({ error: `You already own the $${existing.ticker} stock` });
    }

    const { ticker, name, price } = req.body;

    if (!ticker || !name) {
      return res.status(400).json({ error: 'Ticker and name are required' });
    }

    const cleanTicker = ticker.toUpperCase().trim();
    if (!/^[A-Z]{2,6}$/.test(cleanTicker)) {
      return res.status(400).json({ error: 'Ticker must be 2-6 uppercase letters only' });
    }

    const tickerExists = await Stock.findOne({ ticker: cleanTicker });
    if (tickerExists) {
      return res.status(409).json({ error: `Ticker $${cleanTicker} is already taken` });
    }

    const initialPrice = parseFloat(price) || 10.00;
    if (initialPrice < 0.01) {
      return res.status(400).json({ error: 'Price must be at least $0.01' });
    }

    const stock = new Stock({
      ticker: cleanTicker,
      name: name.trim(),
      price: initialPrice,
      owner: req.userId,
      ownerUsername: req.user.username,
      priceHistory: [initialPrice]
    });

    await stock.save();
    res.status(201).json(stock);
  } catch (err) {
    console.error('[Stocks] Create error:', err);
    res.status(500).json({ error: 'Failed to create stock' });
  }
});

// PATCH /api/stocks/:ticker/price - update price (owner only)
router.patch('/:ticker/price', auth, async (req, res) => {
  try {
    const stock = await Stock.findOne({ ticker: req.params.ticker.toUpperCase() });

    if (!stock) return res.status(404).json({ error: 'Stock not found' });

    if (stock.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Forbidden: you do not own this stock' });
    }

    const { price } = req.body;
    const newPrice = parseFloat(price);

    if (isNaN(newPrice) || newPrice < 0.01) {
      return res.status(400).json({ error: 'Invalid price. Must be at least $0.01' });
    }

    const updatedHistory = [...(stock.priceHistory || []), newPrice].slice(-20);

    stock.price = newPrice;
    stock.priceHistory = updatedHistory;
    await stock.save();

    broadcastTickerUpdate(stock.ticker, newPrice);

    res.json(stock);
  } catch (err) {
    console.error('[Stocks] Price update error:', err);
    res.status(500).json({ error: 'Failed to update price' });
  }
});

module.exports = router;
