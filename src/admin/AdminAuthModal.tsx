import React, { useState } from 'react';
import { tournamentStore, type UserRole } from '../lib/tournamentStore';
import { BlackhawkLogo } from '../components/BlackhawkLogo';
import { ShieldCheck, Lock, Eye, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface AdminAuthProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthProps> = ({ onSuccess, onCancel }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [adminName, setAdminName] = useState('Commander_Viper');
  const [passkey, setPasskey] = useState('blackhawk2026');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) {
      setError('Please provide the authorization security passkey.');
      return;
    }

    sfx.playClick();
    tournamentStore.login(selectedRole, adminName || 'Blackhawk_Admin');
    sfx.playSuccess();
    onSuccess();
  };

  const setRolePreset = (role: UserRole, defaultName: string) => {
    sfx.playClick();
    setSelectedRole(role);
    setAdminName(defaultName);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0b10] border-2 border-red-600/70 rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-[0_0_60px_rgba(225,6,0,0.4)] relative overflow-hidden">
        
        {/* Top Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-700 via-[#e10600] to-red-900"></div>

        {/* Brand & Title */}
        <div className="text-center mb-6">
          <BlackhawkLogo size="md" showSubtitle={false} className="justify-center mb-3" />
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
            ADMIN CONTROL ROOM
          </h2>
          <span className="font-tech text-xs text-red-300 uppercase tracking-widest block font-bold mt-1">
            AUTHORIZED LEAGUE OPERATORS ONLY
          </span>
        </div>

        {/* Role Selector Badges */}
        <div className="mb-6">
          <label className="block text-xs font-tech text-zinc-400 uppercase tracking-wider font-bold mb-2">
            SELECT ACCESS PRIVILEGE LEVEL:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setRolePreset('ADMIN', 'SuperAdmin_Hawk')}
              className={`p-3 rounded-lg border text-center transition-all ${
                selectedRole === 'ADMIN'
                  ? 'bg-red-950/80 border-red-500 text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]'
                  : 'bg-black/50 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
              }`}
            >
              <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-[#ff2a2a]" />
              <span className="block font-display font-black text-sm uppercase">ADMIN</span>
              <span className="text-[10px] font-tech text-zinc-400 block">Full Authority</span>
            </button>

            <button
              type="button"
              onClick={() => setRolePreset('ORGANIZER', 'OpsDirector_Rohan')}
              className={`p-3 rounded-lg border text-center transition-all ${
                selectedRole === 'ORGANIZER'
                  ? 'bg-red-950/80 border-red-500 text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]'
                  : 'bg-black/50 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
              }`}
            >
              <KeyRound className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <span className="block font-display font-black text-sm uppercase">ORGANIZER</span>
              <span className="text-[10px] font-tech text-zinc-400 block">Events & Results</span>
            </button>

            <button
              type="button"
              onClick={() => setRolePreset('VIEWER', 'Auditor_Spectator')}
              className={`p-3 rounded-lg border text-center transition-all ${
                selectedRole === 'VIEWER'
                  ? 'bg-red-950/80 border-red-500 text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]'
                  : 'bg-black/50 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
              }`}
            >
              <Eye className="w-5 h-5 mx-auto mb-1 text-blue-400" />
              <span className="block font-display font-black text-sm uppercase">VIEWER</span>
              <span className="text-[10px] font-tech text-zinc-400 block">Read-Only Telemetry</span>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
              Operator Handle
            </label>
            <input
              type="text"
              required
              value={adminName}
              onChange={e => setAdminName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-lg font-tech text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold flex items-center justify-between">
              <span>Security Passkey</span>
              <span className="text-[10px] text-zinc-500 font-mono">Demo: blackhawk2026</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={passkey}
                onChange={e => setPasskey(e.target.value)}
                placeholder="Enter passkey..."
                className="w-full pl-10 pr-3 py-2.5 bg-black/60 border border-white/10 rounded-lg font-tech text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded bg-red-950/60 border border-red-600/50 flex items-center gap-2 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-[#ff2a2a] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                onCancel();
              }}
              className="w-1/3 py-3 rounded-lg border border-white/10 text-xs font-tech font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="w-2/3 py-3 bg-[#e10600] hover:bg-[#ff1e1e] text-white font-display font-black text-sm tracking-widest uppercase clip-corner-tr flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,6,0,0.5)] transition-all cursor-pointer"
            >
              <span>ENTER CONTROL ROOM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
