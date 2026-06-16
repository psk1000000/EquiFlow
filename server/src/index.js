/**
 * Server entry point.
 *
 * Assembles the Express application with middleware, mounts REST routes,
 * attaches the Socket.IO server, and starts the background services
 * (stock simulation engine, news generator).
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { PORT, CORS_ORIGINS } from './config/index.js';
import rateLimiter from './middleware/rateLimiter.js';
import authMiddleware from './middleware/authMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import tradeRoutes, { portfolioRoute } from './routes/tradeRoutes.js';
import initSocketManager from './socket/SocketManager.js';
import simulationEngine from './services/StockSimulationEngine.js';
import newsGenerator from './services/NewsGenerator.js';

// ─── Express app setup ──────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

// ─── Security & parsing middleware ──────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // CSP off for dev
app.use(compression());
app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimiter);

// ─── Health check (useful for deployment readiness probes) ──────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── REST routes ────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/trades', tradeRoutes);
app.get('/api/portfolio', authMiddleware, portfolioRoute);

// ─── 404 handler for unmatched API routes ───────────────────────────────
app.use('/api/*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
  });
});

// ─── Global error handler ───────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// ─── Socket.IO ──────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

initSocketManager(io);

// ─── Start background services ──────────────────────────────────────────
simulationEngine.start();
newsGenerator.start();

// ─── Start server ───────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║    Stock Broker Dashboard — Server          ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  REST API:   http://localhost:${PORT}/api       ║`);
  console.log(`║  WebSocket:  ws://localhost:${PORT}              ║`);
  console.log(`║  Health:     http://localhost:${PORT}/api/health ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});

// ─── Graceful shutdown ──────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`\n[Server] Received ${signal}, shutting down gracefully…`);
  simulationEngine.stop();
  newsGenerator.stop();
  io.close(() => {
    httpServer.close(() => {
      console.log('[Server] Closed.');
      process.exit(0);
    });
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
