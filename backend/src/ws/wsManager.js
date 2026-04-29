const jwt = require('jsonwebtoken');
const User = require('../models/User');

const clients = new Set();

function initWebSocketServer(wss) {
  wss.on('connection', async (ws, req) => {
    const protocol = req.headers['sec-websocket-protocol'];

    if (!protocol) {
      ws.close(4001, 'Missing authentication token');
      return;
    }

    try {
      const decoded = jwt.verify(protocol, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        ws.close(4002, 'User not found');
        return;
      }

      ws.userId = user._id.toString();
      ws.username = user.username;
      ws.isAlive = true;

      clients.add(ws);

      console.log(`[WS] ${user.username} connected. Total clients: ${clients.size}`);

      ws.send(JSON.stringify({
        type: 'CONNECTED',
        payload: { message: `Welcome to PEX, ${user.username}!` }
      }));

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('close', () => {
        clients.delete(ws);
        console.log(`[WS] ${ws.username} disconnected. Total clients: ${clients.size}`);
      });

      ws.on('error', (err) => {
        console.error(`[WS] Error for ${ws.username}:`, err.message);
        clients.delete(ws);
      });

    } catch (err) {
      console.error('[WS] Auth failed:', err.message);
      ws.close(4003, 'Invalid token');
    }
  });

  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        clients.delete(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heartbeatInterval));
}

function broadcastTickerUpdate(ticker, price) {
  const message = JSON.stringify({
    type: 'TICKER_UPDATE',
    payload: { ticker, price }
  });

  let sent = 0;
  clients.forEach((ws) => {
    if (ws.readyState === 1) { 
      ws.send(message);
      sent++;
    }
  });

  console.log(`[WS] Broadcast TICKER_UPDATE ${ticker}@${price} to ${sent} clients`);
}

module.exports = { initWebSocketServer, broadcastTickerUpdate };
