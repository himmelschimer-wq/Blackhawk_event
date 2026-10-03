import React, { useState, useEffect } from 'react';
import { adminApi } from '../lib/adminApi';
import { Search, Filter, Plus, Edit2, Trash2, Eye, X, Check, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface Player {
  id: string;
  fullName: string;
  gamerTag: string;
  discordUsername: string;
  game: string;
  team: string;
  status: string;
  createdAt: string;
}

export const AdminPlayers: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [gameFilter, setGameFilter] = useState('ALL');

  // Modal State
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [deleteConfirmPlayer, setDeleteConfirmPlayer] = useState<Player | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    gamerTag: '',
    discordUsername: '',
    game: 'BGMI',
    team: '',
    status: 'ACTIVE'
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getPlayers({
        search: search || undefined,
        game: gameFilter !== 'ALL' ? gameFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      setPlayers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load players from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDatabase = async () => {
    try {
      setSyncing(true);
      sfx.playClick();
      const res = await adminApi.syncDatabase();
      showNotify(res.message || 'Supabase registrations and players synchronized successfully.');
      await fetchPlayers();
    } catch (err: any) {
      alert(err.message || 'Database synchronization failed.');
    } finally {
      setSyncing(false);
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
    fetchPlayers();
  }, [gameFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlayers();
  };

  const openCreateModal = () => {
    sfx.playClick();
    setFormData({
      fullName: '',
      gamerTag: '',
      discordUsername: '',
      game: games[0]?.name || 'BGMI',
      team: '',
      status: 'ACTIVE'
    });
    setFormError(null);
    setModalMode('create');
  };

  const openEditModal = (player: Player) => {
    sfx.playClick();
    setSelectedPlayer(player);
    setFormData({
      fullName: player.fullName,
      gamerTag: player.gamerTag,
      discordUsername: player.discordUsername,
      game: player.game,
      team: player.team || '',
      status: player.status
    });
    setFormError(null);
    setModalMode('edit');
  };

  const openViewModal = (player: Player) => {
    sfx.playClick();
    setSelectedPlayer(player);
    setModalMode('view');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.gamerTag.trim()) {
      setFormError('Player full name and gamer tag are required.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (modalMode === 'create') {
        await adminApi.createPlayer(formData);
        showNotify(`Player ${formData.fullName} (@${formData.gamerTag}) created successfully.`);
      } else if (modalMode === 'edit' && selectedPlayer) {
        await adminApi.updatePlayer(selectedPlayer.id, formData);
        showNotify(`Player ${formData.fullName} updated successfully.`);
      }

      sfx.playSuccess();
      setModalMode(null);
      fetchPlayers();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmPlayer) return;
    try {
      sfx.playClick();
      await adminApi.deletePlayer(deleteConfirmPlayer.id);
      showNotify(`Player ${deleteConfirmPlayer.fullName} deleted permanently.`);
      setDeleteConfirmPlayer(null);
      fetchPlayers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete player');
    }
  };

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
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
              PLAYER MANAGEMENT
            </h2>
            <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-[10px] font-tech text-red-400">
              DATABASE SYNCED
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Manage real player profiles, team rosters, and game assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncDatabase}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded bg-red-950/40 border border-red-500/40 text-red-400 hover:text-white hover:bg-red-900/60 transition-colors font-tech text-xs disabled:opacity-50"
            title="Sync Players and Registrations with Supabase Database"
          >
            <Database className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'SYNCING...' : 'SYNC DB'}</span>
          </button>
          <button
            onClick={() => fetchPlayers()}
            className="p-2 rounded bg-black/60 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-colors"
            title="Refresh from Database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#D71920] hover:bg-[#E3262E] text-white font-tech font-bold text-xs uppercase tracking-wider rounded flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(215,25,32,0.4)]"
          >
            <Plus className="w-4 h-4" />
            <span>ADD PLAYER</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0E0E0E] p-4 rounded border border-white/10">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, tag, discord..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-xs text-white focus:outline-none focus:border-red-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="px-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-xs text-white focus:outline-none"
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
            className="px-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-xs text-white focus:outline-none"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="DISQUALIFIED">DISQUALIFIED</option>
          </select>
        </div>
      </div>

      {/* Database Error Banner */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/50 rounded flex items-center gap-3 text-red-300 text-xs font-tech">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Players Table */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/60 text-[11px] font-tech uppercase tracking-widest text-zinc-400">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">PLAYER</th>
                <th className="py-3 px-4">USERNAME / DISCORD</th>
                <th className="py-3 px-4">GAME</th>
                <th className="py-3 px-4">TEAM</th>
                <th className="py-3 px-4">REGISTERED DATE</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-tech text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#D71920]" />
                    <span>Loading athletes from database...</span>
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    No players found in database. Click <span className="text-[#D71920]">+ ADD PLAYER</span> to register the first athlete.
                  </td>
                </tr>
              ) : (
                players.map((p) => {
                  const tag = p.gamerTag || (p as any).gamer_tag || 'player';
                  const name = p.fullName || (p as any).full_name || tag;
                  const discord = p.discordUsername || (p as any).discord_username || 'N/A';
                  const game = p.game || 'ALL';
                  const team = p.team || (p as any).team_name;
                  const dateStr = p.createdAt || (p as any).created_at || (p as any).joined_at;

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                        {p.id && p.id.length > 12 ? p.id.slice(0, 10) + '...' : p.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/15 bg-zinc-900 shrink-0 flex items-center justify-center">
                            <img
                              src={`https://unavatar.io/discord/${encodeURIComponent(discord.trim().replace(/^@/, ''))}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(tag)}%26backgroundColor%3D09090b`}
                              alt={tag}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(tag)}&backgroundColor=09090b,18181b`;
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-white">{name}</div>
                            <div className="text-[11px] text-red-400 font-mono">@{tag}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-300 font-mono text-[11px]">
                        {discord}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-[10px] font-bold text-zinc-300">
                          {game}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {team || <span className="text-zinc-600 italic">Solo</span>}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                            : p.status === 'DISQUALIFIED'
                            ? 'bg-red-950/60 text-red-400 border-red-500/40'
                            : 'bg-zinc-800 text-zinc-400 border-white/10'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openViewModal(p)}
                          className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                          title="Edit Player"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmPlayer(p)}
                          className="p-1.5 rounded hover:bg-red-950/60 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Delete Player"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0E0E0E] border border-white/10 rounded-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">
                {modalMode === 'create' ? 'ADD NEW PLAYER' : 'EDIT PLAYER'}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 bg-red-950/40 border border-red-500/50 rounded text-red-300 text-xs font-tech">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 font-tech text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">FULL NAME *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">GAMER TAG / IGN *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Phoenix_Viper"
                    value={formData.gamerTag}
                    onChange={(e) => setFormData({ ...formData, gamerTag: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">DISCORD USERNAME</label>
                  <input
                    type="text"
                    placeholder="e.g. viper#9999"
                    value={formData.discordUsername}
                    onChange={(e) => setFormData({ ...formData, discordUsername: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">PRIMARY GAME</label>
                  <select
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                  >
                    {games.map((g) => (
                      <option key={g.id} value={g.name}>{g.name}</option>
                    ))}
                    <option value="ALL">ALL / MULTI-DISCIPLINE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">TEAM / ROSTER</label>
                  <input
                    type="text"
                    placeholder="e.g. Team Inferno"
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">STATUS</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="DISQUALIFIED">DISQUALIFIED</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded bg-black/60 border border-white/15 text-zinc-300 hover:text-white hover:bg-white/5"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-[#D71920] hover:bg-[#E3262E] text-white font-bold rounded flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(215,25,32,0.4)] disabled:opacity-50"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalMode === 'create' ? 'CREATE PLAYER' : 'SAVE CHANGES'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {modalMode === 'view' && selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0E0E0E] border border-white/10 rounded-lg p-6 shadow-2xl relative font-tech text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">
                ATHLETE DETAILS
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-black/60 rounded border border-white/5">
                <span className="text-zinc-500 block text-[10px]">FULL NAME</span>
                <span className="text-white font-bold text-sm">{selectedPlayer.fullName}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-black/60 rounded border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">GAMER TAG</span>
                  <span className="text-red-400 font-bold">{selectedPlayer.gamerTag}</span>
                </div>
                <div className="p-3 bg-black/60 rounded border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">DISCORD</span>
                  <span className="text-zinc-300">{selectedPlayer.discordUsername || 'N/A'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-black/60 rounded border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">PRIMARY GAME</span>
                  <span className="text-zinc-300">{selectedPlayer.game}</span>
                </div>
                <div className="p-3 bg-black/60 rounded border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">TEAM</span>
                  <span className="text-zinc-300">{selectedPlayer.team || 'Solo'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-black/60 rounded border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">STATUS</span>
                  <span className="text-white font-bold">{selectedPlayer.status}</span>
                </div>
                <div className="p-3 bg-black/60 rounded border border-white/5">
                  <span className="text-zinc-500 block text-[10px]">REGISTERED AT</span>
                  <span className="text-zinc-300">{new Date(selectedPlayer.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10 mt-6">
              <button
                onClick={() => setModalMode(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded font-tech text-xs"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (Requirement 13) */}
      {deleteConfirmPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111111] border border-red-500/40 rounded p-6 shadow-2xl relative font-tech text-xs">
            <div className="flex items-center gap-3 text-red-500 mb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-display font-black text-base text-white uppercase">
                DELETE THIS PLAYER?
              </h3>
            </div>
            <p className="text-zinc-400 mb-4">
              Are you sure you want to permanently delete <strong className="text-white">{deleteConfirmPlayer.fullName}</strong> (@{deleteConfirmPlayer.gamerTag})?
            </p>
            <p className="text-red-400 text-[11px] mb-5 font-bold uppercase tracking-wider">
              This action cannot be undone. All linked leaderboard records will be removed.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmPlayer(null)}
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
