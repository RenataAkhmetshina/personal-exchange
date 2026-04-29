import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { usePexWebSocket } from './hooks/usePexWebSocket';
import NavBar from './components/NavBar';
import AuthPage from './pages/AuthPage';
import MarketPage from './pages/MarketPage';
import PortfolioPage from './pages/PortfolioPage';
import MyStockPage from './pages/MyStockPage';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 13
      }}>
        Authenticating...
      </div>
    );
  }
  return user ? children : <Navigate to="/auth" replace />;
}

function AppShell() {
  const { user } = useAuth();
  const { prices, connected, seedPrices } = usePexWebSocket();

  // Calculate net worth in real-time from live prices — never stored on server
  const netWorth = useMemo(() => {
    if (!user) return 0;
    const portfolio = user.portfolio || {};
    const holdingsValue = Object.entries(portfolio).reduce((sum, [ticker, shares]) => {
      const livePrice = prices[ticker] || 0;
      return sum + (shares * livePrice);
    }, 0);
    return (user.walletBalance || 0) + holdingsValue;
  }, [user, prices]);

  return (
    <BrowserRouter>
      {user && (
        <NavBar
          connected={connected}
          walletBalance={user.walletBalance}
          netWorth={netWorth}
        />
      )}
      <Routes>
        <Route path="/auth" element={
          user ? <Navigate to="/market" replace /> : <AuthPage />
        } />
        <Route path="/market" element={
          <ProtectedRoute>
            <MarketPage prices={prices} seedPrices={seedPrices} />
          </ProtectedRoute>
        } />
        <Route path="/portfolio" element={
          <ProtectedRoute>
            <PortfolioPage prices={prices} />
          </ProtectedRoute>
        } />
        <Route path="/my-stock" element={
          <ProtectedRoute>
            <MyStockPage prices={prices} />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to={user ? '/market' : '/auth'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
