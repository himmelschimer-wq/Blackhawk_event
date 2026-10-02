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
function toDbRow(data: any): Record<string, any> {
  if (!data || typeof data !== 'object') return data;
  const row: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
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
        const row = toDbRow(payload);
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
        const row = toDbRow(data);
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

    console.log('[Supabase DB] Ready and operational.');
  } catch (err: any) {
    console.error('[Supabase DB] Initialization error:', err?.message);
  }
}
