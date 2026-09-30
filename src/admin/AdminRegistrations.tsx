import React, { useState, useEffect } from 'react';
import { adminApi } from '../lib/adminApi';
import { Search, Filter, Check, X, Trash2, Eye, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface Registration {
  id: string;
  playerId: string;
  playerName: string;
  gamerTag: string;
  discordUsername: string;
  gameId: string;
  gameName: string;
  eventId?: string;
  eventTitle?: string;
  teamName?: string;
  teamMembers?: string;
  gameSpecificData?: string;
  status: string;
  registeredAt: string;
}

export const AdminRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [games, setGames] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Action States
  const [viewDetailsReg, setViewDetailsReg] = useState<Registration | null>(null);
  const [deleteConfirmReg, setDeleteConfirmReg] = useState<Registration | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getRegistrations({
        game: gameFilter !== 'ALL' ? gameFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search || undefined
      });
      setRegistrations(data);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch registrations from database.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      const gList = await adminApi.getGames();
      setGames(gList);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [gameFilter, statusFilter]);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleStatusChange = async (reg: Registration, newStatus: string) => {
    try {
      sfx.playClick();
      await adminApi.updateRegistrationStatus(reg.id, newStatus);
      showNotify(`Registration ${reg.id} marked as ${newStatus}.`);
      fetchRegistrations();
    } catch (err: any) {
      alert(err.message || `Failed to update status to ${newStatus}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmReg) return;
    try {
      sfx.playClick();
      await adminApi.deleteRegistration(deleteConfirmReg.id);
      showNotify(`Registration ${deleteConfirmReg.id} deleted permanently.`);
      setDeleteConfirmReg(null);
      fetchRegistrations();
    } catch (err: any) {
      alert(err.message || 'Failed to delete registration.');
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(registrations.length / pageSize) || 1;
  const paginatedRegistrations = registrations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const parseGameSpecificDetails = (jsonStr?: string) => {
    if (!jsonStr) return {};
    try {
      return JSON.parse(jsonStr);
    } catch {
      return { raw: jsonStr };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-[#161616] border border-[#D71920]/60 px-4 py-3 rounded text-xs font-tech text-white shadow-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-black text-2xl text-white uppercase tracking-wider">
              REGISTRATION MANAGEMENT
            </h2>
            <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-[10px] font-tech text-red-400">
              DATABASE INTAKE
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Process athlete event registrations, team roster clearances, and in-game UID verifications.
          </p>
        </div>

        <div className="flex items-center gap-2 font-tech text-xs">
          <button
            onClick={() => fetchRegistrations()}
            className="p-2 rounded bg-black/60 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-colors"
            title="Refresh Registrations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="px-3 py-1.5 rounded bg-black/60 border border-white/10 text-zinc-300">
            TOTAL INTAKE: <strong className="text-white">{registrations.length}</strong>
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0E0E0E] p-4 rounded border border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchRegistrations();
          }}
          className="relative w-full md:w-80"
        >
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, player, tag, discord..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-xs text-white focus:outline-none focus:border-red-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="px-3 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-xs text-white focus:outline-none"
            >
              <option value="ALL">ALL GAMES</option>
              {games.map((g) => (
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-xs text-white focus:outline-none"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="REGISTERED">REGISTERED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/50 rounded flex items-center gap-3 text-red-300 text-xs font-tech">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/60 text-[11px] font-tech uppercase tracking-widest text-zinc-400">
                <th className="py-3 px-4">REGISTRATION ID</th>
                <th className="py-3 px-4">PLAYER</th>
                <th className="py-3 px-4">GAME</th>
                <th className="py-3 px-4">TOURNAMENT / EVENT</th>
                <th className="py-3 px-4">TEAM</th>
                <th className="py-3 px-4">REGISTERED AT</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-tech text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#D71920]" />
                    <span>Loading intake registrations from database...</span>
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    No registrations found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400 font-bold">
                      {reg.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{reg.playerName}</div>
                      <div className="text-[11px] text-red-400 font-mono">@{reg.gamerTag}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-[10px] font-bold text-zinc-300">
                        {reg.gameName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 text-[11px]">
                      {reg.eventTitle || 'Open Tournament'}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      {reg.teamName || <span className="text-zinc-600 italic">Solo</span>}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                      {new Date(reg.registeredAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        reg.status === 'APPROVED'
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                          : reg.status === 'REJECTED'
                          ? 'bg-red-950/60 text-red-400 border-red-500/40'
                          : 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                      }`}>
                        {reg.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            sfx.playClick();
                            setViewDetailsReg(reg);
                          }}
                          className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                          title="View In-Game Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {reg.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleStatusChange(reg, 'APPROVED')}
                            className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-800 text-emerald-300 hover:text-white rounded border border-emerald-500/40 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="Approve Registration"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        )}
                        {reg.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleStatusChange(reg, 'REJECTED')}
                            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded border border-white/10 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="Reject Registration"
                          >
                            <X className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            sfx.playClick();
                            setDeleteConfirmReg(reg);
                          }}
                          className="p-1.5 rounded hover:bg-red-950/60 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Delete Registration"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between font-tech text-xs text-zinc-400">
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, registrations.length)} of {registrations.length} registrations
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded bg-black/60 border border-white/10 disabled:opacity-30 hover:border-white/30 text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-white font-bold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded bg-black/60 border border-white/10 disabled:opacity-30 hover:border-white/30 text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW REGISTRATION DETAILS MODAL */}
      {viewDetailsReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0E0E0E] border border-white/10 rounded-lg p-6 shadow-2xl relative font-tech text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">
                  REGISTRATION CLEARANCE
                </h3>
                <span className="text-zinc-500 font-mono text-[11px]">{viewDetailsReg.id}</span>
              </div>
              <button
                onClick={() => setViewDetailsReg(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-black/60 rounded border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">ATHLETE</span>
                  <span className="text-white font-bold">{viewDetailsReg.playerName}</span>
                </div>
                <div className="p-3 bg-black/60 rounded border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">GAMER TAG</span>
                  <span className="text-red-400 font-bold">@{viewDetailsReg.gamerTag}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-black/60 rounded border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">DISCORD USERNAME</span>
                  <span className="text-zinc-300 font-mono">{viewDetailsReg.discordUsername || 'N/A'}</span>
                </div>
                <div className="p-3 bg-black/60 rounded border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">SELECTED GAME</span>
                  <span className="text-white font-bold">{viewDetailsReg.gameName}</span>
                </div>
              </div>

              <div className="p-3 bg-black/60 rounded border border-white/5">
                <span className="text-zinc-500 block text-[10px]">TEAM / SQUAD</span>
                <span className="text-zinc-200">{viewDetailsReg.teamName || 'Solo Entry'}</span>
                {viewDetailsReg.teamMembers && (
                  <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-zinc-400">
                    <strong className="text-zinc-300 block mb-0.5">Roster Members:</strong>
                    {viewDetailsReg.teamMembers}
                  </div>
                )}
              </div>

              {/* Game Specific Intake Details */}
              <div className="p-3 bg-black/60 rounded border border-white/5">
                <span className="text-zinc-500 block text-[10px] mb-1">IN-GAME CREDENTIALS / UID</span>
                {(() => {
                  const details = parseGameSpecificDetails(viewDetailsReg.gameSpecificData);
                  const keys = Object.keys(details);
                  if (keys.length === 0) return <span className="text-zinc-500 italic">None provided</span>;
                  return (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {keys.map((k) => (
                        <div key={k} className="bg-black/80 px-2 py-1.5 rounded border border-white/5">
                          <span className="text-[10px] text-zinc-500 block">{k}</span>
                          <span className="text-zinc-200 font-mono text-[11px]">{details[k]}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-6">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                viewDetailsReg.status === 'APPROVED'
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-950/40 text-amber-400 border-amber-500/30'
              }`}>
                Current: {viewDetailsReg.status}
              </span>

              <div className="flex items-center gap-2">
                {viewDetailsReg.status !== 'APPROVED' && (
                  <button
                    onClick={() => {
                      handleStatusChange(viewDetailsReg, 'APPROVED');
                      setViewDetailsReg(null);
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-tech text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Athlete</span>
                  </button>
                )}
                <button
                  onClick={() => setViewDetailsReg(null)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded font-tech text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111111] border border-red-500/40 rounded p-6 shadow-2xl relative font-tech text-xs">
            <div className="flex items-center gap-3 text-red-500 mb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-display font-black text-base text-white uppercase">
                DELETE REGISTRATION?
              </h3>
            </div>
            <p className="text-zinc-400 mb-4">
              Delete registration <strong className="text-white">{deleteConfirmReg.id}</strong> for <strong className="text-white">{deleteConfirmReg.playerName}</strong>?
            </p>
            <p className="text-red-400 text-[11px] mb-5 font-bold uppercase tracking-wider">
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmReg(null)}
                className="px-3.5 py-1.5 rounded bg-black border border-white/15 text-zinc-300 hover:text-white"
              >
                CANCEL
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 bg-[#D71920] hover:bg-[#E3262E] text-white font-bold rounded cursor-pointer shadow-[0_0_15px_rgba(215,25,32,0.5)]"
              >
                CONFIRM DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
