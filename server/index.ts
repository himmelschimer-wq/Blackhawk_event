import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiRouter } from './api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Safe environment loader for standalone server (.env in server/ or root)
try {
  if (typeof (process as any).loadEnvFile === 'function') {
    const serverEnv = path.resolve(__dirname, '.env');
    const parentEnv = path.resolve(__dirname, '../.env');
    const cwdEnv = path.resolve(process.cwd(), '.env');

    if (fs.existsSync(serverEnv)) {
      (process as any).loadEnvFile(serverEnv);
    } else if (fs.existsSync(parentEnv)) {
      (process as any).loadEnvFile(parentEnv);
    } else if (fs.existsSync(cwdEnv)) {
      (process as any).loadEnvFile(cwdEnv);
    } else {
      (process as any).loadEnvFile();
    }
  }
} catch {
  // .env not present or already supplied by cloud provider (Docker, Render, Railway)
}

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Enable trust proxy for reverse proxies (Render, Railway, Fly.io, Cloudflare, Nginx)
app.set('trust proxy', 1);

// ─── CORS CONFIGURATION ───────────────────────────────────────────────────────
const rawCorsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '';
let corsOptions: cors.CorsOptions;

if (!rawCorsOrigin || rawCorsOrigin === '*' || rawCorsOrigin === 'true') {
  // Allow all origins with credentials support in development or wildcard mode
  corsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['set-cookie'],
  };
} else {
  // Support comma-separated list of allowed domains
  const allowedOrigins = rawCorsOrigin.split(',').map(o => o.trim().replace(/\/$/, ''));
  corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some(allowed =>
        allowed === origin || allowed === '*' || origin.endsWith(allowed.replace(/^\*?\./, ''))
      );
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive fallback
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
}

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HEALTH & STATUS CHECKS ──────────────────────────────────────────────────
const startTime = Date.now();

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'blackhawk-tournament-api',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    memoryUsage: process.memoryUsage(),
  });
});

// Root API info endpoint for standalone inspection
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    service: 'BlackHawk Esports Tournament API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      stats: '/api/stats',
      games: '/api/games',
      events: '/api/events',
      players: '/api/players',
      leaderboard: '/api/leaderboard',
      registrations: '/api/registrations (POST public / GET admin)',
      auth: '/api/auth/me',
      discordConfig: '/api/auth/discord/config',
    },
    health: '/health',
  });
});

// ─── MOUNT API ROUTES ────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── OPTIONAL FULLSTACK STATIC SERVING (IF DIST EXISTS) ──────────────────────
// Detect if built client frontend exists (for single-container deployments)
const possibleDistPaths = [
  path.resolve(process.cwd(), 'dist'),
  path.resolve(__dirname, '../dist'),
  path.resolve(__dirname, '../../dist'),
];

let clientDistPath: string | null = null;
for (const p of possibleDistPaths) {
  if (fs.existsSync(path.join(p, 'index.html'))) {
    clientDistPath = p;
    break;
  }
}

if (clientDistPath) {
  console.log(`[BlackHawk Server] Serving static frontend from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  // Client-side routing fallback for SPA (Express 5 compatible)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && req.path !== '/health') {
      return res.sendFile(path.join(clientDistPath!, 'index.html'));
    }
    next();
  });
} else {
  // Pure standalone API mode fallback for root
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      service: 'BlackHawk Esports API',
      status: 'online',
      message: 'Pure Backend API Server is active and operational.',
      healthCheck: '/health',
      apiOverview: '/api',
    });
  });
}

// ─── 404 HANDLER FOR UNMATCHED API ROUTES ────────────────────────────────────
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[BlackHawk API Error]:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

// ─── SERVER LIFECYCLE ────────────────────────────────────────────────────────
let serverInstance: any = null;

if (process.env.NODE_ENV !== 'test') {
  serverInstance = app.listen(PORT, HOST, () => {
    console.log(`[BlackHawk API] 🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`[BlackHawk API] 🌍 Environment: ${NODE_ENV}`);
    console.log(`[BlackHawk API] 🏥 Health check: http://${HOST}:${PORT}/health`);
  });

  // Graceful shutdown handling
  const shutdown = (signal: string) => {
    console.log(`\n[BlackHawk API] Received ${signal}. Shutting down gracefully...`);
    if (serverInstance) {
      serverInstance.close(() => {
        console.log('[BlackHawk API] Closed all HTTP connections. Exiting.');
        process.exit(0);
      });
      // Force shutdown after 10s if connections linger
      setTimeout(() => {
        console.error('[BlackHawk API] Forced shutdown due to timeout.');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;
