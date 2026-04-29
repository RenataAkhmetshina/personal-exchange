import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:4000';

/**
 * Manages the WebSocket connection to PEX.
 * Returns:
 *   - prices: { [ticker]: number } - live price map, updates on TICKER_UPDATE
 *   - connected: boolean
 */
export function usePexWebSocket(initialPrices = {}) {
  const { token } = useAuth();
  const wsRef = useRef(null);
  const [prices, setPrices] = useState(initialPrices);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);
  const isMounted = useRef(true);

  // Seed prices from REST data whenever it changes
  const seedPrices = useCallback((stockList) => {
    const map = {};
    stockList.forEach(s => { map[s.ticker] = s.price; });
    setPrices(prev => ({ ...prev, ...map }));
  }, []);

  const connect = useCallback(() => {
    if (!token || !isMounted.current) return;

    // Pass JWT via Sec-WebSocket-Protocol header (only way browsers support)
    const ws = new WebSocket(WS_URL, token);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMounted.current) return;
      setConnected(true);
      clearTimeout(reconnectTimer.current);
    };

    ws.onmessage = (event) => {
      if (!isMounted.current) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'TICKER_UPDATE') {
          const { ticker, price } = msg.payload;
          setPrices(prev => ({ ...prev, [ticker]: price }));
        }
      } catch (e) {
        console.warn('[WS] Failed to parse message:', event.data);
      }
    };

    ws.onclose = (event) => {
      if (!isMounted.current) return;
      setConnected(false);
      // Auto-reconnect after 3s unless intentional close
      if (event.code !== 1000 && event.code !== 4001) {
        reconnectTimer.current = setTimeout(() => {
          if (isMounted.current) connect();
        }, 3000);
      }
    };

    ws.onerror = () => {
      setConnected(false);
    };
  }, [token]);

  useEffect(() => {
    isMounted.current = true;
    if (token) connect();

    return () => {
      isMounted.current = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [token, connect]);

  return { prices, connected, seedPrices };
}
