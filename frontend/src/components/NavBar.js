import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar({ connected, walletBalance, netWorth }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const fmt = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">
          PEX<span>/</span>
        </Link>

        {user && (
          <div className="nav-links">
            <span style={{ display: 'flex', alignItems: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
              <span className={`ws-dot ${connected ? 'connected' : ''}`} />
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>

            <div className="wallet-bar">
              <span>WALLET</span>
              <span className="val">{fmt(walletBalance ?? user?.walletBalance)}</span>
              <span style={{ color: 'var(--text3)' }}>|</span>
              <span>NET WORTH</span>
              <span className="val">{fmt(netWorth)}</span>
            </div>

            <Link
              to="/market"
              className={`nav-link ${location.pathname === '/market' ? 'active' : ''}`}
            >
              <span>Market</span>
            </Link>
            <Link
              to="/portfolio"
              className={`nav-link ${location.pathname === '/portfolio' ? 'active' : ''}`}
            >
              <span>Portfolio</span>
            </Link>
            <Link
              to="/my-stock"
              className={`nav-link ${location.pathname === '/my-stock' ? 'active' : ''}`}
            >
              <span>My Stock</span>
            </Link>

            <button
              onClick={logout}
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 4 }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
