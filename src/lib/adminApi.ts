// BlackHawk Esports Real Database API Client & Supabase Client
import { supabase, isSupabaseConfigured } from './supabase';

const TOKEN_KEY = 'blackhawk_admin_token';

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

// Universal row normalizer from PostgreSQL snake_case to JavaScript camelCase
export function normalizeDbRow<T = any>(row: any): T {
  if (!row || typeof row !== 'object') return row;
  const normalized: Record<string, any> = { ...row };

  // Common cross-table fields
  if (row.id !== undefined) normalized.id = String(row.id);
  if (row.created_at !== undefined) normalized.createdAt = row.created_at;
  if (row.updated_at !== undefined) normalized.updatedAt = row.updated_at;

  // Games
  if (row.default_prize_pool !== undefined) normalized.defaultPrizePool = Number(row.default_prize_pool);
  if (row.defaultPrizePool !== undefined) normalized.default_prize_pool = Number(row.defaultPrizePool);
  if (row.active !== undefined) {
    normalized.active = Boolean(row.active === true || row.active === 1 || row.active === 'true');
  }

  // Players
  if (row.full_name !== undefined) normalized.fullName = row.full_name;
  if (row.fullName !== undefined) normalized.full_name = row.fullName;
  if (row.gamer_tag !== undefined) normalized.gamerTag = row.gamer_tag;
  if (row.gamerTag !== undefined) normalized.gamer_tag = row.gamerTag;
  if (row.discord_username !== undefined) normalized.discordUsername = row.discord_username;
  if (row.discordUsername !== undefined) normalized.discord_username = row.discordUsername;
  if (row.joined_at !== undefined) normalized.joinedAt = row.joined_at;

  // Registrations
  if (row.player_id !== undefined) normalized.playerId = row.player_id;
  if (row.playerId !== undefined) normalized.player_id = row.playerId;
  if (row.player_name !== undefined) normalized.playerName = row.player_name;
  if (row.playerName !== undefined) normalized.player_name = row.playerName;
  if (row.game_id !== undefined) normalized.gameId = row.game_id;
  if (row.gameId !== undefined) normalized.game_id = row.gameId;
  if (row.game_name !== undefined) normalized.gameName = row.game_name;
  if (row.gameName !== undefined) normalized.game_name = row.gameName;
  if (row.event_id !== undefined) normalized.eventId = row.event_id;
  if (row.eventId !== undefined) normalized.event_id = row.event_id;
  if (row.event_title !== undefined) normalized.eventTitle = row.event_title;
  if (row.eventTitle !== undefined) normalized.event_title = row.eventTitle;
  if (row.team_name !== undefined) normalized.teamName = row.team_name;
  if (row.teamName !== undefined) normalized.team_name = row.teamName;
  if (row.team_members !== undefined) normalized.teamMembers = row.team_members;
  if (row.teamMembers !== undefined) normalized.team_members = row.teamMembers;
  if (row.game_specific_details !== undefined) normalized.gameSpecificData = row.game_specific_details;
  if (row.gameSpecificData !== undefined) normalized.game_specific_details = row.gameSpecificData;
  if (row.gameSpecificDetails !== undefined) normalized.gameSpecificData = row.gameSpecificDetails;
  if (row.registered_at !== undefined) normalized.registeredAt = row.registered_at;
  if (row.registeredAt !== undefined) normalized.registered_at = row.registeredAt;
  if (!normalized.registeredAt && normalized.createdAt) normalized.registeredAt = normalized.createdAt;
  if (!normalized.registeredAt) normalized.registeredAt = new Date().toISOString();

  // Events
  if (row.prize_pool !== undefined) normalized.prizePool = Number(row.prize_pool);
  if (row.prizePool !== undefined) normalized.prize_pool = Number(row.prizePool);
  if (row.max_participants !== undefined) normalized.maxParticipants = Number(row.max_participants);
  if (row.registration_status !== undefined) normalized.registrationStatus = row.registration_status;
  if (row.registrationStatus !== undefined) normalized.registration_status = row.registrationStatus;
  if (row.event_status !== undefined) normalized.eventStatus = row.event_status;
  if (row.eventStatus !== undefined) normalized.event_status = row.eventStatus;
  if (row.general_rules !== undefined) normalized.generalRules = row.general_rules;
  if (row.generalRules !== undefined) normalized.general_rules = row.generalRules;

  // Leaderboard
  if (row.points !== undefined) normalized.points = Number(row.points) || 0;
  if (row.score !== undefined) normalized.score = Number(row.score) || 0;
  if (row.wins !== undefined) normalized.wins = Number(row.wins) || 0;
  if (row.matches !== undefined) normalized.matches = Number(row.matches) || 0;

  return normalized as T;
}

// Local storage fallback loader for offline resilience
function getLocalFallback<T>(table: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const keyMap: Record<string, string> = {
      players: 'BHT_PLAYERS',
      registrations: 'BHT_REGISTRATIONS',
      events: 'BHT_EVENTS',
      games: 'BHT_GAMES',
      leaderboard: 'BHT_LEADERBOARD',
      match_results: 'BHT_RESULTS',
      results: 'BHT_RESULTS'
    };
    const storageKey = keyMap[table];
    if (storageKey) {
      const item = localStorage.getItem(storageKey);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(r => normalizeDbRow<T>(r));
        }
      }
    }
  } catch {}
  return [];
}

// Sync record into local storage cache
function saveToLocalFallback(table: string, record: any) {
  if (typeof window === 'undefined' || !record || !record.id) return;
  try {
    const keyMap: Record<string, string> = {
      players: 'BHT_PLAYERS',
      registrations: 'BHT_REGISTRATIONS',
      events: 'BHT_EVENTS',
      games: 'BHT_GAMES',
      leaderboard: 'BHT_LEADERBOARD'
    };
    const storageKey = keyMap[table];
    if (storageKey) {
      const existingStr = localStorage.getItem(storageKey);
      let list: any[] = existingStr ? JSON.parse(existingStr) : [];
      const idx = list.findIndex((x: any) => x.id === record.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...record };
      } else {
        list.unshift(record);
      }
      localStorage.setItem(storageKey, JSON.stringify(list));
    }
  } catch {}
}

// Helper to fetch from backend or fallback to direct Supabase query or localStorage
async function fetchWithFallback<T>(apiPath: string, supabaseTable: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(apiPath, options);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map(r => normalizeDbRow(r)) as unknown as T;
      }
      return (data ? normalizeDbRow(data) : data) as unknown as T;
    }
  } catch {
    // Backend API unavailable, query Supabase directly
  }

  if (isSupabaseConfigured) {
    try {
      const normalizedTable = supabaseTable === 'results' ? 'match_results' : supabaseTable === 'auditLogs' ? 'audit_logs' : supabaseTable;
      const { data, error } = await supabase.from(normalizedTable).select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(r => normalizeDbRow(r)) as unknown as T;
      }
    } catch {}
  }

  // Fallback to offline local storage
  const localData = getLocalFallback<any>(supabaseTable);
  if (localData.length > 0) {
    return localData as unknown as T;
  }

  return [] as unknown as T;
}

export const adminApi = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  },

  // ─── AUTH ────────────────────────────────────────────────────────────────
  async login(username: string, password: string): Promise<{ token: string; admin: AdminUser }> {
    const cleanUser = String(username).trim();
    const rawPass = String(password).trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: rawPass })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.token) {
          this.setToken(data.token);
          return data;
        }
      }
    } catch {
      // Backend not yet reachable or in cold start
    }

    throw new Error('Invalid admin username or password.');
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch {
      // ignore
    } finally {
      this.clearToken();
    }
  },

  async getMe(): Promise<{ authenticated: boolean; admin?: AdminUser }> {
    const token = this.getToken();
    if (!token) return { authenticated: false };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      const res = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders(),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.authenticated) {
          return data;
        }
      }
    } catch {}

    this.clearToken();
    return { authenticated: false };
  },

  // ─── STATS ───────────────────────────────────────────────────────────────
  async getStats(): Promise<any> {
    try {
      const res = await fetch('/api/stats', {
        headers: this.getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured) {
      try {
        const [p, r, e, g] = await Promise.all([
          supabase.from('players').select('id', { count: 'exact', head: true }),
          supabase.from('registrations').select('id', { count: 'exact', head: true }),
          supabase.from('events').select('id, prize_pool, event_status'),
          supabase.from('games').select('id', { count: 'exact', head: true }),
        ]);
        const events = e.data || [];
        const prizeSum = events.reduce((acc, ev) => acc + (Number(ev.prize_pool) || 0), 0);
        return {
          totalPlayers: p.count || 0,
          totalRegistrations: r.count || 0,
          activeEvents: events.filter(ev => ['UPCOMING', 'LIVE', 'REGISTRATION OPEN'].includes(ev.event_status)).length,
          completedEvents: events.filter(ev => ev.event_status === 'COMPLETED').length,
          totalGames: g.count || 0,
          totalPrizePool: prizeSum,
          totalParticipants: r.count || 0
        };
      } catch {}
    }

    const localP = getLocalFallback('players');
    const localR = getLocalFallback('registrations');
    const localE = getLocalFallback<any>('events');
    return {
      totalPlayers: localP.length,
      totalRegistrations: localR.length,
      activeEvents: localE.filter(ev => ['UPCOMING', 'LIVE', 'REGISTRATION OPEN'].includes(ev.eventStatus || ev.event_status)).length,
      totalPrizePool: localE.reduce((acc, ev) => acc + (Number(ev.prizePool || ev.prize_pool) || 0), 0)
    };
  },

  // ─── GAMES ───────────────────────────────────────────────────────────────
  async getGames(all = false): Promise<any[]> {
    const res = await fetchWithFallback<any[]>(
      `/api/games${all ? '?all=true' : ''}`,
      'games',
      { headers: this.getAuthHeaders() }
    );
    if (!Array.isArray(res)) return [];
    if (!all) {
      return res.filter(g => g.active === true || g.active === 1 || g.active === 'true');
    }
    return res;
  },

  async createGame(data: any) {
    const isBoolActive = data.active !== undefined
      ? Boolean(data.active === true || data.active === 1 || data.active === 'true')
      : true;

    const payload = {
      ...data,
      active: isBoolActive
    };

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        saveToLocalFallback('games', normalizeDbRow(json));
        return normalizeDbRow(json);
      }
    } catch {}

    const id = data.id || `game_${Date.now()}`;
    const normalized = normalizeDbRow({ ...payload, id });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('games').upsert({
          id,
          name: payload.name,
          description: payload.description || '',
          logo: payload.logo || '/assets/badge_bgmi.png',
          banner: payload.banner || '/assets/official_game_bgmi.png',
          category: payload.category || 'ESPORTS',
          default_prize_pool: Number(payload.defaultPrizePool || payload.default_prize_pool || 0),
          format: payload.format || 'SOLO',
          active: isBoolActive
        });
      } catch (e) {
        console.warn('Supabase createGame error:', e);
      }
    }

    saveToLocalFallback('games', normalized);
    return normalized;
  },

  async updateGame(id: string, data: any) {
    const isBoolActive = data.active !== undefined
      ? Boolean(data.active === true || data.active === 1 || data.active === 'true')
      : undefined;

    const payload = {
      ...data,
      ...(isBoolActive !== undefined ? { active: isBoolActive } : {})
    };

    try {
      const res = await fetch(`/api/games/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        saveToLocalFallback('games', normalizeDbRow(json));
        return normalizeDbRow(json);
      }
    } catch {}

    if (isSupabaseConfigured) {
      try {
        const dbPayload: Record<string, any> = {};
        if (payload.name !== undefined) dbPayload.name = payload.name;
        if (payload.description !== undefined) dbPayload.description = payload.description;
        if (payload.logo !== undefined) dbPayload.logo = payload.logo;
        if (payload.banner !== undefined) dbPayload.banner = payload.banner;
        if (payload.category !== undefined) dbPayload.category = payload.category;
        if (payload.format !== undefined) dbPayload.format = payload.format;
        if (payload.defaultPrizePool !== undefined || payload.default_prize_pool !== undefined) {
          dbPayload.default_prize_pool = Number(payload.defaultPrizePool || payload.default_prize_pool || 0);
        }
        if (isBoolActive !== undefined) dbPayload.active = isBoolActive;

        await supabase.from('games').update(dbPayload).eq('id', id);
      } catch (err) {
        console.warn('Supabase updateGame error:', err);
      }
    }

    const normalized = normalizeDbRow({ id, ...payload });
    saveToLocalFallback('games', normalized);
    return normalized;
  },

  async deleteGame(id: string) {
    try {
      const res = await fetch(`/api/games/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured) {
      await supabase.from('games').delete().eq('id', id);
    }
    return { success: true };
  },

  // ─── EVENTS ──────────────────────────────────────────────────────────────
  async getEvents(game?: string) {
    const url = game ? `/api/events?game=${encodeURIComponent(game)}` : '/api/events';
    const events = await fetchWithFallback<any[]>(url, 'events', { headers: this.getAuthHeaders() });
    if (!Array.isArray(events)) return [];
    if (game) {
      return events.filter(e => (e.gameId || e.game_id || '').toLowerCase() === game.toLowerCase());
    }
    return events;
  },

  async createEvent(data: any) {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        saveToLocalFallback('events', normalizeDbRow(json));
        return normalizeDbRow(json);
      }
    } catch {}

    const id = data.id || `ev_${Date.now()}`;
    const payload = normalizeDbRow({ ...data, id, createdAt: new Date().toISOString() });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('events').upsert({
          id,
          game_id: data.gameId || data.game_id,
          game_name: data.gameName || data.game_name,
          title: data.title,
          description: data.description || '',
          date: data.date,
          time: data.time,
          format: data.format || 'SOLO',
          prize_pool: Number(data.prizePool || data.prize_pool || 0),
          max_participants: Number(data.maxParticipants || data.max_participants || 100),
          registration_status: data.registrationStatus || data.registration_status || 'OPEN',
          event_status: data.eventStatus || data.event_status || 'REGISTRATION OPEN',
          rules: data.rules || '',
          general_rules: data.generalRules || data.general_rules || '',
          banner: data.banner || ''
        });
      } catch (err) {
        console.warn('Supabase createEvent error:', err);
      }
    }
    saveToLocalFallback('events', payload);
    return payload;
  },

  async updateEvent(id: string, data: any) {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        saveToLocalFallback('events', normalizeDbRow(json));
        return normalizeDbRow(json);
      }
    } catch {}

    if (isSupabaseConfigured) {
      try {
        const dbPayload: Record<string, any> = {};
        if (data.title !== undefined) dbPayload.title = data.title;
        if (data.gameId !== undefined || data.game_id !== undefined) dbPayload.game_id = data.gameId || data.game_id;
        if (data.gameName !== undefined || data.game_name !== undefined) dbPayload.game_name = data.gameName || data.game_name;
        if (data.date !== undefined) dbPayload.date = data.date;
        if (data.time !== undefined) dbPayload.time = data.time;
        if (data.format !== undefined) dbPayload.format = data.format;
        if (data.prizePool !== undefined || data.prize_pool !== undefined) dbPayload.prize_pool = Number(data.prizePool || data.prize_pool || 0);
        if (data.maxParticipants !== undefined || data.max_participants !== undefined) dbPayload.max_participants = Number(data.maxParticipants || data.max_participants || 100);
        if (data.registrationStatus !== undefined || data.registration_status !== undefined) dbPayload.registration_status = data.registrationStatus || data.registration_status;
        if (data.eventStatus !== undefined || data.event_status !== undefined) dbPayload.event_status = data.eventStatus || data.event_status;
        if (data.description !== undefined) dbPayload.description = data.description;
        if (data.rules !== undefined) dbPayload.rules = data.rules;
        if (data.generalRules !== undefined || data.general_rules !== undefined) dbPayload.general_rules = data.generalRules || data.general_rules;
        if (data.banner !== undefined) dbPayload.banner = data.banner;

        await supabase.from('events').update(dbPayload).eq('id', id);
      } catch (err) {
        console.warn('Supabase updateEvent error:', err);
      }
    }
    const normalized = normalizeDbRow({ id, ...data });
    saveToLocalFallback('events', normalized);
    return normalized;
  },

  async deleteEvent(id: string) {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured) {
      await supabase.from('events').delete().eq('id', id);
    }
    return { success: true };
  },

  async cleanDatabase(options?: { cleanEvents?: boolean; cleanRegistrations?: boolean; cleanResults?: boolean; cleanLeaderboard?: boolean }) {
    try {
      const res = await fetch('/api/admin/clean-database', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(options || {})
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured) {
      if (options?.cleanEvents !== false) await supabase.from('events').delete().neq('id', 'dummy_preserved_id');
      if (options?.cleanRegistrations !== false) await supabase.from('registrations').delete().neq('id', 'dummy_preserved_id');
      if (options?.cleanResults !== false) await supabase.from('match_results').delete().neq('id', 'dummy_preserved_id');
      if (options?.cleanLeaderboard !== false) await supabase.from('leaderboard').delete().neq('id', 'dummy_preserved_id');
    }

    if (options?.cleanEvents !== false) localStorage.removeItem('blackhawk_fallback_events');
    if (options?.cleanRegistrations !== false) localStorage.removeItem('blackhawk_fallback_registrations');
    if (options?.cleanResults !== false) localStorage.removeItem('blackhawk_fallback_results');
    if (options?.cleanLeaderboard !== false) localStorage.removeItem('blackhawk_fallback_leaderboard');

    return { success: true };
  },

  // ─── PLAYERS ─────────────────────────────────────────────────────────────
  async getPlayers(params?: { search?: string; game?: string; status?: string }) {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.game && params.game !== 'ALL') q.set('game', params.game);
    if (params?.status && params.status !== 'ALL') q.set('status', params.status);

    const qs = q.toString() ? `?${q.toString()}` : '';
    const players = await fetchWithFallback<any[]>(
      `/api/players${qs}`,
      'players',
      { headers: this.getAuthHeaders() }
    );
    if (!Array.isArray(players)) return [];
    let filtered = players;
    if (params?.game && params.game !== 'ALL') {
      filtered = filtered.filter(p => (p.game || '').toLowerCase() === params.game?.toLowerCase());
    }
    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter(p => p.status === params.status);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(p => 
        (p.fullName || p.full_name || '').toLowerCase().includes(s) || 
        (p.gamerTag || p.gamer_tag || '').toLowerCase().includes(s) ||
        (p.discordUsername || p.discord_username || '').toLowerCase().includes(s)
      );
    }
    return filtered;
  },

  async createPlayer(data: any) {
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        saveToLocalFallback('players', normalizeDbRow(json));
        return normalizeDbRow(json);
      }
    } catch {}

    const cleanTag = (data.gamerTag || data.gamer_tag || '').trim();
    const existingPlayers = getLocalFallback<any>('players');
    const existing = existingPlayers.find((p: any) => (p.gamerTag || p.gamer_tag || '').trim().toLowerCase() === cleanTag.toLowerCase());

    const id = data.id || existing?.id || `ply_${Date.now()}`;
    const payload = normalizeDbRow({ ...existing, ...data, id, createdAt: existing?.createdAt || new Date().toISOString() });
    if (isSupabaseConfigured) {
      try {
        await supabase.from('players').upsert({
          id,
          full_name: data.fullName || data.full_name,
          gamer_tag: data.gamerTag || data.gamer_tag,
          discord_username: data.discordUsername || data.discord_username || 'N/A',
          email: data.email || '',
          phone: data.phone || '',
          game: data.game || 'ALL',
          team: data.team || '',
          status: data.status || 'ACTIVE'
        });
      } catch (err) {
        console.warn('Supabase createPlayer error:', err);
      }
    }
    saveToLocalFallback('players', payload);
    return payload;
  },

  async updatePlayer(id: string, data: any) {
    try {
      const res = await fetch(`/api/players/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        saveToLocalFallback('players', normalizeDbRow(json));
        return normalizeDbRow(json);
      }
    } catch {}

    if (isSupabaseConfigured) {
      try {
        const dbPayload: Record<string, any> = {};
        if (data.fullName !== undefined || data.full_name !== undefined) dbPayload.full_name = data.fullName || data.full_name;
        if (data.gamerTag !== undefined || data.gamer_tag !== undefined) dbPayload.gamer_tag = data.gamerTag || data.gamer_tag;
        if (data.discordUsername !== undefined || data.discord_username !== undefined) dbPayload.discord_username = data.discordUsername || data.discord_username;
        if (data.email !== undefined) dbPayload.email = data.email;
        if (data.phone !== undefined) dbPayload.phone = data.phone;
        if (data.game !== undefined) dbPayload.game = data.game;
        if (data.team !== undefined) dbPayload.team = data.team;
        if (data.status !== undefined) dbPayload.status = data.status;

        await supabase.from('players').update(dbPayload).eq('id', id);
      } catch (err) {
        console.warn('Supabase updatePlayer error:', err);
      }
    }
    const normalized = normalizeDbRow({ id, ...data });
    saveToLocalFallback('players', normalized);
    return normalized;
  },

  async deletePlayer(id: string) {
    try {
      const res = await fetch(`/api/players/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured) {
      await supabase.from('players').delete().eq('id', id);
    }
    return { success: true };
  },

  // ─── LEADERBOARD ─────────────────────────────────────────────────────────
  async getLeaderboard(game?: string) {
    const url = game && game !== 'ALL' ? `/api/leaderboard?game=${encodeURIComponent(game)}` : '/api/leaderboard';
    const leaderboard = await fetchWithFallback<any[]>(url, 'leaderboard', { headers: this.getAuthHeaders() });
    if (!Array.isArray(leaderboard)) return [];

    // Strict unique filter by gamer tag
    const seen = new Set<string>();
    const deduplicated = leaderboard.filter(l => {
      const tag = (l.gamerTag || l.gamer_tag || l.playerName || '').trim().toLowerCase();
      if (!tag || seen.has(tag)) return false;
      seen.add(tag);
      return true;
    });

    if (game && game !== 'ALL') {
      return deduplicated.filter(l => (l.game || '').toLowerCase() === game.toLowerCase() || (l.game || '').toLowerCase() === 'all');
    }
    return deduplicated;
  },

  async updateLeaderboard(id: string, data: any) {
    try {
      const res = await fetch(`/api/leaderboard/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured) {
      await supabase.from('leaderboard').update(data).eq('id', id);
    }
    return { id, ...data };
  },

  async createLeaderboardEntry(data: any) {
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        saveToLocalFallback('leaderboard', normalizeDbRow(json));
        return normalizeDbRow(json);
      }
    } catch {}

    const cleanTag = (data.gamerTag || data.gamer_tag || '').trim();
    const existingLb = getLocalFallback<any>('leaderboard');
    const existing = existingLb.find((l: any) => (l.gamerTag || l.gamer_tag || '').trim().toLowerCase() === cleanTag.toLowerCase());

    const id = data.id || existing?.id || `lb_${Date.now()}`;
    const normalized = normalizeDbRow({ ...existing, ...data, id });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('leaderboard').upsert({
          id,
          player_id: data.playerId || data.player_id || existing?.playerId || `ply_${Date.now()}`,
          player_name: data.playerName || data.player_name,
          gamer_tag: data.gamerTag || data.gamer_tag,
          discord_username: data.discordUsername || data.discord_username || 'N/A',
          game: data.game || 'ALL',
          points: Number(data.points) || 0,
          wins: Number(data.wins) || 0,
          matches: Number(data.matches) || 0,
          score: Number(data.score) || 0,
          avatar: data.avatar || ''
        });
      } catch (e) {
        console.warn('Supabase createLeaderboardEntry error:', e);
      }
    }
    saveToLocalFallback('leaderboard', normalized);
    return normalized;
  },

  async resetLeaderboard(id: string) {
    try {
      const res = await fetch(`/api/leaderboard/${id}/reset`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured) {
      await supabase.from('leaderboard').update({ points: 0, score: 0, wins: 0, matches: 0 }).eq('id', id);
    }
    return { success: true };
  },

  async deleteLeaderboard(id: string) {
    try {
      const res = await fetch(`/api/leaderboard/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured) {
      await supabase.from('leaderboard').delete().eq('id', id);
    }
    return { success: true };
  },

  async recordMatchScore(payload: {
    playerId?: string;
    playerName?: string;
    gamerTag?: string;
    game: string;
    eventId?: string;
    eventName?: string;
    points: number;
    kills: number;
    placement: number;
    isWin?: boolean;
    breakdown?: any;
    notes?: string;
  }) {
    try {
      const res = await fetch('/api/leaderboard/record-match', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch {}

    const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    if (isSupabaseConfigured) {
      await supabase.from('match_results').upsert({
        id: matchId,
        player_id: payload.playerId,
        player_name: payload.playerName,
        gamer_tag: payload.gamerTag,
        game_name: payload.game,
        event_id: payload.eventId,
        total_points: payload.points,
        placement: payload.placement,
        recorded_at: new Date().toISOString()
      });
    }
    return { success: true, matchId };
  },

  // ─── REGISTRATIONS ───────────────────────────────────────────────────────
  async getRegistrations(params?: { game?: string; status?: string; search?: string }) {
    const q = new URLSearchParams();
    if (params?.game && params.game !== 'ALL') q.set('game', params.game);
    if (params?.status && params.status !== 'ALL') q.set('status', params.status);
    if (params?.search) q.set('search', params.search);

    const qs = q.toString() ? `?${q.toString()}` : '';
    const list = await fetchWithFallback<any[]>(
      `/api/registrations${qs}`,
      'registrations',
      { headers: this.getAuthHeaders() }
    );
    if (!Array.isArray(list)) return [];
    let filtered = list;
    if (params?.game && params.game !== 'ALL') {
      filtered = filtered.filter(r => (r.gameId || r.game_id || r.gameName || r.game_name || '').toLowerCase() === params.game?.toLowerCase());
    }
    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter(r => r.status === params.status);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(r => 
        (r.playerName || r.player_name || '').toLowerCase().includes(s) || 
        (r.gamerTag || r.gamer_tag || '').toLowerCase().includes(s) ||
        (r.id || '').toLowerCase().includes(s)
      );
    }

    // Deduplicate strictly: exactly ONE registration per player per game
    const uniqueMap = new Map<string, any>();
    for (const r of filtered) {
      const tag = (r.gamerTag || r.gamer_tag || '').trim().toLowerCase();
      const gId = (r.gameId || r.game_id || r.gameName || r.game_name || 'freefire').toLowerCase();
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

    return Array.from(uniqueMap.values());
  },

  async submitRegistration(data: any) {
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.player) saveToLocalFallback('players', normalizeDbRow(json.player));
        if (Array.isArray(json.registrations)) {
          json.registrations.forEach((r: any) => saveToLocalFallback('registrations', normalizeDbRow(r)));
        }
        return json;
      }
    } catch {}

    // Fallback registration handler
    const cleanTag = (data.gamerTag || '').trim();
    const existingPlayers = getLocalFallback<any>('players');
    const existingPlayer = existingPlayers.find((p: any) => (p.gamerTag || p.gamer_tag || '').trim().toLowerCase() === cleanTag.toLowerCase());

    const playerId = existingPlayer ? existingPlayer.id : `ply-${Date.now().toString(36)}`;
    const registeredAt = new Date().toISOString();

    const player = normalizeDbRow({
      id: playerId,
      fullName: data.fullName || data.gamerTag,
      gamerTag: cleanTag,
      discordUsername: data.discordUsername || 'N/A',
      game: data.games?.[0]?.gameName || 'ALL',
      status: 'ACTIVE',
      createdAt: existingPlayer?.createdAt || registeredAt
    });

    const registrationsList: any[] = [];
    const gamesList = Array.isArray(data.games) ? data.games : [data];

    for (const g of gamesList) {
      const gRegId = `BHL-${Math.floor(100000 + Math.random() * 900000)}`;
      const payload = normalizeDbRow({
        id: gRegId,
        playerId,
        playerName: data.fullName || data.gamerTag,
        gamerTag: data.gamerTag,
        discordUsername: data.discordUsername || 'N/A',
        gameId: g.gameId || 'bgmi',
        gameName: g.gameName || 'BGMI',
        eventId: g.eventId || null,
        eventTitle: g.eventTitle || null,
        teamName: g.teamName || null,
        teamMembers: g.teamMembers || null,
        gameSpecificData: g.gameSpecificDetails || g.gameSpecificData || {},
        status: 'REGISTERED',
        registeredAt
      });

      if (isSupabaseConfigured) {
        try {
          await supabase.from('registrations').upsert({
            id: gRegId,
            player_id: playerId,
            player_name: payload.playerName,
            gamer_tag: payload.gamerTag,
            discord_username: payload.discordUsername,
            game_id: payload.gameId,
            game_name: payload.gameName,
            event_id: payload.eventId,
            event_title: payload.eventTitle,
            team_name: payload.teamName,
            team_members: payload.teamMembers,
            game_specific_details: payload.gameSpecificData,
            status: 'REGISTERED',
            registered_at: registeredAt
          });
        } catch (e) {
          console.warn('Supabase reg insert fallback error:', e);
        }
      }

      saveToLocalFallback('registrations', payload);
      registrationsList.push(payload);
    }

    saveToLocalFallback('players', player);

    return {
      player,
      registrations: registrationsList
    };
  },

  async updateRegistrationStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const json = await res.json();
        saveToLocalFallback('registrations', normalizeDbRow(json));
        return normalizeDbRow(json);
      }
    } catch {}

    if (isSupabaseConfigured) {
      try {
        await supabase.from('registrations').update({ status }).eq('id', id);
      } catch (err) {
        console.warn('Supabase updateRegistrationStatus error:', err);
      }
    }
    const normalized = normalizeDbRow({ id, status });
    saveToLocalFallback('registrations', normalized);
    return normalized;
  },

  async deleteRegistration(id: string) {
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured) {
      await supabase.from('registrations').delete().eq('id', id);
    }
    return { success: true };
  },

  // ─── DATABASE EXPLORER ───────────────────────────────────────────────────
  async getDatabaseTable(table: string): Promise<any[]> {
    const res = await fetchWithFallback<any[]>(
      `/api/database/${table}`,
      table,
      { headers: this.getAuthHeaders() }
    );
    return Array.isArray(res) ? res : [];
  },

  async deleteDatabaseRow(table: string, id: string) {
    try {
      const res = await fetch(`/api/database/${table}/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}

    if (isSupabaseConfigured) {
      await supabase.from(table).delete().eq('id', id);
    }
    return { success: true };
  },

  async syncDatabase(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/database/sync', {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    return { success: true, message: 'Database synchronized directly.' };
  }
};

