import React, { useState } from 'react';
import { tournamentStore } from '../lib/tournamentStore';
import { Search } from 'lucide-react';

export const AdminAuditLog: React.FC = () => {
  const [search, setSearch] = useState('');
  const logs = tournamentStore.getAuditLogs();

  const filtered = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.adminUser.toLowerCase().includes(search.toLowerCase()) ||
    l.targetEntity.toLowerCase().includes(search.toLowerCase()) ||
    (l.newValue && l.newValue.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
            ADMIN AUDIT TRAIL & INTEGRITY LOGS
          </h2>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Immutable log of all prize modifications, result entries, registrations approvals, and disciplinary changes.
          </p>
        </div>

        <div className="flex items-center gap-2 font-tech text-xs">
          <span className="px-3 py-1.5 rounded bg-black/60 border border-white/10 text-zinc-300">
            TOTAL LOGGED ACTIONS: <strong className="text-white">{logs.length}</strong>
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search action, admin, entity, or value..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-xs text-white focus:outline-none focus:border-red-500"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-[#0b0b0f] border border-white/10 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-tech text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-[10px] uppercase tracking-widest text-zinc-400">
                <th className="py-3 px-4">TIMESTAMP</th>
                <th className="py-3 px-4">OPERATOR & ROLE</th>
                <th className="py-3 px-4">ACTION EXECUTED</th>
                <th className="py-3 px-4">AFFECTED ENTITY</th>
                <th className="py-3 px-4">OLD STATE</th>
                <th className="py-3 px-4">NEW STATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-white block">{l.adminUser}</span>
                    <span className="text-[10px] text-[#ff4d4d] font-bold uppercase">{l.role}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#ff3333] font-bold">
                    {l.action}
                  </td>
                  <td className="py-3 px-4 text-zinc-300">
                    <span className="block text-white font-semibold">{l.targetEntity}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{l.targetId}</span>
                  </td>
                  <td className="py-3 px-4 text-zinc-400 font-sans max-w-xs truncate">
                    {l.oldValue || '—'}
                  </td>
                  <td className="py-3 px-4 text-green-300 font-sans max-w-xs truncate">
                    {l.newValue || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
