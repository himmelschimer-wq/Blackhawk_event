import React, { useEffect, useState } from 'react';
import { Calendar, Trophy, AlertCircle } from 'lucide-react';
import { sfx } from '../utils/sfx';
import { PlayerProfileModal, type PlayerProfileData } from './PlayerProfileModal';
import { safeFetchJson } from '../lib/apiHelper';
import { ScrollReveal } from './ScrollReveal';

interface UpcomingEventsAndLeaderboardProps {
  onRegisterEvent: (gameName: string, eventId?: string) => void;
  onSelectEvent?: (event: DBEventItem) => void;
  onViewAllEvents?: () => void;
  onViewFullLeaderboard?: () => void;
  activeGameFilter?: string;
  onSelectGameFilter?: (gameName: string) => void;
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
  maxParticipants: number;
  registrationStatus: string;
  eventStatus: string;
  rules?: string;
  generalRules?: string;
  banner?: string;
}

export interface DBLeaderboardItem {
  id: string;
  playerId: string;
  playerName: string;
  gamerTag: string;
  game: string;
  avatar?: string;
  matches: number;
  wins: number;
  score: number;
  points: number;
  rank: number;
  crown: boolean;
}

export const UpcomingEventsAndLeaderboard: React.FC<UpcomingEventsAndLeaderboardProps> = ({
  onRegisterEvent,
  onSelectEvent,
  onViewAllEvents,
  onViewFullLeaderboard,
  activeGameFilter,
  onSelectGameFilter,
}) => {
  const [events, setEvents] = useState<DBEventItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<DBLeaderboardItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string>(activeGameFilter || 'ALL');
  const [selectedProfilePlayer, setSelectedProfilePlayer] = useState<PlayerProfileData | null>(null);

  useEffect(() => {
    if (activeGameFilter) {
      setSelectedGame(activeGameFilter);
    }
  }, [activeGameFilter]);

  // Fetch real events from Database API
  const fetchEvents = async () => {
    try {
      const data = await safeFetchJson<any[]>('/api/events', [], 'events');
      if (Array.isArray(data)) {
        setEvents(data);
      }
    } catch (err) {
      console.warn('Failed to load events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Fetch real leaderboard from Database API (with server-calculated ranking)
  const fetchLeaderboard = async () => {
    try {
      const data = await safeFetchJson<any[]>('/api/leaderboard', [], 'leaderboard');
      if (Array.isArray(data)) {
        setLeaderboard(data);
      }
    } catch (err) {
      console.warn('Failed to load leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchLeaderboard();
  }, []);

  // Filter events based on selected game
  const filteredEvents = events.filter(e => {
    if (!selectedGame || selectedGame === 'ALL') return true;
    const gLower = selectedGame.toLowerCase();
    return (
      (e.gameName && e.gameName.toLowerCase().includes(gLower)) ||
      (e.gameId && e.gameId.toLowerCase() === gLower)
    );
  });

  // Filter leaderboard based on selected game with re-ranked positions according to points
  const filteredLeaderboard = (
    !selectedGame || selectedGame === 'ALL'
      ? leaderboard
      : leaderboard.filter(p => (p.game || '').toLowerCase() === selectedGame.toLowerCase() || (p.game || '').toUpperCase() === 'ALL')
  ).map((item, idx) => ({
    ...item,
    rank: idx + 1,
    crown: idx === 0
  }));

  // Unique game names from events
  const gameTabs = ['ALL', ...Array.from(new Set(events.map(e => e.gameName?.toUpperCase() || ''))).filter(Boolean)];

  return (
    <section id="events" className="py-12 sm:py-16 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ─── Left Section: UPCOMING EVENTS (Editorial Schedule Table from Database) ─── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="bg-[#0b0b0e] border border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.65)] relative overflow-hidden">
              {/* Header */}
              <ScrollReveal>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.06] mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[#D71920]/15 border border-[#D71920]/30 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-[#D71920]" />
                    </div>
                    <div>
                      <h2 className="font-cinzel text-base sm:text-lg font-bold text-white tracking-wider uppercase">
                        UPCOMING EVENTS
                      </h2>
                      <p className="text-[10px] font-semibold tracking-[0.2em] text-[#71717a] uppercase -mt-0.5">
                        {selectedGame === 'ALL' ? 'ALL SCHEDULED BATTLES' : `EVENTS FOR ${selectedGame}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sfx.playClick();
                      if (onViewAllEvents) onViewAllEvents();
                    }}
                    className="px-3 py-1 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.02] text-[#9a9aa0] hover:text-white text-[11px] font-medium tracking-wide transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <span>Explore Games</span>
                    <span className="text-zinc-500">→</span>
                  </button>
                </div>
              </ScrollReveal>

              {/* Game Filter Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 scrollbar-none">
                {gameTabs.map((g) => {
                  const isActive = selectedGame === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        sfx.playClick();
                        setSelectedGame(g);
                        if (onSelectGameFilter) onSelectGameFilter(g);
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-tech font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-[#D71920] text-white shadow-[0_0_10px_rgba(215,25,32,0.5)]'
                          : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.07] border border-white/5'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>

              {/* Empty State from Database */}
              {!loadingEvents && filteredEvents.length === 0 && (
                <div className="py-12 text-center text-zinc-500">
                  <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="font-cinzel text-sm text-zinc-400">NO UPCOMING EVENTS FOUND FOR {selectedGame}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">Switch back to ALL to see the full tournament calendar.</p>
                </div>
              )}

              {/* Desktop Table Header */}
              {filteredEvents.length > 0 && (
                <div className="hidden md:grid md:grid-cols-[1fr_130px_90px_85px_150px] gap-3 px-3 pb-2.5 pt-1 text-[10px] font-tech font-bold uppercase tracking-wider text-zinc-500 border-b border-white/[0.06]">
                  <div className="min-w-0">GAME / TOURNAMENT</div>
                  <div className="min-w-0">SCHEDULE</div>
                  <div className="text-center">PRIZE POOL</div>
                  <div className="text-center">FORMAT</div>
                  <div className="text-right">REGISTRATION</div>
                </div>
              )}

              {/* Event Rows from Database */}
              <div className="space-y-2.5 md:space-y-0 md:divide-y md:divide-white/[0.05]">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3.5 md:py-3.5 md:px-3 bg-white/[0.02] md:bg-transparent border border-white/[0.06] md:border-0 rounded-xl md:rounded-none group flex flex-col md:grid md:grid-cols-[1fr_130px_90px_85px_150px] gap-3 md:gap-3 md:items-center transition-all hover:bg-white/[0.03] md:hover:bg-white/[0.02]"
                  >
                    {/* 1. Game & Title */}
                    <div className="flex items-center justify-between md:justify-start gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Mini Thumbnail */}
                        <div className="relative w-11 h-11 sm:w-11 sm:h-11 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                          <img
                            src={event.banner || '/assets/official_game_bgmi.png'}
                            alt={event.gameName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40" />
                        </div>

                        {/* Game & Tournament Name */}
                        <div className="min-w-0">
                          <h3 className="font-cinzel text-xs sm:text-sm font-bold text-white tracking-wide group-hover:text-[#f0f0f5] truncate">
                            {event.gameName}
                          </h3>
                          <p className="text-[11px] text-[#82828a] font-normal truncate">
                            {event.title}
                          </p>
                        </div>
                      </div>

                      {/* Format Tag visible on mobile top-right */}
                      <span className="md:hidden px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-[9px] font-semibold tracking-wider text-zinc-300 uppercase shrink-0">
                        {event.format}
                      </span>
                    </div>

                    {/* 2. Schedule (Date & Time) */}
                    <div className="flex items-center gap-2 text-xs text-[#9a9aa0] pt-1 md:pt-0 border-t border-white/[0.04] md:border-0 min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-[#D71920]/80 shrink-0" />
                      <div className="min-w-0 truncate">
                        <p className="font-medium text-white/90 text-[11px] sm:text-xs tracking-wide truncate">
                          {event.date}
                        </p>
                        <p className="text-[10px] text-[#71717a] truncate">{event.time}</p>
                      </div>
                    </div>

                    {/* 3. Prize Pool */}
                    <div className="text-right md:text-center shrink-0">
                      <p className="font-bebas text-base sm:text-lg text-[#f5c464] tracking-wider leading-none">
                        ₹{event.prizePool.toLocaleString()}
                      </p>
                      <p className="text-[9px] font-semibold tracking-[0.16em] text-[#71717a] uppercase">
                        PRIZE POOL
                      </p>
                    </div>

                    {/* 4. Format Tag */}
                    <div className="hidden md:flex justify-center shrink-0">
                      <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-[9px] font-semibold tracking-wider text-zinc-300 uppercase whitespace-nowrap">
                        {event.format}
                      </span>
                    </div>

                    {/* 5. Action Register Button */}
                    <div className="flex items-center justify-end shrink-0 pt-1 md:pt-0">
                      <button
                        onClick={() => {
                          sfx.playClick();
                          if (onSelectEvent) {
                            onSelectEvent(event);
                          } else {
                            onRegisterEvent(event.gameName, event.id);
                          }
                        }}
                        onMouseEnter={() => sfx.playHover()}
                        className="w-full md:w-auto px-3.5 py-1.5 rounded-full border border-white/15 bg-white/[0.02] active:bg-[#D71920]/25 hover:bg-[#D71920]/15 hover:border-[#D71920]/60 text-white/90 hover:text-white text-[11px] font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 group-hover:border-white/30 whitespace-nowrap"
                      >
                        <span>View Rules &amp; Register</span>
                        <span className="text-[#D71920] group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Right Section: LEADERBOARD from Database (Automatic Ranking) ─── */}
          <div id="leaderboard" className="lg:col-span-5 xl:col-span-4 space-y-4">
            <div className="bg-[#0b0b0e] border border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.65)] relative overflow-hidden">
              {/* Header */}
              <ScrollReveal>
                <div className="flex items-center justify-between pb-5 border-b border-white/[0.06] mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[#D71920]/15 border border-[#D71920]/30 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-[#D71920]" />
                    </div>
                    <div>
                      <h2 className="font-cinzel text-base sm:text-lg font-bold text-white tracking-wider uppercase">
                        LEADERBOARD
                      </h2>
                      <p className="text-[10px] font-semibold tracking-[0.2em] text-[#71717a] uppercase -mt-0.5">
                        TOP WARRIORS
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sfx.playClick();
                      if (onViewFullLeaderboard) onViewFullLeaderboard();
                    }}
                    className="px-3 py-1 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.02] text-[#9a9aa0] hover:text-white text-[11px] font-medium tracking-wide transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>View Full</span>
                    <span className="text-zinc-500">→</span>
                  </button>
                </div>
              </ScrollReveal>

              {/* Table Column Headers */}
              <div className="flex items-center justify-between py-2 text-[10px] font-semibold tracking-[0.18em] text-[#63636b] uppercase border-b border-white/[0.04]">
                <div className="flex items-center gap-4">
                  <span className="w-6 text-center">#</span>
                  <span>PLAYER</span>
                </div>
                <span>POINTS</span>
              </div>

              {/* Empty State */}
              {!loadingLeaderboard && filteredLeaderboard.length === 0 && (
                <div className="py-10 text-center text-zinc-500">
                  <Trophy className="w-7 h-7 text-zinc-600 mx-auto mb-2" />
                  <p className="font-cinzel text-xs text-zinc-400">NO LEADERBOARD RANKINGS YET</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">Register and compete to claim the #1 spot!</p>
                </div>
              )}

              {/* Player Rows with Automatic Ranking */}
              <div className="divide-y divide-white/[0.04] max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {filteredLeaderboard.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => {
                      sfx.playClick();
                      setSelectedProfilePlayer({
                        id: player.id,
                        playerId: player.playerId,
                        playerName: player.playerName,
                        gamerTag: player.gamerTag,
                        game: player.game,
                        avatar: player.avatar,
                        rank: player.rank,
                        points: player.points,
                        wins: player.wins,
                        matches: player.matches,
                        score: player.score,
                      });
                    }}
                    className={`py-3 flex items-center justify-between transition-colors -mx-2 px-2 rounded-lg cursor-pointer group ${
                      player.rank === 1
                        ? 'bg-[#d49935]/[0.06] border border-[#d49935]/20 my-1 hover:bg-[#d49935]/[0.12]'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Rank + Avatar + Name */}
                    <div className="flex items-center gap-3">
                      {/* Rank Pill */}
                      <span
                        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                          player.rank === 1
                            ? 'bg-[#d49935]/30 text-[#f5c464] border border-[#d49935]/50'
                            : 'text-[#82828a] group-hover:text-zinc-300'
                        }`}
                      >
                        #{player.rank}
                      </span>

                      {/* Avatar from Discord / Gamer Profile */}
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/15 shrink-0 bg-zinc-900 shadow-inner flex items-center justify-center group-hover:border-white/30 transition-colors">
                        <img
                          src={player.avatar || `https://unavatar.io/discord/${encodeURIComponent(player.gamerTag)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(player.gamerTag)}%26backgroundColor%3D09090b`}
                          alt={player.gamerTag}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.gamerTag)}&backgroundColor=09090b,18181b`;
                          }}
                        />
                      </div>

                      {/* Player Name */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-semibold tracking-wide group-hover:text-white transition-colors ${
                            player.rank === 1 ? 'text-[#f5c464]' : 'text-zinc-200'
                          }`}
                        >
                          {player.gamerTag}
                        </span>
                        {player.rank === 1 && <span className="text-xs">👑</span>}
                      </div>
                    </div>

                    {/* Points on the Right */}
                    <div className="text-right">
                      <span
                        className={`font-bebas text-base tracking-wider ${
                          player.rank === 1 ? 'text-[#f5c464]' : 'text-[#D71920]'
                        }`}
                      >
                        {player.points.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Interactive Player Profile Modal */}
      {selectedProfilePlayer && (
        <PlayerProfileModal
          player={selectedProfilePlayer}
          onClose={() => setSelectedProfilePlayer(null)}
        />
      )}
    </section>
  );
};
