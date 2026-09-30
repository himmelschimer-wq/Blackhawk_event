import React, { useState, useEffect } from 'react';
import { adminApi } from '../lib/adminApi';
import { Search, Edit2, RotateCcw, Trash2, Plus, Check, AlertCircle, RefreshCw, Calculator } from 'lucide-react';
import { sfx } from '../utils/sfx';
import { PlayerProfileModal, type PlayerProfileData } from '../components/PlayerProfileModal';

interface LeaderboardEntry {
  id: string;
  playerId: string;
  playerName: string;
  gamerTag: string;
  game: string;
  avatar: string;
  matches: number;
  wins: number;
  score: number;
  points: number;
  status: string;
  rank?: number;
  updatedAt: string;
}

export const AdminLeaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [games, setGames] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfilePlayer, setSelectedProfilePlayer] = useState<PlayerProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'points' | 'wins' | 'matches' | 'score'>('points');

  // Modals & Actions
  const [editingEntry, setEditingEntry] = useState<LeaderboardEntry | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<LeaderboardEntry | null>(null);
  const [resetConfirmEntry, setResetConfirmEntry] = useState<LeaderboardEntry | null>(null);

  // Form State for Edit
  const [editFormData, setEditFormData] = useState({
    points: 0,
    wins: 0,
    matches: 0,
    score: 0,
    status: 'ACTIVE',
    game: 'BGMI'
  });

  // Form State for Add
  const [addFormData, setAddFormData] = useState({
    playerName: '',
    gamerTag: '',
    game: 'BGMI',
    points: 0,
    wins: 0,
    matches: 0,
    score: 0
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getLeaderboard(gameFilter !== 'ALL' ? gameFilter : undefined);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leaderboard from database.');
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
    fetchLeaderboard();
  }, [gameFilter]);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const openEditModal = (entry: LeaderboardEntry) => {
    sfx.playClick();
    setEditingEntry(entry);
    setEditFormData({
      points: entry.points,
      wins: entry.wins,
      matches: entry.matches,
      score: entry.score,
      status: entry.status,
      game: entry.game
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    try {
      setFormSubmitting(true);
      await adminApi.updateLeaderboard(editingEntry.id, {
        points: Number(editFormData.points),
        wins: Number(editFormData.wins),
        matches: Number(editFormData.matches),
        score: Number(editFormData.score),
        status: editFormData.status,
        game: editFormData.game
      });

      sfx.playSuccess();
      showNotify(`Updated statistics for ${editingEntry.playerName}. Rankings automatically recalculated.`);
      setEditingEntry(null);
      fetchLeaderboard();
    } catch (err: any) {
      alert(err.message || 'Failed to update leaderboard entry.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFormData.playerName.trim() || !addFormData.gamerTag.trim()) {
      alert('Player name and gamer tag are required.');
      return;
    }

    try {
      setFormSubmitting(true);
      await adminApi.createLeaderboardEntry({
        playerName: addFormData.playerName,
        gamerTag: addFormData.gamerTag,
        game: addFormData.game,
        points: Number(addFormData.points),
        wins: Number(addFormData.wins),
        matches: Number(addFormData.matches),
        score: Number(addFormData.score)
      });

      sfx.playSuccess();
      showNotify(`Added ${addFormData.playerName} to leaderboard. Ranked automatically.`);
      setIsAddModalOpen(false);
      setAddFormData({
        playerName: '',
        gamerTag: '',
        game: games[0]?.name || 'BGMI',
        points: 0,
        wins: 0,
        matches: 0,
        score: 0
      });
      fetchLeaderboard();
    } catch (err: any) {
      alert(err.message || 'Failed to add player to leaderboard.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleResetStats = async () => {
    if (!resetConfirmEntry) return;
    try {
      sfx.playClick();
      await adminApi.resetLeaderboard(resetConfirmEntry.id);
      showNotify(`Reset statistics to 0 for ${resetConfirmEntry.playerName}.`);
      setResetConfirmEntry(null);
      fetchLeaderboard();
    } catch (err: any) {
      alert(err.message || 'Failed to reset statistics.');
    }
  };

  const handleDeleteEntry = async () => {
    if (!deleteConfirmEntry) return;
    try {
      sfx.playClick();
      await adminApi.deleteLeaderboard(deleteConfirmEntry.id);
      showNotify(`Removed ${deleteConfirmEntry.playerName} from leaderboard.`);
      setDeleteConfirmEntry(null);
      fetchLeaderboard();
    } catch (err: any) {
      alert(err.message || 'Failed to remove player.');
    }
  };

  // Filter and deterministic sort
  const filtered = entries
    .filter((entry) => {
      const matchSearch =
        entry.playerName.toLowerCase().includes(search.toLowerCase()) ||
        entry.gamerTag.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || entry.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'points') return b.points - a.points || b.wins - a.wins || b.score - a.score;
      if (sortBy === 'wins') return b.wins - a.wins || b.points - a.points;
      if (sortBy === 'matches') return b.matches - a.matches || b.points - a.points;
      if (sortBy === 'score') return b.score - a.score || b.points - a.points;
      return 0;
    });

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
              LEADERBOARD MANAGEMENT
            </h2>
            <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-[10px] font-tech text-red-400">
              AUTO-RANKING ACTIVE
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Real-time standings computed deterministically by: <strong className="text-zinc-200">Points &gt; Wins &gt; Score &gt; ID</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              sfx.playClick();
              window.location.hash = '#admin/calculator';
              window.location.reload();
            }}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-tech font-bold text-xs uppercase tracking-wider rounded flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-[#ff4d4d]" />
            <span>Points Calculator</span>
          </button>
          <button
            onClick={() => fetchLeaderboard()}
            className="p-2 rounded bg-black/60 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
            title="Refresh Standings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              sfx.playClick();
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-[#D71920] hover:bg-[#E3262E] text-white font-tech font-bold text-xs uppercase tracking-wider rounded flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(215,25,32,0.4)]"
          >
            <Plus className="w-4 h-4" />
            <span>ADD PLAYER</span>
          </button>
        </div>
      </div>

      {/* Search, Filter and Sort Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0E0E0E] p-4 rounded border border-white/10">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search player or gamertag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-xs text-white focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Game Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-tech text-zinc-400">GAME:</span>
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

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-tech text-zinc-400">STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-xs text-white focus:outline-none"
            >
              <option value="ALL">ALL</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-tech text-zinc-400">SORT:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-xs text-white focus:outline-none"
            >
              <option value="points">Points ↓</option>
              <option value="wins">Wins ↓</option>
              <option value="score">Score ↓</option>
              <option value="matches">Matches ↓</option>
            </select>
          </div>
        </div>
      </div>

      {/* Database Error Banner */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/50 rounded flex items-center gap-3 text-red-300 text-xs font-tech">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/60 text-[11px] font-tech uppercase tracking-widest text-zinc-400">
                <th className="py-3 px-4 text-center w-16">RANK</th>
                <th className="py-3 px-4">PLAYER</th>
                <th className="py-3 px-4">GAME</th>
                <th className="py-3 px-4 text-center">MATCHES</th>
                <th className="py-3 px-4 text-center">WINS</th>
                <th className="py-3 px-4 text-center">KILLS / SCORE</th>
                <th className="py-3 px-4 text-right">POINTS</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-tech text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#D71920]" />
                    <span>Loading real leaderboard standings from database...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500">
                    No leaderboard entries found in database.
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => {
                  const calculatedRank = item.rank || index + 1;
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 text-center font-display font-black text-sm">
                        {calculatedRank === 1 && <span className="text-[#D71920]">#01</span>}
                        {calculatedRank === 2 && <span className="text-zinc-200">#02</span>}
                        {calculatedRank === 3 && <span className="text-amber-500">#03</span>}
                        {calculatedRank > 3 && <span className="text-zinc-500">#{calculatedRank.toString().padStart(2, '0')}</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <div 
                          onClick={() => {
                            sfx.playClick();
                            setSelectedProfilePlayer({
                              id: item.id,
                              playerId: item.playerId,
                              playerName: item.playerName,
                              gamerTag: item.gamerTag,
                              game: item.game,
                              avatar: item.avatar,
                              rank: calculatedRank,
                              points: item.points,
                              wins: item.wins,
                              matches: item.matches,
                              score: item.score,
                              status: item.status,
                              updatedAt: item.updatedAt
                            });
                          }}
                          className="flex items-center gap-2.5 cursor-pointer group/player w-fit"
                          title="Click to view player profile"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/15 bg-zinc-900 shrink-0 flex items-center justify-center group-hover/player:border-[#D71920] transition-colors">
                            <img
                              src={item.avatar || `https://unavatar.io/discord/${encodeURIComponent(item.gamerTag)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(item.gamerTag)}`}
                              alt={item.gamerTag}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(item.gamerTag)}&backgroundColor=09090b,18181b`;
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover/player:text-[#ff4d4d] transition-colors flex items-center gap-1.5">
                              <span>{item.playerName}</span>
                              <span className="text-[10px] text-zinc-500 opacity-0 group-hover/player:opacity-100 transition-opacity">↗</span>
                            </div>
                            <div className="text-[11px] text-red-400 font-mono">@{item.gamerTag}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-[10px] font-bold text-zinc-300">
                          {item.game}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-zinc-300">
                        {item.matches}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-400">
                        {item.wins}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-zinc-300">
                        {item.score}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-display font-black text-sm text-[#D71920] tracking-wider">
                          {item.points.toLocaleString()} PTS
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-white/10'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="Edit Points & Stats"
                          >
                            <Edit2 className="w-3 h-3 text-[#D71920]" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              sfx.playClick();
                              setResetConfirmEntry(item);
                            }}
                            className="p-1 rounded hover:bg-amber-950/40 text-zinc-500 hover:text-amber-400 transition-colors"
                            title="Reset Stats to 0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              sfx.playClick();
                              setDeleteConfirmEntry(item);
                            }}
                            className="p-1 rounded hover:bg-red-950/60 text-zinc-500 hover:text-red-400 transition-colors"
                            title="Remove From Leaderboard"
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

      {/* EDIT STATS MODAL (Requirement 12) */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0E0E0E] border border-white/10 rounded-lg p-6 shadow-2xl relative font-tech text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">
                  EDIT PLAYER STATISTICS
                </h3>
                <span className="text-zinc-400 text-[11px]">{editingEntry.playerName} (@{editingEntry.gamerTag})</span>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">TOTAL POINTS *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editFormData.points}
                    onChange={(e) => setEditFormData({ ...editFormData, points: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white font-bold text-sm focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">Affects ranking directly</span>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">WINS *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editFormData.wins}
                    onChange={(e) => setEditFormData({ ...editFormData, wins: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">1st Tie-breaker</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">MATCHES PLAYED</label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.matches}
                    onChange={(e) => setEditFormData({ ...editFormData, matches: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">KILLS / SCORE</label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.score}
                    onChange={(e) => setEditFormData({ ...editFormData, score: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">2nd Tie-breaker</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">GAME DISCIPLINE</label>
                  <select
                    value={editFormData.game}
                    onChange={(e) => setEditFormData({ ...editFormData, game: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                  >
                    {games.map((g) => (
                      <option key={g.id} value={g.name}>{g.name}</option>
                    ))}
                    <option value="ALL">ALL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">STATUS</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded bg-black/60 border border-white/15 text-zinc-300 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-[#D71920] hover:bg-[#E3262E] text-white font-bold rounded flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(215,25,32,0.4)] disabled:opacity-50"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>SAVE CHANGES</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PLAYER TO LEADERBOARD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0E0E0E] border border-white/10 rounded-lg p-6 shadow-2xl relative font-tech text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">
                ADD LEADERBOARD ATHLETE
              </h3>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 mb-1">PLAYER FULL NAME *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikramaditya Singh"
                  value={addFormData.playerName}
                  onChange={(e) => setAddFormData({ ...addFormData, playerName: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">GAMER TAG / IGN *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ShadowHunter"
                    value={addFormData.gamerTag}
                    onChange={(e) => setAddFormData({ ...addFormData, gamerTag: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">GAME</label>
                  <select
                    value={addFormData.game}
                    onChange={(e) => setAddFormData({ ...addFormData, game: e.target.value })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                  >
                    {games.map((g) => (
                      <option key={g.id} value={g.name}>{g.name}</option>
                    ))}
                    <option value="ALL">ALL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">INITIAL POINTS</label>
                  <input
                    type="number"
                    min="0"
                    value={addFormData.points}
                    onChange={(e) => setAddFormData({ ...addFormData, points: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">WINS</label>
                  <input
                    type="number"
                    min="0"
                    value={addFormData.wins}
                    onChange={(e) => setAddFormData({ ...addFormData, wins: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">MATCHES</label>
                  <input
                    type="number"
                    min="0"
                    value={addFormData.matches}
                    onChange={(e) => setAddFormData({ ...addFormData, matches: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">SCORE</label>
                  <input
                    type="number"
                    min="0"
                    value={addFormData.score}
                    onChange={(e) => setAddFormData({ ...addFormData, score: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-black border border-white/15 rounded text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded bg-black/60 border border-white/15 text-zinc-300 hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-[#D71920] hover:bg-[#E3262E] text-white font-bold rounded flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(215,25,32,0.4)] disabled:opacity-50"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>ADD TO LEADERBOARD</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET STATISTICS MODAL */}
      {resetConfirmEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111111] border border-amber-500/40 rounded p-6 shadow-2xl relative font-tech text-xs">
            <div className="flex items-center gap-3 text-amber-500 mb-3">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <h3 className="font-display font-black text-base text-white uppercase">
                RESET STATISTICS?
              </h3>
            </div>
            <p className="text-zinc-400 mb-4">
              Reset all points, wins, matches, and score to zero for <strong className="text-white">{resetConfirmEntry.playerName}</strong>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setResetConfirmEntry(null)}
                className="px-3.5 py-1.5 rounded bg-black border border-white/15 text-zinc-300 hover:text-white"
              >
                CANCEL
              </button>
              <button
                onClick={handleResetStats}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded cursor-pointer"
              >
                CONFIRM RESET
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111111] border border-red-500/40 rounded p-6 shadow-2xl relative font-tech text-xs">
            <div className="flex items-center gap-3 text-red-500 mb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-display font-black text-base text-white uppercase">
                REMOVE FROM LEADERBOARD?
              </h3>
            </div>
            <p className="text-zinc-400 mb-4">
              Remove <strong className="text-white">{deleteConfirmEntry.playerName}</strong> from the public leaderboard?
            </p>
            <p className="text-red-400 text-[11px] mb-5 font-bold uppercase tracking-wider">
              This action cannot be undone. Standings will automatically recalculate.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmEntry(null)}
                className="px-3.5 py-1.5 rounded bg-black border border-white/15 text-zinc-300 hover:text-white cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeleteEntry}
                className="px-4 py-1.5 bg-[#D71920] hover:bg-[#E3262E] text-white font-bold rounded cursor-pointer shadow-[0_0_15px_rgba(215,25,32,0.5)]"
              >
                CONFIRM REMOVE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Player Profile Modal */}
      {selectedProfilePlayer && (
        <PlayerProfileModal
          player={selectedProfilePlayer}
          onClose={() => setSelectedProfilePlayer(null)}
        />
      )}
    </div>
  );
};
