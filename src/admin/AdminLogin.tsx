import React, { useState } from 'react';
import { adminApi } from '../lib/adminApi';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onExitToPublic: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onExitToPublic }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playClick();
    setError(null);
    setLoading(true);

    try {
      await adminApi.login(username, password);
      sfx.playSuccess();
      onLoginSuccess();
    } catch (err: any) {
      sfx.playError();
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4 selection:bg-[#D71920] selection:text-white relative overflow-hidden">
      {/* Background artwork subtle backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none"
        style={{ backgroundImage: `url('/assets/blackhawk_hero_official_banner.png')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/90 to-[#080808]/80 pointer-events-none" />

      {/* Login Box */}
      <div className="relative w-full max-w-md bg-[#0d0d10] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img
            src="/assets/blackhawk_navbar_logo.png"
            alt="BlackHawk"
            className="h-8 w-auto mx-auto object-contain mb-3"
          />
          <h1 className="font-cinzel text-xl font-bold tracking-wider text-white uppercase">
            ADMIN HIGH COMMAND
          </h1>
          <p className="text-xs text-[#787880]">
            Secure database authentication required.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-600/40 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#D71920] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider text-[#a0a0a5] uppercase mb-1.5">
              Admin Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#08080a] border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#D71920] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider text-[#a0a0a5] uppercase mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#08080a] border border-white/10 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-[#D71920] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#D71920] to-[#b8141b] hover:from-[#e3262e] hover:to-[#c4161d] text-white text-xs font-semibold tracking-wider uppercase transition-all duration-200 shadow-[0_0_15px_rgba(215,25,32,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Database</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="pt-4 border-t border-white/[0.06] text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D71920]" />
            <span>BCRYPT PROTECTED SESSION AUTHENTICATION</span>
          </div>

          <div>
            <button
              onClick={onExitToPublic}
              className="text-xs text-[#808088] hover:text-white transition-colors cursor-pointer"
            >
              ← Return to Public Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
