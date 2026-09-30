import React, { useState, useEffect } from 'react';
import { adminApi } from '../lib/adminApi';
import { 
  Users, 
  Gamepad2, 
  Calendar, 
  Award, 
  DollarSign, 
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { sfx } from '../utils/sfx';

interface DashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<DashboardProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<any>(null);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, regsData, eventsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getRegistrations(),
        adminApi.getEvents()
      ]);
      setStats(statsData);
      setRecentRegistrations(Array.isArray(regsData) ? regsData.slice(0, 5) : []);
      setUpcomingEvents(Array.isArray(eventsData) ? eventsData.slice(0, 5) : []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wide uppercase">
            ADMIN OVERVIEW & METRICS
          </h1>
          <p className="text-xs text-[#808088] mt-0.5">
            Real-time live database state across all tournament disciplines.
          </p>
        </div>

        <button
          onClick={() => {
            sfx.playClick();
            loadData();
          }}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.03] text-xs text-zinc-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* ─── REAL DATABASE STATISTICS GRID ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Players */}
        <div className="p-4 rounded-xl bg-[#0c0c0f] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-semibold tracking-wider uppercase">TOTAL PLAYERS</span>
            <Users className="w-3.5 h-3.5 text-[#D71920]" />
          </div>
          <p className="font-bebas text-2xl sm:text-3xl text-white tracking-wider">
            {stats ? stats.totalPlayers : 0}
          </p>
        </div>

        {/* Total Registrations */}
        <div className="p-4 rounded-xl bg-[#0c0c0f] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-semibold tracking-wider uppercase">REGISTRATIONS</span>
            <Award className="w-3.5 h-3.5 text-[#D71920]" />
          </div>
          <p className="font-bebas text-2xl sm:text-3xl text-white tracking-wider">
            {stats ? stats.totalRegistrations : 0}
          </p>
        </div>

        {/* Active Events */}
        <div className="p-4 rounded-xl bg-[#0c0c0f] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-semibold tracking-wider uppercase">ACTIVE EVENTS</span>
            <Calendar className="w-3.5 h-3.5 text-[#D71920]" />
          </div>
          <p className="font-bebas text-2xl sm:text-3xl text-white tracking-wider">
            {stats ? stats.activeEvents : 0}
          </p>
        </div>

        {/* Completed Events */}
        <div className="p-4 rounded-xl bg-[#0c0c0f] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-semibold tracking-wider uppercase">COMPLETED</span>
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <p className="font-bebas text-2xl sm:text-3xl text-white tracking-wider">
            {stats ? stats.completedEvents : 0}
          </p>
        </div>

        {/* Total Games */}
        <div className="p-4 rounded-xl bg-[#0c0c0f] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-semibold tracking-wider uppercase">TOTAL GAMES</span>
            <Gamepad2 className="w-3.5 h-3.5 text-[#D71920]" />
          </div>
          <p className="font-bebas text-2xl sm:text-3xl text-white tracking-wider">
            {stats ? stats.totalGames : 0}
          </p>
        </div>

        {/* Total Prize Pool */}
        <div className="p-4 rounded-xl bg-[#0c0c0f] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-[10px] font-semibold tracking-wider uppercase">PRIZE POOL</span>
            <DollarSign className="w-3.5 h-3.5 text-[#D71920]" />
          </div>
          <p className="font-bebas text-2xl sm:text-3xl text-[#f5c464] tracking-wider">
            ₹{stats ? Number(stats.totalPrizePool).toLocaleString() : 0}
          </p>
        </div>
      </div>

      {/* ─── TWO COLUMN TABLES: RECENT REGISTRATIONS & UPCOMING EVENTS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Registrations Table */}
        <div className="bg-[#0c0c0f] border border-white/[0.08] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <h2 className="font-cinzel text-sm font-bold text-white tracking-wider uppercase">
                RECENT REGISTRATIONS
              </h2>
              <p className="text-[10px] text-zinc-500">Direct entries from players</p>
            </div>
            <button
              onClick={() => onNavigateTab('registrations')}
              className="text-xs text-[#D71920] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentRegistrations.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">No registrations recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-semibold text-zinc-500 border-b border-white/[0.04]">
                    <th className="pb-2">PLAYER</th>
                    <th className="pb-2">GAME</th>
                    <th className="pb-2">STATUS</th>
                    <th className="pb-2 text-right">DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {recentRegistrations.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.015]">
                      <td className="py-2.5 font-medium text-white">
                        {r.gamerTag}
                        <span className="block text-[10px] text-zinc-500 font-normal">{r.playerName}</span>
                      </td>
                      <td className="py-2.5 text-zinc-300">{r.gameName}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.status === 'APPROVED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-600/30' :
                          r.status === 'REJECTED' ? 'bg-red-950/60 text-red-400 border border-red-600/30' :
                          'bg-amber-950/60 text-amber-400 border border-amber-600/30'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-zinc-400 text-[10px]">
                        {new Date(r.registeredAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming Events Table */}
        <div className="bg-[#0c0c0f] border border-white/[0.08] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <h2 className="font-cinzel text-sm font-bold text-white tracking-wider uppercase">
                UPCOMING EVENTS
              </h2>
              <p className="text-[10px] text-zinc-500">Live & scheduled tournament brackets</p>
            </div>
            <button
              onClick={() => onNavigateTab('events')}
              className="text-xs text-[#D71920] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">No upcoming events scheduled.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-semibold text-zinc-500 border-b border-white/[0.04]">
                    <th className="pb-2">TOURNAMENT</th>
                    <th className="pb-2">GAME</th>
                    <th className="pb-2">PRIZE</th>
                    <th className="pb-2 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {upcomingEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-white/[0.015]">
                      <td className="py-2.5 font-medium text-white">
                        {ev.title}
                        <span className="block text-[10px] text-zinc-500 font-normal">{ev.date} • {ev.time}</span>
                      </td>
                      <td className="py-2.5 text-zinc-300">{ev.gameName}</td>
                      <td className="py-2.5 font-bebas text-sm text-[#f5c464]">₹{ev.prizePool.toLocaleString()}</td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-950/60 text-red-400 border border-red-600/30">
                          {ev.eventStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Database Status Indicator */}
      <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>REAL DATABASE CONNECTED • SQLite Engine active at <code className="text-zinc-400">data/blackhawk.db</code></span>
        </div>
        <button
          onClick={() => onNavigateTab('database')}
          className="text-zinc-400 hover:text-white underline text-[11px] cursor-pointer"
        >
          Open Database Explorer →
        </button>
      </div>
    </div>
  );
};
