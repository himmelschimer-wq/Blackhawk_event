import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabaseDb, initSupabaseDatabase, syncPlayersAndRegistrations } from './supabaseDb.js';
import { FREE_FIRE_PRIZE_CONFIG, calculateFreeFireEventPayouts } from './freeFirePrizeEngine.js';

// Initialize Pure Supabase Database
initSupabaseDatabase();

export const apiRouter = express.Router();
apiRouter.use(express.json());

// ─── DISCORD AVATAR & USER ID HELPERS ───────────────────────────────────────
const discordAvatarCache = new Map<string, string>();

/**
 * Extract Discord User ID (snowflake 17-21 digits) from registration details or username
 */
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

/**
 * Extract Free Fire UID / Game UID from registration details
 */
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

/**
 * Extract In-Game Name from registration details
 */
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

/**
 * Resolve Discord Avatar URL using Discord User ID (with JAPI & Discord CDN fallback)
 */
export async function resolveDiscordAvatar(userId?: string | null, discordUsername?: string, gamerTag?: string): Promise<string> {
  const cleanId = (userId || '').trim();
  const cleanUser = (discordUsername || gamerTag || 'player').trim().replace(/^@/, '');

  if (/^\d{16,21}$/.test(cleanId)) {
    if (discordAvatarCache.has(cleanId)) {
      return discordAvatarCache.get(cleanId)!;
    }
    try {
      const res = await fetch(`https://japi.rest/discord/v1/user/${cleanId}`, {
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const json = (await res.json()) as any;
        const data = json?.data;
        if (data?.avatarURL) {
          discordAvatarCache.set(cleanId, data.avatarURL);
          return data.avatarURL;
        }
        if (data?.defaultAvatarURL) {
          discordAvatarCache.set(cleanId, data.defaultAvatarURL);
          return data.defaultAvatarURL;
        }
      }
    } catch {}

    // Discord CDN official snowflake calculation fallback
    try {
      const idx = Number((BigInt(cleanId) >> 22n) % 6n);
      const url = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
      discordAvatarCache.set(cleanId, url);
      return url;
    } catch {}
  }

  if (cleanUser && !cleanUser.includes(' ') && cleanUser.toLowerCase() !== 'n/a') {
    return `https://unavatar.io/discord/${encodeURIComponent(cleanUser)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(cleanUser)}%26backgroundColor%3D09090b%2C18181b`;
  }

  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(gamerTag || 'Player')}&backgroundColor=09090b,18181b`;
}

/**
 * Synchronous instant Discord avatar getter
 */
export function getDiscordAvatar(discordUsername?: string, gamerTag?: string, userId?: string | null): string {
  const cleanId = (userId || '').trim();
  if (/^\d{16,21}$/.test(cleanId)) {
    if (discordAvatarCache.has(cleanId)) {
      return discordAvatarCache.get(cleanId)!;
    }
    // Calculate Discord default avatar immediately
    try {
      const idx = Number((BigInt(cleanId) >> 22n) % 6n);
      const defaultUrl = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
      // Schedule background upgrade if custom avatar exists
      resolveDiscordAvatar(cleanId, discordUsername, gamerTag).catch(() => {});
      return defaultUrl;
    } catch {}
  }

  const clean = (discordUsername || gamerTag || 'player').trim().replace(/^@/, '');
  if (!clean || clean.toLowerCase() === 'n/a') {
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(gamerTag || 'player')}&backgroundColor=09090b,18181b`;
  }
  return `https://unavatar.io/discord/${encodeURIComponent(clean)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(clean)}%26backgroundColor%3D09090b%2C18181b`;
}

// ─── AUTHENTICATION HELPERS & MIDDLEWARE (PURE FIREBASE) ──────────────────────

function getSessionToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.cookies && req.cookies.admin_session) {
    return req.cookies.admin_session;
  }
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

  // Local-only dev session support
  if (token.startsWith('local_dev_')) {
    if (req && !isLocalRequest(req)) {
      return null;
    }
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
    }
  } catch {}

  return null;
}

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = getSessionToken(req);
  const session = await verifyAdminSession(token, req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized. Admin authentication required.' });
    return;
  }
  (req as any).admin = session;
  next();
}

// ─── AUTH ROUTES (STORED IN FIREBASE / SUPABASE) ──────────────────────────────

apiRouter.post('/auth/local-dev-login', async (req: Request, res: Response) => {
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

  res.json({
    token,
    admin: {
      id: session.adminId,
      username: session.username,
      displayName: session.displayName,
      role: session.role
    }
  });
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const cleanUser = String(username).trim().toLowerCase();
  const rawPass = String(password).trim();
  const envAdminUser = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
  const envAdminPass = (process.env.ADMIN_PASSWORD || '').trim();

  let admin: any = null;
  let isValid = false;

  // 1. Check Supabase DB
  try {
    const admins = await supabaseDb.list<any>('admins');
    admin = admins.find(a => a.username?.toLowerCase() === cleanUser);
    if (admin && admin.passwordHash) {
      isValid = bcrypt.compareSync(rawPass, admin.passwordHash);
    }
  } catch {}

  // 2. Env Match Fallback (only if explicitly set in environment)
  if (!isValid && envAdminUser && envAdminPass && cleanUser === envAdminUser && rawPass === envAdminPass) {
    isValid = true;
    if (!admin) {
      admin = {
        id: `adm-${cleanUser}`,
        username: cleanUser,
        displayName: 'BlackHawk Administrator',
        role: 'ADMIN'
      };
      // Attempt auto-seed into Supabase
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(rawPass, salt);
      supabaseDb.set(`blackhawk/admins/${admin.id}`, {
        ...admin,
        passwordHash,
        createdAt: new Date().toISOString()
      }).catch(() => {});
    }
  }

  if (!isValid || !admin) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  // Create session (valid for 7 days)
  const token = crypto.randomUUID() + '-' + crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  await supabaseDb.set(`blackhawk/sessions/${token}`, {
    token,
    adminId: admin.id,
    expiresAt,
    createdAt: new Date().toISOString()
  }).catch(() => {});

  res.json({
    token,
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

// ─── DISCORD OAUTH2 & SERVER MEMBERSHIP ROUTES ──────────────────────────────

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || '';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:5173/discord-callback';

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

apiRouter.get('/auth/discord/url', (req: Request, res: Response) => {
  if (!DISCORD_CLIENT_ID) {
    return res.json({
      configured: false,
      url: `/discord-callback?demo=true`,
      message: 'Discord Client ID not set in environment. Running in instant-sandbox mode.'
    });
  }

  const redirectUri = (req.query.redirectUri as string) || DISCORD_REDIRECT_URI;
  const state = crypto.randomBytes(16).toString('hex');
  const scope = encodeURIComponent('identify guilds guilds.members.read');
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;

  res.json({
    configured: true,
    url,
    state
  });
});

apiRouter.post('/auth/discord/callback', async (req: Request, res: Response) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'OAuth2 authorization code is required.' });
    }

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || code === 'DEMO_CODE' || code.startsWith('demo-')) {
      const demoId = '9' + Math.floor(10000000000000000 + Math.random() * 90000000000000000);
      const demoUser = {
        id: demoId,
        username: 'blackhawk_warrior',
        global_name: 'BlackHawk Warrior',
        discriminator: '0',
        avatar: null,
        avatarUrl: `https://unavatar.io/discord/blackhawk_warrior?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3Dblackhawk_warrior%26backgroundColor%3D09090b`,
        inServer: true,
        verified: true,
        isDemo: true
      };
      return res.json({
        success: true,
        user: demoUser
      });
    }

    const rUri = redirectUri || DISCORD_REDIRECT_URI;
    const tokenParams = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: String(code),
      redirect_uri: rUri,
    });

    const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return res.status(400).json({ error: 'Failed to exchange token with Discord.', details: errText });
    }

    const tokenData = (await tokenRes.json()) as any;
    const accessToken = tokenData.access_token;

    const userRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userRes.ok) {
      return res.status(400).json({ error: 'Failed to fetch Discord user profile.' });
    }

    const discordUser = (await userRes.json()) as any;

    let inServer = false;
    let memberData: any = null;

    if (DISCORD_GUILD_ID) {
      try {
        const memberRes = await fetch(`https://discord.com/api/v10/users/@me/guilds/${DISCORD_GUILD_ID}/member`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (memberRes.ok) {
          inServer = true;
          memberData = await memberRes.json();
        }
      } catch {
        if (DISCORD_BOT_TOKEN) {
          try {
            const botMemberRes = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUser.id}`, {
              headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
            });
            if (botMemberRes.ok) {
              inServer = true;
              memberData = await botMemberRes.json();
            }
          } catch { }
        }
      }
    } else {
      inServer = true;
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
    res.status(500).json({ error: err.message || 'Internal Discord OAuth error' });
  }
});

// ─── SYSTEM STATISTICS ROUTE (FROM FIREBASE) ─────────────────────────────────

apiRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const players = await supabaseDb.list('players');
    const registrations = await supabaseDb.list('registrations');
    const events = await supabaseDb.list<any>('events');
    const games = await supabaseDb.list<any>('games');

    const activeEvents = events.filter(e => ['UPCOMING', 'LIVE', 'REGISTRATION OPEN'].includes(e.eventStatus)).length;
    const completedEvents = events.filter(e => e.eventStatus === 'COMPLETED').length;
    const activeGames = games.filter(g => g.active === 1 || g.active === true).length;
    const prizeSum = events.filter(e => e.eventStatus !== 'CANCELLED').reduce((acc, e) => acc + (Number(e.prizePool) || 0), 0);

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
    res.status(500).json({ error: err.message });
  }
});

// ─── GAMES ROUTES (STORED IN FIREBASE) ─────────────────────────────────────────

apiRouter.get('/games', async (req: Request, res: Response) => {
  try {
    const showAll = req.query.all === 'true';
    const games = await supabaseDb.list<any>('games');
    const filtered = showAll ? games : games.filter(g => g.active === true || g.active === 1 || g.active === 'true');
    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/games', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id, name, description, logo, banner, category, defaultPrizePool, format, active } = req.body;
    if (!name) return res.status(400).json({ error: 'Game name is required.' });

    const gameId = id || name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const isBoolActive = active === undefined ? true : Boolean(active === true || active === 1 || active === 'true');
    const game = {
      id: gameId,
      name,
      description: description || '',
      logo: logo || '/assets/badge_bgmi.png',
      banner: banner || '/assets/official_game_bgmi.png',
      category: category || 'ESPORTS',
      defaultPrizePool: defaultPrizePool || 0,
      format: format || 'SOLO',
      active: isBoolActive,
      createdAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/games/${gameId}`, game);
    res.status(201).json(game);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/games/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await supabaseDb.get<any>(`blackhawk/games/${id}`);
    if (!existing) return res.status(404).json({ error: 'Game not found.' });

    const isBoolActive = req.body.active !== undefined
      ? Boolean(req.body.active === true || req.body.active === 1 || req.body.active === 'true')
      : Boolean(existing.active === true || existing.active === 1 || existing.active === 'true');

    const updated = {
      ...existing,
      ...req.body,
      active: isBoolActive,
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/games/${id}`, updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/games/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await supabaseDb.delete(`blackhawk/games/${id}`);
    res.json({ success: true, message: `Game ${id} deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── EVENTS ROUTES (STORED IN FIREBASE) ────────────────────────────────────────

apiRouter.get('/events', async (req: Request, res: Response) => {
  try {
    const game = req.query.game as string | undefined;
    let events = await supabaseDb.list<any>('events');

    if (game) {
      const gLower = game.toLowerCase();
      events = events.filter(e => (e.gameId && e.gameId.toLowerCase() === gLower) || (e.gameName && e.gameName.toLowerCase().includes(gLower)));
    }

    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/events', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const {
      title, gameId, gameName, description, date, time, format,
      prizePool, maxParticipants, registrationStatus, eventStatus, rules, generalRules, banner
    } = req.body;

    if (!title || !gameId) {
      return res.status(400).json({ error: 'Event title and game are required.' });
    }

    const eventId = 'ev-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const event = {
      id: eventId,
      gameId,
      gameName: gameName || gameId.toUpperCase(),
      title,
      description: description || '',
      date: date || 'TBA',
      time: time || 'TBA',
      format: format || 'Solo',
      prizePool: prizePool || 0,
      maxParticipants: maxParticipants || 100,
      registrationStatus: registrationStatus || 'OPEN',
      eventStatus: eventStatus || 'REGISTRATION OPEN',
      rules: rules || 'Standard tournament rules apply.',
      generalRules: generalRules || req.body.general_rules || '',
      banner: banner || '/assets/official_game_bgmi.png',
      createdAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/events/${eventId}`, event);
    res.status(201).json(event);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/events/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await supabaseDb.get<any>(`blackhawk/events/${id}`);
    if (!existing) return res.status(404).json({ error: 'Event not found.' });

    const updated = {
      ...existing,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/events/${id}`, updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/events/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await supabaseDb.delete(`blackhawk/events/${id}`);
    res.json({ success: true, message: `Event ${id} deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Clean Database endpoint for events and test data
apiRouter.post('/admin/clean-database', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { cleanEvents = true, cleanRegistrations = true, cleanResults = true, cleanLeaderboard = true } = req.body || {};

    if (cleanEvents) {
      if (supabaseDb.client) {
        await supabaseDb.client.from('events').delete().neq('id', 'dummy_preserved_id');
      }
    }
    if (cleanRegistrations) {
      if (supabaseDb.client) {
        await supabaseDb.client.from('registrations').delete().neq('id', 'dummy_preserved_id');
      }
    }
    if (cleanResults) {
      if (supabaseDb.client) {
        await supabaseDb.client.from('match_results').delete().neq('id', 'dummy_preserved_id');
      }
    }
    if (cleanLeaderboard) {
      if (supabaseDb.client) {
        await supabaseDb.client.from('leaderboard').delete().neq('id', 'dummy_preserved_id');
      }
    }

    res.json({ success: true, message: 'Database cleaned successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/events/freefire/calculate-payouts', (req: Request, res: Response) => {
  try {
    const {
      winnerTeamName,
      winnerPlayerId,
      challengerTeamName,
      challengerPlayerId,
      challenge1v1Outcome,
      randomDrawWinnerName,
      randomDrawPlayerId,
      bestPerformanceWinnerName,
      bestPerformancePlayerId,
      highestElimWinnerName,
      highestElimPlayerId,
      notes
    } = req.body;

    if (!winnerTeamName) {
      return res.status(400).json({ error: 'Event winner team/player name is required.' });
    }

    const calculation = calculateFreeFireEventPayouts({
      winnerTeamName,
      winnerPlayerId,
      challengerTeamName,
      challengerPlayerId,
      challenge1v1Outcome: challenge1v1Outcome || 'NO_CHALLENGE',
      randomDrawWinnerName: randomDrawWinnerName || '',
      randomDrawPlayerId,
      bestPerformanceWinnerName: bestPerformanceWinnerName || '',
      bestPerformancePlayerId,
      highestElimWinnerName: highestElimWinnerName || '',
      highestElimPlayerId,
      notes
    });

    res.json(calculation);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/events/freefire/save-payouts', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const calculation = req.body;
    if (!calculation || !calculation.itemizedPayouts) {
      return res.status(400).json({ error: 'Invalid payout calculation payload.' });
    }

    const payoutRecord = {
      ...calculation,
      recordedBy: (req as any).admin?.username || 'admin',
      savedAt: new Date().toISOString()
    };

    await supabaseDb.set('blackhawk/payouts/ev-ff-1', payoutRecord);

    // Also update event status to COMPLETED or RESULTS_PUBLISHED
    await supabaseDb.update('blackhawk/events/ev-ff-1', {
      eventStatus: 'COMPLETED',
      finalPayouts: payoutRecord,
      updatedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Free Fire prize payouts and 1v1 challenge results recorded successfully.',
      payoutRecord
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

// ─── PLAYERS ROUTES (STORED IN FIREBASE / SUPABASE) ──────────────────────────

apiRouter.get('/players', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const game = req.query.game as string | undefined;
    const status = req.query.status as string | undefined;

    let players = await supabaseDb.list<any>('players');

    // Strict deduplication by normalized gamer tag
    const uniquePlayersMap = new Map<string, any>();
    for (const p of players) {
      const tag = (p.gamerTag || p.gamer_tag || '').trim().toLowerCase();
      if (!tag) continue;
      if (!uniquePlayersMap.has(tag)) {
        uniquePlayersMap.set(tag, p);
      } else {
        const existing = uniquePlayersMap.get(tag)!;
        if ((!existing.discordUsername || existing.discordUsername === 'N/A') && p.discordUsername && p.discordUsername !== 'N/A') {
          uniquePlayersMap.set(tag, { ...existing, ...p });
        }
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

    res.json(players);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/players', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { fullName, gamerTag, discordUsername, game, team, status } = req.body;
    if (!fullName || !gamerTag) {
      return res.status(400).json({ error: 'Full name and gamer tag are required.' });
    }

    const cleanTag = String(gamerTag).trim();
    const cleanName = String(fullName).trim();
    const cleanDiscord = (discordUsername || 'N/A').trim();

    // Check if player with this gamer tag already exists
    const allPlayers = await supabaseDb.list<any>('players');
    let existingPlayer = allPlayers.find(p => (p.gamerTag || p.gamer_tag || '').trim().toLowerCase() === cleanTag.toLowerCase());

    const playerId = existingPlayer ? existingPlayer.id : ('ply-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5));
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

    const discordPfp = getDiscordAvatar(cleanDiscord, cleanTag);
    const leaderboardEntry = {
      id: 'lb-' + playerId,
      playerId,
      playerName: cleanName,
      gamerTag: cleanTag,
      discordUsername: cleanDiscord,
      game: game || 'ALL',
      avatar: discordPfp,
      matches: existingPlayer ? (existingPlayer.matches || 0) : 0,
      wins: existingPlayer ? (existingPlayer.wins || 0) : 0,
      score: existingPlayer ? (existingPlayer.score || 0) : 0,
      points: existingPlayer ? (existingPlayer.points || 0) : 0,
      status: status || 'ACTIVE',
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/players/${playerId}`, player);
    await supabaseDb.set(`blackhawk/leaderboard/${playerId}`, leaderboardEntry);

    res.status(existingPlayer ? 200 : 201).json(player);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/players/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await supabaseDb.get<any>(`blackhawk/players/${id}`);
    if (!existing) return res.status(404).json({ error: 'Player not found.' });

    const updatedPlayer = {
      ...existing,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/players/${id}`, updatedPlayer);

    // Sync to Leaderboard entry
    const existingLb = await supabaseDb.get<any>(`blackhawk/leaderboard/${id}`);
    if (existingLb) {
      const newAvatar = req.body.discordUsername
        ? getDiscordAvatar(req.body.discordUsername, req.body.gamerTag || existing.gamerTag)
        : existingLb.avatar;

      await supabaseDb.update(`blackhawk/leaderboard/${id}`, {
        playerName: req.body.fullName || existingLb.playerName,
        gamerTag: req.body.gamerTag || existingLb.gamerTag,
        game: req.body.game || existingLb.game,
        avatar: newAvatar,
        updatedAt: new Date().toISOString()
      });
    }

    res.json(updatedPlayer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/players/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await supabaseDb.delete(`blackhawk/players/${id}`);
    await supabaseDb.delete(`blackhawk/leaderboard/${id}`);
    res.json({ success: true, message: `Player ${id} deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── LEADERBOARD & AUTOMATIC RANKING (FROM FIREBASE / SUPABASE) ───────────────

apiRouter.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const game = req.query.game as string | undefined;
    const [lbEntries, allPlayers, allRegistrations] = await Promise.all([
      supabaseDb.list<any>('leaderboard'),
      supabaseDb.list<any>('players'),
      supabaseDb.list<any>('registrations')
    ]);

    // Build map of canonical Discord User IDs, Game UIDs, In-game Names for each player
    const playerDiscordIdMap = new Map<string, string>();
    const playerGameUidMap = new Map<string, string>();
    const playerInGameNameMap = new Map<string, string>();
    const playerDiscordUsernameMap = new Map<string, string>();

    for (const reg of allRegistrations) {
      const tag = (reg.gamerTag || reg.gamer_tag || '').trim().toLowerCase();
      if (!tag) continue;
      const details = reg.gameSpecificDetails || reg.game_specific_details;
      const uid = extractDiscordUserId(details, reg.discordUsername || reg.discord_username);
      if (uid && !playerDiscordIdMap.has(tag)) {
        playerDiscordIdMap.set(tag, uid);
      }
      const gUid = extractGameUid(details);
      if (gUid && !playerGameUidMap.has(tag)) {
        playerGameUidMap.set(tag, gUid);
      }
      const ign = extractInGameName(details);
      if (ign && !playerInGameNameMap.has(tag)) {
        playerInGameNameMap.set(tag, ign);
      }
      const dcUser = (reg.discordUsername || reg.discord_username || '').trim();
      if (dcUser && dcUser !== 'N/A' && !playerDiscordUsernameMap.has(tag)) {
        playerDiscordUsernameMap.set(tag, dcUser);
      }
    }
    for (const p of allPlayers) {
      const tag = (p.gamerTag || p.gamer_tag || '').trim().toLowerCase();
      if (!tag) continue;
      const uid = extractDiscordUserId(null, p.discordUsername || p.discord_username);
      if (uid && !playerDiscordIdMap.has(tag)) {
        playerDiscordIdMap.set(tag, uid);
      }
      const dcUser = (p.discordUsername || p.discord_username || '').trim();
      if (dcUser && dcUser !== 'N/A' && !playerDiscordUsernameMap.has(tag)) {
        playerDiscordUsernameMap.set(tag, dcUser);
      }
    }

    // Map strictly keyed by unique canonical player gamerTag: cleanTag
    const map = new Map<string, any>();

    // 1. Add existing explicit leaderboard entries
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
      const discordUserId = playerDiscordIdMap.get(cleanTag) || extractDiscordUserId(null, lb.discordUsername || lb.discord_username);
      
      let avatar = lb.avatar;
      if (!avatar || avatar.includes('images.unsplash.com') || (discordUserId && avatar.includes('unavatar.io'))) {
        avatar = getDiscordAvatar(lb.discordUsername || lb.discord_username, lb.gamerTag || lb.gamer_tag, discordUserId);
      }

      if (!existing) {
        map.set(cleanTag, {
          id: lb.id || `lb_${cleanTag}`,
          playerId: lb.playerId || lb.player_id || `ply_${cleanTag}`,
          playerName: lb.playerName || lb.player_name || lb.gamerTag || lb.gamer_tag,
          gamerTag: lb.gamerTag || lb.gamer_tag,
          discordUsername: lb.discordUsername || lb.discord_username || 'N/A',
          discordUserId: discordUserId || null,
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
        if (!existing.avatar || existing.avatar.includes('images.unsplash.com') || (discordUserId && existing.avatar.includes('unavatar.io'))) {
          existing.avatar = avatar;
        }
        if (discordUserId) existing.discordUserId = discordUserId;
      }
    }

    // 2. Merge registered players from players table
    for (const p of allPlayers) {
      if (p.status && p.status !== 'ACTIVE') continue;
      const cleanTag = (p.gamerTag || p.gamer_tag || '').trim().toLowerCase();
      if (!cleanTag) continue;
      const pGame = p.game || 'ALL';
      const discordUserId = playerDiscordIdMap.get(cleanTag) || extractDiscordUserId(null, p.discordUsername || p.discord_username);
      
      let pAvatar = p.avatar;
      if (!pAvatar || pAvatar.includes('images.unsplash.com') || (discordUserId && pAvatar.includes('unavatar.io'))) {
        pAvatar = getDiscordAvatar(p.discordUsername || p.discord_username, p.gamerTag || p.gamer_tag, discordUserId);
      }

      if (!map.has(cleanTag)) {
        map.set(cleanTag, {
          id: 'lb-' + p.id,
          playerId: p.id,
          playerName: p.fullName || p.full_name || p.gamerTag || p.gamer_tag,
          gamerTag: p.gamerTag || p.gamer_tag,
          discordUsername: p.discordUsername || p.discord_username || 'N/A',
          discordUserId: discordUserId || null,
          game: pGame,
          gamesSet: new Set([pGame.toUpperCase()]),
          avatar: pAvatar,
          points: Number(p.points) || 0,
          wins: Number(p.wins) || 0,
          matches: Number(p.matches) || 0,
          score: Number(p.score) || 0,
          status: 'ACTIVE'
        });
      } else {
        const existing = map.get(cleanTag)!;
        existing.gamesSet.add(pGame.toUpperCase());
        if (p.id && (!existing.playerId || existing.playerId.startsWith('ply_'))) {
          existing.playerId = p.id;
        }
        if (p.fullName && (!existing.playerName || existing.playerName === existing.gamerTag)) {
          existing.playerName = p.fullName;
        }
        if (discordUserId) existing.discordUserId = discordUserId;
      }
    }

    // 3. Merge players from tournament registrations table
    for (const reg of allRegistrations) {
      if (reg.status && reg.status === 'REJECTED') continue;
      const cleanTag = (reg.gamerTag || reg.gamer_tag || '').trim().toLowerCase();
      if (!cleanTag) continue;
      const regGame = (reg.gameName || reg.gameId || 'ALL').toUpperCase();
      const discordUserId = playerDiscordIdMap.get(cleanTag) || extractDiscordUserId(reg.gameSpecificDetails || reg.game_specific_details, reg.discordUsername || reg.discord_username);

      if (!map.has(cleanTag)) {
        map.set(cleanTag, {
          id: 'lb-' + reg.id,
          playerId: reg.playerId || reg.player_id || `ply_${reg.id}`,
          playerName: reg.playerName || reg.player_name || reg.gamerTag || reg.gamer_tag,
          gamerTag: reg.gamerTag || reg.gamer_tag,
          discordUsername: reg.discordUsername || reg.discord_username || 'N/A',
          discordUserId: discordUserId || null,
          game: regGame,
          gamesSet: new Set([regGame]),
          avatar: getDiscordAvatar(reg.discordUsername || reg.discord_username, reg.gamerTag || reg.gamer_tag, discordUserId),
          points: 0,
          wins: 0,
          matches: 0,
          score: 0,
          status: 'ACTIVE'
        });
      } else {
        const existing = map.get(cleanTag)!;
        existing.gamesSet.add(regGame);
        if (discordUserId) existing.discordUserId = discordUserId;
      }
    }

    let entries = Array.from(map.values());

    // Filter by game discipline if requested (EXACTLY ONE ENTRY PER PLAYER ALWAYS)
    if (game && game !== 'ALL') {
      const gUpper = game.toUpperCase();
      entries = entries.filter(l => 
        l.gamesSet.has(gUpper) || 
        l.gamesSet.has('ALL') || 
        (l.game || '').toUpperCase() === gUpper || 
        (l.game || '').toUpperCase() === 'ALL'
      );
    }

    // Format final entries: clean up gamesSet before JSON response
    const formattedEntries = entries.map(e => {
      const { gamesSet, ...rest } = e;
      return rest;
    });

    // Dynamic Deterministic Rank Sort: points DESC -> wins DESC -> score DESC -> discordVerified DESC -> matches ASC -> gamerTag ASC
    formattedEntries.sort((a, b) => {
      if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
      if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
      if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
      const aVerified = a.discordUserId ? 1 : 0;
      const bVerified = b.discordUserId ? 1 : 0;
      if (bVerified !== aVerified) return bVerified - aVerified;
      if ((a.matches || 0) !== (b.matches || 0)) return (a.matches || 0) - (b.matches || 0);
      const aClean = (a.gamerTag || a.playerName || '').replace(/^[^\w]+/g, '');
      const bClean = (b.gamerTag || b.playerName || '').replace(/^[^\w]+/g, '');
      return aClean.localeCompare(bClean);
    });

    const ranked = formattedEntries.map((r, index) => {
      const cleanTag = (r.gamerTag || '').trim().toLowerCase();
      const discordUserId = r.discordUserId || playerDiscordIdMap.get(cleanTag) || extractDiscordUserId(null, r.discordUsername);
      const freeFireUid = playerGameUidMap.get(cleanTag) || r.freeFireUid || null;
      const inGameName = playerInGameNameMap.get(cleanTag) || r.inGameName || null;
      const discordUsername = playerDiscordUsernameMap.get(cleanTag) || r.discordUsername || 'N/A';
      
      let avatar = r.avatar;
      if (!avatar || avatar.includes('images.unsplash.com') || avatar.trim() === '' || (discordUserId && avatar.includes('unavatar.io'))) {
        avatar = getDiscordAvatar(discordUsername, r.gamerTag, discordUserId);
      }

      const totalPoints = Number(r.points) || 0;
      const wins = Number(r.wins) || 0;
      const matches = Number(r.matches) || 0;
      const kills = Number(r.score) || 0;

      // Calculable points breakdown according to Blackhawk specifications
      const placementPoints = Math.max(0, wins * 10);
      const killPoints = kills;
      const participationPoints = Math.max(0, matches > wins ? (matches - wins) : 0);
      const challengeBonus = Math.max(0, totalPoints - placementPoints - killPoints - participationPoints);

      return {
        ...r,
        avatar,
        discordUsername,
        discordUserId: discordUserId || undefined,
        freeFireUid: freeFireUid || undefined,
        inGameName: inGameName || undefined,
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
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/leaderboard', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const {
      playerName, gamerTag, game, points = 0, wins = 0, matches = 0, score = 0, status = 'ACTIVE', avatar
    } = req.body;

    if (!playerName || !gamerTag) {
      return res.status(400).json({ error: 'Player Name and Gamer Tag are required.' });
    }

    const cleanTag = String(gamerTag).trim();
    const cleanName = String(playerName).trim();

    const [allLb, allPlayers] = await Promise.all([
      supabaseDb.list<any>('leaderboard'),
      supabaseDb.list<any>('players')
    ]);

    let existingLb = allLb.find(l => (l.gamerTag || l.gamer_tag || '').trim().toLowerCase() === cleanTag.toLowerCase());
    let existingPlayer = allPlayers.find(p => (p.gamerTag || p.gamer_tag || '').trim().toLowerCase() === cleanTag.toLowerCase());

    const playerId = req.body.playerId || existingPlayer?.id || existingLb?.playerId || ('ply-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5));
    const lbId = existingLb ? existingLb.id : ('lb-' + playerId);
    const pfp = avatar || getDiscordAvatar(req.body.discordUsername || existingPlayer?.discordUsername || 'N/A', cleanTag);

    const entry = {
      id: lbId,
      playerId,
      playerName: cleanName,
      gamerTag: cleanTag,
      discordUsername: req.body.discordUsername || existingPlayer?.discordUsername || 'N/A',
      game: game || existingLb?.game || 'ALL',
      points: Number(points) || 0,
      wins: Number(wins) || 0,
      matches: Number(matches) || 0,
      score: Number(score) || 0,
      avatar: pfp,
      status: status || 'ACTIVE',
      createdAt: existingLb?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/leaderboard/${lbId}`, entry);

    // Also ensure player row exists in players table
    if (!existingPlayer) {
      await supabaseDb.set(`blackhawk/players/${playerId}`, {
        id: playerId,
        fullName: cleanName,
        gamerTag: cleanTag,
        discordUsername: req.body.discordUsername || 'N/A',
        game: game || 'ALL',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      });
    }

    res.status(existingLb ? 200 : 201).json(entry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/leaderboard/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let existing = await supabaseDb.get<any>(`blackhawk/leaderboard/${id}`);
    let key = id;

    if (!existing) {
      const all = await supabaseDb.list<any>('leaderboard');
      const found = all.find(l => l.id === id || l.playerId === id);
      if (found) {
        existing = found;
        key = found.id || found.playerId;
      }
    }

    if (!existing) return res.status(404).json({ error: 'Leaderboard entry not found.' });

    const updated = {
      ...existing,
      ...req.body,
      points: req.body.points !== undefined ? Number(req.body.points) : existing.points,
      wins: req.body.wins !== undefined ? Number(req.body.wins) : existing.wins,
      matches: req.body.matches !== undefined ? Number(req.body.matches) : existing.matches,
      score: req.body.score !== undefined ? Number(req.body.score) : existing.score,
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/leaderboard/${key}`, updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/leaderboard/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await supabaseDb.delete(`blackhawk/leaderboard/${id}`);
    res.json({ success: true, message: `Leaderboard entry ${id} deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/leaderboard/:id/reset', requireAdminAuth, async (req: Request, res: Response) => {
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
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/leaderboard/record-match', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const {
      playerId,
      playerName,
      gamerTag,
      game,
      eventId,
      eventName,
      points,
      kills,
      placement,
      isWin,
      breakdown,
      notes
    } = req.body;

    if (!playerName && !gamerTag) {
      return res.status(400).json({ error: 'Player Name or Gamer Tag is required.' });
    }

    const targetGame = (game || 'BGMI').toUpperCase();
    const cleanGamerTag = gamerTag || playerName;
    const cleanPlayerName = playerName || gamerTag;
    const matchPoints = Number(points) || 0;
    const matchKills = Number(kills) || 0;
    const winIncrement = isWin || Number(placement) === 1 ? 1 : 0;

    // Search existing leaderboard entry by gamerTag, playerId, or playerName
    const allLeaderboard = await supabaseDb.list<any>('leaderboard');
    let entry = allLeaderboard.find(l => 
      ((playerId && (l.playerId === playerId || l.id === playerId)) ||
       ((l.gamerTag || l.gamer_tag) && (l.gamerTag || l.gamer_tag).trim().toLowerCase() === cleanGamerTag.trim().toLowerCase()) ||
       ((l.playerName || l.player_name) && (l.playerName || l.player_name).trim().toLowerCase() === cleanPlayerName.trim().toLowerCase()))
    );

    let key = entry ? (entry.id || entry.playerId) : ('lb-' + (playerId || cleanGamerTag.toLowerCase().replace(/[^a-z0-9]/g, '_')));

    let updatedEntry: any;
    if (entry) {
      updatedEntry = {
        ...entry,
        points: (Number(entry.points) || 0) + matchPoints,
        wins: (Number(entry.wins) || 0) + winIncrement,
        matches: (Number(entry.matches) || 0) + 1,
        score: (Number(entry.score) || 0) + matchKills,
        status: 'ACTIVE',
        updatedAt: new Date().toISOString()
      };
    } else {
      updatedEntry = {
        id: key,
        playerId: playerId || key,
        playerName: cleanPlayerName,
        gamerTag: cleanGamerTag,
        game: targetGame,
        avatar: getDiscordAvatar('', cleanGamerTag),
        points: matchPoints,
        wins: winIncrement,
        matches: 1,
        score: matchKills,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    await supabaseDb.set(`blackhawk/leaderboard/${key}`, updatedEntry);

    // Save historical match record
    const matchLogId = 'match_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const matchLog = {
      id: matchLogId,
      playerId: updatedEntry.playerId,
      playerName: cleanPlayerName,
      gamerTag: cleanGamerTag,
      game: targetGame,
      eventId: eventId || null,
      eventName: eventName || null,
      placement: Number(placement) || 0,
      kills: matchKills,
      points: matchPoints,
      isWin: winIncrement === 1,
      breakdown: breakdown || {},
      notes: notes || '',
      recordedBy: (req as any).admin?.username || 'admin',
      recordedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/match_scores/${matchLogId}`, matchLog);

    res.json({
      success: true,
      message: `Successfully calculated and credited ${matchPoints} points to ${cleanGamerTag}!`,
      leaderboardEntry: updatedEntry,
      matchLog
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ─── REGISTRATIONS ROUTES (STORED IN FIREBASE / SUPABASE) ─────────────────────

apiRouter.get('/registrations', requireAdminAuth, async (req: Request, res: Response) => {
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

    // Deduplicate strictly: exactly ONE registration per player per game
    const uniqueMap = new Map<string, any>();
    for (const r of list) {
      const tag = (r.gamerTag || r.gamer_tag || '').trim().toLowerCase();
      const gId = (r.gameId || r.game_id || 'freefire').toLowerCase();
      const key = `${tag}_${gId}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, r);
      } else {
        const existing = uniqueMap.get(key)!;
        const rHasEvent = Boolean((r.eventId || r.event_id) && (r.eventId || r.event_id) !== 'null');
        const exHasEvent = Boolean((existing.eventId || existing.event_id) && (existing.eventId || existing.event_id) !== 'null');
        if (rHasEvent && !exHasEvent) {
          uniqueMap.set(key, r);
        }
      }
    }

    const dedupedList = Array.from(uniqueMap.values());

    // Sort newest first
    dedupedList.sort((a, b) => new Date(b.registeredAt || b.registered_at || 0).getTime() - new Date(a.registeredAt || a.registered_at || 0).getTime());
    res.json(dedupedList);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/registrations', async (req: Request, res: Response) => {
  try {
    const { fullName, gamerTag, username, discordUsername, discordId, email, phone, games } = req.body;

    const sanitize = (s: string, maxLen = 100) => String(s || '').trim().slice(0, maxLen);
    const cleanTag = sanitize(gamerTag || username, 40);
    const cleanName = sanitize(fullName || cleanTag, 80);
    const cleanDiscord = sanitize(discordUsername || discordId || 'N/A', 60);
    const cleanEmail = sanitize(email || '', 120);
    const cleanPhone = sanitize(phone || '', 20);

    if (!cleanTag || !games || !Array.isArray(games) || games.length === 0) {
      return res.status(400).json({ error: 'Username / Gamer tag and at least one game are required.' });
    }

    if (cleanTag.length < 2) return res.status(400).json({ error: 'Username / Gamer tag must be at least 2 characters.' });

    // Check duplicate registrations in database
    const existingRegistrations = await supabaseDb.list<any>('registrations');
    const duplicateGames: string[] = [];

    for (const g of games) {
      const gameId = (g.gameId || 'freefire').toLowerCase();
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
        error: `You've already registered for: ${duplicateGames.join(', ')}. Duplicate registrations are not allowed.`,
        duplicateGames
      });
    }

    // 1. Find or create Player in database (Strictly deduplicated by gamer tag)
    const allPlayers = await supabaseDb.list<any>('players');
    let player = allPlayers.find(p => (p.gamerTag || p.gamer_tag || '').trim().toLowerCase() === cleanTag.toLowerCase());

    if (!player) {
      const playerId = 'ply-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
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
        id: 'lb-' + playerId,
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
      const updatedPlayer = {
        ...player,
        fullName: cleanName || player.fullName,
        discordUsername: cleanDiscord !== 'N/A' ? cleanDiscord : player.discordUsername,
        email: cleanEmail || player.email,
        phone: cleanPhone || player.phone
      };
      await supabaseDb.set(`blackhawk/players/${player.id}`, updatedPlayer);
      player = updatedPlayer;

      // Ensure leaderboard entry exists for existing player
      const existingLb = await supabaseDb.get<any>(`blackhawk/leaderboard/${player.id}`);
      if (!existingLb) {
        const discordPfp = getDiscordAvatar(player.discordUsername, player.gamerTag);
        await supabaseDb.set(`blackhawk/leaderboard/${player.id}`, {
          id: 'lb-' + player.id,
          playerId: player.id,
          playerName: player.fullName || player.gamerTag,
          gamerTag: player.gamerTag,
          discordUsername: player.discordUsername || 'N/A',
          game: player.game || 'FREE FIRE',
          avatar: discordPfp,
          matches: 0,
          wins: 0,
          score: 0,
          points: 0,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    // 2. Create Registrations
    const createdRegistrations: any[] = [];
    for (const g of games) {
      const regId = 'BHL-' + Math.floor(100000 + Math.random() * 900000);
      const regRecord = {
        id: regId,
        playerId: player.id,
        playerName: cleanName,
        gamerTag: cleanTag,
        discordUsername: cleanDiscord,
        email: cleanEmail,
        phone: cleanPhone,
        gameId: (g.gameId || 'freefire').toLowerCase(),
        gameName: sanitize(g.gameName || 'FREE FIRE', 60),
        eventId: g.eventId || null,
        eventTitle: g.eventTitle || null,
        playType: g.playType === 'Team / Squad' || g.play_type === 'Team / Squad' ? 'Team / Squad' : 'Solo',
        teamName: sanitize(g.teamName || g.team_name || '', 80) || null,
        teamMembers: sanitize(g.teamMembers || g.team_members || '', 500) || null,
        gameSpecificData: g.gameSpecificDetails || g.gameSpecificData || {},
        status: 'REGISTERED',
        registeredAt: new Date().toISOString()
      };

      await supabaseDb.set(`blackhawk/registrations/${regId}`, regRecord);
      createdRegistrations.push(regRecord);
    }

    res.status(201).json({
      player,
      registrations: createdRegistrations
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/registrations/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await supabaseDb.get<any>(`blackhawk/registrations/${id}`);
    if (!existing) return res.status(404).json({ error: 'Registration not found.' });

    const updated = {
      ...existing,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    await supabaseDb.set(`blackhawk/registrations/${id}`, updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/registrations/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await supabaseDb.delete(`blackhawk/registrations/${id}`);
    res.json({ success: true, message: `Registration ${id} deleted.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DATABASE SYNC ROUTE ───────────────────────────────────────────────────────

apiRouter.post('/database/sync', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const result = await syncPlayersAndRegistrations();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/registrations/sync', requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const result = await syncPlayersAndRegistrations();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DATABASE EXPLORER ROUTE (FROM FIREBASE) ──────────────────────────────────

apiRouter.get('/database/:table', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const table = String(req.params.table);
    const allowedTables = ['players', 'games', 'events', 'registrations', 'leaderboard', 'admins'];
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Invalid collection requested.' });
    }

    let rows = await supabaseDb.list<any>(table);
    if (table === 'admins') {
      rows = rows.map(a => ({ id: a.id, username: a.username, displayName: a.displayName, role: a.role, createdAt: a.createdAt }));
    }

    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/database/:table/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const table = String(req.params.table);
    const id = String(req.params.id);
    await supabaseDb.delete(`blackhawk/${table}/${id}`);
    res.json({ success: true, message: `Record ${id} removed from Firebase ${table}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
