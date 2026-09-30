import React, { useEffect, useState } from 'react';
import { discordAuthService, type DiscordUser } from '../lib/discordAuth';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const DiscordCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<DiscordUser | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code') || (urlParams.get('demo') ? 'DEMO_CODE' : null);
        const error = urlParams.get('error');
        const errorDesc = urlParams.get('error_description');

        if (error) {
          throw new Error(errorDesc || error || 'Authorization cancelled by user');
        }

        if (!code) {
          throw new Error('No authorization code returned from Discord');
        }

        const discordUser = await discordAuthService.handleCallback(code);
        discordAuthService.saveUser(discordUser);
        setUser(discordUser);
        setStatus('success');

        // Notify parent window if opened as popup
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            { type: 'DISCORD_AUTH_SUCCESS', user: discordUser },
            window.location.origin
          );
          setTimeout(() => {
            window.close();
          }, 1200);
        } else {
          // If not in popup, redirect back to home page after brief success
          setTimeout(() => {
            window.location.href = '/#register';
          }, 1500);
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Authentication failed');

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            { type: 'DISCORD_AUTH_ERROR', error: err.message },
            window.location.origin
          );
        }
      }
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0d0d12] border border-white/10 rounded-2xl p-6 text-center shadow-2xl space-y-4">
        {status === 'loading' && (
          <div className="space-y-3">
            <Loader2 className="w-10 h-10 text-[#5865F2] animate-spin mx-auto" />
            <h2 className="font-cinzel text-lg font-bold text-white uppercase tracking-wider">
              VERIFYING DISCORD...
            </h2>
            <p className="text-xs text-zinc-400 font-sans">
              Authenticating credentials & checking server membership...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h2 className="font-cinzel text-lg font-bold text-white uppercase tracking-wider">
              DISCORD VERIFIED!
            </h2>
            {user && (
              <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-black/40 border border-white/10">
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-7 h-7 rounded-full object-cover border border-white/20"
                />
                <span className="text-xs font-mono font-bold text-white">
                  @{user.username}
                </span>
              </div>
            )}
            <p className="text-[11px] text-zinc-400 font-sans">
              Connecting you back to registration...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <AlertCircle className="w-10 h-10 text-[#D71920] mx-auto" />
            <h2 className="font-cinzel text-lg font-bold text-white uppercase tracking-wider">
              VERIFICATION FAILED
            </h2>
            <p className="text-xs text-red-300 font-sans">{errorMessage}</p>
            <button
              onClick={() => {
                if (window.opener) window.close();
                else window.location.href = '/';
              }}
              className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
