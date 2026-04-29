import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import TradeModal from '../components/TradeModal';

export default function PortfolioPage({ prices }) {
  const { token, user } = useAuth();
  const [stocks, setStocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [tradeStock, setTradeStock] = useState(null);

  const portfolio = user?.portfolio || {};
  const tickers = Object.keys(portfolio).filter(t => portfolio[t] > 0);

  useEffect(() => {
    if (tickers.length === 0) { setLoading(false); return; }
    Promise.all(tickers.map(t =>
      apiFetch(`/api/stocks/${t}`, {}, token)
        .catch(() => null)
    )).then(results => {
      const map = {};
      results.forEach(s => { if (s) map[s.ticker] = s; });
      setStocks(map);
      setLoading(false);
    });
  }, [tickers.join(',')]); 

  const fmt = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const portfolioValue = tickers.reduce((sum, t) => {
    const livePrice = prices[t] ?? stocks[t]?.price ?? 0;
    return sum + (portfolio[t] * livePrice);
  }, 0);

  const walletBalance = user?.walletBalance || 0;
  const totalNetWorth = walletBalance + portfolioValue;

  return (
    <div className="page">
      <div className="container" style={{ padding: '32px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>
          Portfolio
        </h1>
        <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 24 }}>
          @{user?.username} · Net worth 
        </div>

        {/* Total Net Worth */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div className="valuation-display">
            <div className="card-title" style={{ marginBottom: 8 }}>Total Net Worth</div>
            <div className={`big-num ${totalNetWorth < 0 ? 'negative' : ''}`}>
              {fmt(totalNetWorth)}
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>Cash Balance</div>
            <div className="big-num">{fmt(walletBalance)}</div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>Holdings Value</div>
            <div className="big-num">{fmt(portfolioValue)}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              {tickers.length} position{tickers.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Holdings */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="card-title">Holdings</div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              Loading positions...
            </div>
          ) : tickers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              No holdings yet. 
            </div>
          ) : (
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Company</th>
                  <th>Shares</th>
                  <th>Live Price</th>
                  <th>Value</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickers.map(ticker => {
                  const stock = stocks[ticker];
                  const sharesHeld = portfolio[ticker];
                  const livePrice = prices[ticker] ?? stock?.price ?? 0;
                  const value = sharesHeld * livePrice;

                  return (
                    <tr key={ticker}>
                      <td><span className="ticker-chip">{ticker}</span></td>
                      <td style={{ color: 'var(--text2)' }}>{stock?.name || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{sharesHeld.toLocaleString()}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{fmt(livePrice)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{fmt(value)}</td>
                      <td style={{ textAlign: 'right' }}>
                        {stock && (
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
          )}
        </div>
      </div>

      {tradeStock && (
        <TradeModal
          stock={tradeStock}
          currentPrice={prices[tradeStock.ticker] ?? tradeStock.price}
          onClose={() => setTradeStock(null)}
        />
      )}
    </div>
  );
}
