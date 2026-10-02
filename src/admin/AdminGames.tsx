import React, { useState, useEffect } from 'react';
import { adminApi } from '../lib/adminApi';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  CheckCircle2, 
  XCircle,
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { sfx } from '../utils/sfx';

export const AdminGames: React.FC = () => {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('BATTLE ROYALE');
  const [formFormat, setFormFormat] = useState('SOLO');
  const [formPrize, setFormPrize] = useState(10000);
  const [formDescription, setFormDescription] = useState('');
  const [formBanner, setFormBanner] = useState('');
  const [formLogo, setFormLogo] = useState('');
  const [formActive, setFormActive] = useState(true);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getGames(true); // fetch all games including inactive
      setGames(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const openCreateModal = () => {
    sfx.playClick();
    setEditingGame(null);
    setFormName('');
    setFormCategory('BATTLE ROYALE');
    setFormFormat('SOLO');
    setFormPrize(10000);
    setFormDescription('');
    setFormBanner('/assets/official_game_bgmi.png');
    setFormLogo('/assets/badge_bgmi.png');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (game: any) => {
    sfx.playClick();
    setEditingGame(game);
    setFormName(game.name);
    setFormCategory(game.category || 'ESPORTS');
    setFormFormat(game.format || 'SOLO');
    setFormPrize(game.defaultPrizePool || 0);
    setFormDescription(game.description || '');
    setFormBanner(game.banner || '');
    setFormLogo(game.logo || '');
    setFormActive(game.active === 1 || game.active === true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playClick();
    try {
      const isBoolActive = Boolean(formActive);
      if (editingGame) {
        await adminApi.updateGame(editingGame.id, {
          name: formName,
          category: formCategory,
          format: formFormat,
          defaultPrizePool: Number(formPrize),
          description: formDescription,
          banner: formBanner,
          logo: formLogo,
          active: isBoolActive
        });
      } else {
        await adminApi.createGame({
          name: formName,
          category: formCategory,
          format: formFormat,
          defaultPrizePool: Number(formPrize),
          description: formDescription,
          banner: formBanner,
          logo: formLogo,
          active: isBoolActive
        });
      }
      sfx.playSuccess();
      setIsModalOpen(false);
      fetchGames();
    } catch (err: any) {
      sfx.playError();
      setError(err.message || 'Failed to save game');
    }
  };

  const handleToggleActive = async (game: any) => {
    sfx.playClick();
    const isCurrentlyActive = game.active === true || game.active === 1 || game.active === 'true';
    const newActive = !isCurrentlyActive;

    // Optimistic UI state update
    setGames(prev => prev.map(g => g.id === game.id ? { ...g, active: newActive } : g));

    try {
      await adminApi.updateGame(game.id, { active: newActive });
      sfx.playSuccess();
      fetchGames();
    } catch (err: any) {
      sfx.playError();
      setError(err.message || 'Failed to toggle visibility status');
      fetchGames();
    }
  };

  const handleDelete = async (id: string) => {
    sfx.playClick();
    try {
      await adminApi.deleteGame(id);
      sfx.playSuccess();
      setDeleteConfirmId(null);
      fetchGames();
    } catch (err: any) {
      sfx.playError();
      setError(err.message || 'Failed to delete game');
    }
  };

  const filteredGames = games.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    (g.category && g.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wide uppercase">
            GAME TITLES & ROSTER
          </h1>
          <p className="text-xs text-[#808088] mt-0.5">
            Active games appear directly in the public "Choose Your Game" carousel.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#D71920] to-[#b3141a] hover:from-[#e3262e] text-white text-xs font-semibold tracking-wider uppercase flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(215,25,32,0.35)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Game</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-950/60 border border-red-600/40 text-xs text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#D71920]" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0c0c0f] border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#D71920]"
          />
        </div>
      </div>

      {/* Games Table */}
      <div className="bg-[#0c0c0f] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-semibold text-zinc-500 border-b border-white/[0.06] bg-[#09090c]">
                <th className="p-3.5">GAME TITLE</th>
                <th className="p-3.5">CATEGORY</th>
                <th className="p-3.5">FORMAT</th>
                <th className="p-3.5">LANDING PAGE VISIBILITY</th>
                <th className="p-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#D71920]" />
                    <span>Loading games from database...</span>
                  </td>
                </tr>
              ) : filteredGames.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">
                    No games found in database.
                  </td>
                </tr>
              ) : (
                filteredGames.map((game) => {
                  const isActive = game.active === true || game.active === 1 || game.active === 'true';
                  return (
                    <tr key={game.id} className="hover:bg-white/[0.015]">
                      <td className="p-3.5 font-medium text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-zinc-900 border border-white/10 flex items-center justify-center p-1 shrink-0">
                          <img
                            src={game.logo || '/assets/badge_bgmi.png'}
                            alt={game.name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                          />
                        </div>
                        <div>
                          <span>{game.name}</span>
                          <span className="block text-[10px] text-zinc-500 font-normal truncate max-w-xs">
                            {game.description || 'No description'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-zinc-300">{game.category}</td>
                      <td className="p-3.5 text-zinc-400">{game.format}</td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleActive(game)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-all ${
                            isActive
                              ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                              : 'bg-zinc-900 text-zinc-500 border border-zinc-700 hover:text-zinc-300 hover:border-zinc-500'
                          }`}
                          title={isActive ? 'Click to disable visibility on Landing Page' : 'Click to enable visibility on Landing Page'}
                        >
                          {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{isActive ? 'Visible on Landing Page' : 'Hidden (Disabled)'}</span>
                        </button>
                      </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(game)}
                        className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Edit Game"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(game.id)}
                        className="p-1.5 rounded hover:bg-red-950/60 text-zinc-400 hover:text-[#D71920] transition-colors cursor-pointer"
                        title="Delete Game"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal (Requirement 13) */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0c0c0f] border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="font-cinzel text-sm font-bold text-white uppercase">CONFIRM DELETION</h3>
            <p className="text-xs text-zinc-400">
              Are you sure you want to delete this game? This action cannot be undone and will delete associated tournaments.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-1.5 rounded bg-[#D71920] hover:bg-[#e3262e] text-white text-xs font-semibold"
              >
                Delete Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c0c0f] border border-white/10 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-cinzel text-sm font-bold text-white uppercase">
                {editingGame ? 'EDIT GAME TITLE' : 'ADD NEW GAME TITLE'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Game Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Call of Duty Warzone"
                  className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. BATTLE ROYALE"
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Default Format</label>
                  <input
                    type="text"
                    value={formFormat}
                    onChange={(e) => setFormFormat(e.target.value)}
                    placeholder="e.g. SQUAD / 5v5"
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Banner Artwork Path / URL</label>
                <input
                  type="text"
                  value={formBanner}
                  onChange={(e) => setFormBanner(e.target.value)}
                  placeholder="/assets/official_game_bgmi.png"
                  className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Badge Logo Path / URL</label>
                <input
                  type="text"
                  value={formLogo}
                  onChange={(e) => setFormLogo(e.target.value)}
                  placeholder="/assets/badge_bgmi.png"
                  className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short overview of the game and format..."
                  className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="gameActiveCheck"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded text-[#D71920]"
                />
                <label htmlFor="gameActiveCheck" className="text-zinc-300">
                  Visible on Public Website ("Choose Your Game" carousel)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#D71920] hover:bg-[#e3262e] text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
