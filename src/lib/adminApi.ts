// BlackHawk Esports Real Database API Client & Hardened Auth Client
import { supabase, isSupabaseConfigured } from './supabase';

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

  // Match Results
  if (row.total_points !== undefined) normalized.points = Number(row.total_points);
  if (row.recorded_at !== undefined) normalized.recordedAt = row.recorded_at;

  return normalized as T;
}

// Offline cache helpers (only for non-sensitive presentation resilience)
function getLocalFallback<T = any>(table: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const storageKey = `blackhawk_fallback_${table}`;
    const item = localStorage.getItem(storageKey);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

function saveToLocalFallback(table: string, record: any): void {
  if (typeof window === 'undefined' || !record) return;
  try {
    // Never cache admin credentials or audit logs in localStorage!
    if (['admins', 'sessions', 'audit_logs', 'auditLogs'].includes(table)) return;

    const storageKey = `blackhawk_fallback_${table}`;
    const existingStr = localStorage.getItem(storageKey);
    const list: any[] = existingStr ? JSON.parse(existingStr) : [];
    const id = record.id || record.key;
    const idx = list.findIndex(i => (i.id || i.key) === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...record };
    } else {
      list.unshift(record);
    }
    localStorage.setItem(storageKey, JSON.stringify(list));
  } catch {}
}

// Fetch helper that falls back to Supabase ONLY for public spectator tables
async function fetchWithFallback<T>(apiPath: string, supabaseTable: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(apiPath, {
      ...options,
      credentials: 'include'
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map(r => normalizeDbRow(r)) as unknown as T;
      }
      return (data ? normalizeDbRow(data) : data) as unknown as T;
    }
  } catch {
    // API not reachable
  }

  // Strictly allow ONLY public spectator tables to be queried directly from client Supabase
  const publicSpectatorTables = ['games', 'events', 'leaderboard'];
  const normalizedTable = supabaseTable === 'results' ? 'match_results' : supabaseTable === 'auditLogs' ? 'audit_logs' : supabaseTable;

  if (isSupabaseConfigured && publicSpectatorTables.includes(normalizedTable)) {
    try {
      const { data, error } = await supabase.from(normalizedTable).select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(r => normalizeDbRow(r)) as unknown as T;
      }
    } catch {}
  }

  // Fallback to offline presentation cache
  const localData = getLocalFallback<any>(supabaseTable);
  if (localData.length > 0) {
    return localData as unknown as T;
  }

  return [] as unknown as T;
}

export const adminApi = {
  getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  },

  // ─── AUTHENTICATION (SECURE HTTPONLY COOKIE BASED) ──────────────────────────
  async login(username: string, password: string): Promise<{ admin: AdminUser }> {
    const cleanUser = String(username).trim();
    const rawPass = String(password).trim();

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: cleanUser, password: rawPass })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Invalid admin username or password.');
    }

    return await res.json();
  },

  async localDevLogin(): Promise<{ admin: AdminUser }> {
    const res = await fetch('/api/auth/local-dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Local dev login failed. Admin access is restricted to localhost.');
    }
    return await res.json();
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });
    } catch {
      // ignore
    }
  },

  async getMe(): Promise<{ authenticated: boolean; admin?: AdminUser }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders(),
        credentials: 'include',
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

    return { authenticated: false };
  },

  // ─── STATS ───────────────────────────────────────────────────────────────
  async getStats(): Promise<any> {
    try {
      const res = await fetch('/api/stats', {
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) return await res.json();
    } catch {}

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

    const res = await fetch('/api/games', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create game');
    }

    const json = await res.json();
    saveToLocalFallback('games', normalizeDbRow(json));
    return normalizeDbRow(json);
  },

  async updateGame(id: string, data: any) {
    const isBoolActive = data.active !== undefined
      ? Boolean(data.active === true || data.active === 1 || data.active === 'true')
      : undefined;

    const payload = {
      ...data,
      ...(isBoolActive !== undefined ? { active: isBoolActive } : {})
    };

    const res = await fetch(`/api/games/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update game');
    }

    const json = await res.json();
    saveToLocalFallback('games', normalizeDbRow(json));
    return normalizeDbRow(json);
  },

  async deleteGame(id: string) {
    const res = await fetch(`/api/games/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete game');
    }

    return await res.json();
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
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create tournament event');
    }

    const json = await res.json();
    saveToLocalFallback('events', normalizeDbRow(json));
    return normalizeDbRow(json);
  },

  async updateEvent(id: string, data: any) {
    const res = await fetch(`/api/events/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update event');
    }

    const json = await res.json();
    saveToLocalFallback('events', normalizeDbRow(json));
    return normalizeDbRow(json);
  },

  async deleteEvent(id: string) {
    const res = await fetch(`/api/events/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete event');
    }

    return await res.json();
  },

  async cleanDatabase(options?: { cleanEvents?: boolean; cleanRegistrations?: boolean; cleanResults?: boolean; cleanLeaderboard?: boolean; confirm?: string }) {
    const res = await fetch('/api/admin/clean-database', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(options || {})
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to clean database');
    }

    return await res.json();
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
    return players;
  },

  async createPlayer(data: any) {
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create player');
    }

    const json = await res.json();
    saveToLocalFallback('players', normalizeDbRow(json));
    return normalizeDbRow(json);
  },

  async updatePlayer(id: string, data: any) {
    const res = await fetch(`/api/players/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update player');
    }

    const json = await res.json();
    saveToLocalFallback('players', normalizeDbRow(json));
    return normalizeDbRow(json);
  },

  async deletePlayer(id: string) {
    const res = await fetch(`/api/players/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete player');
    }

    return await res.json();
  },

  // ─── LEADERBOARD ─────────────────────────────────────────────────────────
  async getLeaderboard(game?: string) {
    const url = game && game !== 'ALL' ? `/api/leaderboard?game=${encodeURIComponent(game)}` : '/api/leaderboard';
    const leaderboard = await fetchWithFallback<any[]>(url, 'leaderboard', { headers: this.getAuthHeaders() });
    if (!Array.isArray(leaderboard)) return [];
    return leaderboard;
  },

  async updateLeaderboard(id: string, data: any) {
    const res = await fetch(`/api/leaderboard/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update leaderboard entry');
    }

    return await res.json();
  },

  async createLeaderboardEntry(data: any) {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create leaderboard entry');
    }

    const json = await res.json();
    saveToLocalFallback('leaderboard', normalizeDbRow(json));
    return normalizeDbRow(json);
  },

  async deleteLeaderboardEntry(id: string) {
    const res = await fetch(`/api/leaderboard/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete leaderboard entry');
    }

    return await res.json();
  },

  async deleteLeaderboard(id: string) {
    return this.deleteLeaderboardEntry(id);
  },

  async resetLeaderboardEntry(id: string) {
    const res = await fetch(`/api/leaderboard/${encodeURIComponent(id)}/reset`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reset leaderboard entry');
    }

    return await res.json();
  },

  async resetLeaderboard(id: string) {
    return this.resetLeaderboardEntry(id);
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
    const res = await fetch('/api/leaderboard/record-match', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record authoritative match score');
    }

    return await res.json();
  },

  // ─── REGISTRATIONS ───────────────────────────────────────────────────────
  async getRegistrations(params?: { game?: string; status?: string; search?: string }) {
    const q = new URLSearchParams();
    if (params?.game && params.game !== 'ALL') q.set('game', params.game);
    if (params?.status && params.status !== 'ALL') q.set('status', params.status);
    if (params?.search) q.set('search', params.search);

    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await fetch(`/api/registrations${qs}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load registrations');
    }

    const list = await res.json();
    return Array.isArray(list) ? list.map(normalizeDbRow) : [];
  },

  async submitRegistration(data: any) {
    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed.');
    }

    const json = await res.json();
    return json;
  },

  async updateRegistrationStatus(id: string, status: string) {
    const res = await fetch(`/api/registrations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update registration status');
    }

    const json = await res.json();
    saveToLocalFallback('registrations', normalizeDbRow(json));
    return normalizeDbRow(json);
  },

  async deleteRegistration(id: string) {
    const res = await fetch(`/api/registrations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete registration');
    }

    return await res.json();
  },

  // ─── DATABASE EXPLORER ───────────────────────────────────────────────────
  async getDatabaseTable(table: string): Promise<any[]> {
    const res = await fetch(`/api/database/${encodeURIComponent(table)}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch table ${table}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeDbRow) : [];
  },

  async deleteDatabaseRow(table: string, id: string) {
    const res = await fetch(`/api/database/${encodeURIComponent(table)}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete record');
    }

    return await res.json();
  },

  async syncDatabase(): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch('/api/database/sync', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to synchronize database');
    }

    return await res.json();
  },

  async saveFreeFirePayouts(calculation: any) {
    const res = await fetch('/api/events/freefire/save-payouts', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(calculation)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save Free Fire prize payouts');
    }

    return await res.json();
  }
};
