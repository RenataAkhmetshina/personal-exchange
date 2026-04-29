import React, { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import Sparkline from '../components/Sparkline';
import TradeModal from '../components/TradeModal';

export default function MarketPage({ prices, seedPrices }) {
  const { token, user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tradeStock, setTradeStock] = useState(null);
  const [flashMap, setFlashMap] = useState({});
  const prevPrices = useRef({});

  const fetchStocks = async () => {
    try {
      const data = await apiFetch('/api/stocks', {}, token);
      setStocks(data);
      seedPrices(data);
    } catch (err) {
      console.error('Failed to fetch stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []); // eslint-disable-line

  // Flash animation when price changes via WS
  useEffect(() => {
    const newFlash = {};
    Object.entries(prices).forEach(([ticker, price]) => {
      const prev = prevPrices.current[ticker];
      if (prev !== undefined && prev !== price) {
        newFlash[ticker] = price > prev ? 'up' : 'down';
      }
    });

    if (Object.keys(newFlash).length > 0) {
      setFlashMap(newFlash);
      prevPrices.current = { ...prevPrices.current, ...prices };
      setTimeout(() => setFlashMap({}), 800);
    } else {
      prevPrices.current = { ...prevPrices.current, ...prices };
    }
  }, [prices]);

  const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getPriceChange = (stock) => {
    const history = stock.priceHistory;
    if (!history || history.length < 2) return null;
    const first = history[0];
    const last = prices[stock.ticker] ?? stock.price;
    const pct = ((last - first) / first) * 100;
    return pct;
  };

  return (
    <div className="page">
      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>Market</h1>
            <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 4 }}>
              {stocks.length} stocks listed · Prices update live via WebSocket
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            Loading market data...
          </div>
        ) : stocks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text3)', fontSize: 13 }}>
              No stocks listed yet. Be the first to issue yours!
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Company</th>
                  <th>Owner</th>
                  <th>Price</th>
                  <th>Change</th>
                  <th>History</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => {
                  const livePrice = prices[stock.ticker] ?? stock.price;
                  const change = getPriceChange(stock);
                  const isOwner = stock.owner === user?._id || stock.ownerUsername === user?.username;
                  const flash = flashMap[stock.ticker];

                  return (
                    <tr key={stock.ticker} className={flash === 'up' ? 'price-up' : flash === 'down' ? 'price-down' : ''}>
                      <td>
                        <span className="ticker-chip">{stock.ticker}</span>
                      </td>
                      <td style={{ color: 'var(--text2)' }}>{stock.name}</td>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>@{stock.ownerUsername}</td>
                      <td style={{ fontWeight: 700, fontSize: 14 }}>{fmt(livePrice)}</td>
                      <td>
                        {change !== null ? (
                          <span style={{ color: change >= 0 ? 'var(--accent)' : 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                            {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>
                        <Sparkline data={stock.priceHistory} width={80} height={28} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isOwner ? (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>
                            YOUR STOCK
                          </span>
                        ) : (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setTradeStock(stock)}
                          >
                            Trade
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {tradeStock && (
        <TradeModal
          stock={tradeStock}
          currentPrice={prices[tradeStock.ticker] ?? tradeStock.price}
          onClose={() => setTradeStock(null)}
          onTrade={fetchStocks}
        />
      )}
    </div>
  );
}
