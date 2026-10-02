import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { type RegistrationRecord } from '../lib/tournamentStore';
import { BlackhawkLogo } from './BlackhawkLogo';
import { 
  Send, 
  CheckCircle, 
  Copy, 
  Download, 
  ExternalLink, 
  User, 
  AtSign, 
  Flame, 
  Crosshair, 
  ShieldAlert, 
  Gamepad2,
  Sparkles, 
  RotateCcw, 
  Check, 
  Trophy, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { sfx } from '../utils/sfx';
import { safeFetchJson } from '../lib/apiHelper';

interface RegistrationProps {
  preSelectedGame?: string;
  preSelectedEventId?: string;
  onRegistrationSuccess?: () => void;
  onClose?: () => void;
}

export interface DBGameItem {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  category?: string;
  defaultPrizePool?: number;
  format?: string;
  active?: number;
}

export interface DBEventItem {
  id: string;
  gameId: string;
  gameName: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  format: string;
  prizePool: number;
  maxParticipants?: number;
  registrationStatus?: string;
}

export const RegistrationSection: React.FC<RegistrationProps> = ({ 
  preSelectedGame, 
  preSelectedEventId,
  onRegistrationSuccess, 
  onClose: _onClose 
}) => {
  // Database Games List
  const [dbGames, setDbGames] = useState<DBGameItem[]>([]);
  const [dbEvents, setDbEvents] = useState<DBEventItem[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  // Step 1: Selected Game Names & Specific Events
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  // Step 2: Athlete Profile
  const [fullName, setFullName] = useState('');
  const [gamerTag, setGamerTag] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');

  // Step 3: Game Credentials
  // Valorant
  const [valRiotId, setValRiotId] = useState('');
  const [valRank, setValRank] = useState('Diamond');
  const [valTeamName, setValTeamName] = useState('');

  // Free Fire
  const [ffUid, setFfUid] = useState('');
  const [ffIgn, setFfIgn] = useState('');
  const [ffPlayType, setFfPlayType] = useState<'Solo' | 'Team / Squad'>('Solo');
  const [ffTeamName, setFfTeamName] = useState('');
  const [ffTeamMembers, setFfTeamMembers] = useState('');

  // BGMI
  const [bgmiUid, setBgmiUid] = useState('');
  const [bgmiIgn, setBgmiIgn] = useState('');
  const [bgmiTeamName, setBgmiTeamName] = useState('');
  const [bgmiTeamMembers, setBgmiTeamMembers] = useState('');

  // Minecraft
  const [mcUsername, setMcUsername] = useState('');
  const [mcEdition, setMcEdition] = useState<'Java' | 'Bedrock'>('Java');
  const [mcPlayType, setMcPlayType] = useState<'Solo' | 'Team / Squad'>('Solo');
  const [mcTeamName, setMcTeamName] = useState('');
  const [mcTeamMembers, setMcTeamMembers] = useState('');

  // Collapsed sections toggle
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});

  // Agreement
  const [agreeToRules, setAgreeToRules] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedPass, setConfirmedPass] = useState<{
    player: string;
    gamerTag: string;
    discord: string;
    registrations: (RegistrationRecord & { eventTitle?: string })[];
    registeredAt: string;
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Fetch games & events strictly from database
  useEffect(() => {
    Promise.all([
      safeFetchJson<DBGameItem[]>('/api/games', [], 'games'),
      safeFetchJson<DBEventItem[]>('/api/events', [], 'events')
    ])
      .then(([gamesData, eventsData]: [DBGameItem[], DBEventItem[]]) => {
        if (Array.isArray(gamesData)) {
          const activeGames = gamesData.filter(g => g.active === undefined || g.active === 1);
          setDbGames(activeGames);

          if (Array.isArray(eventsData)) {
            setDbEvents(eventsData);
          }

          // Handle initial selected game and event
          if (preSelectedEventId && Array.isArray(eventsData)) {
            const foundEvent = eventsData.find(e => e.id === preSelectedEventId);
            if (foundEvent) {
              setSelectedGames([foundEvent.gameName]);
              setSelectedEventIds([foundEvent.id]);
              setLoadingGames(false);
              return;
            }
          }

          if (activeGames.length > 0) {
            if (preSelectedGame) {
              const match = activeGames.find(
                g => g.name.toLowerCase() === preSelectedGame.toLowerCase() || g.id.toLowerCase() === preSelectedGame.toLowerCase()
              );
              if (match) {
                setSelectedGames([match.name]);
                // Select events for this game
                const gameEvs = eventsData.filter(
                  e => e.gameName?.toLowerCase() === match.name.toLowerCase() || e.gameId?.toLowerCase() === match.id.toLowerCase()
                );
                setSelectedEventIds(gameEvs.map(e => e.id));
              } else {
                setSelectedGames([activeGames[0].name]);
              }
            } else {
              setSelectedGames([activeGames[0].name]);
              const firstGameEvs = eventsData.filter(
                e => e.gameName?.toLowerCase() === activeGames[0].name.toLowerCase() || e.gameId?.toLowerCase() === activeGames[0].id.toLowerCase()
              );
              setSelectedEventIds(firstGameEvs.map(e => e.id));
            }
          }
        }
        setLoadingGames(false);
      })
      .catch(err => {
        console.error('Failed to load database games and events for registration:', err);
        setLoadingGames(false);
      });
  }, []);

  // Update selection if preSelectedGame or preSelectedEventId prop changes
  useEffect(() => {
    if (preSelectedEventId && dbEvents.length > 0) {
      const foundEvent = dbEvents.find(e => e.id === preSelectedEventId);
      if (foundEvent) {
        setSelectedGames([foundEvent.gameName]);
        setSelectedEventIds([foundEvent.id]);
        return;
      }
    }

    if (preSelectedGame && dbGames.length > 0) {
      const match = dbGames.find(
        g => g.name.toLowerCase() === preSelectedGame.toLowerCase() || g.id.toLowerCase() === preSelectedGame.toLowerCase()
      );
      if (match) {
        setSelectedGames(prev => {
          if (prev.includes(match.name)) return prev;
          return [...prev, match.name];
        });
        const matchEvents = dbEvents.filter(
          e => e.gameName?.toLowerCase() === match.name.toLowerCase() || e.gameId?.toLowerCase() === match.id.toLowerCase()
        );
        setSelectedEventIds(prev => Array.from(new Set([...prev, ...matchEvents.map(e => e.id)])));
      }
    }
  }, [preSelectedGame, preSelectedEventId, dbGames, dbEvents]);

  // Toggle game selection
  const toggleGame = (gameName: string) => {
    sfx.playClick();
    const game = dbGames.find(g => g.name === gameName);
    const relatedEvents = dbEvents.filter(
      e => e.gameName?.toLowerCase() === gameName.toLowerCase() || (game && e.gameId?.toLowerCase() === game.id.toLowerCase())
    );

    setSelectedGames(prev => {
      if (prev.includes(gameName)) {
        // Remove game and its events
        setSelectedEventIds(evPrev => evPrev.filter(id => !relatedEvents.some(re => re.id === id)));
        return prev.filter(g => g !== gameName);
      } else {
        // Add game and auto-select its events
        setSelectedEventIds(evPrev => Array.from(new Set([...evPrev, ...relatedEvents.map(re => re.id)])));
        return [...prev, gameName];
      }
    });
  };

  // Toggle specific event selection
  const toggleEvent = (eventId: string, gameName: string) => {
    sfx.playClick();
    setSelectedEventIds(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        // Also ensure parent game is selected
        if (!selectedGames.includes(gameName)) {
          setSelectedGames(gPrev => [...gPrev, gameName]);
        }
        return [...prev, eventId];
      }
    });
  };

  // Smart toggle: Select all or Deselect all
  const isAllSelected = dbGames.length > 0 && selectedGames.length === dbGames.length;

  const toggleSelectAll = () => {
    sfx.playClick();
    if (isAllSelected) {
      setSelectedGames([]);
      setSelectedEventIds([]);
    } else {
      setSelectedGames(dbGames.map(g => g.name));
      setSelectedEventIds(dbEvents.map(e => e.id));
    }
  };

  const toggleCardCollapse = (gameName: string) => {
    sfx.playClick();
    setCollapsedCards(prev => ({
      ...prev,
      [gameName]: !prev[gameName]
    }));
  };

  // Calculate real total prize pool from database games & events
  const totalSelectedPrize = selectedGames.reduce((acc, gameName) => {
    const item = dbGames.find(g => g.name === gameName);
    return acc + (item ? (item.defaultPrizePool || 0) : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGames.length === 0) {
      alert("Please select at least one tournament game discipline to register.");
      return;
    }

    if (!agreeToRules) {
      alert("Please accept the tournament rules to complete registration.");
      return;
    }

    sfx.playClick();
    setIsSubmitting(true);

    try {
      // Build registration entries mapped to selected games & specific events
      const entries: any[] = [];

      for (const gameName of selectedGames) {
        const game = dbGames.find(g => g.name === gameName);
        const gameId = game ? game.id : gameName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const gameSpecificDetails: Record<string, string> = {};
        let playType = game?.format || 'Solo';
        let teamName: string | undefined;
        let teamMembers: string | undefined;

        const gnUpper = gameName.toUpperCase();

        if (gnUpper.includes('FREE FIRE')) {
          gameSpecificDetails['Free Fire UID'] = ffUid || 'N/A';
          gameSpecificDetails['In-Game Name'] = ffIgn || gamerTag;
          playType = ffPlayType;
          if (ffPlayType === 'Team / Squad') {
            teamName = ffTeamName;
            teamMembers = ffTeamMembers;
          }
        } else if (gnUpper.includes('BGMI')) {
          gameSpecificDetails['BGMI UID'] = bgmiUid || 'N/A';
          gameSpecificDetails['In-Game Name'] = bgmiIgn || gamerTag;
          playType = 'Team / Squad';
          teamName = bgmiTeamName;
          teamMembers = bgmiTeamMembers;
        } else if (gnUpper.includes('VALORANT')) {
          gameSpecificDetails['Riot ID'] = valRiotId || gamerTag;
          gameSpecificDetails['Rank'] = valRank;
          playType = 'Team / Squad';
          teamName = valTeamName || `${gamerTag}'s 5v5 Squad`;
        } else if (gnUpper.includes('MINECRAFT')) {
          gameSpecificDetails['Minecraft Username'] = mcUsername || gamerTag;
          gameSpecificDetails['Edition'] = mcEdition;
          playType = mcPlayType;
          if (mcPlayType === 'Team / Squad') {
            teamName = mcTeamName;
            teamMembers = mcTeamMembers;
          }
        } else {
          gameSpecificDetails['In-Game Handle'] = gamerTag;
          playType = game?.format || 'Solo';
        }

        // Check if there are specific events selected for this game
        const gameEvents = dbEvents.filter(
          e => e.gameName?.toLowerCase() === gameName.toLowerCase() || (game && e.gameId?.toLowerCase() === game.id.toLowerCase())
        );
        const selectedGameEvents = gameEvents.filter(e => selectedEventIds.includes(e.id));

        if (selectedGameEvents.length > 0) {
          for (const ev of selectedGameEvents) {
            entries.push({
              gameId,
              gameName,
              eventId: ev.id,
              eventTitle: ev.title,
              playType: ev.format || playType,
              teamName,
              teamMembers,
              gameSpecificDetails
            });
          }
        } else {
          entries.push({
            gameId,
            gameName,
            eventId: null,
            eventTitle: null,
            playType,
            teamName,
            teamMembers,
            gameSpecificDetails
          });
        }
      }

      // Submit directly to REAL database API endpoint
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          gamerTag,
          discordUsername,
          games: entries
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Registration submission failed' }));
        throw new Error(errData.error || 'Registration submission failed');
      }

      const result = await response.json();

      setConfirmedPass({
        player: result.player.fullName,
        gamerTag: result.player.gamerTag,
        discord: result.player.discordUsername,
        registrations: result.registrations,
        registeredAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });

      setIsSubmitting(false);
      sfx.playSuccess();
      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      }

      try {
        confetti({
          particleCount: 130,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#D71920', '#ff2a2a', '#ffffff', '#8b0000', '#ffd700']
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      setIsSubmitting(false);
      alert(`Registration Error: ${err.message || 'Please check your inputs and try again.'}`);
    }
  };

  const copySingleRegId = (id: string) => {
    sfx.playClick();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const copyAllRegIds = () => {
    if (!confirmedPass) return;
    sfx.playClick();
    const text = confirmedPass.registrations
      .map(r => `${r.gameName}: ${r.id}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const resetForm = () => {
    sfx.playClick();
    setConfirmedPass(null);
    setFullName('');
    setGamerTag('');
    setDiscordUsername('');
    setValRiotId('');
    setFfUid('');
    setFfIgn('');
    setBgmiUid('');
    setBgmiIgn('');
    setMcUsername('');
    setAgreeToRules(false);
  };

  const getGameIcon = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('FREE FIRE')) return <Flame className="w-5 h-5 text-[#ff2a2a]" />;
    if (n.includes('BGMI')) return <Crosshair className="w-5 h-5 text-[#ff2a2a]" />;
    if (n.includes('VALORANT')) return <Crosshair className="w-5 h-5 text-[#D71920]" />;
    if (n.includes('MINECRAFT')) return <ShieldAlert className="w-5 h-5 text-[#ff2a2a]" />;
    return <Gamepad2 className="w-5 h-5 text-[#ff2a2a]" />;
  };

  return (
    <section id="register" className="relative py-6 bg-transparent text-white font-sans">
      <div className="max-w-5xl mx-auto px-2 sm:px-4">
        
        {/* Sleek Compact Header */}
        <div className="text-center mb-3 sm:mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/40 border border-red-500/30 text-[#ff4d4d] font-tech text-[10px] tracking-wider uppercase mb-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>INSTANT DATABASE REGISTRATION</span>
          </div>

          <h2 className="font-cinzel font-bold text-lg sm:text-2xl text-white uppercase tracking-tight">
            SELECT <span className="text-[#D71920]">DISCIPLINES & REGISTER</span>
          </h2>
        </div>

        {/* Dynamic State: Form or Confirmation Pass */}
        {!confirmedPass ? (
          <div className="bg-[#0c0c10] border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative">
            
            {/* Step 1: Select One or Multiple Games from Real Database */}
            <div className="mb-4 sm:mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-white/10 mb-2.5 gap-2">
                <span className="font-tech text-xs uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#D71920] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  CHOOSE TOURNAMENT GAMES
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="px-2.5 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-[10px] font-tech font-bold text-[#ff4d4d] hover:text-white uppercase transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {isAllSelected ? (
                      <>
                        <RotateCcw className="w-3 h-3" />
                        <span>DESELECT ALL</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        <span>SELECT ALL ({dbGames.length})</span>
                      </>
                    )}
                  </button>
                  <span className="text-[10px] font-tech text-emerald-400 font-bold uppercase bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                    {selectedGames.length} OF {dbGames.length} DISCIPLINES SELECTED
                  </span>
                </div>
              </div>

              {/* Game Cards Grid (Loaded strictly from Database) */}
              {loadingGames ? (
                <div className="py-4 text-center text-zinc-500 font-tech text-xs">
                  Loading available games from database...
                </div>
              ) : dbGames.length === 0 ? (
                <div className="py-4 text-center text-zinc-500 font-tech text-xs">
                  No active games found in the database.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {dbGames.map((g) => {
                    const isSelected = selectedGames.includes(g.name);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGame(g.name)}
                        onMouseEnter={() => sfx.playHover()}
                        className={`p-2 rounded-lg border text-left transition-all duration-150 flex items-center justify-between cursor-pointer relative group ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#220a0a] to-[#120707] border-[#D71920] shadow-[0_0_12px_rgba(215,25,32,0.35)] ring-1 ring-[#D71920]'
                            : 'bg-[#09090d] border-white/10 hover:border-white/20 hover:bg-[#0e0e14]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded bg-black/60 border border-white/10 flex items-center justify-center p-1 shrink-0">
                            {g.logo ? (
                              <img
                                src={g.logo}
                                alt={g.name}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              getGameIcon(g.name)
                            )}
                          </div>
                          <div className="min-w-0 truncate">
                            <h4 className={`font-cinzel font-bold text-xs sm:text-sm uppercase leading-tight truncate ${
                              isSelected ? 'text-white' : 'text-zinc-300'
                            }`}>
                              {g.name}
                            </h4>
                            <span className="text-[9px] font-tech text-zinc-400 font-bold block leading-none mt-0.5 truncate uppercase">
                              {g.category || g.format || 'OFFICIAL'}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[9px] font-tech font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ml-1 ${
                          isSelected 
                            ? 'bg-[#D71920] text-white shadow-sm' 
                            : 'bg-white/5 text-zinc-500 group-hover:text-zinc-300'
                        }`}>
                          {isSelected ? 'IN' : '+'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Upcoming Events for Selected Games */}
              {selectedGames.length > 0 && dbEvents.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-tech text-xs uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-[#D71920]" />
                      UPCOMING TOURNAMENT EVENTS ({selectedEventIds.length} SELECTED)
                    </span>
                    <span className="text-[10px] font-tech text-zinc-400">
                      SELECT MATCHES YOU ARE PARTICIPATING IN
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dbEvents
                      .filter(e => selectedGames.some(sg => sg.toLowerCase() === e.gameName?.toLowerCase() || (e.gameId && sg.toLowerCase().includes(e.gameId.toLowerCase()))))
                      .map((ev) => {
                        const isEvSelected = selectedEventIds.includes(ev.id);
                        return (
                          <div
                            key={ev.id}
                            onClick={() => toggleEvent(ev.id, ev.gameName)}
                            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                              isEvSelected
                                ? 'bg-gradient-to-r from-[#1f0a0a] to-[#0d0909] border-[#D71920]/80 shadow-[0_0_10px_rgba(215,25,32,0.25)]'
                                : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-tech text-zinc-300 font-bold uppercase">
                                  {ev.gameName}
                                </span>
                                <span className="text-[9px] font-tech text-[#ff4d4d] font-bold uppercase">
                                  {ev.format}
                                </span>
                              </div>
                              <h5 className="font-cinzel text-xs sm:text-sm font-bold text-white truncate leading-snug">
                                {ev.title}
                              </h5>
                              <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-1 font-tech">
                                <span>📅 {ev.date}</span>
                                <span className="text-[#f5c464] font-bold">₹{(ev.prizePool || 0).toLocaleString()}</span>
                              </div>
                            </div>

                            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all ${
                              isEvSelected 
                                ? 'bg-[#D71920] border-[#D71920] text-white' 
                                : 'border-white/20 bg-black/60 text-transparent group-hover:border-white/40'
                            }`}>
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {selectedGames.length === 0 && (
                <p className="text-[11px] font-tech text-amber-400 mt-2 flex items-center gap-1.5 bg-amber-950/20 border border-amber-500/20 p-2 rounded-lg">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Select at least 1 game above to enter your credentials and register.</span>
                </p>
              )}
            </div>

            {/* Step 2: Form Input Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-tech text-xs uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#D71920] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                  ATHLETE PROFILE
                </span>
                <span className="text-[10px] font-tech text-zinc-500 uppercase">
                  COMMON TO ALL GAMES
                </span>
              </div>

              {/* COMMON PLAYER INFORMATION (SHARED ACROSS ALL SELECTED GAMES) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider font-semibold mb-1">
                    Full Name <span className="text-[#ff2a2a]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. Alex Morgan"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 rounded-lg font-tech text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Primary Gamer Tag */}
                <div>
                  <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider font-semibold mb-1">
                    Primary Gamer Tag <span className="text-[#ff2a2a]">*</span>
                  </label>
                  <div className="relative">
                    <AtSign className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. ShadowHawk"
                      value={gamerTag}
                      onChange={e => setGamerTag(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 rounded-lg font-tech text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Discord Username */}
                <div>
                  <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider font-semibold mb-1">
                    Discord Username <span className="text-[#ff2a2a]">*</span>
                  </label>
                  <div className="relative">
                    <AtSign className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. shadowhawk#0001"
                      value={discordUsername}
                      onChange={e => setDiscordUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 rounded-lg font-tech text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

              </div>

              {/* STEP 3: DISCIPLINE-SPECIFIC IN-GAME CREDENTIALS */}
              {selectedGames.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                    <span className="font-tech text-xs uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#D71920] text-white flex items-center justify-center text-[10px] font-bold">3</span>
                      IN-GAME CREDENTIALS ({selectedGames.length} SELECTED)
                    </span>
                    <span className="text-[10px] font-tech text-zinc-500 uppercase">
                      CLICK TO COLLAPSE/EXPAND
                    </span>
                  </div>

                  {/* FREE FIRE SPECIFIC FIELDS */}
                  {selectedGames.some(g => g.toUpperCase().includes('FREE FIRE')) && (
                    <div className="p-3 sm:p-3.5 rounded-lg bg-black/40 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Flame className="w-3.5 h-3.5 text-[#ff2a2a]" />
                          <span className="font-tech text-xs uppercase tracking-wider text-[#ff4d4d] font-bold">
                            FREE FIRE CREDENTIALS
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCardCollapse('FREE FIRE')}
                          className="text-zinc-500 hover:text-white cursor-pointer"
                        >
                          {collapsedCards['FREE FIRE'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {!collapsedCards['FREE FIRE'] && (
                        <div className="space-y-3 animate-in fade-in duration-200">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                Free Fire UID <span className="text-[#ff2a2a]">*</span>
                              </label>
                              <input
                                required
                                type="text"
                                placeholder="e.g. 192837465"
                                value={ffUid}
                                onChange={e => setFfUid(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                In-Game Name (IGN) <span className="text-[#ff2a2a]">*</span>
                              </label>
                              <input
                                required
                                type="text"
                                placeholder="Exact in-game name"
                                value={ffIgn}
                                onChange={e => setFfIgn(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                Format <span className="text-[#ff2a2a]">*</span>
                              </label>
                              <select
                                value={ffPlayType}
                                onChange={e => setFfPlayType(e.target.value as 'Solo' | 'Team / Squad')}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                              >
                                <option value="Solo">Solo</option>
                                <option value="Team / Squad">Team / Squad</option>
                              </select>
                            </div>
                          </div>

                          {ffPlayType === 'Team / Squad' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/5">
                              <div>
                                <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                  Team Name <span className="text-[#ff2a2a]">*</span>
                                </label>
                                <input
                                  required
                                  type="text"
                                  placeholder="e.g. Team Phoenix"
                                  value={ffTeamName}
                                  onChange={e => setFfTeamName(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                  Team Members <span className="text-[#ff2a2a]">*</span>
                                </label>
                                <input
                                  required
                                  type="text"
                                  placeholder="Player2, Player3, Player4"
                                  value={ffTeamMembers}
                                  onChange={e => setFfTeamMembers(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* BGMI SPECIFIC FIELDS */}
                  {selectedGames.some(g => g.toUpperCase().includes('BGMI')) && (
                    <div className="p-3 sm:p-3.5 rounded-lg bg-black/40 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Crosshair className="w-3.5 h-3.5 text-[#ff2a2a]" />
                          <span className="font-tech text-xs uppercase tracking-wider text-[#ff4d4d] font-bold">
                            BGMI CREDENTIALS
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCardCollapse('BGMI')}
                          className="text-zinc-500 hover:text-white cursor-pointer"
                        >
                          {collapsedCards['BGMI'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {!collapsedCards['BGMI'] && (
                        <div className="space-y-3 animate-in fade-in duration-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                Character ID <span className="text-[#ff2a2a]">*</span>
                              </label>
                              <input
                                required
                                type="text"
                                placeholder="e.g. 5182930412"
                                value={bgmiUid}
                                onChange={e => setBgmiUid(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                In-Game Name (IGN) <span className="text-[#ff2a2a]">*</span>
                              </label>
                              <input
                                required
                                type="text"
                                placeholder="Exact IGN"
                                value={bgmiIgn}
                                onChange={e => setBgmiIgn(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/5">
                            <div>
                              <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                Squad / Team Name <span className="text-[#ff2a2a]">*</span>
                              </label>
                              <input
                                required
                                type="text"
                                placeholder="e.g. Mortal Esports"
                                value={bgmiTeamName}
                                onChange={e => setBgmiTeamName(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                Squad Lineup (4 Players) <span className="text-[#ff2a2a]">*</span>
                              </label>
                              <input
                                required
                                type="text"
                                placeholder="Player1, Player2, Player3, Player4"
                                value={bgmiTeamMembers}
                                onChange={e => setBgmiTeamMembers(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VALORANT SPECIFIC FIELDS */}
                  {selectedGames.some(g => g.toUpperCase().includes('VALORANT')) && (
                    <div className="p-3 sm:p-3.5 rounded-lg bg-black/40 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Crosshair className="w-3.5 h-3.5 text-[#D71920]" />
                          <span className="font-tech text-xs uppercase tracking-wider text-[#ff4d4d] font-bold">
                            VALORANT 5v5 CREDENTIALS
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCardCollapse('VALORANT')}
                          className="text-zinc-500 hover:text-white cursor-pointer"
                        >
                          {collapsedCards['VALORANT'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {!collapsedCards['VALORANT'] && (
                        <div className="space-y-3 animate-in fade-in duration-200">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                Riot ID & Tagline <span className="text-[#ff2a2a]">*</span>
                              </label>
                              <input
                                required
                                type="text"
                                placeholder="e.g. TenZ#1337"
                                value={valRiotId}
                                onChange={e => setValRiotId(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                Peak Rank <span className="text-[#ff2a2a]">*</span>
                              </label>
                              <select
                                value={valRank}
                                onChange={e => setValRank(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                              >
                                <option value="Iron">Iron</option>
                                <option value="Bronze">Bronze</option>
                                <option value="Silver">Silver</option>
                                <option value="Gold">Gold</option>
                                <option value="Platinum">Platinum</option>
                                <option value="Diamond">Diamond</option>
                                <option value="Ascendant">Ascendant</option>
                                <option value="Immortal">Immortal</option>
                                <option value="Radiant">Radiant</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                5v5 Team Name <span className="text-[#ff2a2a]">*</span>
                              </label>
                              <input
                                required
                                type="text"
                                placeholder="e.g. Sentinels India"
                                value={valTeamName}
                                onChange={e => setValTeamName(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* MINECRAFT SPECIFIC FIELDS */}
                  {selectedGames.some(g => g.toUpperCase().includes('MINECRAFT')) && (
                    <div className="p-3 sm:p-3.5 rounded-lg bg-black/40 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-3.5 h-3.5 text-[#ff2a2a]" />
                          <span className="font-tech text-xs uppercase tracking-wider text-[#ff4d4d] font-bold">
                            MINECRAFT CREDENTIALS
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCardCollapse('MINECRAFT')}
                          className="text-zinc-500 hover:text-white cursor-pointer"
                        >
                          {collapsedCards['MINECRAFT'] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {!collapsedCards['MINECRAFT'] && (
                        <div className="space-y-3 animate-in fade-in duration-200">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                Minecraft IGN <span className="text-[#ff2a2a]">*</span>
                              </label>
                              <input
                                required
                                type="text"
                                placeholder="Java or Bedrock username"
                                value={mcUsername}
                                onChange={e => setMcUsername(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                Edition <span className="text-[#ff2a2a]">*</span>
                              </label>
                              <select
                                value={mcEdition}
                                onChange={e => setMcEdition(e.target.value as 'Java' | 'Bedrock')}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                              >
                                <option value="Java">Java Edition (1.20+)</option>
                                <option value="Bedrock">Bedrock Edition</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                Format <span className="text-[#ff2a2a]">*</span>
                              </label>
                              <select
                                value={mcPlayType}
                                onChange={e => setMcPlayType(e.target.value as 'Solo' | 'Team / Squad')}
                                className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                              >
                                <option value="Solo">Solo (Build Battle & PvP)</option>
                                <option value="Team / Squad">Duo / Squad</option>
                              </select>
                            </div>
                          </div>

                          {mcPlayType === 'Team / Squad' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/5">
                              <div>
                                <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                  Duo/Squad Name <span className="text-[#ff2a2a]">*</span>
                                </label>
                                <input
                                  required
                                  type="text"
                                  placeholder="e.g. BlockBusters"
                                  value={mcTeamName}
                                  onChange={e => setMcTeamName(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                                  Teammates <span className="text-[#ff2a2a]">*</span>
                                </label>
                                <input
                                  required
                                  type="text"
                                  placeholder="Teammate MC Usernames"
                                  value={mcTeamMembers}
                                  onChange={e => setMcTeamMembers(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-base sm:text-xs text-white focus:outline-none focus:border-red-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* Agreement Checkbox */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    required
                    type="checkbox"
                    checked={agreeToRules}
                    onChange={e => setAgreeToRules(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#D71920] rounded cursor-pointer"
                  />
                  <span className="text-[11px] sm:text-xs text-zinc-400 font-sans leading-relaxed">
                    I agree to the tournament code of conduct and rules. Third-party hacks, cheating, or toxic conduct will lead to instant disqualification.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || selectedGames.length === 0}
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-[#D71920] to-[#b3141a] hover:from-[#e3262e] hover:to-[#c4161d] text-white font-cinzel font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 shadow-[0_0_20px_rgba(215,25,32,0.4)] hover:shadow-[0_0_28px_rgba(215,25,32,0.6)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 rounded-lg active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>REGISTERING FOR {selectedGames.length} DISCIPLINES...</span>
                  </>
                ) : (
                  <>
                    <span>REGISTER FOR {selectedGames.length} {selectedGames.length === 1 ? 'DISCIPLINE' : 'DISCIPLINES'} (₹{totalSelectedPrize.toLocaleString()} POOL)</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="text-center">
                <span className="font-tech text-[11px] text-zinc-500 uppercase tracking-widest">
                  BLACKHAWK TOURNAMENT PLATFORM • DATABASE SYNCED
                </span>
              </div>

            </form>
          </div>
        ) : (
          /* MULTI-GAME REGISTRATION CONFIRMATION CARD */
          <div className="bg-[#0b0b10] border-2 border-[#D71920] rounded-2xl p-5 sm:p-7 shadow-[0_0_40px_rgba(215,25,32,0.3)] animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
            
            {/* Top Pass Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-white/10 gap-3">
              <BlackhawkLogo size="sm" showSubtitle={true} />
              
              <div className="text-left sm:text-right">
                <span className="inline-block px-2.5 py-0.5 rounded bg-green-950/80 border border-green-500 text-green-400 font-tech font-bold text-xs uppercase tracking-widest">
                  YOU'RE IN • {confirmedPass.registrations.length} {confirmedPass.registrations.length === 1 ? 'DISCIPLINE' : 'DISCIPLINES'}
                </span>
                <span className="block font-tech text-[11px] text-zinc-400 mt-0.5 uppercase">
                  STATUS: VERIFIED & REGISTERED IN DATABASE
                </span>
              </div>
            </div>

            {/* Athlete Profile Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/60 p-3.5 sm:p-4 rounded-xl border border-white/5 mb-4">
              <div>
                <span className="text-[9px] font-tech text-zinc-400 uppercase tracking-widest block mb-0.5">
                  ATHLETE NAME
                </span>
                <h3 className="font-cinzel font-bold text-xl sm:text-2xl text-white uppercase">
                  {confirmedPass.player}
                </h3>
              </div>

              <div>
                <span className="text-[9px] font-tech text-zinc-400 uppercase tracking-widest block mb-0.5">
                  PRIMARY GAMER TAG
                </span>
                <span className="font-tech font-bold text-lg text-[#ff4d4d]">
                  {confirmedPass.gamerTag}
                </span>
              </div>

              <div>
                <span className="text-[9px] font-tech text-zinc-400 uppercase tracking-widest block mb-0.5">
                  DISCORD TAG / VERIFIED DATE
                </span>
                <span className="font-tech font-bold text-sm text-white block">
                  {confirmedPass.discord}
                </span>
                <span className="font-tech text-[10px] text-zinc-500 block mt-0.5">
                  {confirmedPass.registeredAt}
                </span>
              </div>
            </div>

            {/* Multi-Discipline Registration Passes Grid */}
            <div className="space-y-2.5 mb-4">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                <span className="font-tech text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[#ff2a2a]" />
                  YOUR TOURNAMENT ENTRY PASSES ({confirmedPass.registrations.length})
                </span>
                <button
                  onClick={copyAllRegIds}
                  className="px-2.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-zinc-200 text-[11px] font-tech font-bold uppercase flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedAll ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedAll ? 'COPIED ALL' : 'COPY ALL IDS'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {confirmedPass.registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-[#160808] to-[#0c0c12] border border-red-600/40 flex flex-col justify-between space-y-2 shadow-sm hover:border-red-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-tech text-[#ff4d4d] font-bold uppercase tracking-widest block">
                            {reg.gameName}
                          </span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-[9px] font-tech text-zinc-400 font-bold uppercase tracking-widest block">
                            {reg.playType}
                          </span>
                        </div>
                        <h4 className="font-cinzel font-bold text-base sm:text-lg text-white uppercase leading-tight mt-0.5">
                          {reg.eventTitle || reg.gameName}
                        </h4>
                        {reg.teamName && (
                          <span className="text-xs text-zinc-400 font-sans block mt-0.5">
                            Team: <strong className="text-white">{reg.teamName}</strong>
                          </span>
                        )}
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-tech font-bold bg-green-950/80 text-green-400 border border-green-500/40 uppercase">
                        {reg.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-tech text-zinc-500 uppercase tracking-widest block">
                          REGISTRATION ID
                        </span>
                        <span className="font-cinzel font-bold text-base text-white tracking-wider text-glow-red">
                          {reg.id}
                        </span>
                      </div>
                      <button
                        onClick={() => copySingleRegId(reg.id)}
                        className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition flex items-center gap-1 text-[11px] font-tech cursor-pointer"
                        title="Copy Registration ID"
                      >
                        {copiedId === reg.id ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === reg.id ? 'COPIED' : 'COPY'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps Discord CTA Box */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950/60 to-black border border-red-600/40 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="font-cinzel font-bold text-base text-white uppercase">
                  STEP 2: JOIN THE BLACKHAWK DISCORD
                </h4>
                <p className="text-xs text-zinc-300 font-sans">
                  Custom room IDs, passwords, schedule timings, and qualifier brackets are posted on Discord.
                </p>
              </div>

              <a
                href="https://discord.gg/WrxHsKbHY"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white font-tech font-bold text-xs uppercase tracking-wider rounded flex items-center gap-1.5 shadow-lg transition-colors shrink-0"
              >
                <span>JOIN DISCORD</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Footer Control Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
              <button
                onClick={resetForm}
                className="text-xs font-tech text-zinc-400 hover:text-white uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Register Another Athlete</span>
              </button>

              <button
                onClick={() => {
                  sfx.playClick();
                  window.print();
                }}
                className="px-3.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white font-tech font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>SAVE / SCREENSHOT MULTI-PASS</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
