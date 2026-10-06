import './env.js';
import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabaseDb, initSupabaseDatabase, syncPlayersAndRegistrations } from './supabaseDb.js';
import { FREE_FIRE_PRIZE_CONFIG, calculateFreeFireEventPayouts } from './freeFirePrizeEngine.js';
import {
  loginRateLimiter,
  localDevLoginRateLimiter,
  discordUrlRateLimiter,
  discordCallbackRateLimiter,
  registrationRateLimiter
} from './rateLimiter.js';
import {
  loginSchema,
  registrationInputSchema,
  gameCreateSchema,
  gameUpdateSchema,
  eventCreateSchema,
  eventUpdateSchema,
  matchRecordSchema,
  playerUpdateSchema,
  registrationUpdateSchema,
  leaderboardUpdateSchema,
  payoutCalculateSchema
} from './validation.js';

// Initialize Supabase Database
initSupabaseDatabase();

export const apiRouter = express.Router();
apiRouter.use(express.json());

// ─── CSRF PROTECTION FOR STATE-CHANGING ADMIN MUTATIONS ──────────────────────
function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!mutatingMethods.includes(req.method)) return next();

  // Public unauthenticated endpoints do not require admin CSRF checks
  const publicMutatingPaths = [
    '/auth/login',
    '/auth/local-dev-login',
    '/auth/discord/callback',
    '/registrations',
    '/events/freefire/calculate-payouts'
  ];
  if (publicMutatingPaths.some(p => req.path === p || req.path.endsWith(p))) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return next();
    } catch {}
  } else if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) return next();
    } catch {}
  } else if (!origin && !referer && process.env.NODE_ENV !== 'production') {
    // Allow non-browser dev tools
    return next();
  }

  // Check CORS origin if set
  if (process.env.CORS_ORIGIN && origin) {
    const allowed = process.env.CORS_ORIGIN.split(',').map(s => s.trim().replace(/\/$/, ''));
    if (allowed.includes(origin)) return next();
  }

  res.status(403).json({ error: 'CSRF validation failed: Origin or Referer mismatch.' });
}

apiRouter.use(csrfProtection);

// ─── DISCORD AVATAR & USER ID HELPERS ───────────────────────────────────────
const discordAvatarCache = new Map<string, string>();

export function extractDiscordUserId(details?: any, discordUsername?: string): string | null {
  if (details && typeof details === 'object') {
    for (const key of Object.keys(details)) {
      if (/discord.*(user.*)?id/i.test(key)) {
        const val = String(details[key]).trim();
        if (/^\d{16,21}$/.test(val)) return val;
      }
    }
    if (details.UID && /^\d{17,20}$/.test(String(details.UID).trim())) {
      return String(details.UID).trim();
    }
  }
  const cleanDiscord = (discordUsername || '').trim();
  if (/^\d{16,21}$/.test(cleanDiscord)) {
    return cleanDiscord;
  }
  return null;
}

export function extractGameUid(details?: any): string | null {
  if (!details) return null;
  const parsed = typeof details === 'string' ? (() => { try { return JSON.parse(details); } catch { return {}; } })() : details;
  if (!parsed || typeof parsed !== 'object') return null;
  for (const key of Object.keys(parsed)) {
    if (/free\s*fire\s*uid/i.test(key) || /bgmi\s*id/i.test(key) || /game\s*uid/i.test(key) || /in[- ]*game\s*uid/i.test(key) || /character\s*id/i.test(key)) {
      const val = String(parsed[key]).trim();
      if (val) return val;
    }
  }
  if (parsed.UID && /^\d{7,14}$/.test(String(parsed.UID).trim())) {
    return String(parsed.UID).trim();
  }
  return null;
}

export function extractInGameName(details?: any): string | null {
  if (!details) return null;
  const parsed = typeof details === 'string' ? (() => { try { return JSON.parse(details); } catch { return {}; } })() : details;
  if (!parsed || typeof parsed !== 'object') return null;
  for (const key of Object.keys(parsed)) {
    if (/in[- ]*game\s*name/i.test(key) || /^ign$/i.test(key)) {
      const val = String(parsed[key]).trim();
      if (val) return val;
    }
  }
  return null;
}

export function getDiscordAvatar(discordUsername?: string, gamerTag?: string, userId?: string | null): string {
  const cleanId = (userId || '').trim();
  if (/^\d{16,21}$/.test(cleanId)) {
    if (discordAvatarCache.has(cleanId)) {
      return discordAvatarCache.get(cleanId)!;
    }
    try {
      const idx = Number((BigInt(cleanId) >> 22n) % 6n);
      const defaultUrl = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
      return defaultUrl;
    } catch {}
  }

  const clean = (discordUsername || gamerTag || 'player').trim().replace(/^@/, '');
  if (!clean || clean.toLowerCase() === 'n/a') {
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(gamerTag || 'player')}&backgroundColor=09090b,18181b`;
  }
  return `https://unavatar.io/discord/${encodeURIComponent(clean)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(clean)}%26backgroundColor%3D09090b%2C18181b`;
}

export function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

// ─── AUDIT LOGGING HELPER ────────────────────────────────────────────────────
export async function createAuditLog(
  adminUser: string,
  role: string,
  action: string,
  targetEntity: string,
  targetId?: string | string[],
  metadata?: any,
  ip?: string
): Promise<void> {
  const id = `log-${crypto.randomUUID()}`;
  const resolvedTargetId = typeof targetId === 'string' ? targetId : Array.isArray(targetId) ? (targetId[0] || 'unknown') : (targetId ? String(targetId) : 'unknown');
  const logRecord = {
    id,
    adminUser,
    role,
    action,
    targetEntity,
    targetId: resolvedTargetId,
    oldValue: metadata?.oldValue ? JSON.stringify(metadata.oldValue) : undefined,
    newValue: metadata?.newValue ? JSON.stringify(metadata.newValue) : undefined,
    ipAddress: ip || 'unknown',
    timestamp: new Date().toISOString()
  };
  try {
    await supabaseDb.set(`blackhawk/audit_logs/${id}`, logRecord);
  } catch (err: any) {
    console.warn('[Audit Log] Failed to write audit record:', err?.message);
  }
}

// ─── AUTHENTICATION HELPERS & MIDDLEWARE ─────────────────────────────────────

function getSessionToken(req: Request): string | null {
  // 1. Primary: HttpOnly secure cookie
  if (req.cookies && req.cookies.admin_session) {
    return String(req.cookies.admin_session).trim();
  }
  // 2. Secondary: Authorization Bearer header (for automated testing / CLI)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  // Never accept session token from query parameters!
  return null;
}

export function isLocalRequest(req: Request): boolean {
  const host = (req.headers.host || '').toLowerCase();
  const ip = req.ip || req.socket.remoteAddress || '';
  return (
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1' ||
    ip.endsWith('127.0.0.1')
  );
}

async function verifyAdminSession(token: string | null, req?: Request): Promise<any | null> {
  if (!token) return null;
  const now = Date.now();

  // Local-only dev session support (strictly forbidden in production)
  if (token.startsWith('local_dev_')) {
    if (process.env.NODE_ENV === 'production') return null;
    if (req && !isLocalRequest(req)) return null;

    return {
      token,
      adminId: 'adm-local-developer',
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
      username: 'local_admin',
      displayName: 'Local Administrator',
      role: 'ADMIN',
    };
  }

  try {
    const session = await supabaseDb.get<any>(`blackhawk/sessions/${token}`);
    if (session && session.expiresAt > now) {
      const admin = await supabaseDb.get<any>(`blackhawk/admins/${session.adminId}`);
      if (admin) {
        return {
          token: session.token,
          adminId: session.adminId,
          expiresAt: session.expiresAt,
          username: admin.username,
          displayName: admin.displayName,
          role: admin.role,
        };
      }
    } else if (session && session.expiresAt <= now) {
      // Lazy cleanup of expired session
      await supabaseDb.delete(`blackhawk/sessions/${token}`).catch(() => {});
    }
  } catch {}

  return null;
}

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = getSessionToken(req);
  const session = await verifyAdminSession(token, req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
    return;
  }
  (req as any).admin = session;
  next();
}

/**
 * Role-Based Access Control Middleware
 * Roles: ADMIN, ORGANIZER, VIEWER
 */
export function requireRole(...allowedRoles: ('ADMIN' | 'ORGANIZER' | 'VIEWER')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const admin = (req as any).admin;
    if (!admin) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    const currentRole = (admin.role || 'VIEWER').toUpperCase();
    if (!allowedRoles.includes(currentRole as any)) {
      res.status(403).json({
        error: `Forbidden: Role "${currentRole}" does not have permission for this action. Required: ${allowedRoles.join(' or ')}.`
      });
      return;
    }

    next();
  };
}

// ─── AUTH ROUTES (COOKIE-BASED SECURE AUTHENTICATION) ────────────────────────

apiRouter.post('/auth/local-dev-login', localDevLoginRateLimiter, async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Local development login is disabled in production.' });
  }
  if (!isLocalRequest(req)) {
    return res.status(403).json({ error: 'Admin access is restricted to localhost.' });
  }

  const token = 'local_dev_' + crypto.randomUUID() + '_' + Date.now();
  const session = {
    token,
    adminId: 'adm-local-developer',
    username: 'local_admin',
    displayName: 'Local Administrator',
    role: 'ADMIN',
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  try {
    await supabaseDb.set(`blackhawk/sessions/${token}`, session);
  } catch {}

  // Set secure HttpOnly cookie
  res.cookie('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });

  res.json({
    success: true,
    admin: {
      id: session.adminId,
      username: session.username,
      displayName: session.displayName,
      role: session.role
    }
  });
});

apiRouter.post('/auth/login', loginRateLimiter, async (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid login payload format.' });
  }

  const { username, password } = parseResult.data;
  const cleanUser = username.toLowerCase();
  const rawPass = password;
  const envAdminUser = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
  const envAdminPass = (process.env.ADMIN_PASSWORD || '').trim();

  let admin: any = null;
  let isValid = false;

  // 1. Check Supabase DB admins table
  try {
    admin = await supabaseDb.findBy<any>('admins', 'username', cleanUser);
    if (admin && admin.passwordHash) {
      isValid = bcrypt.compareSync(rawPass, admin.passwordHash);
    }
  } catch {}

  // 2. Environment master fallback (only if explicitly set)
  if (!isValid && envAdminUser && envAdminPass && cleanUser === envAdminUser && rawPass === envAdminPass) {
    isValid = true;
    if (!admin) {
      admin = {
        id: `adm-${cleanUser}`,
        username: cleanUser,
        displayName: 'BlackHawk Administrator',
        role: 'ADMIN'
      };
      const salt = bcrypt.genSaltSync(12);
      const passwordHash = bcrypt.hashSync(rawPass, salt);
      supabaseDb.set(`blackhawk/admins/${admin.id}`, {
        ...admin,
        passwordHash,
        createdAt: new Date().toISOString()
      }).catch(() => {});
    }
  }

  // Prevent username enumeration: generic authentication error
  if (!isValid || !admin) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Session rotation: generate cryptographically secure random token
  const token = crypto.randomUUID() + '-' + crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  await supabaseDb.set(`blackhawk/sessions/${token}`, {
    token,
    adminId: admin.id,
    expiresAt,
    createdAt: new Date().toISOString()
  }).catch(() => {});

  // Set HttpOnly cookie
  res.cookie('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });

  // Audit log login
  createAuditLog(
    admin.username,
    admin.role || 'ADMIN',
    'LOGIN_SUCCESS',
    'admins',
    admin.id,
    undefined,
    req.ip
  );

  // Never return raw session token in JSON response!
  res.json({
    success: true,
    admin: {
      id: admin.id,
      username: admin.username,
      displayName: admin.displayName || 'BlackHawk High Command',
      role: admin.role || 'ADMIN',
    }
  });
});

apiRouter.post('/auth/logout', async (req: Request, res: Response) => {
  const token = getSessionToken(req);
  if (token) {
    await supabaseDb.delete(`blackhawk/sessions/${token}`);
  }

  // Clear cookie
  res.clearCookie('admin_session', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.json({ success: true, message: 'Logged out successfully.' });
});

apiRouter.get('/auth/me', async (req: Request, res: Response) => {
  const token = getSessionToken(req);
  const session = await verifyAdminSession(token, req);
  if (!session) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    admin: {
      id: session.adminId,
      username: session.username,
      displayName: session.displayName,
      role: session.role
    }
  });
});

// ─── DISCORD OAUTH2 & SERVER MEMBERSHIP ROUTES (FAIL-CLOSED) ─────────────────

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || '';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:5173/discord-callback';

// Server-side OAuth state store with TTL to prevent CSRF and replay attacks
const oauthStateStore = new Map<string, { createdAt: number; expiresAt: number }>();

// Periodic cleanup of expired states
setInterval(() => {
  const now = Date.now();
  for (const [s, data] of oauthStateStore.entries()) {
    if (data.expiresAt <= now) oauthStateStore.delete(s);
  }
}, 60000).unref();

apiRouter.get('/auth/discord/config', (_req: Request, res: Response) => {
  const configured = Boolean(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET);
  res.json({
    configured,
    clientId: DISCORD_CLIENT_ID || null,
    guildId: DISCORD_GUILD_ID || null,
    redirectUri: DISCORD_REDIRECT_URI,
    guildInvite: 'https://discord.gg/WrxHsKbHY'
  });
});

apiRouter.get('/auth/discord/url', discordUrlRateLimiter, (req: Request, res: Response) => {
  if (!DISCORD_CLIENT_ID) {
    // Only allow demo mode if explicitly enabled in non-production environment
    if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEMO_AUTH === 'true') {
      return res.json({
        configured: false,
        url: `/discord-callback?demo=true`,
        message: 'Discord Client ID not set. Running in development demo mode.'
      });
    }
    return res.status(400).json({
      configured: false,
      error: 'Discord OAuth is not configured on the server.'
    });
  }

  // Generate cryptographically secure state
  const state = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  oauthStateStore.set(state, { createdAt: now, expiresAt: now + 10 * 60 * 1000 });

  const scope = encodeURIComponent('identify guilds guilds.members.read');
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=${scope}&state=${state}`;

  res.json({
    configured: true,
    url,
    state
  });
});

apiRouter.post('/auth/discord/callback', discordCallbackRateLimiter, async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'OAuth authorization code is required.' });
    }

    // Isolate demo auth: strictly forbidden in production
    const isDemoCode = code === 'DEMO_CODE' || (typeof code === 'string' && code.startsWith('demo-'));
    if (isDemoCode) {
      if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_AUTH !== 'true') {
        return res.status(403).json({ error: 'Demo authentication is disabled in this environment.' });
      }

      const demoId = '9' + crypto.randomBytes(8).toString('hex').replace(/\D/g, '').padEnd(17, '0').slice(0, 18);
      return res.json({
        success: true,
        user: {
          id: demoId,
          username: 'blackhawk_warrior',
          global_name: 'BlackHawk Warrior',
          discriminator: '0',
          avatar: null,
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=blackhawk_warrior&backgroundColor=09090b',
          inServer: false, // Demo does not fake membership
          verified: false,
          isDemo: true
        }
      });
    }

    // Validate server-side OAuth state parameter
    if (!state || !oauthStateStore.has(String(state))) {
      return res.status(400).json({ error: 'Invalid or expired OAuth state parameter. Please retry login.' });
    }
    // State is single-use; consume immediately
    oauthStateStore.delete(String(state));

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Discord OAuth credentials missing from server configuration.' });
    }

    // Exchange authorization code with Discord using ONLY configured server redirect URI
    const tokenParams = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: String(code),
      redirect_uri: DISCORD_REDIRECT_URI,
    });

    const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });

    if (!tokenRes.ok) {
      return res.status(400).json({ error: 'Failed to exchange authorization token with Discord.' });
    }

    const tokenData = (await tokenRes.json()) as any;
    const accessToken = tokenData.access_token;

    // Fetch user profile
    const userRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userRes.ok) {
      return res.status(400).json({ error: 'Failed to fetch Discord user profile.' });
    }

    const discordUser = (await userRes.json()) as any;

    // Fail-Closed Server Membership Verification
    let inServer = false;
    let memberData: any = null;

    if (DISCORD_GUILD_ID) {
      try {
        const memberRes = await fetch(`https://discord.com/api/v10/users/@me/guilds/${DISCORD_GUILD_ID}/member`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(4000)
        });
        if (memberRes.ok) {
          inServer = true;
          memberData = await memberRes.json();
        } else if (DISCORD_BOT_TOKEN) {
          // Fallback to bot token check
          const botMemberRes = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUser.id}`, {
            headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
            signal: AbortSignal.timeout(4000)
          });
          if (botMemberRes.ok) {
            inServer = true;
            memberData = await botMemberRes.json();
          }
        }
      } catch {
        // Fail-Closed: any error or timeout results in inServer = false
        inServer = false;
      }
    } else {
      // Missing guild ID fails closed
      inServer = false;
    }

    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${(BigInt(discordUser.id) >> 22n) % 6n}.png`;

    res.json({
      success: true,
      user: {
        id: discordUser.id,
        username: discordUser.username,
        global_name: discordUser.global_name || discordUser.username,
        discriminator: discordUser.discriminator,
        avatar: discordUser.avatar,
        avatarUrl,
        inServer,
        roles: memberData?.roles || [],
        joinedAt: memberData?.joined_at || null,
        verified: true
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Internal Discord OAuth error.' });
  }
});

// Membership check endpoint (fail-closed)
apiRouter.get('/auth/discord/check-membership/:userId', async (req: Request, res: Response) => {
  const userId = getParam(req.params.userId);
  if (!DISCORD_GUILD_ID || !DISCORD_BOT_TOKEN || !/^\d{16,21}$/.test(userId)) {
    return res.json({ inServer: false, checked: false });
  }

  try {
    const resBot = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${userId}`, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      signal: AbortSignal.timeout(3500)
    });
    if (resBot.ok) {
      return res.json({ inServer: true, checked: true });
    }
  } catch {}

  // Fail closed
  res.json({ inServer: false, checked: true });
});

// ─── SYSTEM STATISTICS ROUTE ─────────────────────────────────────────────────

apiRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [players, registrations, events, games] = await Promise.all([
      supabaseDb.list('players'),
      supabaseDb.list('registrations'),
      supabaseDb.list<any>('events'),
      supabaseDb.list<any>('games')
    ]);

    const activeEvents = events.filter(e => ['UPCOMING', 'LIVE', 'REGISTRATION OPEN'].includes(e.eventStatus)).length;
    const completedEvents = events.filter(e => e.eventStatus === 'COMPLETED').length;
    const activeGames = games.filter(g => g.active === true || g.active === 1).length;
    const prizeSum = events
      .filter(e => e.eventStatus !== 'CANCELLED')
      .reduce((acc, e) => acc + (Number(e.prizePool) || 0), 0);

    res.json({
      totalPlayers: players.length,
      totalRegistrations: registrations.length,
      activeEvents,
      completedEvents,
      totalGames: activeGames,
      totalPrizePool: prizeSum,
      totalParticipants: registrations.length
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve platform statistics.' });
  }
});

// ─── GAMES ROUTES ────────────────────────────────────────────────────────────

apiRouter.get('/games', async (req: Request, res: Response) => {
  try {
    const showAll = req.query.all === 'true';
    const games = await supabaseDb.list<any>('games');
    const filtered = showAll ? games : games.filter(g => g.active === true || g.active === 1 || g.active === 'true');
    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve games catalog.' });
  }
});

apiRouter.post('/games', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const parse = gameCreateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid game payload', details: parse.error.format() });
    }

    const { id, name, description, logo, banner, category, defaultPrizePool, format, active } = parse.data;
    const gameId = id || name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const game = {
      id: gameId,
      name,
      description,
      logo,
      banner,
      category,
      defaultPrizePool,
      format,
      active,
      createdAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/games/${gameId}`, game);
    createAuditLog((req as any).admin.username, 'ADMIN', 'CREATE_GAME', 'games', gameId, { newValue: game }, req.ip);
    res.status(201).json(game);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create game.' });
  }
});

apiRouter.patch('/games/:id', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await supabaseDb.get<any>(`blackhawk/games/${id}`);
    if (!existing) return res.status(404).json({ error: 'Game not found.' });

    const parse = gameUpdateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid update payload', details: parse.error.format() });
    }

    // Explicit field allowlist (no ...req.body spread!)
    const updated = {
      ...existing,
      ...(parse.data.name !== undefined ? { name: parse.data.name } : {}),
      ...(parse.data.description !== undefined ? { description: parse.data.description } : {}),
      ...(parse.data.logo !== undefined ? { logo: parse.data.logo } : {}),
      ...(parse.data.banner !== undefined ? { banner: parse.data.banner } : {}),
      ...(parse.data.category !== undefined ? { category: parse.data.category } : {}),
      ...(parse.data.defaultPrizePool !== undefined ? { defaultPrizePool: parse.data.defaultPrizePool } : {}),
      ...(parse.data.format !== undefined ? { format: parse.data.format } : {}),
      ...(parse.data.active !== undefined ? { active: parse.data.active } : {}),
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/games/${id}`, updated);
    createAuditLog((req as any).admin.username, 'ADMIN', 'UPDATE_GAME', 'games', id, { oldValue: existing, newValue: updated }, req.ip);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update game.' });
  }
});

apiRouter.delete('/games/:id', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await supabaseDb.delete(`blackhawk/games/${id}`);
    createAuditLog((req as any).admin.username, 'ADMIN', 'DELETE_GAME', 'games', id, undefined, req.ip);
    res.json({ success: true, message: `Game ${id} deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete game.' });
  }
});

// ─── EVENTS ROUTES ───────────────────────────────────────────────────────────

apiRouter.get('/events', async (req: Request, res: Response) => {
  try {
    const game = req.query.game as string | undefined;
    let events = await supabaseDb.list<any>('events');

    if (game) {
      const gLower = game.toLowerCase();
      events = events.filter(e =>
        (e.gameId && e.gameId.toLowerCase() === gLower) ||
        (e.gameName && e.gameName.toLowerCase().includes(gLower))
      );
    }

    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve events.' });
  }
});

apiRouter.post('/events', requireAdminAuth, requireRole('ADMIN', 'ORGANIZER'), async (req: Request, res: Response) => {
  try {
    const parse = eventCreateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid event data', details: parse.error.format() });
    }

    const eventId = 'ev-' + crypto.randomUUID();
    const event = {
      id: eventId,
      ...parse.data,
      gameName: parse.data.gameName || parse.data.gameId.toUpperCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/events/${eventId}`, event);
    createAuditLog((req as any).admin.username, (req as any).admin.role, 'CREATE_EVENT', 'events', eventId, { newValue: event }, req.ip);
    res.status(201).json(event);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create event.' });
  }
});

apiRouter.patch('/events/:id', requireAdminAuth, requireRole('ADMIN', 'ORGANIZER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await supabaseDb.get<any>(`blackhawk/events/${id}`);
    if (!existing) return res.status(404).json({ error: 'Event not found.' });

    const parse = eventUpdateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid update payload', details: parse.error.format() });
    }

    // Explicit field allowlist (no ...req.body spread)
    const updated = {
      ...existing,
      ...(parse.data.title !== undefined ? { title: parse.data.title } : {}),
      ...(parse.data.gameId !== undefined ? { gameId: parse.data.gameId } : {}),
      ...(parse.data.gameName !== undefined ? { gameName: parse.data.gameName } : {}),
      ...(parse.data.description !== undefined ? { description: parse.data.description } : {}),
      ...(parse.data.date !== undefined ? { date: parse.data.date } : {}),
      ...(parse.data.time !== undefined ? { time: parse.data.time } : {}),
      ...(parse.data.format !== undefined ? { format: parse.data.format } : {}),
      ...(parse.data.prizePool !== undefined ? { prizePool: parse.data.prizePool } : {}),
      ...(parse.data.maxParticipants !== undefined ? { maxParticipants: parse.data.maxParticipants } : {}),
      ...(parse.data.registrationStatus !== undefined ? { registrationStatus: parse.data.registrationStatus } : {}),
      ...(parse.data.eventStatus !== undefined ? { eventStatus: parse.data.eventStatus } : {}),
      ...(parse.data.rules !== undefined ? { rules: parse.data.rules } : {}),
      ...(parse.data.generalRules !== undefined ? { generalRules: parse.data.generalRules } : {}),
      ...(parse.data.banner !== undefined ? { banner: parse.data.banner } : {}),
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/events/${id}`, updated);
    createAuditLog((req as any).admin.username, (req as any).admin.role, 'UPDATE_EVENT', 'events', id, { oldValue: existing, newValue: updated }, req.ip);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update event.' });
  }
});

apiRouter.delete('/events/:id', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await supabaseDb.delete(`blackhawk/events/${id}`);
    createAuditLog((req as any).admin.username, 'ADMIN', 'DELETE_EVENT', 'events', id, undefined, req.ip);
    res.json({ success: true, message: `Event ${id} deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete event.' });
  }
});

// ─── DESTRUCTIVE DATABASE OPERATIONS (ADMIN ROLE ONLY) ───────────────────────

apiRouter.post('/admin/clean-database', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { cleanEvents = true, cleanRegistrations = true, cleanResults = true, cleanLeaderboard = true, confirm } = req.body || {};

    if (confirm !== 'CLEAN_ALL_DATABASE_CONFIRMED') {
      return res.status(400).json({ error: 'Explicit confirmation { confirm: "CLEAN_ALL_DATABASE_CONFIRMED" } required to clean database.' });
    }

    if (cleanEvents && supabaseDb.client) {
      await supabaseDb.client.from('events').delete().neq('id', 'preserved_placeholder');
    }
    if (cleanRegistrations && supabaseDb.client) {
      await supabaseDb.client.from('registrations').delete().neq('id', 'preserved_placeholder');
    }
    if (cleanResults && supabaseDb.client) {
      await supabaseDb.client.from('match_results').delete().neq('id', 'preserved_placeholder');
    }
    if (cleanLeaderboard && supabaseDb.client) {
      await supabaseDb.client.from('leaderboard').delete().neq('id', 'preserved_placeholder');
    }

    createAuditLog((req as any).admin.username, 'ADMIN', 'CLEAN_DATABASE', 'all_tables', '*', req.body, req.ip);
    res.json({ success: true, message: 'Database cleaned successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Database cleanup failed.' });
  }
});

// Admin-only diagnostics endpoint (replaces insecure public /health details)
apiRouter.get('/admin/diagnostics', requireAdminAuth, requireRole('ADMIN'), (_req: Request, res: Response) => {
  res.json({
    environment: process.env.NODE_ENV,
    memoryUsage: process.memoryUsage(),
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform,
    isSupabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  });
});

// ─── FREE FIRE PRIZE RULES & 1V1 CHALLENGE CALCULATOR ROUTES ─────────────────

apiRouter.get('/events/freefire/prize-rules', async (_req: Request, res: Response) => {
  try {
    const event = await supabaseDb.get<any>('blackhawk/events/ev-ff-1');
    const rules = event?.prizeRules || FREE_FIRE_PRIZE_CONFIG;
    res.json({
      eventId: 'ev-ff-1',
      gameName: 'Free Fire',
      prizePool: event?.prizePool || 700,
      rules
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve prize rules.' });
  }
});

apiRouter.post('/events/freefire/calculate-payouts', (req: Request, res: Response) => {
  try {
    const parse = payoutCalculateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid payout calculation request', details: parse.error.format() });
    }

    const calculation = calculateFreeFireEventPayouts(parse.data);
    res.json(calculation);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to calculate payouts.' });
  }
});

apiRouter.post('/events/freefire/save-payouts', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const calculation = req.body;
    if (!calculation || !calculation.itemizedPayouts || !Array.isArray(calculation.itemizedPayouts)) {
      return res.status(400).json({ error: 'Invalid payout calculation payload.' });
    }

    // Verify itemized calculations
    const verifiedTotal = calculation.itemizedPayouts.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    const payoutRecord = {
      id: 'payout-ev-ff-1',
      eventId: 'ev-ff-1',
      totalPayout: verifiedTotal,
      itemizedPayouts: calculation.itemizedPayouts,
      recordedBy: (req as any).admin.username,
      savedAt: new Date().toISOString()
    };

    await supabaseDb.set('blackhawk/payouts/ev-ff-1', payoutRecord);
    await supabaseDb.update('blackhawk/events/ev-ff-1', {
      eventStatus: 'COMPLETED',
      finalPayouts: payoutRecord,
      updatedAt: new Date().toISOString()
    });

    createAuditLog((req as any).admin.username, 'ADMIN', 'SAVE_PAYOUTS', 'payouts', 'ev-ff-1', { totalPayout: verifiedTotal }, req.ip);
    res.json({
      success: true,
      message: 'Free Fire prize payouts recorded successfully.',
      payoutRecord
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record payouts.' });
  }
});

apiRouter.get('/events/freefire/payouts', async (_req: Request, res: Response) => {
  try {
    const payout = await supabaseDb.get<any>('blackhawk/payouts/ev-ff-1');
    if (!payout) {
      return res.json({ recorded: false, message: 'No official payouts recorded yet for Free Fire.' });
    }
    res.json({ recorded: true, payout });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch payouts.' });
  }
});

// ─── PLAYERS ROUTES (PII PROTECTED) ──────────────────────────────────────────

apiRouter.get('/players', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const game = req.query.game as string | undefined;
    const status = req.query.status as string | undefined;

    let players = await supabaseDb.list<any>('players');

    const uniquePlayersMap = new Map<string, any>();
    for (const p of players) {
      const tag = (p.gamerTag || p.gamer_tag || '').trim().toLowerCase();
      if (!tag) continue;
      if (!uniquePlayersMap.has(tag)) {
        uniquePlayersMap.set(tag, p);
      }
    }
    players = Array.from(uniquePlayersMap.values());

    if (search) {
      const s = search.toLowerCase();
      players = players.filter(p =>
        (p.fullName && p.fullName.toLowerCase().includes(s)) ||
        (p.gamerTag && p.gamerTag.toLowerCase().includes(s)) ||
        (p.discordUsername && p.discordUsername.toLowerCase().includes(s))
      );
    }
    if (game && game !== 'ALL') {
      players = players.filter(p => p.game === game);
    }
    if (status && status !== 'ALL') {
      players = players.filter(p => p.status === status);
    }

    // DATA MINIMIZATION: Never expose email or phone in public API!
    const sanitized = players.map(p => ({
      id: p.id,
      fullName: p.fullName || p.full_name,
      gamerTag: p.gamerTag || p.gamer_tag,
      discordUsername: p.discordUsername || p.discord_username || 'N/A',
      game: p.game || 'ALL',
      team: p.team || '',
      status: p.status || 'ACTIVE',
      joinedAt: p.joinedAt || p.joined_at,
    }));

    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve players.' });
  }
});

apiRouter.post('/players', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { fullName, gamerTag, discordUsername, game, team, status } = req.body;
    if (!fullName || !gamerTag) {
      return res.status(400).json({ error: 'Full name and gamer tag are required.' });
    }

    const cleanTag = String(gamerTag).trim();
    const cleanName = String(fullName).trim();
    const cleanDiscord = (discordUsername || 'N/A').trim();

    const allPlayers = await supabaseDb.list<any>('players');
    let existingPlayer = allPlayers.find(p => (p.gamerTag || p.gamer_tag || '').trim().toLowerCase() === cleanTag.toLowerCase());

    const playerId = existingPlayer ? existingPlayer.id : `ply-${crypto.randomUUID()}`;
    const player = {
      id: playerId,
      fullName: cleanName,
      gamerTag: cleanTag,
      discordUsername: cleanDiscord,
      game: game || (existingPlayer ? existingPlayer.game : 'ALL'),
      team: team !== undefined ? team : (existingPlayer?.team || ''),
      status: status || (existingPlayer?.status || 'ACTIVE'),
      createdAt: existingPlayer?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/players/${playerId}`, player);
    createAuditLog((req as any).admin.username, 'ADMIN', existingPlayer ? 'UPDATE_PLAYER' : 'CREATE_PLAYER', 'players', playerId, { newValue: player }, req.ip);

    res.status(existingPlayer ? 200 : 201).json(player);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save player record.' });
  }
});

apiRouter.patch('/players/:id', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await supabaseDb.get<any>(`blackhawk/players/${id}`);
    if (!existing) return res.status(404).json({ error: 'Player not found.' });

    const parse = playerUpdateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid player update payload', details: parse.error.format() });
    }

    // Explicit field allowlist
    const updatedPlayer = {
      ...existing,
      ...(parse.data.fullName !== undefined ? { fullName: parse.data.fullName } : {}),
      ...(parse.data.gamerTag !== undefined ? { gamerTag: parse.data.gamerTag } : {}),
      ...(parse.data.discordUsername !== undefined ? { discordUsername: parse.data.discordUsername } : {}),
      ...(parse.data.game !== undefined ? { game: parse.data.game } : {}),
      ...(parse.data.team !== undefined ? { team: parse.data.team } : {}),
      ...(parse.data.status !== undefined ? { status: parse.data.status } : {}),
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/players/${id}`, updatedPlayer);
    createAuditLog((req as any).admin.username, 'ADMIN', 'UPDATE_PLAYER', 'players', id, { oldValue: existing, newValue: updatedPlayer }, req.ip);
    res.json(updatedPlayer);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update player.' });
  }
});

apiRouter.delete('/players/:id', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await supabaseDb.delete(`blackhawk/players/${id}`);
    await supabaseDb.delete(`blackhawk/leaderboard/${id}`);
    createAuditLog((req as any).admin.username, 'ADMIN', 'DELETE_PLAYER', 'players', id, undefined, req.ip);
    res.json({ success: true, message: `Player ${id} deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete player.' });
  }
});

// ─── LEADERBOARD & RANKINGS ──────────────────────────────────────────────────

apiRouter.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const game = req.query.game as string | undefined;
    const [lbEntries, allPlayers] = await Promise.all([
      supabaseDb.list<any>('leaderboard'),
      supabaseDb.list<any>('players')
    ]);

    const map = new Map<string, any>();

    // 1. Add existing leaderboard entries
    for (const lb of lbEntries) {
      if (lb.status && lb.status !== 'ACTIVE') continue;
      const cleanTag = (lb.gamerTag || lb.gamer_tag || '').trim().toLowerCase();
      if (!cleanTag) continue;

      const existing = map.get(cleanTag);
      const points = Number(lb.points) || 0;
      const wins = Number(lb.wins) || 0;
      const matches = Number(lb.matches) || 0;
      const score = Number(lb.score) || 0;
      const lbGame = lb.game || 'ALL';
      const avatar = lb.avatar || getDiscordAvatar(lb.discordUsername || lb.discord_username, lb.gamerTag || lb.gamer_tag);

      if (!existing) {
        map.set(cleanTag, {
          id: lb.id || `lb_${cleanTag}`,
          playerId: lb.playerId || lb.player_id || `ply_${cleanTag}`,
          playerName: lb.playerName || lb.player_name || lb.gamerTag || lb.gamer_tag,
          gamerTag: lb.gamerTag || lb.gamer_tag,
          discordUsername: lb.discordUsername || lb.discord_username || 'N/A',
          game: lbGame,
          gamesSet: new Set([lbGame.toUpperCase()]),
          avatar,
          points,
          wins,
          matches,
          score,
          status: lb.status || 'ACTIVE'
        });
      } else {
        existing.points = Math.max(existing.points, points);
        existing.wins = Math.max(existing.wins, wins);
        existing.matches = Math.max(existing.matches, matches);
        existing.score = Math.max(existing.score, score);
        if (lbGame) existing.gamesSet.add(lbGame.toUpperCase());
      }
    }

    // 2. Merge registered players
    for (const p of allPlayers) {
      if (p.status && p.status !== 'ACTIVE') continue;
      const cleanTag = (p.gamerTag || p.gamer_tag || '').trim().toLowerCase();
      if (!cleanTag) continue;
      const pGame = p.game || 'ALL';

      if (!map.has(cleanTag)) {
        map.set(cleanTag, {
          id: 'lb-' + p.id,
          playerId: p.id,
          playerName: p.fullName || p.full_name || p.gamerTag || p.gamer_tag,
          gamerTag: p.gamerTag || p.gamer_tag,
          discordUsername: p.discordUsername || p.discord_username || 'N/A',
          game: pGame,
          gamesSet: new Set([pGame.toUpperCase()]),
          avatar: getDiscordAvatar(p.discordUsername, p.gamerTag),
          points: Number(p.points) || 0,
          wins: Number(p.wins) || 0,
          matches: Number(p.matches) || 0,
          score: Number(p.score) || 0,
          status: 'ACTIVE'
        });
      }
    }

    let entries = Array.from(map.values());

    if (game && game !== 'ALL') {
      const gUpper = game.toUpperCase();
      entries = entries.filter(l =>
        l.gamesSet.has(gUpper) ||
        l.gamesSet.has('ALL') ||
        (l.game || '').toUpperCase() === gUpper
      );
    }

    const formattedEntries = entries.map(e => {
      const { gamesSet, ...rest } = e;
      return rest;
    });

    // Dynamic Deterministic Rank Sort: points DESC -> wins DESC -> score DESC
    formattedEntries.sort((a, b) => {
      if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
      if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
      return (a.gamerTag || '').localeCompare(b.gamerTag || '');
    });

    const ranked = formattedEntries.map((r, index) => {
      const totalPoints = Number(r.points) || 0;
      const wins = Number(r.wins) || 0;
      const matches = Number(r.matches) || 0;
      const kills = Number(r.score) || 0;

      const placementPoints = Math.max(0, wins * 10);
      const killPoints = kills;
      const participationPoints = Math.max(0, matches > wins ? (matches - wins) : 0);
      const challengeBonus = Math.max(0, totalPoints - placementPoints - killPoints - participationPoints);

      return {
        id: r.id,
        playerId: r.playerId,
        playerName: r.playerName,
        gamerTag: r.gamerTag,
        discordUsername: r.discordUsername,
        game: r.game,
        avatar: r.avatar,
        points: totalPoints,
        wins,
        matches,
        score: kills,
        placementPoints,
        killPoints,
        participationPoints,
        challengeBonus,
        totalPoints,
        rank: index + 1,
        crown: index === 0,
      };
    });

    res.json(ranked);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve leaderboard.' });
  }
});

apiRouter.post('/leaderboard', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { playerName, gamerTag, game, points = 0, wins = 0, matches = 0, score = 0, status = 'ACTIVE' } = req.body;
    if (!playerName || !gamerTag) {
      return res.status(400).json({ error: 'Player Name and Gamer Tag are required.' });
    }

    const cleanTag = String(gamerTag).trim();
    const cleanName = String(playerName).trim();
    const lbId = `lb-${cleanTag.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const entry = {
      id: lbId,
      playerId: req.body.playerId || `ply-${crypto.randomUUID()}`,
      playerName: cleanName,
      gamerTag: cleanTag,
      discordUsername: req.body.discordUsername || 'N/A',
      game: game || 'ALL',
      points: Math.max(0, Number(points) || 0),
      wins: Math.max(0, Number(wins) || 0),
      matches: Math.max(0, Number(matches) || 0),
      score: Math.max(0, Number(score) || 0),
      avatar: getDiscordAvatar(req.body.discordUsername, cleanTag),
      status: status || 'ACTIVE',
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/leaderboard/${lbId}`, entry);
    createAuditLog((req as any).admin.username, 'ADMIN', 'CREATE_LEADERBOARD', 'leaderboard', lbId, { newValue: entry }, req.ip);
    res.status(201).json(entry);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create leaderboard entry.' });
  }
});

apiRouter.patch('/leaderboard/:id', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await supabaseDb.get<any>(`blackhawk/leaderboard/${id}`);
    if (!existing) return res.status(404).json({ error: 'Leaderboard entry not found.' });

    const parse = leaderboardUpdateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid update payload', details: parse.error.format() });
    }

    const updated = {
      ...existing,
      ...(parse.data.playerName !== undefined ? { playerName: parse.data.playerName } : {}),
      ...(parse.data.gamerTag !== undefined ? { gamerTag: parse.data.gamerTag } : {}),
      ...(parse.data.game !== undefined ? { game: parse.data.game } : {}),
      ...(parse.data.points !== undefined ? { points: parse.data.points } : {}),
      ...(parse.data.wins !== undefined ? { wins: parse.data.wins } : {}),
      ...(parse.data.matches !== undefined ? { matches: parse.data.matches } : {}),
      ...(parse.data.score !== undefined ? { score: parse.data.score } : {}),
      ...(parse.data.status !== undefined ? { status: parse.data.status } : {}),
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/leaderboard/${id}`, updated);
    createAuditLog((req as any).admin.username, 'ADMIN', 'UPDATE_LEADERBOARD', 'leaderboard', id, { oldValue: existing, newValue: updated }, req.ip);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update leaderboard entry.' });
  }
});

apiRouter.delete('/leaderboard/:id', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await supabaseDb.delete(`blackhawk/leaderboard/${id}`);
    createAuditLog((req as any).admin.username, 'ADMIN', 'DELETE_LEADERBOARD', 'leaderboard', id, undefined, req.ip);
    res.json({ success: true, message: `Leaderboard entry ${id} deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete leaderboard entry.' });
  }
});

apiRouter.post('/leaderboard/:id/reset', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await supabaseDb.get<any>(`blackhawk/leaderboard/${id}`);
    if (!existing) return res.status(404).json({ error: 'Leaderboard entry not found.' });

    const updated = {
      ...existing,
      points: 0,
      score: 0,
      wins: 0,
      matches: 0,
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/leaderboard/${id}`, updated);
    createAuditLog((req as any).admin.username, 'ADMIN', 'RESET_LEADERBOARD', 'leaderboard', id, undefined, req.ip);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset leaderboard entry.' });
  }
});

// Record authoritative match scores (ADMIN only)
async function recordMatchHandler(req: Request, res: Response) {
  try {
    const parse = matchRecordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid match scoring payload', details: parse.error.format() });
    }

    const {
      playerId, playerName, gamerTag, game, eventId, eventName,
      points, kills, placement, isWin, breakdown, notes
    } = parse.data;

    const targetGame = game.toUpperCase();
    const cleanGamerTag = gamerTag;
    const cleanPlayerName = playerName || gamerTag;
    const winIncrement = isWin || placement === 1 ? 1 : 0;

    const allLeaderboard = await supabaseDb.list<any>('leaderboard');
    let entry = allLeaderboard.find(l =>
      (playerId && (l.playerId === playerId || l.id === playerId)) ||
      ((l.gamerTag || l.gamer_tag) && (l.gamerTag || l.gamer_tag).trim().toLowerCase() === cleanGamerTag.toLowerCase())
    );

    const key = entry ? (entry.id || entry.playerId) : `lb-${cleanGamerTag.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    let updatedEntry: any;
    if (entry) {
      updatedEntry = {
        ...entry,
        points: (Number(entry.points) || 0) + points,
        wins: (Number(entry.wins) || 0) + winIncrement,
        matches: (Number(entry.matches) || 0) + 1,
        score: (Number(entry.score) || 0) + kills,
        status: 'ACTIVE',
        updatedAt: new Date().toISOString()
      };
    } else {
      updatedEntry = {
        id: key,
        playerId: playerId || `ply-${crypto.randomUUID()}`,
        playerName: cleanPlayerName,
        gamerTag: cleanGamerTag,
        game: targetGame,
        avatar: getDiscordAvatar('', cleanGamerTag),
        points,
        wins: winIncrement,
        matches: 1,
        score: kills,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    await supabaseDb.set(`blackhawk/leaderboard/${key}`, updatedEntry);

    const matchLogId = `match_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const matchLog = {
      id: matchLogId,
      playerId: updatedEntry.playerId,
      playerName: cleanPlayerName,
      gamerTag: cleanGamerTag,
      game: targetGame,
      eventId: eventId || null,
      eventName: eventName || null,
      placement,
      kills,
      points,
      isWin: winIncrement === 1,
      breakdown,
      notes,
      recordedBy: (req as any).admin.username,
      recordedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/match_scores/${matchLogId}`, matchLog);
    createAuditLog((req as any).admin.username, 'ADMIN', 'RECORD_MATCH_SCORE', 'match_results', matchLogId, matchLog, req.ip);

    res.json({
      success: true,
      message: `Successfully calculated and credited ${points} points to ${cleanGamerTag}!`,
      leaderboardEntry: updatedEntry,
      matchLog
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record match scores.' });
  }
}

apiRouter.post('/leaderboard/record-match', requireAdminAuth, requireRole('ADMIN'), recordMatchHandler);
apiRouter.post('/match-results', requireAdminAuth, requireRole('ADMIN'), recordMatchHandler);

// ─── REGISTRATIONS ROUTES (DATA INTEGRITY HARDENED) ──────────────────────────

apiRouter.get('/registrations', requireAdminAuth, requireRole('ADMIN', 'ORGANIZER', 'VIEWER'), async (req: Request, res: Response) => {
  try {
    const game = req.query.game as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    let list = await supabaseDb.list<any>('registrations');

    if (game && game !== 'ALL') {
      const gLower = game.toLowerCase();
      list = list.filter(r => (r.gameId && r.gameId.toLowerCase() === gLower) || (r.gameName && r.gameName.toLowerCase() === gLower));
    }
    if (status && status !== 'ALL') {
      list = list.filter(r => r.status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(r =>
        (r.playerName && r.playerName.toLowerCase().includes(s)) ||
        (r.gamerTag && r.gamerTag.toLowerCase().includes(s)) ||
        (r.discordUsername && r.discordUsername.toLowerCase().includes(s)) ||
        (r.id && r.id.toLowerCase().includes(s))
      );
    }

    list.sort((a, b) => new Date(b.registeredAt || 0).getTime() - new Date(a.registeredAt || 0).getTime());
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve registrations.' });
  }
});

apiRouter.post('/registrations', registrationRateLimiter, async (req: Request, res: Response) => {
  try {
    const parse = registrationInputSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        error: 'Invalid registration details.',
        details: parse.error.format()
      });
    }

    const { fullName, gamerTag, discordUsername, email, phone, games } = parse.data;
    const cleanTag = gamerTag;
    const cleanName = fullName;
    const cleanDiscord = discordUsername || 'N/A';
    const cleanEmail = email || '';
    const cleanPhone = phone || '';

    // Check duplicate registrations: one active registration per player per game
    const existingRegistrations = await supabaseDb.list<any>('registrations');
    const duplicateGames: string[] = [];

    for (const g of games) {
      const gameId = g.gameId.toLowerCase();
      const isDup = existingRegistrations.some(r =>
        (r.gamerTag || r.gamer_tag)?.trim().toLowerCase() === cleanTag.toLowerCase() &&
        (r.gameId || r.game_id)?.trim().toLowerCase() === gameId &&
        r.status !== 'REJECTED'
      );
      if (isDup) {
        duplicateGames.push(g.gameName || gameId);
      }
    }

    if (duplicateGames.length > 0) {
      return res.status(409).json({
        error: `You are already registered for: ${duplicateGames.join(', ')}. Duplicate active registrations are not permitted.`,
        duplicateGames
      });
    }

    // DATA INTEGRITY: Look up player by gamerTag.
    // If found, NEVER overwrite their existing email, phone, or discord identity from an unauthenticated request!
    const allPlayers = await supabaseDb.list<any>('players');
    let player = allPlayers.find(p => (p.gamerTag || p.gamer_tag || '').trim().toLowerCase() === cleanTag.toLowerCase());

    if (!player) {
      // First time player: create new record with cryptographically secure ID
      const playerId = `ply-${crypto.randomUUID()}`;
      player = {
        id: playerId,
        fullName: cleanName,
        gamerTag: cleanTag,
        discordUsername: cleanDiscord,
        email: cleanEmail,
        phone: cleanPhone,
        game: games[0].gameName || 'FREE FIRE',
        status: 'ACTIVE',
        joinedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const discordPfp = getDiscordAvatar(cleanDiscord, cleanTag);
      const leaderboardEntry = {
        id: `lb-${playerId}`,
        playerId,
        playerName: cleanName,
        gamerTag: cleanTag,
        discordUsername: cleanDiscord,
        game: games[0].gameName || 'FREE FIRE',
        avatar: discordPfp,
        matches: 0,
        wins: 0,
        score: 0,
        points: 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await supabaseDb.set(`blackhawk/players/${playerId}`, player);
      await supabaseDb.set(`blackhawk/leaderboard/${playerId}`, leaderboardEntry);
    } else {
      // Existing player found: DO NOT OVERWRITE private fields (email, phone, discord identity)
      // Existing player remains intact; registration links to existing player ID
    }

    // Create Registration records with cryptographically strong collision-resistant ID
    const createdRegistrations: any[] = [];
    for (const g of games) {
      const regId = 'BHL-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      const regRecord = {
        id: regId,
        playerId: player.id,
        playerName: cleanName,
        gamerTag: cleanTag,
        discordUsername: cleanDiscord,
        email: cleanEmail,
        phone: cleanPhone,
        gameId: g.gameId.toLowerCase(),
        gameName: g.gameName || 'FREE FIRE',
        eventId: g.eventId || null,
        eventTitle: g.eventTitle || null,
        playType: g.playType,
        teamName: g.teamName || null,
        teamMembers: g.teamMembers || null,
        gameSpecificDetails: g.gameSpecificDetails || g.gameSpecificData || {},
        status: 'REGISTERED',
        registeredAt: new Date().toISOString()
      };

      await supabaseDb.set(`blackhawk/registrations/${regId}`, regRecord);
      createdRegistrations.push(regRecord);
    }

    // Return sanitized response (do not expose sensitive internal attributes)
    res.status(201).json({
      success: true,
      player: {
        id: player.id,
        gamerTag: player.gamerTag,
        fullName: player.fullName,
      },
      registrations: createdRegistrations.map(r => ({
        id: r.id,
        gamerTag: r.gamerTag,
        gameName: r.gameName,
        status: r.status,
        registeredAt: r.registeredAt
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Registration processing failed.' });
  }
});

apiRouter.patch('/registrations/:id', requireAdminAuth, requireRole('ADMIN', 'ORGANIZER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await supabaseDb.get<any>(`blackhawk/registrations/${id}`);
    if (!existing) return res.status(404).json({ error: 'Registration not found.' });

    const parse = registrationUpdateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid registration update payload', details: parse.error.format() });
    }

    // Explicit allowlist (no ...req.body spread)
    const updated = {
      ...existing,
      ...(parse.data.status !== undefined ? { status: parse.data.status } : {}),
      ...(parse.data.playType !== undefined ? { playType: parse.data.playType } : {}),
      ...(parse.data.teamName !== undefined ? { teamName: parse.data.teamName } : {}),
      ...(parse.data.teamMembers !== undefined ? { teamMembers: parse.data.teamMembers } : {}),
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/registrations/${id}`, updated);
    createAuditLog((req as any).admin.username, (req as any).admin.role, 'UPDATE_REGISTRATION', 'registrations', id, { oldValue: existing, newValue: updated }, req.ip);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update registration.' });
  }
});

apiRouter.delete('/registrations/:id', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await supabaseDb.delete(`blackhawk/registrations/${id}`);
    createAuditLog((req as any).admin.username, 'ADMIN', 'DELETE_REGISTRATION', 'registrations', id, undefined, req.ip);
    res.json({ success: true, message: `Registration ${id} deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete registration.' });
  }
});

// ─── DATABASE SYNC & EXPLORER ROUTES ─────────────────────────────────────────

apiRouter.post('/database/sync', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const result = await syncPlayersAndRegistrations();
    createAuditLog((req as any).admin.username, 'ADMIN', 'SYNC_DATABASE', 'all', '*', undefined, req.ip);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Database synchronization failed.' });
  }
});

apiRouter.post('/registrations/sync', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const result = await syncPlayersAndRegistrations();
    createAuditLog((req as any).admin.username, 'ADMIN', 'SYNC_REGISTRATIONS', 'registrations', '*', undefined, req.ip);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Registrations synchronization failed.' });
  }
});

apiRouter.get('/database/:table', requireAdminAuth, requireRole('ADMIN', 'ORGANIZER', 'VIEWER'), async (req: Request, res: Response) => {
  try {
    const table = String(req.params.table);
    const allowedTables = ['players', 'games', 'events', 'registrations', 'leaderboard', 'admins', 'audit_logs', 'payouts'];
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Invalid collection requested.' });
    }

    // Role check: Only ADMIN can inspect audit logs or payouts
    if ((table === 'audit_logs' || table === 'payouts') && (req as any).admin.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only ADMIN can inspect audit logs or payouts.' });
    }

    let rows = await supabaseDb.list<any>(table);
    // Never return password hashes under any circumstance!
    if (table === 'admins') {
      rows = rows.map(a => ({
        id: a.id,
        username: a.username,
        displayName: a.displayName,
        role: a.role,
        createdAt: a.createdAt
      }));
    }

    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to inspect collection.' });
  }
});

apiRouter.delete('/database/:table/:id', requireAdminAuth, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const table = String(req.params.table);
    const id = String(req.params.id);
    const allowedTables = ['players', 'games', 'events', 'registrations', 'leaderboard'];
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Forbidden or invalid table for deletion.' });
    }

    await supabaseDb.delete(`blackhawk/${table}/${id}`);
    createAuditLog((req as any).admin.username, 'ADMIN', 'DELETE_RECORD', table, id, undefined, req.ip);
    res.json({ success: true, message: `Record ${id} removed from ${table}.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});
