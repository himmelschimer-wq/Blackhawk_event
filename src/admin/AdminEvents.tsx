import React, { useState, useEffect } from 'react';
import { adminApi } from '../lib/adminApi';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  X, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Trophy
} from 'lucide-react';
import { sfx } from '../utils/sfx';

// Game Rules Preset Templates for fast creation
const GAME_RULE_PRESETS: Record<string, { rules: string; generalRules: string; format: string }> = {
  bgmi: {
    format: 'SQUAD',
    rules: [
      '1. Custom Room ID & Password shared on Discord 15 minutes before match start.',
      '2. Mobile devices only (Smartphones). Emulators, iPad view mods, and physical trigger accessories are strictly forbidden.',
      '3. Official Maps: Erangel (Match 1) & Miramar (Match 2). Standard esports circle shrink times.',
      '4. Scoring: 1st Place: 10 pts, 2nd: 6 pts, 3rd: 5 pts, 4th: 4 pts, 5th: 3 pts, 6th: 2 pts, 7th-8th: 1 pt. Kill Point: 1 pt per kill.',
      '5. Team Captain must submit clear end-screen scoreboard screenshot in #match-results within 15 mins.'
    ].join('\n'),
    generalRules: [
      '1. Discord check-in mandatory for all 4 team members 30 minutes prior.',
      '2. Strict zero-tolerance policy against teaming, stream sniping, or verbal abuse.',
      '3. Prize pool payout dispatched via UPI / Bank Transfer within 24-48 hours after admin verification.'
    ].join('\n')
  },
  'free-fire': {
    format: 'SOLO / SQUAD',
    rules: [
      '1. Classic Battle Royale / Clash Squad custom room mode.',
      '2. Character Skills: ACTIVE. Gun Attributes: OFF (Competitive Standard). Limited Ammo: YES.',
      '3. Mobile devices only. Emulators or third-party sensitivity scripts result in immediate disqualification.',
      '4. Point System: 1st Place (Booyah): 12 pts, 2nd: 9 pts, 3rd: 8 pts, 4th: 7 pts. Kill Point: 1 pt per kill.',
      '5. Screen recording / screenshot of final match results is compulsory for verification.'
    ].join('\n'),
    generalRules: [
      '1. Accurate In-Game UID and IGN must match your registration form exactly.',
      '2. Unsportsmanlike conduct or lobby toxicity will lead to blacklisting from future BlackHawk seasons.',
      '3. Payouts processed directly to winners via verified UPI.'
    ].join('\n')
  },
  valorant: {
    format: '5v5',
    rules: [
      '1. Mode: Standard 5v5 Custom Game (Tournament Mode: ON, Overtime: Win by Two).',
      '2. Map Pool: Ascent, Bind, Haven, Split, Lotus, Sunset, Abyss. Map veto done in Discord prior to match.',
      '3. Tactical Pauses: 1 tactical timeout allowed per half (60 seconds each).',
      '4. Anti-Cheat: Riot Vanguard must remain active with zero exceptions.',
      '5. Both team captains must record match VODs and upload post-match summary screenshots.'
    ].join('\n'),
    generalRules: [
      '1. All players must be in the designated BlackHawk Discord voice channels during match play.',
      '2. Substitutions must be declared at least 1 hour before scheduled match time.',
      '3. Official prize disbursement within 48 hours post-tournament.'
    ].join('\n')
  },
  minecraft: {
    format: 'SOLO / TEAM',
    rules: [
      '1. Server Version: Java 1.20.x / Bedrock compatible server ip sent to confirmed participants.',
      '2. Game Mode: Bedwars / Speedrun Challenge / Survival Games as specified in bracket.',
      '3. Prohibited: X-ray texture packs, hacked clients (Meteor, Aristois, etc.), auto-clickers (>15 CPS).',
      '4. Replay recording enabled on server for automated anti-cheat review.',
      '5. Final placement determined by in-game leaderboards and server logging.'
    ].join('\n'),
    generalRules: [
      '1. Player IGN must match the registered Minecraft handle.',
      '2. Respectful communication in Discord and in-game chat required at all times.',
      '3. Cash prize transferred via UPI within 24 hours of match completion.'
    ].join('\n')
  },
  chess: {
    format: 'SOLO',
    rules: [
      '1. Platform: Chess.com / Lichess.org official tournament arena link.',
      '2. Time Control: 3+2 Blitz or 5+0 Rapid as scheduled.',
      '3. Anti-Cheating: Automated engine analysis (Stockfish evaluation) performed on all games. Any match with >95% engine accuracy is subject to manual grandmaster review.',
      '4. Disconnections: Player is responsible for their own internet stability.'
    ].join('\n'),
    generalRules: [
      '1. Account must be at least 30 days old and have verified rating history.',
      '2. Instant disqualification and ban for using chess engines or secondary devices.',
      '3. Instant payout directly following fair-play review.'
    ].join('\n')
  },
  scribble: {
    format: 'SOLO',
    rules: [
      '1. Private Skribbl.io custom room lobby link sent 5 minutes prior to match.',
      '2. Drawing Time: 80 Seconds per round. Custom words list enabled.',
      '3. Strictly forbidden: Writing words or spelling out answers directly on canvas.',
      '4. Highest cumulative points at the end of all rounds takes the crown.'
    ].join('\n'),
    generalRules: [
      '1. Keep drawing and chat family-friendly and respectful.',
      '2. Prizes distributed immediately post-session.'
    ].join('\n')
  }
};

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
  const [previewRulesEvent, setPreviewRulesEvent] = useState<any | null>(null);
  const [isCleanDbModalOpen, setIsCleanDbModalOpen] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanSuccessMessage, setCleanSuccessMessage] = useState<string | null>(null);
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
  const [formEventStatus, setFormEventStatus] = useState('REGISTRATION OPEN');
  const [formDesc, setFormDesc] = useState('');
  const [formRules, setFormRules] = useState('');
  const [formGeneralRules, setFormGeneralRules] = useState('');
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

  const applyRulesPreset = (gameKey: string) => {
    sfx.playClick();
    const cleanKey = gameKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    let matchedPreset = GAME_RULE_PRESETS[cleanKey];

    if (!matchedPreset) {
      if (cleanKey.includes('bgmi') || cleanKey.includes('pubg')) matchedPreset = GAME_RULE_PRESETS['bgmi'];
      else if (cleanKey.includes('freefire') || cleanKey.includes('ff')) matchedPreset = GAME_RULE_PRESETS['free-fire'];
      else if (cleanKey.includes('valorant') || cleanKey.includes('val')) matchedPreset = GAME_RULE_PRESETS['valorant'];
      else if (cleanKey.includes('minecraft') || cleanKey.includes('mc')) matchedPreset = GAME_RULE_PRESETS['minecraft'];
      else if (cleanKey.includes('chess')) matchedPreset = GAME_RULE_PRESETS['chess'];
      else if (cleanKey.includes('scribble') || cleanKey.includes('skribbl')) matchedPreset = GAME_RULE_PRESETS['scribble'];
    }

    if (matchedPreset) {
      setFormRules(matchedPreset.rules);
      setFormGeneralRules(matchedPreset.generalRules);
      setFormFormat(matchedPreset.format);
    } else {
      setFormRules([
        '1. Match lobby credentials will be shared in Discord 15 minutes before the start time.',
        '2. Fair play rules strictly enforced. Instant ban for any unauthorized mods or third-party tools.',
        '3. Screenshots of the final scoreboard must be submitted immediately post-match.'
      ].join('\n'));
      setFormGeneralRules([
        '1. Discord attendance & check-in is mandatory.',
        '2. Prize payout processed via UPI / Bank Transfer within 24-48 hours.'
      ].join('\n'));
    }
  };

  const openCreateModal = () => {
    sfx.playClick();
    setEditingEvent(null);
    setFormTitle('');
    const initialGame = games.length > 0 ? games[0] : null;
    const gId = initialGame ? initialGame.id : 'bgmi';
    setFormGameId(gId);
    setFormDate('OCT 25, 2026');
    setFormTime('6:00 PM');
    setFormFormat('SOLO');
    setFormPrize(10000);
    setFormMaxPart(100);
    setFormRegStatus('OPEN');
    setFormEventStatus('REGISTRATION OPEN');
    setFormDesc('');
    applyRulesPreset(gId);
    setFormBanner(initialGame?.banner || '/assets/official_game_bgmi.png');
    setIsModalOpen(true);
  };

  const openEditModal = (event: any) => {
    sfx.playClick();
    setEditingEvent(event);
    setFormTitle(event.title || '');
    setFormGameId(event.gameId || event.game_id || (games.length > 0 ? games[0].id : ''));
    setFormDate(event.date || 'OCT 25, 2026');
    setFormTime(event.time || '6:00 PM');
    setFormFormat(event.format || 'SOLO');
    setFormPrize(event.prizePool || event.prize_pool || 10000);
    setFormMaxPart(event.maxParticipants || event.max_participants || 100);
    setFormRegStatus(event.registrationStatus || event.registration_status || 'OPEN');
    setFormEventStatus(event.eventStatus || event.event_status || 'REGISTRATION OPEN');
    setFormDesc(event.description || '');
    setFormRules(event.rules || '');
    setFormGeneralRules(event.generalRules || event.general_rules || '');
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
        generalRules: formGeneralRules,
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

  const handleCleanDatabase = async () => {
    sfx.playClick();
    setIsCleaning(true);
    try {
      await adminApi.cleanDatabase({
        cleanEvents: true,
        cleanRegistrations: true,
        cleanResults: true,
        cleanLeaderboard: true
      });
      sfx.playSuccess();
      setIsCleanDbModalOpen(false);
      setCleanSuccessMessage('Database cleared! All previous events, registrations, match results & leaderboard entries wiped. You can now add fresh events.');
      setTimeout(() => setCleanSuccessMessage(null), 6000);
      loadData();
    } catch (err: any) {
      sfx.playError();
      setError(err.message || 'Failed to clean database');
    } finally {
      setIsCleaning(false);
    }
  };

  const filteredEvents = events.filter(ev => {
    const matchSearch = (ev.title || '').toLowerCase().includes(search.toLowerCase()) || 
                        (ev.gameName || '').toLowerCase().includes(search.toLowerCase());
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
            Manage live brackets, formats, custom rules, and prize disbursement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Clean / Reset Database Button */}
          <button
            onClick={() => {
              sfx.playClick();
              setIsCleanDbModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-[#ff4d4d] hover:text-white text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Wipe previous events and registrations to start fresh"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clean Database</span>
          </button>

          {/* Create New Event Button */}
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#D71920] to-[#b3141a] hover:from-[#e3262e] text-white text-xs font-semibold tracking-wider uppercase flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(215,25,32,0.35)]"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {cleanSuccessMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{cleanSuccessMessage}</span>
          </div>
          <button onClick={() => setCleanSuccessMessage(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
      <div className="bg-[#0c0c0f] border border-white/[0.08] rounded-xl overflow-hidden shadow-[0_0_25px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-semibold text-zinc-500 border-b border-white/[0.06] bg-[#09090c]">
                <th className="p-3.5">EVENT</th>
                <th className="p-3.5">GAME</th>
                <th className="p-3.5">DATE & TIME</th>
                <th className="p-3.5">FORMAT</th>
                <th className="p-3.5">PRIZE POOL</th>
                <th className="p-3.5">RULES BRIEF</th>
                <th className="p-3.5">STATUS</th>
                <th className="p-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#D71920]" />
                    <span>Loading tournaments from database...</span>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">
                    <p className="font-semibold text-zinc-400">Database is clean. No tournament events created yet.</p>
                    <p className="text-[11px] text-zinc-600 mt-1">Click "+ Create New Event" above to publish your first tournament.</p>
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
                    <td className="p-3.5 text-zinc-300">
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-tech text-[#ff4d4d] uppercase font-bold">
                        {ev.gameName}
                      </span>
                    </td>
                    <td className="p-3.5 text-zinc-400">
                      <span>{ev.date}</span>
                      <span className="block text-[10px] text-zinc-600">{ev.time}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-zinc-300 font-mono">
                        {ev.format}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-[#f5c464]">
                      ₹{(ev.prizePool || ev.prize_pool || 0).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => setPreviewRulesEvent(ev)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 hover:text-white cursor-pointer transition-colors"
                      >
                        <ShieldCheck className="w-3 h-3 text-[#D71920]" />
                        <span>{ev.rules ? 'View Rules' : 'No Rules'}</span>
                      </button>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={ev.eventStatus || ev.event_status || 'REGISTRATION OPEN'}
                        onChange={(e) => handleChangeStatus(ev.id, e.target.value)}
                        className="bg-black/50 border border-white/10 rounded px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-[#D71920]"
                      >
                        <option value="REGISTRATION OPEN">REGISTRATION OPEN</option>
                        <option value="REGISTRATION CLOSED">REGISTRATION CLOSED</option>
                        <option value="UPCOMING">UPCOMING</option>
                        <option value="LIVE">LIVE</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(ev)}
                        className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Edit Event & Rules"
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

      {/* Clean Database Confirmation Modal */}
      {isCleanDbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c0c0f] border border-red-500/30 rounded-2xl p-6 space-y-4 shadow-[0_0_40px_rgba(215,25,32,0.3)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center text-[#ff4d4d]">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cinzel text-base font-bold text-white uppercase">CLEAN DATABASE</h3>
                <p className="text-xs text-zinc-400">Wipe events and test registrations</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5">
              This will safely clear all <span className="text-white font-bold">events</span>, <span className="text-white font-bold">registrations</span>, <span className="text-white font-bold">match results</span>, and <span className="text-white font-bold">leaderboard scores</span> so you can start completely fresh. Active games and admin credentials are preserved.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCleanDbModalOpen(false)}
                disabled={isCleaning}
                className="px-4 py-2 rounded-lg text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCleanDatabase}
                disabled={isCleaning}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#D71920] to-[#990f14] hover:from-[#e3262e] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                {isCleaning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cleaning...</span>
                  </>
                ) : (
                  <span>Yes, Wipe & Clean Database</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0c0c0f] border border-white/10 rounded-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#D71920]" />
                <h3 className="font-cinzel text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                  {editingEvent ? 'EDIT TOURNAMENT EVENT' : 'CREATE TOURNAMENT EVENT'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Tournament Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. BlackHawk BGMI Pro Championship Week 1"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Game Discipline *</label>
                  <select
                    value={formGameId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setFormGameId(newId);
                      const sel = games.find(g => g.id === newId);
                      if (sel && sel.banner) setFormBanner(sel.banner);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  >
                    {games.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Match Format</label>
                  <select
                    value={formFormat}
                    onChange={(e) => setFormFormat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="SOLO">SOLO</option>
                    <option value="DUO">DUO</option>
                    <option value="SQUAD">SQUAD (4-Man)</option>
                    <option value="5v5">5v5 Tactical</option>
                    <option value="1v1 CHALLENGE">1v1 CHALLENGE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Scheduled Date</label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="e.g. OCT 25, 2026"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Match Start Time</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="e.g. 6:00 PM IST"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Prize Pool (₹ INR)</label>
                  <input
                    type="number"
                    value={formPrize}
                    onChange={(e) => setFormPrize(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Max Participants / Slots</label>
                  <input
                    type="number"
                    value={formMaxPart}
                    onChange={(e) => setFormMaxPart(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Registration Status</label>
                  <select
                    value={formRegStatus}
                    onChange={(e) => setFormRegStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="OPEN">OPEN (Accepting Entries)</option>
                    <option value="CLOSED">CLOSED (Slots Full)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Event Tournament Status</label>
                  <select
                    value={formEventStatus}
                    onChange={(e) => setFormEventStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="REGISTRATION OPEN">REGISTRATION OPEN</option>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="REGISTRATION CLOSED">REGISTRATION CLOSED</option>
                    <option value="LIVE">LIVE MATCHES ONGOING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Banner Image URL / Asset</label>
                <input
                  type="text"
                  value={formBanner}
                  onChange={(e) => setFormBanner(e.target.value)}
                  placeholder="/assets/official_game_valorant.png"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Tournament Overview & Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Overview of the tournament format, map rotation, and match rules..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-[#D71920]"
                />
              </div>

              {/* Event-Specific Rules Builder Section */}
              <div className="pt-4 border-t border-white/10 space-y-3.5 bg-white/[0.01] p-4 rounded-xl border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D71920]" />
                    <h4 className="font-cinzel text-xs font-bold text-white uppercase tracking-wider">
                      EVENT-SPECIFIC RULES & REGULATIONS
                    </h4>
                  </div>

                  {/* Preset Rule Helper */}
                  <button
                    type="button"
                    onClick={() => applyRulesPreset(formGameId)}
                    className="px-2.5 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-[10px] font-tech font-bold text-[#ff4d4d] hover:text-white uppercase transition-colors flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    title="Auto-fill rules from competitive esports template"
                  >
                    <Sparkles className="w-3 h-3 text-[#f5c464]" />
                    <span>Auto-Fill {games.find(g => g.id === formGameId)?.name || 'Game'} Rules</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-zinc-200">
                      Match Rules, Device Standards & Scoring System
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">1 rule per line</span>
                  </div>
                  <textarea
                    rows={5}
                    value={formRules}
                    onChange={(e) => setFormRules(e.target.value)}
                    placeholder={"1. Custom room credentials will be shared 15 minutes before match.\n2. Mobile devices only; emulators and iPad mods strictly prohibited.\n3. Squad captain must submit final score screenshot."}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/70 border border-white/10 text-white font-mono text-[11px] placeholder:text-zinc-600 focus:outline-none focus:border-[#D71920] leading-relaxed"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-zinc-200">
                      General Code of Conduct & Payout Protocol
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">1 rule per line</span>
                  </div>
                  <textarea
                    rows={3}
                    value={formGeneralRules}
                    onChange={(e) => setFormGeneralRules(e.target.value)}
                    placeholder={"1. Discord check-in mandatory 15 minutes prior to match time.\n2. Zero tolerance for cheating or toxic conduct.\n3. Cash prizes sent via UPI within 24-48 hours."}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/70 border border-white/10 text-white font-mono text-[11px] placeholder:text-zinc-600 focus:outline-none focus:border-[#D71920] leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#D71920] to-[#b3141a] hover:from-[#e3262e] text-white font-bold tracking-wide uppercase transition-all shadow-[0_0_15px_rgba(215,25,32,0.35)]"
                >
                  Save Tournament & Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rules Preview Dialog Modal */}
      {previewRulesEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c0c0f] border border-white/10 rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-tech text-[#D71920] font-bold uppercase tracking-wider">
                  {previewRulesEvent.gameName}
                </span>
                <h3 className="font-cinzel text-sm sm:text-base font-bold text-white uppercase">
                  {previewRulesEvent.title} — Rules Briefing
                </h3>
              </div>
              <button onClick={() => setPreviewRulesEvent(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-tech text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D71920]" />
                  SPECIFIC TOURNAMENT & MATCH RULES
                </h4>
                <div className="p-3.5 rounded-lg bg-black/60 border border-white/10 text-zinc-300 space-y-2 font-mono text-[11px] leading-relaxed">
                  {previewRulesEvent.rules ? (
                    previewRulesEvent.rules.split('\n').map((r: string, idx: number) => (
                      <p key={idx}>{r}</p>
                    ))
                  ) : (
                    <p className="text-zinc-500 italic">Standard tournament rules apply.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-tech text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  GENERAL CODE OF CONDUCT & PAYOUT RULES
                </h4>
                <div className="p-3.5 rounded-lg bg-black/60 border border-white/10 text-zinc-300 space-y-2 font-mono text-[11px] leading-relaxed">
                  {(previewRulesEvent.generalRules || previewRulesEvent.general_rules) ? (
                    (previewRulesEvent.generalRules || previewRulesEvent.general_rules).split('\n').map((r: string, idx: number) => (
                      <p key={idx}>{r}</p>
                    ))
                  ) : (
                    <p className="text-zinc-500 italic">Standard BlackHawk esports conduct applies.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setPreviewRulesEvent(null)}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
