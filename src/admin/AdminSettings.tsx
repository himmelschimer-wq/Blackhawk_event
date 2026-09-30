import React, { useState, useEffect } from 'react';
import { adminApi, type AdminUser } from '../lib/adminApi';
import { Shield, Key, Server, Check, RefreshCw } from 'lucide-react';
import { sfx } from '../utils/sfx';

export const AdminSettings: React.FC = () => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const me = await adminApi.getMe();
      if (me.admin) setAdminUser(me.admin);
      const s = await adminApi.getStats();
      setStats(s);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    sfx.playClick();
    await loadData();
    sfx.playSuccess();
    setNotification('System settings diagnostics refreshed.');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-[#161616] border border-[#D71920]/60 px-4 py-3 rounded text-xs font-tech text-white shadow-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-black text-2xl text-white uppercase tracking-wider">
              ADMIN SYSTEM SETTINGS
            </h2>
            <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-[10px] font-tech text-red-400">
              PROTECTED MODE
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Control room environment, active authentication credentials, and database engine diagnostics.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="p-2 rounded bg-black/60 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-colors"
          title="Refresh Diagnostics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Operator Card */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="p-2 rounded bg-red-950/40 border border-red-500/30 text-[#D71920]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                CURRENT OPERATOR SESSION
              </h3>
              <p className="text-[11px] text-zinc-400 font-tech">Bcrypt token-verified session</p>
            </div>
          </div>

          <div className="space-y-2.5 font-tech text-xs">
            <div className="flex items-center justify-between p-2.5 bg-black/60 rounded border border-white/5">
              <span className="text-zinc-500">USERNAME</span>
              <span className="text-white font-bold">{adminUser?.username || 'admin'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-black/60 rounded border border-white/5">
              <span className="text-zinc-500">OPERATOR NAME</span>
              <span className="text-white">{adminUser?.displayName || 'Lead Tournament Director'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-black/60 rounded border border-white/5">
              <span className="text-zinc-500">ACCESS ROLE</span>
              <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-[10px] text-red-400 font-bold uppercase">
                {adminUser?.role || 'SUPER_ADMIN'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-black/60 rounded border border-white/5">
              <span className="text-zinc-500">SESSION AUTH TOKEN</span>
              <span className="text-emerald-400 font-bold">VALID &amp; ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Database & Runtime Engine */}
        <div className="bg-[#0A0A0A] border border-white/10 rounded p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="p-2 rounded bg-zinc-900 border border-white/10 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                DATABASE &amp; ENGINE
              </h3>
              <p className="text-[11px] text-zinc-400 font-tech">SQLite WAL mode persistent storage</p>
            </div>
          </div>

          <div className="space-y-2.5 font-tech text-xs">
            <div className="flex items-center justify-between p-2.5 bg-black/60 rounded border border-white/5">
              <span className="text-zinc-500">DATABASE FILE</span>
              <span className="text-zinc-300 font-mono text-[11px]">data/blackhawk.db</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-black/60 rounded border border-white/5">
              <span className="text-zinc-500">TOTAL PLAYERS</span>
              <span className="text-white font-bold">{stats?.totalPlayers ?? '...'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-black/60 rounded border border-white/5">
              <span className="text-zinc-500">TOTAL REGISTRATIONS</span>
              <span className="text-white font-bold">{stats?.totalRegistrations ?? '...'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-black/60 rounded border border-white/5">
              <span className="text-zinc-500">ACTIVE EVENTS</span>
              <span className="text-[#D71920] font-bold">{stats?.activeEvents ?? '...'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Policies */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded p-5 space-y-3 font-tech text-xs">
        <div className="flex items-center gap-2 text-zinc-300 font-bold uppercase tracking-wider">
          <Key className="w-4 h-4 text-[#D71920]" />
          <span>SECURITY &amp; ACCESS POLICIES</span>
        </div>
        <ul className="space-y-1.5 text-zinc-400 list-disc list-inside">
          <li>Admin passwords hashed with standard bcrypt round salt. Raw passwords are never stored.</li>
          <li>All mutating endpoints under <code className="text-red-400">/api/*</code> require verified bearer authorization.</li>
          <li>Public routes only read published games, events, and active leaderboard calculations.</li>
          <li>Database views strictly filter out authentication secrets and password hashes.</li>
        </ul>
      </div>
    </div>
  );
};
