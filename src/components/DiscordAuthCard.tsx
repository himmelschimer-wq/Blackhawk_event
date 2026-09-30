import React, { useState, useEffect } from 'react';
import { discordAuthService, type DiscordUser } from '../lib/discordAuth';
import { Check, AlertTriangle, ExternalLink, RefreshCw, LogOut, Sparkles } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface DiscordAuthCardProps {
  onUserAuthenticated: (user: DiscordUser) => void;
  onUserDisconnected?: () => void;
  initialUser?: DiscordUser | null;
}

export const DiscordAuthCard: React.FC<DiscordAuthCardProps> = ({
  onUserAuthenticated,
  onUserDisconnected,
  initialUser = null,
}) => {
  const [user, setUser] = useState<DiscordUser | null>(initialUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingMembership, setCheckingMembership] = useState(false);

  useEffect(() => {
    // Check if user is already saved in session
    const saved = discordAuthService.getSavedUser();
    if (saved && !user) {
      setUser(saved);
      onUserAuthenticated(saved);
    }
  }, []);

  // Listen for popup callback message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'DISCORD_AUTH_SUCCESS') {
        const authedUser: DiscordUser = event.data.user;
        setUser(authedUser);
        discordAuthService.saveUser(authedUser);
        onUserAuthenticated(authedUser);
        setLoading(false);
        sfx.playSuccess();
      } else if (event.data?.type === 'DISCORD_AUTH_ERROR') {
        setError(event.data.error || 'Discord authentication failed');
        setLoading(false);
        sfx.playError();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onUserAuthenticated]);

  const handleConnectDiscord = async () => {
    sfx.playClick();
    setError(null);
    setLoading(true);

    try {
      const { url } = await discordAuthService.getAuthUrl();

      // Open OAuth popup
      const width = 500;
      const height = 750;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        url,
        'blackhawk_discord_auth',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Fallback to full page redirect if popup blocked
        window.location.href = url;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Discord login');
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    sfx.playClick();
    setUser(null);
    discordAuthService.clearUser();
    if (onUserDisconnected) onUserDisconnected();
  };

  const handleRecheckMembership = async () => {
    if (!user) return;
    sfx.playClick();
    setCheckingMembership(true);
    try {
      const res = await discordAuthService.checkServerMembership(user.id);
      const updated = { ...user, inServer: res.inServer };
      setUser(updated);
      discordAuthService.saveUser(updated);
      onUserAuthenticated(updated);
      if (res.inServer) sfx.playSuccess();
    } catch {
      // Ignored
    } finally {
      setCheckingMembership(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-white/10 bg-[#0c0c11] shadow-lg transition-all relative overflow-hidden">
      {/* Subtle Discord Indigo Top Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#5865F2] via-[#7289da] to-transparent" />

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-sans flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white font-bold ml-2">×</button>
        </div>
      )}

      {!user ? (
        /* NOT CONNECTED STATE */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#5865F2]/15 border border-[#5865F2]/30 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 fill-[#5865F2]" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinzel font-bold text-xs sm:text-sm text-white uppercase tracking-wider">
                  DISCORD VERIFICATION
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#5865F2]/20 border border-[#5865F2]/40 text-[9px] font-tech text-[#8ea1e1] font-bold">
                  RECOMMENDED
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5 leading-snug">
                Connect your Discord to sync your avatar for the leaderboard & verify server membership.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConnectDiscord}
            disabled={loading}
            className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752c4] active:scale-95 text-white font-tech font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(88,101,242,0.35)] transition-all cursor-pointer shrink-0"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            )}
            <span>{loading ? 'CONNECTING...' : 'CONNECT DISCORD'}</span>
          </button>
        </div>
      ) : (
        /* CONNECTED USER CARD */
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* User Profile Info */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#5865F2] shrink-0 bg-zinc-900 shadow-md">
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white leading-tight">
                    {user.global_name || user.username}
                  </h4>
                  <span className="text-[11px] text-[#5865F2] font-mono font-semibold">
                    @{user.username}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  {user.inServer ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-tech text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3" />
                      <span>SERVER MEMBER VERIFIED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-tech text-amber-400 font-bold bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      <span>NOT IN SERVER YET</span>
                    </span>
                  )}
                  {user.isDemo && (
                    <span className="text-[9px] font-tech text-zinc-500">
                      (Sandbox Mode)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-2.5 py-1.5 rounded bg-white/[0.04] hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-[11px] font-tech flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Disconnect Discord Account"
              >
                <LogOut className="w-3 h-3" />
                <span>Switch</span>
              </button>
            </div>
          </div>

          {/* Warning banner if not in BlackHawk Server */}
          {!user.inServer && (
            <div className="mt-2 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-[11px] text-amber-200 font-sans">
                You must be a member of the BlackHawk Discord server to receive tournament room credentials.
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="https://discord.gg/WrxHsKbHY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-[#5865F2] hover:bg-[#4752c4] text-white text-[10px] font-tech font-bold rounded flex items-center gap-1 transition-colors"
                >
                  <span>JOIN SERVER</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <button
                  type="button"
                  onClick={handleRecheckMembership}
                  disabled={checkingMembership}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-tech rounded flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${checkingMembership ? 'animate-spin' : ''}`} />
                  <span>Re-check</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
