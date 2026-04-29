import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.username, form.email, form.password);
      }
      navigate('/market');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 24
    }}>
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0
      }}>
        {['$DEV','$BTC','$MOON','$PUMP','$PEX','$UP'].map((t, i) => (
          <div key={t} style={{
            position: 'absolute',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            color: 'rgba(0,229,160,0.06)',
            top: `${10 + i * 15}%`,
            left: `${5 + i * 16}%`,
            transform: `rotate(${-15 + i * 6}deg)`
          }}>{t}</div>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 48,
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: -2,
            lineHeight: 1
          }}>PEX</div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text3)',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginTop: 4
          }}>Personal Exchange</div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <div className="tabs">
            <button className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>
              Login
            </button>
            <button className={`tab-btn ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {tab === 'register' && (
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="your name"
                  value={form.username}
                  onChange={update('username')}
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={update('email')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={update('password')}
                required
                minLength={6}
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Loading...' : tab === 'login' ? 'Login to PEX' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
