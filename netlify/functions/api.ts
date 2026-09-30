import type { Config } from '@netlify/functions';
import express from 'express';
import cookieParser from 'cookie-parser';
import type { AddressInfo } from 'net';
import { apiRouter } from '../../server/api.js';

// Runs the existing Express API (server/api.ts) on Netlify so the site's
// /api/* calls reach Firebase instead of falling through to index.html.
const app = express();
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', apiRouter);
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.originalUrl, method: req.method });
});
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[BlackHawk API Error]:', err);
  res.status(err.status || err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
});

// Express listens on a loopback port that is reused across warm invocations.
let origin: Promise<string> | null = null;
function getOrigin(): Promise<string> {
  origin ??= new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    });
    server.on('error', (err) => {
      origin = null;
      reject(err);
    });
  });
  return origin;
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const headers = new Headers(req.headers);
  headers.set('x-forwarded-proto', url.protocol.replace(':', ''));
  headers.set('x-forwarded-host', url.host);
  headers.delete('host');

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const res = await fetch(`${await getOrigin()}${url.pathname}${url.search}`, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: 'manual',
  });

  const outHeaders = new Headers(res.headers);
  outHeaders.delete('content-length');
  outHeaders.delete('transfer-encoding');
  outHeaders.delete('connection');
  return new Response(res.body, { status: res.status, headers: outHeaders });
};

export const config: Config = {
  path: '/api/*',
};
