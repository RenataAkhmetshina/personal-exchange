const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');

// POST /api/trades/buy
router.post('/buy', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { ticker, shares } = req.body;
    const shareCount = parseInt(shares);

    if (!ticker || !shareCount || shareCount < 1) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Ticker and a positive share count are required' });
    }

    const stock = await Stock.findOne({ ticker: ticker.toUpperCase() }).session(session);
    if (!stock) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Can't buy your own stock
    if (stock.owner.toString() === req.userId.toString()) {
      await session.abortTransaction();
      return res.status(400).json({ error: "You can't buy your own stock" });
    }

    const totalCost = stock.price * shareCount;

    const buyer = await User.findById(req.userId).session(session);

    if (buyer.walletBalance < totalCost) {
      await session.abortTransaction();
      return res.status(400).json({
        error: `Insufficient funds. Need $${totalCost.toFixed(2)}, have $${buyer.walletBalance.toFixed(2)}`
      });
    }

    // Atomic: deduct balance, add shares
    buyer.walletBalance -= totalCost;
    const currentShares = buyer.portfolio.get(stock.ticker) || 0;
    buyer.portfolio.set(stock.ticker, currentShares + shareCount);
    buyer.markModified('portfolio');
    await buyer.save({ session });

    await session.commitTransaction();

    res.json({
      message: `Bought ${shareCount} shares of $${stock.ticker} for $${totalCost.toFixed(2)}`,
      walletBalance: buyer.walletBalance,
      portfolio: Object.fromEntries(buyer.portfolio)
    });

  } catch (err) {
    await session.abortTransaction();
    console.error('[Trade] Buy error:', err);
    res.status(500).json({ error: 'Transaction failed' });
  } finally {
    session.endSession();
  }
});

// POST /api/trades/sell
router.post('/sell', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { ticker, shares } = req.body;
    const shareCount = parseInt(shares);

    if (!ticker || !shareCount || shareCount < 1) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Ticker and a positive share count are required' });
    }

    const stock = await Stock.findOne({ ticker: ticker.toUpperCase() }).session(session);
    if (!stock) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Stock not found' });
    }

    const seller = await User.findById(req.userId).session(session);
    const currentShares = seller.portfolio.get(stock.ticker) || 0;

    if (currentShares < shareCount) {
      await session.abortTransaction();
      return res.status(400).json({
        error: `Not enough shares. You have ${currentShares}, trying to sell ${shareCount}`
      });
    }

    const totalRevenue = stock.price * shareCount;

    // Atomic: add balance, remove shares
    seller.walletBalance += totalRevenue;
    const remaining = currentShares - shareCount;
    if (remaining === 0) {
      seller.portfolio.delete(stock.ticker);
    } else {
      seller.portfolio.set(stock.ticker, remaining);
    }
    seller.markModified('portfolio');
    await seller.save({ session });

    await session.commitTransaction();

    res.json({
      message: `Sold ${shareCount} shares of $${stock.ticker} for $${totalRevenue.toFixed(2)}`,
      walletBalance: seller.walletBalance,
      portfolio: Object.fromEntries(seller.portfolio)
    });

  } catch (err) {
    await session.abortTransaction();
    console.error('[Trade] Sell error:', err);
    res.status(500).json({ error: 'Transaction failed' });
  } finally {
    session.endSession();
  }
});

module.exports = router;
