import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Clean up expired buckets every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (record.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}, 120000).unref();

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyPrefix?: string;
}) {
  const { windowMs, max, message = 'Too many requests. Please try again later.', keyPrefix = 'rl' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, allow bypassing unless testing rate limiter
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const clientIp = (
      req.headers['cf-connecting-ip'] ||
      req.headers['x-forwarded-for'] ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown'
    ).toString().split(',')[0].trim();

    const key = `${keyPrefix}:${clientIp}`;
    const now = Date.now();
    const record = memoryStore.get(key);

    if (!record || record.resetAt <= now) {
      memoryStore.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      return next();
    }

    if (record.count >= max) {
      const retryAfterSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
      res.setHeader('Retry-After', retryAfterSec);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.status(429).json({ error: message, retryAfterSeconds: retryAfterSec });
      return;
    }

    record.count += 1;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    next();
  };
}

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many admin login attempts from this IP. Please wait 15 minutes before trying again.',
  keyPrefix: 'login'
});

export const localDevLoginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many local development login attempts. Please wait.',
  keyPrefix: 'dev-login'
});

export const discordUrlRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: 'Too many Discord authorization requests. Please try again in a few minutes.',
  keyPrefix: 'discord-url'
});

export const discordCallbackRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: 'Too many Discord callback attempts. Please wait before retrying.',
  keyPrefix: 'discord-cb'
});

export const registrationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many registration submissions from this address. Please wait before submitting again.',
  keyPrefix: 'reg'
});
