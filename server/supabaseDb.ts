import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://inwyqpxnnirfaqltzorz.supabase.co'
).trim().replace(/\/$/, '');

const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlud3lxcHhubmlyZmFxbHR6b3J6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDg3NDE5NiwiZXhwIjoyMTA2NDUwMTk2fQ.hWk0VauGFv4PIYiAl5RewYIl4iNaOKj70vYurX8Q9CY'
).trim();

// Local in-memory fallback cache when Supabase credentials are pending
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
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    console.log(`[Supabase DB] Initialized client connected to: ${SUPABASE_URL}`);
  } catch (err: any) {
    console.warn('[Supabase DB] Failed to create Supabase client:', err?.message);
  }
} else {
  console.log('[Supabase DB] Note: SUPABASE_URL / SUPABASE_KEY not yet configured in .env. Using in-memory fallback cache.');
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
    // If path is e.g. "blackhawk/events/ev-ff-1"
    const parts = path.replace(/^blackhawk\//, '').split('/');
    if (parts.length >= 2) {
      const targetTable = normalizeTable(parts[0]);
      const id = parts.slice(1).join('/');

      if (supabaseInstance) {
        try {
          const { data, error } = await supabaseInstance
            .from(targetTable)
            .select('*')
            .eq('id', id)
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

    // Otherwise treat as list or single table
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

    // 1. Seed Admin
    const admins = await supabaseDb.list('admins');
    if (admins.length === 0) {
      const adminUser = process.env.ADMIN_USERNAME || 'admin';
      const adminPass = process.env.ADMIN_PASSWORD || 'blackhawk2026!';
      const salt = bcrypt.genSaltSync(10);
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
      console.log(`[Supabase DB] Seeded default admin "${adminUser}".`);
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
      console.log('[Supabase DB] Seeded 6 official games into Supabase.');
    }

    // 3. Clean up and deduplicate any existing duplicate player and leaderboard rows
    await deduplicateDatabaseRecords();

    // 4. Fully sync all registrations and players to players & leaderboard tables
    await syncPlayersAndRegistrations();

    console.log('[Supabase DB] Ready and operational.');
  } catch (err: any) {
    console.error('[Supabase DB] Initialization error:', err?.message);
  }
}

/**
 * Automatically clean up and consolidate duplicate player & leaderboard rows
 */
export async function deduplicateDatabaseRecords() {
  try {
    // 1. Deduplicate Players
    const players = await supabaseDb.list<any>('players');
    const playerGroups = new Map<string, any[]>();
    for (const p of players) {
      const tag = (p.gamerTag || p.gamer_tag || '').trim().toLowerCase();
      if (!tag) continue;
      if (!playerGroups.has(tag)) playerGroups.set(tag, []);
      playerGroups.get(tag)!.push(p);
    }

    for (const [tag, group] of playerGroups.entries()) {
      if (group.length > 1) {
        group.sort((a, b) => {
          const aCreated = new Date(a.createdAt || a.created_at || 0).getTime();
          const bCreated = new Date(b.createdAt || b.created_at || 0).getTime();
          return aCreated - bCreated;
        });
        const primary = group[0];
        const duplicates = group.slice(1);

        for (const dup of duplicates) {
          const dupId = dup.id;
          if (!dupId || dupId === primary.id) continue;
          
          if (supabaseInstance) {
            try {
              await supabaseInstance.from('registrations').update({ player_id: primary.id }).eq('player_id', dupId);
              await supabaseInstance.from('match_results').update({ player_id: primary.id }).eq('player_id', dupId);
              await supabaseInstance.from('players').delete().eq('id', dupId);
            } catch {}
          }
          if (localFallbackMemory.players && localFallbackMemory.players[dupId]) {
            delete localFallbackMemory.players[dupId];
          }
        }
        console.log(`[Supabase DB] Deduplicated ${duplicates.length} duplicate player record(s) for gamer tag "${tag}".`);
      }
    }

    // 2. Deduplicate Leaderboard
    const lbEntries = await supabaseDb.list<any>('leaderboard');
    const lbGroups = new Map<string, any[]>();
    for (const lb of lbEntries) {
      const tag = (lb.gamerTag || lb.gamer_tag || '').trim().toLowerCase();
      if (!tag) continue;
      if (!lbGroups.has(tag)) lbGroups.set(tag, []);
      lbGroups.get(tag)!.push(lb);
    }

    for (const [tag, group] of lbGroups.entries()) {
      if (group.length > 1) {
        group.sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));
        const primary = group[0];
        const maxPoints = group.reduce((max, e) => Math.max(max, Number(e.points) || 0), 0);
        const maxWins = group.reduce((max, e) => Math.max(max, Number(e.wins) || 0), 0);
        const maxMatches = group.reduce((max, e) => Math.max(max, Number(e.matches) || 0), 0);
        const maxScore = group.reduce((max, e) => Math.max(max, Number(e.score) || 0), 0);

        primary.points = maxPoints;
        primary.wins = maxWins;
        primary.matches = maxMatches;
        primary.score = maxScore;

        const duplicates = group.slice(1);
        for (const dup of duplicates) {
          const dupId = dup.id;
          if (dupId && dupId !== primary.id) {
            if (supabaseInstance) {
              try {
                await supabaseInstance.from('leaderboard').delete().eq('id', dupId);
              } catch {}
            }
            if (localFallbackMemory.leaderboard && localFallbackMemory.leaderboard[dupId]) {
              delete localFallbackMemory.leaderboard[dupId];
            }
          }
        }
        await supabaseDb.set(`blackhawk/leaderboard/${primary.id}`, primary);
        console.log(`[Supabase DB] Deduplicated ${duplicates.length} duplicate leaderboard record(s) for gamer tag "${tag}".`);
      }
    }
  } catch (err: any) {
    console.warn('[Supabase DB] Deduplication check completed with notice:', err?.message);
  }
}

/**
 * Helper to generate Discord Avatar URL
 */
function getDiscordAvatarUrl(discordUsername?: string, gamerTag?: string) {
  const clean = (discordUsername || '').trim();
  const seed = encodeURIComponent(clean || gamerTag || 'Player');
  if (clean && !clean.includes(' ') && clean !== 'N/A') {
    return `https://unavatar.io/discord/${seed}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${seed}%26backgroundColor%3D09090b%2C18181b`;
  }
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=09090b,18181b`;
}

/**
 * Universal Sync: Cross-synchronize Registrations, Players, and Leaderboard tables in Supabase
 */
export async function syncPlayersAndRegistrations() {
  try {
    console.log('[Supabase DB] Synchronizing registrations, players, and leaderboard tables...');

    // 1. Fetch current tables
    const [rawPlayers, rawRegs, rawLb] = await Promise.all([
      supabaseDb.list<any>('players'),
      supabaseDb.list<any>('registrations'),
      supabaseDb.list<any>('leaderboard')
    ]);

    // 2. Clean up any dummy test data
    for (const r of rawRegs) {
      if ((r.gamerTag || r.gamer_tag || '').toUpperCase().includes('DEDUP_CHAMP')) {
        await supabaseDb.delete(`blackhawk/registrations/${r.id}`);
      }
    }
    for (const p of rawPlayers) {
      if ((p.gamerTag || p.gamer_tag || '').toUpperCase().includes('DEDUP_CHAMP')) {
        await supabaseDb.delete(`blackhawk/players/${p.id}`);
      }
    }
    for (const l of rawLb) {
      if ((l.gamerTag || l.gamer_tag || '').toUpperCase().includes('DEDUP_CHAMP')) {
        await supabaseDb.delete(`blackhawk/leaderboard/${l.id}`);
      }
    }

    // 3. Re-read active records
    const [players, registrations, leaderboard] = await Promise.all([
      supabaseDb.list<any>('players'),
      supabaseDb.list<any>('registrations'),
      supabaseDb.list<any>('leaderboard')
    ]);

    // 4. Map existing players by normalized gamer tag
    const playerMap = new Map<string, any>();
    for (const p of players) {
      const tag = (p.gamerTag || p.gamer_tag || '').trim().toLowerCase();
      if (tag && !playerMap.has(tag)) {
        playerMap.set(tag, p);
      }
    }

    // 5. Sync Registrations -> Players & Deduplicate strictly per (player + game)
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

    for (const [key, group] of regGroups.entries()) {
      // Sort: prefer row with eventId, then most complete details, then newest
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

      // Clean up any duplicates
      for (const dup of duplicates) {
        await supabaseDb.delete(`blackhawk/registrations/${dup.id}`);
      }

      // Ensure primary player exists and is linked
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
          : `ply-${Date.now().toString(36)}${Math.random().toString(36).substring(2, 5)}`;

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

      // Link primary registration
      if ((primary.playerId || primary.player_id) !== player.id) {
        await supabaseDb.update(`blackhawk/registrations/${primary.id}`, {
          playerId: player.id,
          playerName: trimmedName,
          gamerTag: trimmedTag,
          discordUsername: trimmedDiscord,
          email: trimmedEmail,
          phone: trimmedPhone
        });
      }
    }

    // 6. Sync Players -> Leaderboard
    const latestPlayers = await supabaseDb.list<any>('players');
    const lbMap = new Map<string, any>();
    for (const l of leaderboard) {
      const tag = (l.gamerTag || l.gamer_tag || '').trim().toLowerCase();
      if (tag) lbMap.set(tag, l);
    }

    for (const p of latestPlayers) {
      const normTag = (p.gamerTag || p.gamer_tag || '').trim().toLowerCase();
      if (!normTag) continue;

      const existingLb = lbMap.get(normTag);
      const avatarUrl = getDiscordAvatarUrl(p.discordUsername || p.discord_username, p.gamerTag || p.gamer_tag);

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

