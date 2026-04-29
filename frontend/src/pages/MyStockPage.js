import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import Sparkline from '../components/Sparkline';

export default function MyStockPage({ prices }) {
  const { token, user } = useAuth();
  const [myStock, setMyStock] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create form
  const [createForm, setCreateForm] = useState({ ticker: '', name: '', price: '10.00' });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Price update form
  const [newPrice, setNewPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [priceSuccess, setPriceSuccess] = useState('');
  const [priceLoading, setPriceLoading] = useState(false);

  const fetchMyStock = async () => {
    try {
      const data = await apiFetch('/api/stocks', {}, token);
      const mine = data.find(s => s.ownerUsername === user?.username);
      setMyStock(mine || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMyStock();
  }, [user]); 

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const stock = await apiFetch('/api/stocks', {
        method: 'POST',
        body: JSON.stringify(createForm)
      }, token);
      setMyStock(stock);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handlePriceUpdate = async (e) => {
    e.preventDefault();
    setPriceError('');
    setPriceSuccess('');
    setPriceLoading(true);
    try {
      const updated = await apiFetch(`/api/stocks/${myStock.ticker}/price`, {
        method: 'PATCH',
        body: JSON.stringify({ price: parseFloat(newPrice) })
      }, token);
      setMyStock(updated);
      setPriceSuccess(`Price updated to $${parseFloat(newPrice).toFixed(2)} and broadcast to all users!`);
      setNewPrice('');
      setTimeout(() => setPriceSuccess(''), 3000);
    } catch (err) {
      setPriceError(err.message);
    } finally {
      setPriceLoading(false);
    }
  };

  const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const livePrice = myStock ? (prices[myStock.ticker] ?? myStock.price) : 0;

  if (loading) {
    return (
      <div className="page">
        <div className="container" style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ padding: '32px 24px', maxWidth: 700 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>
          My Stock
        </h1>
        
        {!myStock ? (
          /* Create stock form */
          <div className="card">
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Issue Your Stock</div>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Ticker</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="TICKER"
                    value={createForm.ticker}
                    onChange={e => setCreateForm(p => ({ ...p, ticker: e.target.value.toUpperCase() }))}
                    maxLength={6}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Your Company Industries Inc."
                    value={createForm.name}
                    onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Price USD</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={`10.00 USD`}
                  value={createForm.price}
                  onChange={e => setCreateForm(p => ({ ...p, price: e.target.value }))}
                  required
                />
              </div>

              {createError && <div className="form-error">{createError}</div>}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={createLoading}
              >
                {createLoading ? 'Creating...' : 'Create Stock'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="ticker-chip" style={{ fontSize: 16, padding: '4px 12px' }}>${myStock.ticker}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{myStock.name}</div>
                  </div>
                </div>
                <Sparkline data={myStock.priceHistory} width={100} height={36} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 12 }}>
                  <div className="card-title" style={{ marginBottom: 4 }}>Live Price</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
                    {fmt(livePrice)}
                  </div>
                </div>
                <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 12 }}>
                  <div className="card-title" style={{ marginBottom: 4 }}>All-Time High</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700 }}>
                    {fmt(Math.max(...(myStock.priceHistory.length ? myStock.priceHistory : [myStock.price])))}
                  </div>
                </div>
                <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: 12 }}>
                  <div className="card-title" style={{ marginBottom: 4 }}>Updates</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700 }}>
                    {myStock.priceHistory.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Update price */}
            <div className="card">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Update Stock Price</div>
              </div>

              <form onSubmit={handlePriceUpdate}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">New Price</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder={`${livePrice.toFixed(2)} USD`}
                      value={newPrice}
                      onChange={e => setNewPrice(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={priceLoading || !newPrice}
                    style={{ height: 42 }}
                  >
                    {priceLoading ? 'Broadcasting...' : 'Update'}
                  </button>
                </div>
                {priceError && <div className="form-error" style={{ marginTop: 8 }}>{priceError}</div>}
                {priceSuccess && <div className="form-success" style={{ marginTop: 8 }}>{priceSuccess}</div>}
              </form>
            </div>

            {/* Price history */}
            {myStock.priceHistory.length > 0 && (
              <div className="card">
                <div className="card-title" style={{ marginBottom: 12 }}>Price History</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[...myStock.priceHistory].reverse().map((p, i) => (
                    <div key={i} style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      padding: '3px 8px',
                      background: 'var(--bg3)',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      color: i === 0 ? 'var(--accent)' : 'var(--text2)'
                    }}>
                      {fmt(p)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
