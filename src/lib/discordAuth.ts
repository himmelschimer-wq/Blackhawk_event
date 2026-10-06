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

  // Get OAuth authorization URL
  async getAuthUrl(redirectUri?: string): Promise<{ configured: boolean; url: string; state?: string }> {
    const params = redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : '';
    const res = await fetch(`/api/auth/discord/url${params}`);
    if (!res.ok) throw new Error('Failed to get Discord authorization URL');
    return res.json();
  },

  // Exchange code for user profile
  async handleCallback(code: string, redirectUri?: string): Promise<DiscordUser> {
    const res = await fetch('/api/auth/discord/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to authenticate with Discord');
    }
    return data.user;
  },

  // Check server membership for a Discord ID
  async checkServerMembership(userId: string): Promise<{ inServer: boolean; checked: boolean }> {
    const res = await fetch(`/api/auth/discord/check-membership/${userId}`);
    if (!res.ok) return { inServer: true, checked: false };
    return res.json();
  },

  // Stored session helpers
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
