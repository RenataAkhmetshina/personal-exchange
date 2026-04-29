import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

export default function TradeModal({ stock, currentPrice, onClose, onTrade }) {
  const { token, user, updateUserState } = useAuth();
  const [tab, setTab] = useState('buy');
  const [shares, setShares] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sharesNum = parseInt(shares) || 0;
  const total = (sharesNum * currentPrice).toFixed(2);
  const ownedShares = user?.portfolio?.[stock.ticker] || 0;

  const handleTrade = async () => {
    if (!sharesNum || sharesNum < 1) {
      setError('Enter a valid number of shares');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch(`/api/trades/${tab}`, {
        method: 'POST',
        body: JSON.stringify({ ticker: stock.ticker, shares: sharesNum })
      }, token);

      setSuccess(data.message);
      updateUserState({
        walletBalance: data.walletBalance,
        portfolio: data.portfolio
      });
      onTrade && onTrade();
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">
          <span className="ticker-chip">{stock.ticker}</span>
          {stock.name}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div className="card" style={{ padding: 12 }}>
            <div className="card-title">Live Price</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--accent)', fontWeight: 700 }}>
              {fmt(currentPrice)}
            </div>
          </div>
          <div className="card" style={{ padding: 12 }}>
            <div className="card-title">You Hold</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700 }}>
              {ownedShares.toLocaleString()} <span style={{ fontSize: 12, color: 'var(--text3)' }}>shares</span>
            </div>
          </div>
        </div>

        <div className="tabs" style={{ marginBottom: 16 }}>
          <button className={`tab-btn ${tab === 'buy' ? 'active' : ''}`} onClick={() => setTab('buy')}>Buy</button>
          <button className={`tab-btn ${tab === 'sell' ? 'active' : ''}`} onClick={() => setTab('sell')}>Sell</button>
        </div>

        <div className="form-group">
          <label className="form-label">Number of Shares</label>
          <input
            className="form-input"
            type="number"
            min="1"
            value={shares}
            onChange={e => setShares(e.target.value)}
            placeholder="0"
            autoFocus
          />
        </div>

        {sharesNum > 0 && (
          <div style={{
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px 14px',
            marginBottom: 12,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span style={{ color: 'var(--text3)' }}>
              {sharesNum.toLocaleString()} shares × {fmt(currentPrice)}
            </span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
              {tab === 'buy' ? '−' : '+'}{fmt(total)}
            </span>
          </div>
        )}

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button
            className={`btn ${tab === 'buy' ? 'btn-primary' : 'btn-danger'}`}
            style={{ flex: 1 }}
            onClick={handleTrade}
            disabled={loading || !sharesNum}
          >
            {loading ? '...' : `${tab === 'buy' ? 'Buy' : 'Sell'} ${sharesNum > 0 ? sharesNum.toLocaleString() : ''} Shares`}
          </button>
        </div>
      </div>
    </div>
  );
}
