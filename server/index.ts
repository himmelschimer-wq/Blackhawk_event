import './env.js';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiRouter } from './api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Fail startup immediately if production is missing critical credentials
if (NODE_ENV === 'production') {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('CRITICAL FATAL ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in production!');
    process.exit(1);
  }
}

// Enable trust proxy for reverse proxies
app.set('trust proxy', 1);

// ─── SECURITY HEADERS (HELMET) ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://cdn.discordapp.com',
          'https://*.dicebear.com',
          'https://unavatar.io'
        ],
        connectSrc: [
          "'self'",
          'https://discord.com',
          ...(process.env.SUPABASE_URL ? [process.env.SUPABASE_URL] : [])
        ],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xContentTypeOptions: true,
  })
);

// ─── CORS CONFIGURATION (EXPLICIT ALLOWLIST ONLY) ─────────────────────────────
const allowedOrigins: string[] = [];
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(
    ...process.env.CORS_ORIGIN.split(',')
      .map(o => o.trim().replace(/\/$/, ''))
      .filter(Boolean)
  );
}
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.trim().replace(/\/$/, ''));
}
if (NODE_ENV !== 'production') {
  allowedOrigins.push(
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  );
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests without origin header (e.g., CLI, tests, server-to-server)
    if (!origin) return callback(null, true);
    const normalized = origin.trim().replace(/\/$/, '');
    if (allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie'],
};

app.use(cors(corsOptions));
app.use(cookieParser());

// Reduce global request body limits to 100kb for input/DoS protection
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ─── HEALTH & STATUS CHECKS ──────────────────────────────────────────────────
// Minimal public health check: no internal server diagnostics exposed
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Root API info endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    service: 'BlackHawk Esports Tournament API',
    status: 'online',
    version: '1.0.0'
  });
});

// ─── MOUNT API ROUTES ────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── OPTIONAL FULLSTACK STATIC SERVING (IF DIST EXISTS) ──────────────────────
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
  app.use(express.static(clientDistPath));

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && req.path !== '/health') {
      return res.sendFile(path.join(clientDistPath!, 'index.html'));
    }
    next();
  });
} else {
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      service: 'BlackHawk Esports API',
      status: 'online'
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
  if (err?.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS origin denied' });
  }
  console.error('[BlackHawk API Error]:', err?.message || err);
  const status = err.status || err.statusCode || 500;
  const message = NODE_ENV === 'production' && status === 500
    ? 'Internal server error'
    : (err.message || 'Internal server error');
  res.status(status).json({ error: message });
});

// ─── SERVER LIFECYCLE ────────────────────────────────────────────────────────
let serverInstance: any = null;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  serverInstance = app.listen(PORT, HOST, () => {
    console.log(`[BlackHawk API] 🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`[BlackHawk API] 🌍 Environment: ${NODE_ENV}`);
    console.log(`[BlackHawk API] 🏥 Health check: http://${HOST}:${PORT}/health`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n[BlackHawk API] Received ${signal}. Shutting down gracefully...`);
    if (serverInstance) {
      serverInstance.close(() => {
        console.log('[BlackHawk API] Closed all HTTP connections. Exiting.');
        process.exit(0);
      });
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
