// BlackHawk Esports Real Database API Client

const TOKEN_KEY = 'blackhawk_admin_token';

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
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
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Invalid credentials');
    }
    const data = await res.json();
    this.setToken(data.token);
    return data;
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
      const res = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders()
      });
      if (!res.ok) {
        this.clearToken();
        return { authenticated: false };
      }
      return await res.json();
    } catch {
      return { authenticated: false };
    }
  },

  // ─── STATS ───────────────────────────────────────────────────────────────
  async getStats() {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch statistics');
    return await res.json();
  },

  // ─── GAMES ───────────────────────────────────────────────────────────────
  async getGames(all = false) {
    const res = await fetch(`/api/games${all ? '?all=true' : ''}`);
    if (!res.ok) throw new Error('Failed to fetch games');
    return await res.json();
  },

  async createGame(data: any) {
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to create game');
    return await res.json();
  },

  async updateGame(id: string, data: any) {
    const res = await fetch(`/api/games/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update game');
    return await res.json();
  },

  async deleteGame(id: string) {
    const res = await fetch(`/api/games/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete game');
    return await res.json();
  },

  // ─── EVENTS ──────────────────────────────────────────────────────────────
  async getEvents(game?: string) {
    const url = game ? `/api/events?game=${encodeURIComponent(game)}` : '/api/events';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch events');
    return await res.json();
  },

  async createEvent(data: any) {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to create event');
    return await res.json();
  },

  async updateEvent(id: string, data: any) {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update event');
    return await res.json();
  },

  async deleteEvent(id: string) {
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete event');
    return await res.json();
  },

  // ─── PLAYERS ─────────────────────────────────────────────────────────────
  async getPlayers(params?: { search?: string; game?: string; status?: string }) {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.game) q.append('game', params.game);
    if (params?.status) q.append('status', params.status);
    const res = await fetch(`/api/players?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch players');
    return await res.json();
  },

  async createPlayer(data: any) {
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to create player');
    return await res.json();
  },

  async updatePlayer(id: string, data: any) {
    const res = await fetch(`/api/players/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update player');
    return await res.json();
  },

  async deletePlayer(id: string) {
    const res = await fetch(`/api/players/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete player');
    return await res.json();
  },

  // ─── LEADERBOARD ─────────────────────────────────────────────────────────
  async getLeaderboard(game?: string) {
    const url = game && game !== 'ALL' ? `/api/leaderboard?game=${encodeURIComponent(game)}` : '/api/leaderboard';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return await res.json();
  },

  async updateLeaderboard(id: string, data: any) {
    const res = await fetch(`/api/leaderboard/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update leaderboard stats');
    return await res.json();
  },

  async resetLeaderboard(id: string) {
    const res = await fetch(`/api/leaderboard/${id}/reset`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to reset leaderboard');
    return await res.json();
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
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to record match score');
    return await res.json();
  },

  // ─── REGISTRATIONS ───────────────────────────────────────────────────────
  async getRegistrations(params?: { game?: string; status?: string; search?: string }) {
    const q = new URLSearchParams();
    if (params?.game) q.append('game', params.game);
    if (params?.status) q.append('status', params.status);
    if (params?.search) q.append('search', params.search);
    const res = await fetch(`/api/registrations?${q.toString()}`, {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch registrations');
    return await res.json();
  },

  async submitRegistration(data: any) {
    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Registration submission failed');
    return await res.json();
  },

  async updateRegistrationStatus(id: string, status: string) {
    const res = await fetch(`/api/registrations/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update registration');
    return await res.json();
  },

  async deleteRegistration(id: string) {
    const res = await fetch(`/api/registrations/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete registration');
    return await res.json();
  },

  async createLeaderboardEntry(data: any) {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to add leaderboard player');
    return await res.json();
  },

  async deleteLeaderboard(id: string) {
    const res = await fetch(`/api/leaderboard/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete leaderboard player');
    return await res.json();
  },

  // ─── DATABASE EXPLORER ───────────────────────────────────────────────────
  async getDatabaseTable(table: string) {
    const res = await fetch(`/api/database/${table}`, {
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch database table');
    return await res.json();
  },

  async deleteDatabaseRow(table: string, id: string) {
    const res = await fetch(`/api/database/${table}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).error || `Failed to delete record from ${table}`);
    return await res.json();
  }
};
