export interface DiscordUser {
  id: string;
  username: string;
  global_name: string;
  discriminator: string;
  avatar: string | null;
  avatarUrl: string;
  inServer: boolean;
  roles?: string[];
  joinedAt?: string | null;
  verified: boolean;
  isDemo?: boolean;
}

export interface DiscordConfig {
  configured: boolean;
  clientId: string | null;
  redirectUri: string;
  guildInvite: string;
}

export const discordAuthService = {
  // Fetch Discord configuration
  async getConfig(): Promise<DiscordConfig> {
    const res = await fetch('/api/auth/discord/config');
    if (!res.ok) throw new Error('Failed to get Discord config');
    return res.json();
  },

  // Get OAuth authorization URL with cryptographically secure state
  async getAuthUrl(): Promise<{ configured: boolean; url: string; state?: string }> {
    const res = await fetch('/api/auth/discord/url');
    if (!res.ok) throw new Error('Failed to get Discord authorization URL');
    return res.json();
  },

  // Exchange code + state for user profile
  async handleCallback(code: string, state?: string): Promise<DiscordUser> {
    const res = await fetch('/api/auth/discord/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to authenticate with Discord');
    }
    return data.user;
  },

  // Check server membership for a Discord ID (FAIL CLOSED)
  async checkServerMembership(userId: string): Promise<{ inServer: boolean; checked: boolean }> {
    try {
      const res = await fetch(`/api/auth/discord/check-membership/${encodeURIComponent(userId)}`);
      if (!res.ok) return { inServer: false, checked: false };
      return res.json();
    } catch {
      return { inServer: false, checked: false };
    }
  },

  // Stored session helpers (public profile display only)
  saveUser(user: DiscordUser) {
    sessionStorage.setItem('bh_discord_user', JSON.stringify(user));
  },

  getSavedUser(): DiscordUser | null {
    try {
      const data = sessionStorage.getItem('bh_discord_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  clearUser() {
    sessionStorage.removeItem('bh_discord_user');
  }
};
