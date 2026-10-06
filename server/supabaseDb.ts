import './env.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing required Supabase server configuration");
}

// Local in-memory fallback cache when running isolated tests
const localFallbackMemory: Record<string, Record<string, any>> = {
  admins: {},
  sessions: {},
  games: {},
  events: {},
  players: {},
  leaderboard: {},
  registrations: {},
  match_results: {},
  draws: {},
  audit_logs: {},
  payouts: {},
  system_settings: {}
};

let supabaseInstance: SupabaseClient | null = null;
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_SERVICE_ROLE_KEY &&
  !SUPABASE_URL.includes('test-placeholder')
);

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    console.log(`[Supabase DB] Initialized client connected to: ${SUPABASE_URL}`);
  } catch (err: any) {
    console.warn('[Supabase DB] Failed to create Supabase client:', err?.message);
  }
}

export const supabase = supabaseInstance;

// Helper to normalize table names from blackhawk/collection format
function normalizeTable(tableOrPath: string): string {
  const clean = tableOrPath.replace(/^blackhawk\//, '').replace(/^\//, '').replace(/\.json$/, '');
  const mapping: Record<string, string> = {
    'results': 'match_results',
    'match_scores': 'match_results',
    'auditLogs': 'audit_logs',
    'rewardsConfig': 'system_settings',
    'settings': 'system_settings'
  };
  return mapping[clean] || clean;
}

// Convert object camelCase keys to snake_case for PostgreSQL tables
function toDbRow(data: any, targetTable?: string): Record<string, any> {
  if (!data || typeof data !== 'object') return data;
  const row: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'gamesSet' || key === 'games_set') continue;
    if (targetTable === 'leaderboard' && (key === 'status' || key === 'crown')) continue;
    if (targetTable === 'players' && (key === 'updatedAt' || key === 'updated_at')) continue;

    // specific key overrides
    if (key === 'gameSpecificDetails' || key === 'gameSpecificData') row['game_specific_details'] = value;
    else if (key === 'prizeRules') row['prize_rules'] = value;
    else if (key === 'winnersJson') row['winners_json'] = value;
    else if (key === 'calculationsJson') row['calculations_json'] = value;
    else if (key === 'points' && typeof value === 'object') row['points'] = value;
    else if (key === 'active') row['active'] = Boolean(value === true || value === 1 || value === 'true');
    else {
      // standard camelCase to snake_case
      const snake = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      row[snake] = value;
    }
  }
  return row;
}

// Convert PostgreSQL snake_case row back to JavaScript camelCase
function fromDbRow<T = any>(row: any): T {
  if (!row || typeof row !== 'object') return row;
  const obj: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === 'game_specific_details') {
      obj['gameSpecificDetails'] = value;
      obj['gameSpecificData'] = value;
    }
    else if (key === 'prize_rules') obj['prizeRules'] = value;
    else if (key === 'winners_json') obj['winnersJson'] = value;
    else if (key === 'calculations_json') obj['calculationsJson'] = value;
    else if (key === 'active') obj['active'] = Boolean(value === true || value === 1 || value === 'true');
    else {
      const camel = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      obj[camel] = value;
      // also preserve snake_case key for backward compatibility
      obj[key] = value;
    }
  }
  return obj as T;
}

/**
 * Universal Supabase Database Driver with in-memory caching resilience
 */
export const supabaseDb = {
  url: SUPABASE_URL,
  isConfigured: isSupabaseConfigured,
  client: supabaseInstance,

  async get<T = any>(path: string): Promise<T | null> {
    const table = normalizeTable(path);
    const parts = path.replace(/^blackhawk\//, '').split('/');
    if (parts.length >= 2) {
      const targetTable = normalizeTable(parts[0]);
      const id = parts.slice(1).join('/');

      if (supabaseInstance) {
        try {
          const { data, error } = await supabaseInstance
            .from(targetTable)
            .select('*')
            .eq(targetTable === 'system_settings' ? 'key' : 'id', id)
            .maybeSingle();

          if (!error && data) return fromDbRow<T>(data);
          if (error && error.code !== 'PGRST116') {
            console.warn(`[Supabase DB] Error getting ${targetTable}/${id}:`, error.message);
          }
        } catch {}
      }

      const cached = localFallbackMemory[targetTable]?.[id];
      return cached ? (fromDbRow<T>(cached) || null) : null;
    }

    return (await this.list<T>(table)) as unknown as T;
  },

  async set(path: string, data: any): Promise<boolean> {
    const parts = path.replace(/^blackhawk\//, '').split('/');
    const targetTable = normalizeTable(parts[0]);
    const id = parts.length > 1 ? parts.slice(1).join('/') : data?.id;

    const payload = { ...data, ...(id ? { id } : {}) };

    if (!localFallbackMemory[targetTable]) {
      localFallbackMemory[targetTable] = {};
    }
    if (id) {
      localFallbackMemory[targetTable][id] = payload;
    }

    if (supabaseInstance) {
      try {
        const row = toDbRow(payload, targetTable);
        const { error } = await supabaseInstance
          .from(targetTable)
          .upsert(row, { onConflict: targetTable === 'system_settings' ? 'key' : 'id' });

        if (error) {
          console.warn(`[Supabase DB] Error upserting to ${targetTable}:`, error.message);
          return false;
        }
        return true;
      } catch (err: any) {
        console.warn(`[Supabase DB] Error in set(${path}):`, err.message);
        return false;
      }
    }
    return true;
  },

  async update(path: string, data: any): Promise<boolean> {
    const parts = path.replace(/^blackhawk\//, '').split('/');
    const targetTable = normalizeTable(parts[0]);
    const id = parts.length > 1 ? parts.slice(1).join('/') : data?.id;

    if (id && localFallbackMemory[targetTable]?.[id]) {
      localFallbackMemory[targetTable][id] = { ...localFallbackMemory[targetTable][id], ...data };
    }

    if (supabaseInstance && id) {
      try {
        const row = toDbRow(data, targetTable);
        const { error } = await supabaseInstance
          .from(targetTable)
          .update(row)
          .eq(targetTable === 'system_settings' ? 'key' : 'id', id);

        if (error) {
          console.warn(`[Supabase DB] Error updating ${targetTable}/${id}:`, error.message);
          return false;
        }
        return true;
      } catch (err: any) {
        console.warn(`[Supabase DB] Error in update(${path}):`, err.message);
        return false;
      }
    }
    return true;
  },

  async delete(path: string): Promise<boolean> {
    const parts = path.replace(/^blackhawk\//, '').split('/');
    const targetTable = normalizeTable(parts[0]);
    const id = parts.length > 1 ? parts.slice(1).join('/') : null;

    if (id && localFallbackMemory[targetTable]?.[id]) {
      delete localFallbackMemory[targetTable][id];
    }

    if (supabaseInstance && id) {
      try {
        const { error } = await supabaseInstance
          .from(targetTable)
          .delete()
          .eq(targetTable === 'system_settings' ? 'key' : 'id', id);

        if (error) {
          console.warn(`[Supabase DB] Error deleting from ${targetTable}/${id}:`, error.message);
          return false;
        }
        return true;
      } catch (err: any) {
        console.warn(`[Supabase DB] Error in delete(${path}):`, err.message);
        return false;
      }
    }
    return true;
  },

  async list<T = any>(collection: string): Promise<T[]> {
    const targetTable = normalizeTable(collection);

    if (supabaseInstance) {
      try {
        const { data, error } = await supabaseInstance
          .from(targetTable)
          .select('*');

        if (!error && Array.isArray(data)) {
          return data.map(r => fromDbRow<T>(r));
        }
        if (error) {
          console.warn(`[Supabase DB] Error listing from ${targetTable}:`, error.message);
        }
      } catch {}
    }

    const cached = localFallbackMemory[targetTable] || {};
    return Object.values(cached).map(r => fromDbRow<T>(r));
  },

  async findBy<T = any>(collection: string, column: string, value: any): Promise<T | null> {
    const targetTable = normalizeTable(collection);
    const snakeCol = column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

    if (supabaseInstance) {
      try {
        const { data, error } = await supabaseInstance
          .from(targetTable)
          .select('*')
          .eq(snakeCol, value)
          .maybeSingle();

        if (!error && data) return fromDbRow<T>(data);
      } catch {}
    }

    const cached = localFallbackMemory[targetTable] || {};
    const item = Object.values(cached).find((row: any) => row[column] === value || row[snakeCol] === value);
    return item ? fromDbRow<T>(item) : null;
  },

  async listWithFilter<T = any>(
    collection: string,
    options: {
      select?: string;
      where?: Record<string, any>;
      limit?: number;
      offset?: number;
      orderBy?: string;
      ascending?: boolean;
    } = {}
  ): Promise<T[]> {
    const targetTable = normalizeTable(collection);

    if (supabaseInstance) {
      try {
        let query = supabaseInstance
          .from(targetTable)
          .select(options.select || '*');

        if (options.where) {
          for (const [col, val] of Object.entries(options.where)) {
            if (val !== undefined && val !== null) {
              const snake = col.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
              query = query.eq(snake, val);
            }
          }
        }

        if (options.orderBy) {
          const snakeOrder = options.orderBy.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
          query = query.order(snakeOrder, { ascending: options.ascending ?? true });
        }

        if (options.limit) {
          query = query.limit(options.limit);
        }

        if (options.offset) {
          query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data.map(r => fromDbRow<T>(r));
        }
      } catch {}
    }

    let items = Object.values(localFallbackMemory[targetTable] || {}).map(r => fromDbRow<T>(r));
    if (options.where) {
      items = items.filter(item => {
        for (const [k, v] of Object.entries(options.where!)) {
          if ((item as any)[k] !== v) return false;
        }
        return true;
      });
    }
    if (options.limit) {
      items = items.slice(options.offset || 0, (options.offset || 0) + options.limit);
    }
    return items;
  },

  async findOne<T = any>(collection: string, predicate: (item: T) => boolean): Promise<T | null> {
    const all = await this.list<T>(collection);
    return all.find(predicate) || null;
  },

  async filter<T = any>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
    const all = await this.list<T>(collection);
    return all.filter(predicate);
  }
};

/**
 * Seed initial structure directly into Supabase (or fallback cache) if empty
 */
export async function initSupabaseDatabase() {
  try {
    console.log('[Supabase DB] Checking & initializing Supabase database tables...');

    // 1. Seed Admin (only if explicit environment credentials are provided)
    const admins = await supabaseDb.list('admins');
    if (admins.length === 0 && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
      const adminUser = process.env.ADMIN_USERNAME.trim();
      const adminPass = process.env.ADMIN_PASSWORD.trim();
      const salt = bcrypt.genSaltSync(12);
      const hash = bcrypt.hashSync(adminPass, salt);
      const adminId = 'adm-' + Date.now();

      await supabaseDb.set(`blackhawk/admins/${adminId}`, {
        id: adminId,
        username: adminUser,
        displayName: 'BlackHawk High Command',
        passwordHash: hash,
        role: 'ADMIN',
        createdAt: new Date().toISOString()
      });
      console.log(`[Supabase DB] Seeded admin "${adminUser}" from environment configuration.`);
    }

    // 2. Seed Default Games
    const games = await supabaseDb.list('games');
    if (games.length === 0) {
      const defaultGames = [
        {
          id: 'freefire',
          name: 'FREE FIRE',
          description: 'Free Fire high-octane survival clash, squad gauntlet & 1v1 challenge.',
          logo: '/assets/badge_freefire.png',
          banner: '/assets/official_game_freefire.png',
          category: 'SURVIVAL SHOOTER',
          defaultPrizePool: 700,
          format: 'SQUAD & 1v1',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'bgmi',
          name: 'BGMI',
          description: 'Battlegrounds Mobile India squad & solo championship series.',
          logo: '/assets/badge_bgmi.png',
          banner: '/assets/official_game_bgmi.png',
          category: 'BATTLE ROYALE',
          defaultPrizePool: 350,
          format: 'SOLO / SQUAD',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'valorant',
          name: 'VALORANT',
          description: '5v5 tactical spike rush, precision gunplay, and clutch tournament.',
          logo: '/assets/badge_valorant.png',
          banner: '/assets/official_game_valorant.png',
          category: 'TACTICAL 5v5',
          defaultPrizePool: 20000,
          format: '5v5',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'minecraft',
          name: 'MINECRAFT',
          description: 'Competitive build battle, survival games, and PvP arena clash.',
          logo: '/assets/badge_minecraft.png',
          banner: '/assets/official_game_minecraft.png',
          category: 'BUILD & PVP',
          defaultPrizePool: 350,
          format: 'SOLO',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'chess',
          name: 'CHESS',
          description: 'Rapid and blitz tactical mastery across 64 squares.',
          logo: '/assets/badge_bgmi.png',
          banner: '/assets/official_game_bgmi.png',
          category: 'STRATEGY',
          defaultPrizePool: 200,
          format: 'SOLO',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'scribble',
          name: 'SCRIBBLE',
          description: 'Lightning speed sketch & guess community showdown.',
          logo: '/assets/badge_minecraft.png',
          banner: '/assets/official_game_minecraft.png',
          category: 'PARTY & CASUAL',
          defaultPrizePool: 150,
          format: 'SOLO',
          active: true,
          createdAt: new Date().toISOString()
        }
      ];

      for (const g of defaultGames) {
        await supabaseDb.set(`blackhawk/games/${g.id}`, g);
      }
      console.log(`[Supabase DB] Seeded ${defaultGames.length} default esports games.`);
    }

    // 3. Seed Default Events
    const events = await supabaseDb.list('events');
    if (events.length === 0) {
      const defaultEvents = [
        {
          id: 'ev-ff-1',
          gameId: 'freefire',
          gameName: 'FREE FIRE',
          title: 'Free Fire Weekend Clash',
          description: 'Squad battle royale tournament with intense 1v1 King of the Hill finale.',
          date: 'Saturday, 8:00 PM IST',
          time: '20:00',
          format: 'Squad & 1v1 Challenge',
          prizePool: 700,
          maxParticipants: 48,
          registrationStatus: 'OPEN',
          eventStatus: 'REGISTRATION OPEN',
          rules: 'Free Fire official competitive esports rules apply.',
          generalRules: 'Fair play enforced. Emulators strictly disallowed without admin approval.',
          banner: '/assets/official_game_freefire.png',
          prizeRules: {
            firstPlace: 400,
            secondPlace: 200,
            mvpBonus: 100,
            challenge1v1Bonus: 150,
            participationDraw: 50
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'ev-bgmi-1',
          gameId: 'bgmi',
          gameName: 'BGMI',
          title: 'BGMI Erangel Domination Cup',
          description: 'Competitive squads clash on Erangel for the championship crown.',
          date: 'Sunday, 7:00 PM IST',
          time: '19:00',
          format: 'Squad',
          prizePool: 350,
          maxParticipants: 64,
          registrationStatus: 'OPEN',
          eventStatus: 'REGISTRATION OPEN',
          rules: 'Standard BGMI esports point table and rotation format.',
          banner: '/assets/official_game_bgmi.png',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      for (const ev of defaultEvents) {
        await supabaseDb.set(`blackhawk/events/${ev.id}`, ev);
      }
      console.log(`[Supabase DB] Seeded ${defaultEvents.length} default tournament events.`);
    }
  } catch (err: any) {
    console.warn('[Supabase DB] Error in initSupabaseDatabase():', err?.message);
  }
}

function extractDiscordUserId(details?: any, discordUsername?: string): string | null {
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

async function getDiscordAvatarUrl(discordUsername?: string, gamerTag?: string, userId?: string | null): Promise<string> {
  const cleanId = (userId || '').trim();
  const clean = (discordUsername || gamerTag || 'Player').trim().replace(/^@/, '');

  if (/^\d{16,21}$/.test(cleanId)) {
    try {
      const idx = Number((BigInt(cleanId) >> 22n) % 6n);
      return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
    } catch {}
  }

  if (clean && !clean.includes(' ') && clean !== 'N/A') {
    return `https://unavatar.io/discord/${encodeURIComponent(clean)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(clean)}%26backgroundColor%3D09090b%2C18181b`;
  }
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(gamerTag || 'Player')}&backgroundColor=09090b,18181b`;
}

/**
 * Universal Sync: Cross-synchronize Registrations, Players, and Leaderboard tables in Supabase
 */
export async function syncPlayersAndRegistrations() {
  try {
    console.log('[Supabase DB] Synchronizing registrations, players, and leaderboard tables...');

    const [players, registrations, leaderboard] = await Promise.all([
      supabaseDb.list<any>('players'),
      supabaseDb.list<any>('registrations'),
      supabaseDb.list<any>('leaderboard')
    ]);

    const playerMap = new Map<string, any>();
    for (const p of players) {
      const tag = (p.gamerTag || p.gamer_tag || '').trim().toLowerCase();
      if (tag && !playerMap.has(tag)) {
        playerMap.set(tag, p);
      }
    }

    const regGroups = new Map<string, any[]>();
    for (const reg of registrations) {
      const trimmedTag = (reg.gamerTag || reg.gamer_tag || '').trim();
      if (!trimmedTag) continue;
      const gameId = (reg.gameId || reg.game_id || 'freefire').toLowerCase();
      const normTag = trimmedTag.toLowerCase();
      const key = `${normTag}_${gameId}`;
      if (!regGroups.has(key)) regGroups.set(key, []);
      regGroups.get(key)!.push(reg);
    }

    for (const [, group] of regGroups.entries()) {
      group.sort((a, b) => {
        const aHasEvent = Boolean((a.eventId || a.event_id) && (a.eventId || a.event_id) !== 'null');
        const bHasEvent = Boolean((b.eventId || b.event_id) && (b.eventId || b.event_id) !== 'null');
        if (aHasEvent && !bHasEvent) return -1;
        if (!aHasEvent && bHasEvent) return 1;

        const aDetailsLen = Object.keys(a.gameSpecificData || a.gameSpecificDetails || a.game_specific_details || {}).length;
        const bDetailsLen = Object.keys(b.gameSpecificData || b.gameSpecificDetails || b.game_specific_details || {}).length;
        if (aDetailsLen !== bDetailsLen) return bDetailsLen - aDetailsLen;

        return new Date(b.registeredAt || b.registered_at || 0).getTime() - new Date(a.registeredAt || a.registered_at || 0).getTime();
      });

      const primary = group[0];
      const duplicates = group.slice(1);

      for (const dup of duplicates) {
        await supabaseDb.delete(`blackhawk/registrations/${dup.id}`);
      }

      const trimmedTag = (primary.gamerTag || primary.gamer_tag || '').trim();
      const trimmedName = (primary.playerName || primary.player_name || trimmedTag).trim();
      const trimmedDiscord = (primary.discordUsername || primary.discord_username || 'N/A').trim();
      const trimmedEmail = (primary.email || '').trim();
      const trimmedPhone = (primary.phone || '').trim();
      const gameName = (primary.gameName || primary.game_name || 'FREE FIRE').trim();
      const normTag = trimmedTag.toLowerCase();

      let player = playerMap.get(normTag);
      if (!player) {
        const newPlayerId = (primary.playerId || primary.player_id) && String(primary.playerId || primary.player_id).startsWith('ply-')
          ? String(primary.playerId || primary.player_id)
          : `ply-${crypto.randomUUID()}`;

        player = {
          id: newPlayerId,
          fullName: trimmedName,
          gamerTag: trimmedTag,
          discordUsername: trimmedDiscord,
          email: trimmedEmail,
          phone: trimmedPhone,
          game: gameName,
          team: primary.teamName || primary.team_name || null,
          status: 'ACTIVE',
          joinedAt: primary.registeredAt || primary.registered_at || new Date().toISOString(),
          createdAt: primary.createdAt || primary.created_at || new Date().toISOString()
        };

        await supabaseDb.set(`blackhawk/players/${newPlayerId}`, player);
        playerMap.set(normTag, player);
      }

      if ((primary.playerId || primary.player_id) !== player.id) {
        await supabaseDb.update(`blackhawk/registrations/${primary.id}`, {
          playerId: player.id,
          playerName: trimmedName,
          gamerTag: trimmedTag
        });
      }
    }

    const latestPlayers = await supabaseDb.list<any>('players');
    const lbMap = new Map<string, any>();
    for (const l of leaderboard) {
      const tag = (l.gamerTag || l.gamer_tag || '').trim().toLowerCase();
      if (tag) lbMap.set(tag, l);
    }

    const regDiscordIdMap = new Map<string, string>();
    for (const r of registrations) {
      const tag = (r.gamerTag || r.gamer_tag || '').trim().toLowerCase();
      const uid = extractDiscordUserId(r.gameSpecificDetails || r.game_specific_details, r.discordUsername || r.discord_username);
      if (tag && uid && !regDiscordIdMap.has(tag)) {
        regDiscordIdMap.set(tag, uid);
      }
    }

    for (const p of latestPlayers) {
      const normTag = (p.gamerTag || p.gamer_tag || '').trim().toLowerCase();
      if (!normTag) continue;

      const existingLb = lbMap.get(normTag);
      const discordUserId = regDiscordIdMap.get(normTag) || extractDiscordUserId(null, p.discordUsername || p.discord_username);
      const avatarUrl = await getDiscordAvatarUrl(p.discordUsername || p.discord_username, p.gamerTag || p.gamer_tag, discordUserId);

      if (!existingLb) {
        const lbId = `lb-${p.id}`;
        const lbEntry = {
          id: lbId,
          playerId: p.id,
          playerName: p.fullName || p.full_name || p.gamerTag || p.gamer_tag,
          gamerTag: p.gamerTag || p.gamer_tag,
          discordUsername: p.discordUsername || p.discord_username || 'N/A',
          game: p.game || 'FREE FIRE',
          points: 0,
          score: 0,
          wins: 0,
          matches: 0,
          rank: 1,
          avatar: avatarUrl,
          createdAt: p.createdAt || p.created_at || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await supabaseDb.set(`blackhawk/leaderboard/${lbId}`, lbEntry);
      } else {
        await supabaseDb.update(`blackhawk/leaderboard/${existingLb.id}`, {
          playerId: p.id,
          playerName: p.fullName || p.full_name || p.gamerTag || p.gamer_tag,
          gamerTag: p.gamerTag || p.gamer_tag,
          discordUsername: p.discordUsername || p.discord_username || 'N/A',
          avatar: avatarUrl || existingLb.avatar,
          updatedAt: new Date().toISOString()
        });
      }
    }

    console.log('[Supabase DB] Database synchronization completed successfully.');
    return {
      success: true,
      message: 'All players, registrations, and leaderboard records successfully synchronized.'
    };
  } catch (err: any) {
    console.warn('[Supabase DB] Error during database synchronization:', err?.message);
    return { success: false, error: err?.message };
  }
}
