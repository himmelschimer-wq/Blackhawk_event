import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ''
).trim().replace(/\/$/, '');

const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ''
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
    if (key === 'gameSpecificDetails') row['game_specific_details'] = value;
    else if (key === 'prizeRules') row['prize_rules'] = value;
    else if (key === 'winnersJson') row['winners_json'] = value;
    else if (key === 'calculationsJson') row['calculations_json'] = value;
    else if (key === 'points' && typeof value === 'object') row['points'] = value;
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
    if (key === 'game_specific_details') obj['gameSpecificDetails'] = value;
    else if (key === 'prize_rules') obj['prizeRules'] = value;
    else if (key === 'winners_json') obj['winnersJson'] = value;
    else if (key === 'calculations_json') obj['calculationsJson'] = value;
    else {
      const camel = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      obj[camel] = value;
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

    // 3. Seed Default Events
    const events = await supabaseDb.list('events');
    const freeFirePrizeRules = {
      totalBasePool: 700,
      currency: 'INR',
      symbol: '₹',
      categories: [
        {
          id: 'event_winner',
          title: 'Event Winner',
          baseAmount: 300,
          currency: 'INR',
          eligibility: '1st Place Champion in the main Free Fire tournament bracket',
          payoutCondition: 'Base ₹300; modified by 1v1 Challenge: ₹400 if won (+₹100 bonus), or ₹200 if lost (-₹100 penalty).'
        },
        {
          id: 'random_draw',
          title: 'Random Draw',
          baseAmount: 50,
          currency: 'INR',
          eligibility: 'All verified participating squads and players who completed their tournament matches',
          payoutCondition: 'Awarded to 1 randomly selected verified participant via automated lucky draw.'
        },
        {
          id: 'best_performance',
          title: 'Best Performance / Most Entertaining Gameplay',
          baseAmount: 50,
          currency: 'INR',
          eligibility: 'Athlete or squad exhibiting standout entertaining gameplay, highlight clutches, or exemplary sportsmanship',
          payoutCondition: 'Awarded after admin/community clip and match performance evaluation.'
        },
        {
          id: 'highest_eliminations',
          title: 'Highest Eliminations',
          baseAmount: 100,
          currency: 'INR',
          eligibility: 'Player or squad securing the highest total confirmed frags/kills across tournament matches',
          payoutCondition: 'Awarded directly to the top fragger according to official in-game match statistics.'
        },
        {
          id: 'challenge_1v1',
          title: '“Double or -₹100” 1v1 Challenge with Top Team',
          baseAmount: 200,
          currency: 'INR',
          eligibility: 'Event-winning team vs top challenger team',
          payoutCondition: 'If Event Winner wins: Event Winner total becomes ₹400, Challenger gets ₹0. If Event Winner loses: Event Winner receives ₹200, Challenger receives ₹100.'
        }
      ],
      challenge1v1Rules: {
        challengeName: '“Double or -₹100” 1v1 Challenge',
        baseWinnerPrize: 300,
        stakeAmount: 100,
        maxWinnerPrize: 400,
        minWinnerPrize: 200,
        challengerRewardOnWin: 100,
        challengerRewardOnLoss: 0,
        payoutScenarios: [
          {
            outcome: 'WINNER_WON',
            label: 'Event Winner Wins 1v1',
            winnerTotalPayout: 400,
            challengerPayout: 0,
            description: 'Event-winning team validates dominance and boosts total payout to ₹400.'
          },
          {
            outcome: 'WINNER_LOST',
            label: 'Challenger Wins 1v1',
            winnerTotalPayout: 200,
            challengerPayout: 100,
            description: 'Event-winning team receives ₹200 (-₹100 penalty); Challenging team receives ₹100.'
          }
        ]
      }
    };

    const freeFireEvent = {
      id: 'ev-ff-1',
      gameId: 'freefire',
      gameName: 'FREE FIRE',
      title: 'Free Fire Squad Showdown & 1v1 Gauntlet',
      description: 'Intense squad battle royale featuring Event Winner (₹300), Random Draw (₹50), Best Performance (₹50), Highest Eliminations (₹100), and the "Double or -₹100" 1v1 Challenge (₹200).',
      date: 'OCT 15, 2026',
      time: '7:00 PM',
      format: 'SQUAD & 1v1',
      prizePool: 700,
      maxParticipants: 48,
      registrationStatus: 'OPEN',
      eventStatus: 'REGISTRATION OPEN',
      rules: '1. 4-Man Squad custom room + optional 1v1 Gauntlet showdown.\n2. Mobile devices only. Emulators, iPad view mods, and third-party scripts strictly prohibited.\n3. Character skills & loadouts are permitted.\n4. Winning squad leader must submit in-game match end screenshot and victory POV recording upon request.\n5. “Double or -₹100” 1v1 Challenge is contested immediately following the main bracket.',
      generalRules: '1. All participating athletes must join the BlackHawk official Discord 15 minutes before scheduled match start.\n2. Fair play is enforced with zero tolerance for toxicity, hacking, or match-fixing.\n3. Prizes are disbursed directly via UPI / Bank Transfer within 24-48 hours of verification.\n4. High Command admin decisions on dispute resolutions and replay audits are final.',
      banner: '/assets/official_game_freefire.png',
      prizeRules: freeFirePrizeRules,
      createdAt: new Date().toISOString()
    };

    if (events.length === 0) {
      const defaultEvents = [
        freeFireEvent,
        {
          id: 'ev-bgmi-1',
          gameId: 'bgmi',
          gameName: 'BGMI',
          title: 'BGMI Squad Erangel Clash',
          description: 'Premier squad battle royale tournament across Erangel and Miramar.',
          date: 'OCT 12, 2026',
          time: '6:00 PM',
          format: 'SQUAD',
          prizePool: 350,
          maxParticipants: 64,
          registrationStatus: 'OPEN',
          eventStatus: 'REGISTRATION OPEN',
          rules: '1. Squad custom room lobby across Erangel & Miramar.\n2. Mobile devices only; emulators, triggers, and GFX tools are strictly forbidden.\n3. Squad captain must record voice comms and submit final kill tally screenshot.\n4. In case of room crash, the match will be restarted once.',
          generalRules: '1. Discord check-in mandatory 15 minutes prior to match time.\n2. Zero tolerance for unverified roster swaps.\n3. Transparent prize payouts within 24-48h of match verification.',
          banner: '/assets/official_game_bgmi.png',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ev-val-1',
          gameId: 'valorant',
          gameName: 'VALORANT',
          title: 'Valorant 5v5 Spike Rush Cup',
          description: 'Single elimination bracket 5v5 spike plant competitive tournament.',
          date: 'OCT 18, 2026',
          time: '6:00 PM',
          format: '5v5',
          prizePool: 20000,
          maxParticipants: 16,
          registrationStatus: 'OPEN',
          eventStatus: 'REGISTRATION OPEN',
          rules: '1. 5v5 Spike Plant competitive custom tournament mode.\n2. Map veto conducted in Discord lobby 15 minutes prior.\n3. Riot Vanguard active; any injection or cheating leads to instant disqualification.\n4. Tactical timeouts permitted (1 per team per half).',
          generalRules: '1. Official Discord voice rooms used for team comms.\n2. Good sportsmanship and fair play enforced.\n3. Instant prize distribution post-verification.',
          banner: '/assets/official_game_valorant.png',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ev-mc-1',
          gameId: 'minecraft',
          gameName: 'MINECRAFT',
          title: 'Minecraft Build Battle & Survival',
          description: 'Fast-paced theme building and PvP survival gauntlet.',
          date: 'OCT 20, 2026',
          time: '5:00 PM',
          format: 'SOLO',
          prizePool: 350,
          maxParticipants: 50,
          registrationStatus: 'OPEN',
          eventStatus: 'REGISTRATION OPEN',
          rules: '1. Timed 60-minute Build Challenge + Hardcore Survival PvP Arena.\n2. Minecraft Java Edition 1.20+ vanilla client only (no X-Ray or hack clients).\n3. Judges score builds based on Creativity, Complexity, and Theme adherence.',
          generalRules: '1. Discord voice check-in required on match day.\n2. Griefing outside designated arena boundaries prohibited.\n3. Payout disbursed upon official judges score publication.',
          banner: '/assets/official_game_minecraft.png',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ev-chess-1',
          gameId: 'chess',
          gameName: 'CHESS',
          title: 'BlackHawk Blitz Chess Championship',
          description: 'Tactical Swiss system rapid and blitz chess open.',
          date: 'OCT 22, 2026',
          time: '5:00 PM',
          format: 'SOLO',
          prizePool: 200,
          maxParticipants: 32,
          registrationStatus: 'OPEN',
          eventStatus: 'REGISTRATION OPEN',
          rules: '1. Swiss system blitz (3+2 / 5+0) via Chess.com / Lichess custom arena.\n2. Webcams / screen share in Discord mandatory for anti-cheat verification.\n3. Computer engine assistance, tablebases, or third-party hints strictly prohibited.',
          generalRules: '1. Strict anti-cheat algorithm checks applied to all moves.\n2. Disqualification for players failing to join Discord on time.\n3. Instant prize distribution upon fair-play clearance.',
          banner: '/assets/official_game_bgmi.png',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ev-sc-1',
          gameId: 'scribble',
          gameName: 'SCRIBBLE',
          title: 'Scribble Speed-Guesser Blitz',
          description: 'Fast-paced party custom room for fastest guessers and best artists.',
          date: 'OCT 25, 2026',
          time: '6:00 PM',
          format: 'SOLO',
          prizePool: 150,
          maxParticipants: 24,
          registrationStatus: 'OPEN',
          eventStatus: 'REGISTRATION OPEN',
          rules: '1. Custom private rooms with 6 rounds of speed sketching.\n2. No writing out the word letters directly on canvas.\n3. Fastest guessers score maximum bonus multiplier.',
          generalRules: '1. Community fair play and respect in chat.\n2. Room IDs distributed 10 minutes prior on Discord.\n3. Instant winner payouts upon final scoreboard capture.',
          banner: '/assets/official_game_minecraft.png',
          createdAt: new Date().toISOString()
        }
      ];

      for (const ev of defaultEvents) {
        await supabaseDb.set(`blackhawk/events/${ev.id}`, ev);
      }
      console.log('[Supabase DB] Seeded 6 official events into Supabase.');
    }

    console.log('[Supabase DB] Ready and operational.');
  } catch (err: any) {
    console.error('[Supabase DB] Initialization error:', err?.message);
  }
}
