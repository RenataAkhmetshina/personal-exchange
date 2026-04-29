require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { WebSocketServer } = require('ws');
const { initWebSocketServer } = require('./ws/wsManager');

const app = express();
const server = http.createServer(app);

// ─── WebSocket Server ────────────────────────────────────────────────────────
// handleProtocols: echo back the token as accepted sub-protocol
// This satisfies browsers that require at least one protocol to be accepted
const wss = new WebSocketServer({
  server,
  handleProtocols: (protocols) => {
    // Accept the first protocol (which is the JWT token)
    const proto = [...protocols][0];
    return proto || false;
  }
});

initWebSocketServer(wss);

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/trades', require('./routes/trades'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connections: wss.clients.size,
    timestamp: new Date().toISOString()
  });
});

// ─── Database & Server Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('[DB] Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`[Server] PEX backend running on port ${PORT}`);
      console.log(`[Server] WebSocket server ready`);
    });
  })
  .catch((err) => {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  });
