import React, { useState, useEffect } from 'react';
import { adminApi } from '../lib/adminApi';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { sfx } from '../utils/sfx';

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGameFilter, setSelectedGameFilter] = useState('ALL');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formGameId, setFormGameId] = useState('');
  const [formDate, setFormDate] = useState('OCT 25, 2026');
  const [formTime, setFormTime] = useState('6:00 PM');
  const [formFormat, setFormFormat] = useState('SOLO');
  const [formPrize, setFormPrize] = useState(10000);
  const [formMaxPart, setFormMaxPart] = useState(100);
  const [formRegStatus, setFormRegStatus] = useState('OPEN');
  const [formEventStatus, setFormEventStatus] = useState('UPCOMING');
  const [formDesc, setFormDesc] = useState('');
  const [formRules, setFormRules] = useState('');
  const [formBanner, setFormBanner] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, gamesData] = await Promise.all([
        adminApi.getEvents(),
        adminApi.getGames(true)
      ]);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setGames(Array.isArray(gamesData) ? gamesData : []);
      if (gamesData.length > 0 && !formGameId) {
        setFormGameId(gamesData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    sfx.playClick();
    setEditingEvent(null);
    setFormTitle('');
    setFormGameId(games.length > 0 ? games[0].id : 'bgmi');
    setFormDate('OCT 25, 2026');
    setFormTime('6:00 PM');
    setFormFormat('SOLO');
    setFormPrize(10000);
    setFormMaxPart(100);
    setFormRegStatus('OPEN');
    setFormEventStatus('REGISTRATION OPEN');
    setFormDesc('');
    setFormRules('Standard tournament rules apply.');
    setFormBanner('/assets/official_game_bgmi.png');
    setIsModalOpen(true);
  };

  const openEditModal = (event: any) => {
    sfx.playClick();
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormGameId(event.gameId);
    setFormDate(event.date);
    setFormTime(event.time);
    setFormFormat(event.format);
    setFormPrize(event.prizePool);
    setFormMaxPart(event.maxParticipants || 100);
    setFormRegStatus(event.registrationStatus);
    setFormEventStatus(event.eventStatus);
    setFormDesc(event.description || '');
    setFormRules(event.rules || '');
    setFormBanner(event.banner || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playClick();
    try {
      const selectedGame = games.find(g => g.id === formGameId);
      const gameName = selectedGame ? selectedGame.name : 'Esports';

      const payload = {
        title: formTitle,
        gameId: formGameId,
        gameName,
        date: formDate,
        time: formTime,
        format: formFormat,
        prizePool: Number(formPrize),
        maxParticipants: Number(formMaxPart),
        registrationStatus: formRegStatus,
        eventStatus: formEventStatus,
        description: formDesc,
        rules: formRules,
        banner: formBanner || (selectedGame ? selectedGame.banner : '')
      };

      if (editingEvent) {
        await adminApi.updateEvent(editingEvent.id, payload);
      } else {
        await adminApi.createEvent(payload);
      }

      sfx.playSuccess();
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      sfx.playError();
      setError(err.message || 'Failed to save event');
    }
  };

  const handleChangeStatus = async (eventId: string, newStatus: string) => {
    sfx.playClick();
    try {
      await adminApi.updateEvent(eventId, { eventStatus: newStatus });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    sfx.playClick();
    try {
      await adminApi.deleteEvent(id);
      sfx.playSuccess();
      setDeleteConfirmId(null);
      loadData();
    } catch (err: any) {
      sfx.playError();
      setError(err.message || 'Failed to delete event');
    }
  };

  const filteredEvents = events.filter(ev => {
    const matchSearch = ev.title.toLowerCase().includes(search.toLowerCase()) || 
                        ev.gameName.toLowerCase().includes(search.toLowerCase());
    const matchGame = selectedGameFilter === 'ALL' || ev.gameId === selectedGameFilter || ev.gameName === selectedGameFilter;
    return matchSearch && matchGame;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wide uppercase">
            TOURNAMENTS & EVENTS
          </h1>
          <p className="text-xs text-[#808088] mt-0.5">
            Manage live brackets, formats, registration windows, and prize disbursement.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#D71920] to-[#b3141a] hover:from-[#e3262e] text-white text-xs font-semibold tracking-wider uppercase flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(215,25,32,0.35)]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
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

      {/* Controls: Search + Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tournament..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0c0c0f] border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#D71920]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-zinc-500 whitespace-nowrap">Filter Game:</span>
          <select
            value={selectedGameFilter}
            onChange={(e) => setSelectedGameFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#0c0c0f] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D71920]"
          >
            <option value="ALL">All Games</option>
            {games.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-[#0c0c0f] border border-white/[0.08] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-semibold text-zinc-500 border-b border-white/[0.06] bg-[#09090c]">
                <th className="p-3.5">EVENT</th>
                <th className="p-3.5">GAME</th>
                <th className="p-3.5">DATE & TIME</th>
                <th className="p-3.5">FORMAT</th>
                <th className="p-3.5">PRIZE POOL</th>
                <th className="p-3.5">STATUS</th>
                <th className="p-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#D71920]" />
                    <span>Loading tournaments from database...</span>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No tournaments found in database.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-white/[0.015]">
                    <td className="p-3.5 font-medium text-white">
                      <div>
                        <span>{ev.title}</span>
                        <span className="block text-[10px] text-zinc-500 font-normal">ID: {ev.id}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-zinc-300">{ev.gameName}</td>
                    <td className="p-3.5 text-zinc-400">
                      <span>{ev.date}</span>
                      <span className="block text-[10px] text-zinc-600">{ev.time}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded border border-white/10 bg-white/[0.02] text-[10px] text-zinc-300 font-semibold">
                        {ev.format}
                      </span>
                    </td>
                    <td className="p-3.5 font-bebas text-sm text-[#f5c464]">₹{Number(ev.prizePool).toLocaleString()}</td>
                    <td className="p-3.5">
                      <select
                        value={ev.eventStatus}
                        onChange={(e) => handleChangeStatus(ev.id, e.target.value)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold border bg-black/60 focus:outline-none cursor-pointer ${
                          ev.eventStatus === 'LIVE' ? 'text-red-400 border-red-500/50' :
                          ev.eventStatus === 'REGISTRATION OPEN' ? 'text-emerald-400 border-emerald-500/50' :
                          ev.eventStatus === 'COMPLETED' ? 'text-zinc-400 border-zinc-700' :
                          'text-amber-400 border-amber-500/50'
                        }`}
                      >
                        <option value="UPCOMING">UPCOMING</option>
                        <option value="REGISTRATION OPEN">REGISTRATION OPEN</option>
                        <option value="REGISTRATION CLOSED">REGISTRATION CLOSED</option>
                        <option value="LIVE">LIVE</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(ev)}
                        className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Edit Event"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(ev.id)}
                        className="p-1.5 rounded hover:bg-red-950/60 text-zinc-400 hover:text-[#D71920] transition-colors cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0c0c0f] border border-white/10 rounded-xl p-5 space-y-4">
            <h3 className="font-cinzel text-sm font-bold text-white uppercase">CONFIRM DELETION</h3>
            <p className="text-xs text-zinc-400">
              Are you sure you want to delete this tournament event? This action cannot be undone.
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
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c0c0f] border border-white/10 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-cinzel text-sm font-bold text-white uppercase">
                {editingEvent ? 'EDIT TOURNAMENT EVENT' : 'CREATE TOURNAMENT EVENT'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Tournament Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. BlackHawk Valorant 5v5 Championship"
                  className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Game Title *</label>
                  <select
                    value={formGameId}
                    onChange={(e) => setFormGameId(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  >
                    {games.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Format</label>
                  <select
                    value={formFormat}
                    onChange={(e) => setFormFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="SOLO">SOLO</option>
                    <option value="DUO">DUO</option>
                    <option value="SQUAD">SQUAD</option>
                    <option value="5v5">5v5</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Date</label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="e.g. OCT 25, 2026"
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Time</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="e.g. 6:00 PM"
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Prize Pool (₹)</label>
                  <input
                    type="number"
                    value={formPrize}
                    onChange={(e) => setFormPrize(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Max Participants</label>
                  <input
                    type="number"
                    value={formMaxPart}
                    onChange={(e) => setFormMaxPart(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Registration Status</label>
                  <select
                    value={formRegStatus}
                    onChange={(e) => setFormRegStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Event Status</label>
                  <select
                    value={formEventStatus}
                    onChange={(e) => setFormEventStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="REGISTRATION OPEN">REGISTRATION OPEN</option>
                    <option value="REGISTRATION CLOSED">REGISTRATION CLOSED</option>
                    <option value="LIVE">LIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Banner Image URL / Asset</label>
                <input
                  type="text"
                  value={formBanner}
                  onChange={(e) => setFormBanner(e.target.value)}
                  placeholder="/assets/official_game_valorant.png"
                  className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Overview of the tournament format and stakes..."
                  className="w-full px-3 py-2 rounded bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                />
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
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
