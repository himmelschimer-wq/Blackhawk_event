import React, { useState, useEffect, useRef } from 'react';
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
  Trophy,
  Palette,
  Eye,
  EyeOff
} from 'lucide-react';
import { sfx } from '../utils/sfx';
import { FormattedRuleText, COLOR_OPTIONS } from '../utils/ruleFormatter';

// Game Rules Preset Templates for fast creation
const GAME_RULE_PRESETS: Record<string, { rules: string; generalRules: string }> = {
  bgmi: {
    rules: [
      '1. Custom Room ID & Password shared [gold]ONLY on Discord[/gold] (no other way) 15 minutes before match start.',
      '2. [red]Mobile devices only[/red] (Smartphones). Emulators, iPad view mods, and physical trigger accessories are strictly forbidden.',
      '3. Official Maps: [cyan]Erangel (Match 1)[/cyan] & [cyan]Miramar (Match 2)[/cyan]. Standard competitive circle shrink times.',
      '4. Scoring: [gold]1st: 10 pts[/gold], 2nd: 6 pts, 3rd: 5 pts, 4th: 4 pts, 5th: 3 pts, 6th: 2 pts, 7th-8th: 1 pt. Kill Point: [green]1 pt per kill[/green].',
      '5. Team Captain must submit clear end-screen scoreboard screenshot in #match-results within 15 mins (recordings not mandatory).'
    ].join('\n'),
    generalRules: [
      '1. Discord check-in mandatory for all team members [gold]30 minutes prior[/gold].',
      '2. [red]Strict zero-tolerance policy[/red] against teaming, stream sniping, or verbal abuse.',
      '3. Screen recording is not mandatory for players; [cyan]Tournament Admins & Event Managers[/cyan] take final conclusions on all match results and disputes.',
      '4. Prize pool distribution is awarded according to specific event rules and dispatched via [green]UPI / Bank Transfer[/green].'
    ].join('\n')
  },
  'free-fire': {
    rules: [
      '1. Custom Room ID & Password shared [gold]ONLY on official Discord[/gold] (no other way) 15 minutes prior to match start.',
      '2. Classic Battle Royale / Clash Squad custom room mode.',
      '3. Character Skills: [green]ACTIVE[/green]. Gun Attributes: [red]OFF[/red] (Competitive Standard). Limited Ammo: [green]YES[/green].',
      '4. [red]Mobile devices only[/red]. Emulators or third-party sensitivity scripts result in immediate disqualification.',
      '5. Point System: [gold]1st Place (Booyah): 12 pts[/gold], 2nd: 9 pts, 3rd: 8 pts, 4th: 7 pts. Kill Point: [green]1 pt per kill[/green].',
      '6. Submit screenshot of final match scoreboard for verification (continuous recording not mandatory).'
    ].join('\n'),
    generalRules: [
      '1. Accurate In-Game UID and IGN must match your registration form exactly.',
      '2. [cyan]Tournament Admins and Event Managers[/cyan] hold full authority to make final decisions on all disputes.',
      '3. Prize pool distribution is awarded according to event rules via [green]verified UPI[/green].'
    ].join('\n')
  },
  valorant: {
    rules: [
      '1. Custom Lobby details shared [gold]ONLY on official Discord[/gold] (no other way).',
      '2. Mode: Standard 5v5 Custom Game (Tournament Mode: ON, Overtime: Win by Two).',
      '3. Map Pool: Ascent, Bind, Haven, Split, Lotus, Sunset, Abyss. Map veto done in Discord prior to match.',
      '4. Tactical Pauses: 1 tactical timeout allowed per half (60 seconds each). [red]Riot Vanguard must remain active[/red].',
      '5. Team captains must upload post-match summary screenshots (VOD recording is optional for players).'
    ].join('\n'),
    generalRules: [
      '1. All players must be in the designated [gold]BlackHawk Discord voice channels[/gold] during match play.',
      '2. [cyan]Tournament Admins and Event Managers[/cyan] take final conclusions on match outcomes and disputes.',
      '3. Prize pool distribution as specified in event rules, disbursed within [green]48 hours post-verification[/green].'
    ].join('\n')
  },
  minecraft: {
    rules: [
      '1. Server IP & connection details shared [gold]ONLY on official Discord[/gold] (no other way).',
      '2. Game Mode: Bedwars / Speedrun Challenge / Survival Games as specified in bracket.',
      '3. Prohibited: [red]X-ray texture packs, hacked clients, auto-clickers (>15 CPS)[/red].',
      '4. Final placement determined by in-game leaderboards and server logging (screen recording not mandatory for players).'
    ].join('\n'),
    generalRules: [
      '1. Player IGN must match the registered Minecraft handle.',
      '2. [cyan]Tournament Admins & Event Managers[/cyan] make final conclusions on all match decisions.',
      '3. Prize pool distributed according to specific event rules via [green]UPI[/green].'
    ].join('\n')
  },
  chess: {
    rules: [
      '1. Platform: Chess.com / Lichess.org official tournament arena link shared [gold]ONLY on Discord[/gold].',
      '2. Time Control: [gold]3+2 Blitz or 5+0 Rapid[/gold] as scheduled.',
      '3. Anti-Cheating: Automated engine analysis performed on all games.',
      '4. Disconnections: Player is responsible for their own internet stability.'
    ].join('\n'),
    generalRules: [
      '1. Account must be at least [gold]30 days old[/gold] and have verified rating history.',
      '2. [cyan]Admins and Event Managers[/cyan] make final conclusions regarding disputes and fair play.',
      '3. Prize pool distributed according to event rules directly following review.'
    ].join('\n')
  },
  scribble: {
    rules: [
      '1. Private Skribbl.io custom room lobby link sent [gold]ONLY on Discord[/gold] 5 minutes prior to match.',
      '2. Drawing Time: [gold]80 Seconds[/gold] per round. Custom words list enabled.',
      '3. Strictly forbidden: [red]Writing words or spelling out answers directly on canvas[/red].',
      '4. Highest cumulative points at the end of all rounds takes the crown.'
    ].join('\n'),
    generalRules: [
      '1. Keep drawing and chat family-friendly and respectful.',
      '2. [cyan]Admins and Event Managers[/cyan] hold final decision on any disputed answers.',
      '3. Prizes distributed according to event rules immediately post-session via [green]UPI[/green].'
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
  const [showRulesLivePreview, setShowRulesLivePreview] = useState(false);

  const rulesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const generalRulesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatTag = (target: 'rules' | 'generalRules' | 'desc', openTag: string, closeTag: string) => {
    sfx.playClick();
    let ref: HTMLTextAreaElement | null = null;
    let currentVal = '';
    let setVal: React.Dispatch<React.SetStateAction<string>> = () => {};

    if (target === 'rules') {
      ref = rulesTextareaRef.current;
      currentVal = formRules;
      setVal = setFormRules;
    } else if (target === 'generalRules') {
      ref = generalRulesTextareaRef.current;
      currentVal = formGeneralRules;
      setVal = setFormGeneralRules;
    } else {
      ref = descTextareaRef.current;
      currentVal = formDesc;
      setVal = setFormDesc;
    }

    if (!ref) {
      setVal(prev => prev ? `${prev}\n${openTag}highlighted text${closeTag}` : `${openTag}highlighted text${closeTag}`);
      return;
    }

    const start = ref.selectionStart;
    const end = ref.selectionEnd;
    const selectedText = currentVal.substring(start, end) || 'highlighted text';
    const replacement = `${openTag}${selectedText}${closeTag}`;
    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    setVal(newVal);

    setTimeout(() => {
      ref.focus();
      ref.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length);
    }, 30);
  };

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
      const gameName = selectedGame ? selectedGame.name : 'Gaming';

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
                    <option value="SOLO / SQUAD">SOLO / SQUAD</option>
                    <option value="SOLO / TEAM">SOLO / TEAM</option>
                    {!['SOLO', 'DUO', 'SQUAD', '5v5', '1v1 CHALLENGE', 'SOLO / SQUAD', 'SOLO / TEAM'].includes(formFormat) && formFormat && (
                      <option value={formFormat}>{formFormat}</option>
                    )}
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-zinc-300 text-xs">
                    Tournament Overview &amp; Description
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">Supports colors &amp; **bold**</span>
                </div>

                {/* Color Highlight Bar for Overview */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 rounded-t-lg bg-black/80 border-t border-x border-white/15 text-[10px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-zinc-400 font-tech font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
                      <Palette className="w-3 h-3 text-[#D71920]" />
                      Text Color:
                    </span>
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => applyFormatTag('desc', `[${c.tag}]`, `[/${c.tag}]`)}
                        className="px-2 py-0.5 rounded border border-white/10 hover:border-white/40 text-white font-medium flex items-center gap-1.5 bg-zinc-900/90 hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer shadow-sm"
                        title={`Color selected text in ${c.label}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${c.bg} shadow-sm`} />
                        <span className="text-[10px]">{c.name}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => applyFormatTag('desc', '**', '**')}
                      className="px-2 py-0.5 rounded border border-white/10 hover:border-white/40 text-white font-bold bg-zinc-900/90 hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer text-[10px]"
                      title="Make selected text bold (**text**)"
                    >
                      Bold
                    </button>
                  </div>
                </div>

                <textarea
                  ref={descTextareaRef}
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Overview of the tournament format, map rotation, and prize breakdown (supports new lines, **bold**, and [gold]colors[/gold])..."
                  className="w-full px-3.5 py-2.5 rounded-b-lg rounded-t-none bg-black/70 border border-white/15 text-white font-mono text-[11px] placeholder:text-zinc-600 focus:outline-none focus:border-[#D71920] leading-relaxed"
                />

                {/* Live Preview for Description */}
                {showRulesLivePreview && formDesc && (
                  <div className="mt-2 p-3 rounded-lg bg-black/90 border border-amber-500/30 space-y-1">
                    <div className="text-[10px] font-tech text-amber-400 font-bold uppercase tracking-wider">
                      Live Overview Preview:
                    </div>
                    <div className="text-xs text-zinc-300 font-mono">
                      <FormattedRuleText text={formDesc} asParagraphs={true} />
                    </div>
                  </div>
                )}
              </div>

              {/* Event-Specific Rules Builder Section */}
              <div className="pt-4 border-t border-white/10 space-y-4 bg-white/[0.01] p-4 rounded-xl border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D71920]" />
                    <h4 className="font-cinzel text-xs font-bold text-white uppercase tracking-wider">
                      EVENT-SPECIFIC RULES &amp; REGULATIONS
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Live Preview Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        sfx.playClick();
                        setShowRulesLivePreview(!showRulesLivePreview);
                      }}
                      className={`px-2.5 py-1 rounded text-[10px] font-tech font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer ${
                        showRulesLivePreview
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                          : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white'
                      }`}
                      title="Toggle Live Formatting Preview"
                    >
                      {showRulesLivePreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showRulesLivePreview ? 'Hide Live Preview' : 'Live Highlight Preview'}</span>
                    </button>

                    {/* Preset Rule Helper */}
                    <button
                      type="button"
                      onClick={() => applyRulesPreset(formGameId)}
                      className="px-2.5 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-[10px] font-tech font-bold text-[#ff4d4d] hover:text-white uppercase transition-colors flex items-center gap-1 cursor-pointer"
                      title="Auto-fill rules from tournament template"
                    >
                      <Sparkles className="w-3 h-3 text-[#f5c464]" />
                      <span>Auto-Fill Template</span>
                    </button>
                  </div>
                </div>

                {/* Match Rules & Scoring Section */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-zinc-200 text-xs">
                      Match Rules, Device Standards &amp; Scoring System
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">1 rule per line</span>
                  </div>

                  {/* Color Highlight Bar for Match Rules */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 rounded-t-lg bg-black/80 border-t border-x border-white/15 text-[10px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-zinc-400 font-tech font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
                        <Palette className="w-3 h-3 text-[#D71920]" />
                        Highlight Color:
                      </span>
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => applyFormatTag('rules', `[${c.tag}]`, `[/${c.tag}]`)}
                          className="px-2 py-0.5 rounded border border-white/10 hover:border-white/40 text-white font-medium flex items-center gap-1.5 bg-zinc-900/90 hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer shadow-sm"
                          title={`Wrap selected text with ${c.label} tag`}
                        >
                          <span className={`w-2 h-2 rounded-full ${c.bg} shadow-sm`} />
                          <span className="text-[10px]">{c.name}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => applyFormatTag('rules', '**', '**')}
                        className="px-2 py-0.5 rounded border border-white/10 hover:border-white/40 text-white font-bold bg-zinc-900/90 hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer text-[10px]"
                        title="Make selected text bold (**text**)"
                      >
                        Bold
                      </button>
                    </div>
                  </div>

                  <textarea
                    ref={rulesTextareaRef}
                    rows={5}
                    value={formRules}
                    onChange={(e) => setFormRules(e.target.value)}
                    placeholder={"1. Custom room credentials will be shared [gold]15 minutes[/gold] before match.\n2. [red]Mobile devices only[/red]; emulators strictly prohibited.\n3. Squad captain must submit final score screenshot."}
                    className="w-full px-3.5 py-2.5 rounded-b-lg rounded-t-none bg-black/70 border border-white/15 text-white font-mono text-[11px] placeholder:text-zinc-600 focus:outline-none focus:border-[#D71920] leading-relaxed"
                  />

                  {/* Live Highlight Preview for Match Rules */}
                  {showRulesLivePreview && (
                    <div className="mt-2 p-3 rounded-lg bg-black/90 border border-amber-500/30 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-tech text-amber-400 font-bold uppercase tracking-wider">
                        <Eye className="w-3 h-3" />
                        <span>Live Highlight Preview (Match Rules)</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-zinc-300 font-mono">
                        {formRules.split('\n').filter(Boolean).map((line, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] mt-1.5 shrink-0" />
                            <div>
                              <FormattedRuleText text={line} />
                            </div>
                          </div>
                        ))}
                        {!formRules && <p className="text-zinc-500 italic text-[11px]">No rules entered yet.</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* General Code of Conduct Section */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-zinc-200 text-xs">
                      General Code of Conduct &amp; Payout Protocol
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">1 rule per line</span>
                  </div>

                  {/* Color Highlight Bar for General Rules */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 rounded-t-lg bg-black/80 border-t border-x border-white/15 text-[10px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-zinc-400 font-tech font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
                        <Palette className="w-3 h-3 text-emerald-400" />
                        Highlight Color:
                      </span>
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => applyFormatTag('generalRules', `[${c.tag}]`, `[/${c.tag}]`)}
                          className="px-2 py-0.5 rounded border border-white/10 hover:border-white/40 text-white font-medium flex items-center gap-1.5 bg-zinc-900/90 hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer shadow-sm"
                          title={`Wrap selected text with ${c.label} tag`}
                        >
                          <span className={`w-2 h-2 rounded-full ${c.bg} shadow-sm`} />
                          <span className="text-[10px]">{c.name}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => applyFormatTag('generalRules', '**', '**')}
                        className="px-2 py-0.5 rounded border border-white/10 hover:border-white/40 text-white font-bold bg-zinc-900/90 hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer text-[10px]"
                        title="Make selected text bold (**text**)"
                      >
                        Bold
                      </button>
                    </div>
                  </div>

                  <textarea
                    ref={generalRulesTextareaRef}
                    rows={3}
                    value={formGeneralRules}
                    onChange={(e) => setFormGeneralRules(e.target.value)}
                    placeholder={"1. Discord check-in mandatory [gold]15 minutes prior[/gold].\n2. [red]Zero tolerance[/red] for cheating or toxic conduct.\n3. Cash prizes sent via [green]UPI within 24-48 hours[/green]."}
                    className="w-full px-3.5 py-2.5 rounded-b-lg rounded-t-none bg-black/70 border border-white/15 text-white font-mono text-[11px] placeholder:text-zinc-600 focus:outline-none focus:border-[#D71920] leading-relaxed"
                  />

                  {/* Live Highlight Preview for General Rules */}
                  {showRulesLivePreview && (
                    <div className="mt-2 p-3 rounded-lg bg-black/90 border border-amber-500/30 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-tech text-amber-400 font-bold uppercase tracking-wider">
                        <Eye className="w-3 h-3" />
                        <span>Live Highlight Preview (General Rules)</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-zinc-300 font-mono">
                        {formGeneralRules.split('\n').filter(Boolean).map((line, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <div>
                              <FormattedRuleText text={line} />
                            </div>
                          </div>
                        ))}
                        {!formGeneralRules && <p className="text-zinc-500 italic text-[11px]">No general rules entered yet.</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#D71920] to-[#b3141a] hover:from-[#e3262e] text-white font-bold tracking-wide uppercase transition-all shadow-[0_0_15px_rgba(215,25,32,0.35)] cursor-pointer"
                >
                  Save Tournament &amp; Rules
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
              <button onClick={() => setPreviewRulesEvent(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-tech text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D71920]" />
                  SPECIFIC TOURNAMENT &amp; MATCH RULES
                </h4>
                <div className="p-3.5 rounded-lg bg-black/60 border border-white/10 text-zinc-300 space-y-2 font-mono text-[11px] leading-relaxed">
                  {previewRulesEvent.rules ? (
                    previewRulesEvent.rules.split('\n').map((r: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] mt-1.5 shrink-0" />
                        <div>
                          <FormattedRuleText text={r} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500 italic">Standard tournament rules apply.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-tech text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  GENERAL CODE OF CONDUCT &amp; PAYOUT RULES
                </h4>
                <div className="p-3.5 rounded-lg bg-black/60 border border-white/10 text-zinc-300 space-y-2 font-mono text-[11px] leading-relaxed">
                  {(previewRulesEvent.generalRules || previewRulesEvent.general_rules) ? (
                    (previewRulesEvent.generalRules || previewRulesEvent.general_rules).split('\n').map((r: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <div>
                          <FormattedRuleText text={r} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500 italic">Standard BlackHawk community conduct applies.</p>
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
