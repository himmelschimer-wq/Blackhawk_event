import React, { useState, useEffect, useMemo } from 'react';
import { LEAGUE_POINTS_RULES, MONTHLY_REWARDS_BREAKDOWN } from '../data/tournamentData';
import { tournamentStore, type LeaderboardEntry } from '../lib/tournamentStore';
import { PlayerPointHistoryModal } from './PlayerPointHistoryModal';
import { PlayerProfileModal, type PlayerProfileData } from './PlayerProfileModal';
import { 
  Award, 
  Crown, 
  Search, 
  Star, 
  ShieldCheck, 
  Flame, 
  History, 
  Trophy, 
  Users, 
  X, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { sfx } from '../utils/sfx';
import { safeFetchJson } from '../lib/apiHelper';

export const MonthlyLeague: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'points' | 'prizes'>('leaderboard');
  const [selectedGame, setSelectedGame] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'points' | 'wins' | 'matches'>('points');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(tournamentStore.getLeaderboard());
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedProfilePlayer, setSelectedProfilePlayer] = useState<PlayerProfileData | null>(null);

  // Load real leaderboard data from Database API
  useEffect(() => {
    let isMounted = true;
    const loadRealLeaderboard = async () => {
      try {
        const data = await safeFetchJson<any[]>('/api/leaderboard', [], 'leaderboard');
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped: LeaderboardEntry[] = data.map((d: any, idx: number) => ({
            rank: d.rank || idx + 1,
            playerId: d.playerId || d.id,
            playerName: d.playerName || d.gamerTag,
            gamerTag: d.gamerTag,
            discordUsername: d.discordUsername || 'N/A',
            discordUserId: d.discordUserId,
            freeFireUid: d.freeFireUid,
            inGameName: d.inGameName,
            placementPoints: Number(d.placementPoints || 0),
            killPoints: Number(d.killPoints || 0),
            participationPoints: Number(d.participationPoints || 0),
            challengeBonus: Number(d.challengeBonus || 0),
            risingStarBonus: Number(d.risingStarBonus || 0),
            avatar: d.avatar,
            game: d.game || 'ALL',
            totalPoints: Number(d.points || d.totalPoints || 0),
            eventsParticipated: Number(d.matches || 0),
            winsCount: Number(d.wins || 0),
            breakdown: []
          }));
          setLeaderboardData(mapped);
          return;
        }
      } catch {}
      if (isMounted) {
        setLeaderboardData(tournamentStore.getLeaderboard());
      }
    };

    loadRealLeaderboard();
    const unsubscribe = tournamentStore.subscribe(() => {
      loadRealLeaderboard();
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Distinct games list
  const gameOptions = ['ALL', 'FREE FIRE', 'BGMI', 'VALORANT', 'MINECRAFT', 'CHESS'];

  // Calculate count for each discipline
  const getGameCount = (game: string) => {
    if (game === 'ALL') return leaderboardData.length;
    return leaderboardData.filter(p => (p.game || '').toUpperCase().includes(game)).length;
  };

  // Filter and sort leaderboard
  const filteredAndSorted = useMemo(() => {
    let list = leaderboardData.filter(p => {
      // Game discipline filter
      if (selectedGame !== 'ALL') {
        const pGame = (p.game || '').toUpperCase();
        if (pGame && pGame !== 'ALL' && !pGame.includes(selectedGame.toUpperCase())) {
          return false;
        }
      }
      // Search query
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.playerName.toLowerCase().includes(q) ||
        p.gamerTag.toLowerCase().includes(q) ||
        (p.discordUsername && p.discordUsername.toLowerCase().includes(q)) ||
        (p.discordUserId && p.discordUserId.includes(q))
      );
    });

    // Sort order
    list = [...list].sort((a, b) => {
      if (sortBy === 'wins') {
        if (b.winsCount !== a.winsCount) return b.winsCount - a.winsCount;
        return b.totalPoints - a.totalPoints;
      }
      if (sortBy === 'matches') {
        if (b.eventsParticipated !== a.eventsParticipated) return b.eventsParticipated - a.eventsParticipated;
        return b.totalPoints - a.totalPoints;
      }
      // default: points
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.winsCount !== a.winsCount) return b.winsCount - a.winsCount;
      const aVerified = a.discordUserId ? 1 : 0;
      const bVerified = b.discordUserId ? 1 : 0;
      if (bVerified !== aVerified) return bVerified - aVerified;
      return a.rank - b.rank;
    });

    // Re-assign consecutive display ranks
    return list.map((item, idx) => ({
      ...item,
      displayRank: idx + 1,
      isChampion: idx === 0
    }));
  }, [leaderboardData, selectedGame, search, sortBy]);

  // Top 3 Podium contenders
  const top3 = useMemo(() => filteredAndSorted.slice(0, 3), [filteredAndSorted]);

  // Overall Stats for Overview Bar
  const stats = useMemo(() => {
    const leader = leaderboardData[0];
    const totalContenders = leaderboardData.length;
    const verifiedDiscordCount = leaderboardData.filter(p => Boolean(p.discordUserId)).length;
    return {
      leader,
      totalContenders,
      verifiedDiscordCount,
      totalPrizePool: 600
    };
  }, [leaderboardData]);

  // Open profile modal helper
  const handleOpenProfile = (player: any) => {
    sfx.playClick();
    setSelectedProfilePlayer({
      id: player.playerId || player.id,
      playerId: player.playerId || player.id,
      playerName: player.playerName,
      gamerTag: player.gamerTag,
      game: player.game || 'FREE FIRE',
      avatar: player.avatar,
      rank: player.displayRank || player.rank,
      points: Number(player.totalPoints || player.points || 0),
      wins: Number(player.winsCount || player.wins || 0),
      matches: Number(player.eventsParticipated || player.matches || 0),
      score: Number(player.killPoints || player.score || 0),
      discordUsername: player.discordUsername,
      discordUserId: player.discordUserId,
      freeFireUid: player.freeFireUid,
      inGameName: player.inGameName,
      placementPoints: Number(player.placementPoints || 0),
      killPoints: Number(player.killPoints || 0),
      participationPoints: Number(player.participationPoints || 0),
      challengeBonus: Number(player.challengeBonus || 0),
      risingStarBonus: Number(player.risingStarBonus || 0),
      totalPoints: Number(player.totalPoints || player.points || 0),
      status: 'ACTIVE'
    });
  };

  // Open points history modal helper
  const handleOpenHistory = (playerId: string) => {
    sfx.playClick();
    setSelectedPlayerId(playerId);
  };

  return (
    <section id="monthly" className="relative py-14 sm:py-20 bg-[#070709] border-y border-white/5 overflow-hidden">
      {/* Background Decor & Atmospheric Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-red-600/10 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-amber-500/5 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ─── 1. Section Header ─── */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-600/40 text-[11px] font-tech font-bold uppercase tracking-widest text-[#ff3333] mb-3 shadow-[0_0_15px_rgba(225,6,0,0.3)]">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>SEASON 01 CHAMPIONSHIP</span>
          </div>

          <h2 className="font-display font-black text-3xl sm:text-5xl text-white uppercase tracking-tight mb-2">
            THE MONTHLY <span className="text-[#e10600]">LEAGUE</span>
          </h2>

          <p className="font-tech text-xs sm:text-sm text-red-200 font-bold tracking-widest uppercase mb-3">
            FIVE WEEKS. ONE LEADERBOARD. IMMUTABLE GLORY.
          </p>

          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#e10600] to-transparent mx-auto mb-3" />

          <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed text-balance">
            Every match counts. Points accumulated across weekly battles fuel your position on the Official League Table. Top 8 claim the ₹600 Prize Pool.
          </p>
        </div>

        {/* ─── 2. Tournament Metrics Overview Ribbon ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {/* Metric 1: Reigning #1 Leader */}
          <div 
            onClick={() => stats.leader && handleOpenProfile(stats.leader)}
            className="p-3.5 rounded-xl bg-gradient-to-b from-[#1b1207]/90 via-[#100d08]/95 to-[#0b0b0e] border border-amber-500/40 hover:border-amber-400/80 transition-all cursor-pointer group shadow-[0_4px_20px_rgba(245,158,11,0.15)]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-tech text-[10px] text-amber-400/90 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                REIGNING LEADER
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-tech font-bold text-[9px]">#01 SEED</span>
            </div>
            {stats.leader ? (
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-amber-400 shrink-0 bg-zinc-900 shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                  <img
                    src={stats.leader.avatar || `https://unavatar.io/discord/${encodeURIComponent(stats.leader.gamerTag)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(stats.leader.gamerTag)}%26backgroundColor%3D09090b`}
                    alt={stats.leader.gamerTag}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(stats.leader.gamerTag)}&backgroundColor=09090b,18181b`;
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-bold text-xs sm:text-sm text-white truncate group-hover:text-amber-300 transition-colors">
                    {stats.leader.playerName}
                  </div>
                  <div className="text-[10px] font-tech text-amber-400/80 flex items-center gap-1">
                    <span className="text-glow-gold font-bold">{stats.leader.totalPoints} PTS</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400 font-mono truncate">@{stats.leader.gamerTag}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 font-tech">Awaiting Scores</div>
            )}
          </div>

          {/* Metric 2: Total Contenders */}
          <div className="p-3.5 rounded-xl bg-[#0c0c11]/90 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="font-tech text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-red-500" />
                ACTIVE CONTENDERS
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-300 font-tech font-bold text-[9px]">LIVE</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-xl sm:text-2xl text-white">
                {stats.totalContenders}
              </span>
              <span className="font-tech text-[10px] text-zinc-400 uppercase">ATHLETES REGISTERED</span>
            </div>
            <p className="text-[10px] font-tech text-zinc-500 mt-1 truncate">
              {stats.verifiedDiscordCount} Verified Discord Profiles
            </p>
          </div>

          {/* Metric 3: Grand Finale Prize Pool */}
          <div className="p-3.5 rounded-xl bg-[#0c0c11]/90 border border-white/10 hover:border-red-500/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="font-tech text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#ff3333]" />
                PRIZE POOL
              </span>
              <span className="px-1.5 py-0.5 rounded bg-red-600/20 text-[#ff4d4d] font-tech font-bold text-[9px]">CASH</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-black text-xl sm:text-2xl text-[#ff3333] text-glow-red">
                ₹{stats.totalPrizePool}
              </span>
              <span className="font-tech text-[10px] text-zinc-400 uppercase">INR TOTAL</span>
            </div>
            <p className="text-[10px] font-tech text-zinc-500 mt-1">
              ₹200 Champion Bounty • 8 Payout Tiers
            </p>
          </div>

          {/* Metric 4: Live Sync & Verification */}
          <div className="p-3.5 rounded-xl bg-[#0c0c11]/90 border border-emerald-500/30 hover:border-emerald-500/60 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="font-tech text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                VERIFICATION
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-tech font-bold text-[9px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CONNECTED
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm sm:text-base text-white">DISCORD CDN SYNC</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <p className="text-[10px] font-tech text-zinc-400 mt-1 truncate">
              Avatars synced via Discord Snowflake API
            </p>
          </div>
        </div>

        {/* ─── 3. Navigation Tabs ─── */}
        <div className="flex justify-center mb-6">
          <div className="p-1 rounded-xl bg-[#0d0d12] border border-white/10 flex items-center gap-1 shadow-lg">
            <button
              onClick={() => {
                sfx.playClick();
                setActiveTab('leaderboard');
              }}
              className={`px-4 py-2 rounded-lg font-tech font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'leaderboard'
                  ? 'bg-[#e10600] text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>OFFICIAL STANDINGS</span>
            </button>
            <button
              onClick={() => {
                sfx.playClick();
                setActiveTab('points');
              }}
              className={`px-4 py-2 rounded-lg font-tech font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'points'
                  ? 'bg-[#e10600] text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>POINT SYSTEM</span>
            </button>
            <button
              onClick={() => {
                sfx.playClick();
                setActiveTab('prizes');
              }}
              className={`px-4 py-2 rounded-lg font-tech font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'prizes'
                  ? 'bg-[#e10600] text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>₹600 PRIZES</span>
            </button>
          </div>
        </div>

        {/* ─── TAB 1: OFFICIAL STANDINGS ─── */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Filter & Search Toolbar */}
            <div className="bg-[#0b0b0f] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
              
              {/* Game Discipline Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="font-tech text-[10px] text-zinc-500 uppercase tracking-widest font-bold shrink-0 hidden sm:inline mr-1">
                  DISCIPLINE:
                </span>
                {gameOptions.map((g) => {
                  const isActive = selectedGame === g;
                  const count = getGameCount(g);
                  return (
                    <button
                      key={g}
                      onClick={() => {
                        sfx.playClick();
                        setSelectedGame(g);
                      }}
                      className={`px-3 py-1.5 rounded-full font-tech font-bold text-[10px] sm:text-[11px] uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#e10600] text-white shadow-[0_0_12px_rgba(225,6,0,0.5)]'
                          : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.07] border border-white/5'
                      }`}
                    >
                      <span>{g}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-zinc-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search + Sort Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
                
                {/* Search Input with Clear Button */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search athlete, gamer tag, or Discord ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-black/50 border border-white/10 rounded-lg font-tech text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort Order Selector */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="font-tech text-[10px] text-zinc-500 uppercase tracking-widest hidden sm:inline">
                    SORT:
                  </span>
                  <div className="p-0.5 rounded-lg bg-black/50 border border-white/10 flex items-center">
                    <button
                      onClick={() => {
                        sfx.playClick();
                        setSortBy('points');
                      }}
                      className={`px-2.5 py-1 rounded font-tech text-[10px] font-bold uppercase transition-all ${
                        sortBy === 'points' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Points
                    </button>
                    <button
                      onClick={() => {
                        sfx.playClick();
                        setSortBy('wins');
                      }}
                      className={`px-2.5 py-1 rounded font-tech text-[10px] font-bold uppercase transition-all ${
                        sortBy === 'wins' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Wins
                    </button>
                    <button
                      onClick={() => {
                        sfx.playClick();
                        setSortBy('matches');
                      }}
                      className={`px-2.5 py-1 rounded font-tech text-[10px] font-bold uppercase transition-all ${
                        sortBy === 'matches' ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Matches
                    </button>
                  </div>

                  {(selectedGame !== 'ALL' || search) && (
                    <button
                      onClick={() => {
                        sfx.playClick();
                        setSelectedGame('ALL');
                        setSearch('');
                      }}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-[10px] font-tech transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

              </div>

            </div>

            {/* ─── 4. The 3D Stepped Esports Podium Arrangement ─── */}
            {top3.length >= 3 && (
              <div className="relative pt-6 pb-2">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-tech text-[10px] font-bold uppercase tracking-widest mb-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>CHAMPIONSHIP PODIUM</span>
                  </div>
                  <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-tight">
                    TOP TIER CONTENDERS
                  </h3>
                </div>

                {/* 
                  Mobile: #1 Champion on top full width; #2 and #3 side-by-side below!
                  Desktop (md): Stepped 3D podium layout (#2 Left, #1 Elevated Center, #3 Right).
                */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 md:items-end max-w-5xl mx-auto">
                  
                  {/* 🥈 #2 RUNNER-UP (Col 1 on Desktop, Left on Mobile below #1) */}
                  <div 
                    onClick={() => handleOpenProfile(top3[1])}
                    className="order-2 md:order-1 col-span-1 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#181824]/90 via-[#0f0f18]/95 to-[#08080d] border border-slate-300/40 hover:border-slate-300 hover:scale-[1.02] text-center flex flex-col justify-between shadow-[0_0_25px_rgba(203,213,225,0.15)] cursor-pointer transition-all duration-300 group relative overflow-hidden"
                  >
                    {/* Top ambient shimmer */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-300/60 to-transparent" />
                    
                    <div>
                      {/* Avatar */}
                      <div className="relative mx-auto w-14 h-14 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-slate-300 ring-4 ring-slate-400/20 shadow-[0_0_20px_rgba(203,213,225,0.3)] mb-3 bg-zinc-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <img
                          src={top3[1].avatar || `https://unavatar.io/discord/${encodeURIComponent(top3[1].gamerTag)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(top3[1].gamerTag)}%26backgroundColor%3D09090b`}
                          alt={top3[1].gamerTag}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(top3[1].gamerTag)}&backgroundColor=09090b,18181b`;
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-800 border border-slate-300 shadow-md">
                          <Award className="w-3.5 h-3.5 text-slate-200" />
                        </div>
                      </div>

                      {/* Rank Pill */}
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-400/10 border border-slate-400/30 font-tech text-[9px] text-slate-300 uppercase tracking-widest font-bold mb-1">
                        🥈 2nd PLACE • RUNNER-UP
                      </span>

                      {/* Name */}
                      <h4 className="font-display font-black text-base sm:text-xl text-white uppercase mt-1 group-hover:text-slate-200 transition-colors truncate">
                        {top3[1].playerName}
                      </h4>
                      <span className="font-mono text-[11px] text-zinc-400 block truncate">@{top3[1].gamerTag}</span>
                    </div>

                    {/* Stats & Est Reward */}
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                      <div className="flex justify-around font-tech">
                        <div>
                          <span className="block text-[9px] text-zinc-400 uppercase">LEAGUE PTS</span>
                          <span className="font-display font-black text-base sm:text-lg text-white">{top3[1].totalPoints} pts</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-zinc-400 uppercase">EST. PRIZE</span>
                          <span className="font-display font-black text-base sm:text-lg text-slate-200">₹100</span>
                        </div>
                      </div>
                      
                      {/* Stepped Pedestal Base block (Desktop 3D elevation) */}
                      <div className="hidden md:flex items-center justify-center h-10 rounded-lg bg-gradient-to-t from-slate-900 to-slate-800/80 border border-slate-400/30 text-slate-300 font-display font-black text-xl tracking-wider">
                        2ND
                      </div>
                    </div>
                  </div>

                  {/* 👑 #1 CHAMPION (Elevated Center on Desktop, Full Width Top on Mobile) */}
                  <div 
                    onClick={() => handleOpenProfile(top3[0])}
                    className="order-1 md:order-2 col-span-2 md:col-span-1 p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#261506]/95 via-[#180a0a]/95 to-[#0b0608] border-2 border-amber-400 hover:border-amber-300 md:-translate-y-8 md:scale-105 z-20 text-center flex flex-col justify-between shadow-[0_0_40px_rgba(245,158,11,0.35),0_0_20px_rgba(225,6,0,0.3)] cursor-pointer transition-all duration-300 group relative overflow-hidden"
                  >
                    {/* Golden radiant banner glow */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                    
                    <div>
                      {/* Floating Crown above Avatar */}
                      <div className="flex justify-center mb-1">
                        <div className="p-1 rounded-full bg-amber-400/10 border border-amber-400/40 text-amber-300 animate-bounce">
                          <Crown className="w-5 h-5 text-amber-400" />
                        </div>
                      </div>

                      {/* Large Champion Avatar */}
                      <div className="relative mx-auto w-18 h-18 sm:w-22 sm:h-22 rounded-full overflow-hidden border-2 border-amber-400 ring-4 ring-amber-400/40 shadow-[0_0_30px_rgba(245,158,11,0.6)] mb-3 bg-zinc-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <img
                          src={top3[0].avatar || `https://unavatar.io/discord/${encodeURIComponent(top3[0].gamerTag)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(top3[0].gamerTag)}%26backgroundColor%3D09090b`}
                          alt={top3[0].gamerTag}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(top3[0].gamerTag)}&backgroundColor=09090b,18181b`;
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 border-2 border-black shadow-[0_0_10px_rgba(245,158,11,1)]">
                          <Crown className="w-4 h-4 text-black" />
                        </div>
                      </div>

                      {/* Champion Badge */}
                      <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/60 font-tech text-[10px] text-amber-300 uppercase tracking-widest font-black mb-1.5 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                        👑 1st PLACE • LEAGUE CHAMPION
                      </span>

                      {/* Name */}
                      <h4 className="font-display font-black text-xl sm:text-2xl text-amber-200 uppercase mt-1 group-hover:text-white transition-colors truncate">
                        {top3[0].playerName}
                      </h4>
                      <span className="font-mono text-xs text-amber-400/90 block truncate">@{top3[0].gamerTag}</span>
                    </div>

                    {/* Stats & Champion Bounty */}
                    <div className="mt-4 pt-3 border-t border-amber-400/20 space-y-2">
                      <div className="flex justify-around font-tech">
                        <div>
                          <span className="block text-[9px] text-zinc-400 uppercase">TOTAL POINTS</span>
                          <span className="font-display font-black text-xl sm:text-2xl text-amber-300 text-glow-gold">{top3[0].totalPoints} pts</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-zinc-400 uppercase">CHAMPION CASH</span>
                          <span className="font-display font-black text-xl sm:text-2xl text-[#ff2a2a] text-glow-red">₹200</span>
                        </div>
                      </div>

                      {/* Stepped Pedestal Base block (Tallest Center) */}
                      <div className="hidden md:flex items-center justify-center h-14 rounded-lg bg-gradient-to-t from-amber-950 via-amber-900/60 to-amber-800/80 border border-amber-400/50 text-amber-300 font-display font-black text-2xl tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                        1ST CHAMPION
                      </div>
                    </div>
                  </div>

                  {/* 🥉 #3 3RD PLACE (Col 3 on Desktop, Right on Mobile below #1) */}
                  <div 
                    onClick={() => handleOpenProfile(top3[2])}
                    className="order-3 col-span-1 p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#1c120a]/90 via-[#100b08]/95 to-[#08080d] border border-amber-700/50 hover:border-amber-600 hover:scale-[1.02] text-center flex flex-col justify-between shadow-[0_0_25px_rgba(180,83,9,0.15)] cursor-pointer transition-all duration-300 group relative overflow-hidden"
                  >
                    {/* Top ambient shimmer */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-700/60 to-transparent" />
                    
                    <div>
                      {/* Avatar */}
                      <div className="relative mx-auto w-14 h-14 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-amber-600 ring-4 ring-amber-700/20 shadow-[0_0_20px_rgba(180,83,9,0.3)] mb-3 bg-zinc-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <img
                          src={top3[2].avatar || `https://unavatar.io/discord/${encodeURIComponent(top3[2].gamerTag)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(top3[2].gamerTag)}%26backgroundColor%3D09090b`}
                          alt={top3[2].gamerTag}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(top3[2].gamerTag)}&backgroundColor=09090b,18181b`;
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-950 border border-amber-600 shadow-md">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                      </div>

                      {/* Rank Pill */}
                      <span className="inline-block px-2 py-0.5 rounded-full bg-amber-700/10 border border-amber-700/30 font-tech text-[9px] text-amber-400 uppercase tracking-widest font-bold mb-1">
                        🥉 3rd PLACE • PODIUM
                      </span>

                      {/* Name */}
                      <h4 className="font-display font-black text-base sm:text-xl text-white uppercase mt-1 group-hover:text-amber-300 transition-colors truncate">
                        {top3[2].playerName}
                      </h4>
                      <span className="font-mono text-[11px] text-zinc-400 block truncate">@{top3[2].gamerTag}</span>
                    </div>

                    {/* Stats & Est Reward */}
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                      <div className="flex justify-around font-tech">
                        <div>
                          <span className="block text-[9px] text-zinc-400 uppercase">LEAGUE PTS</span>
                          <span className="font-display font-black text-base sm:text-lg text-white">{top3[2].totalPoints} pts</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-zinc-400 uppercase">EST. PRIZE</span>
                          <span className="font-display font-black text-base sm:text-lg text-amber-400">₹75</span>
                        </div>
                      </div>

                      {/* Stepped Pedestal Base block (Desktop 3D elevation) */}
                      <div className="hidden md:flex items-center justify-center h-8 rounded-lg bg-gradient-to-t from-amber-950/80 to-amber-900/60 border border-amber-700/40 text-amber-500 font-display font-black text-lg tracking-wider">
                        3RD
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ─── 5. Complete Standings Table ─── */}
            <div className="bg-[#0b0b0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              
              {/* Table Top Bar */}
              <div className="px-4 py-3.5 bg-black/40 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#ff2a2a]" />
                  <span className="font-tech text-xs uppercase tracking-wider text-white font-bold">
                    OFFICIAL ROSTER STANDINGS
                  </span>
                  <span className="text-[10px] font-tech text-zinc-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                    Showing {filteredAndSorted.length} of {leaderboardData.length} Athletes
                  </span>
                </div>
                <span className="text-[10px] font-tech text-zinc-500 uppercase tracking-widest">
                  CLICK ROW FOR AUDIT HISTORY &amp; FULL STATS
                </span>
              </div>

              {/* Responsive Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/20 text-[10px] font-tech uppercase tracking-widest text-zinc-400">
                      <th className="py-3 px-4 w-16 text-center">RANK</th>
                      <th className="py-3 px-4">CONTENDER &amp; DISCORD</th>
                      <th className="py-3 px-4 text-center">DISCIPLINE</th>
                      <th className="py-3 px-4 text-center">EVENTS</th>
                      <th className="py-3 px-4 text-center">WINS</th>
                      <th className="py-3 px-4 text-right">TOTAL POINTS</th>
                      <th className="py-3 px-4 text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-tech text-xs">
                    {filteredAndSorted.map((player) => (
                      <tr 
                        key={player.playerId} 
                        onClick={() => handleOpenProfile(player)}
                        className="hover:bg-red-950/20 transition-all cursor-pointer group hover:border-l-4 hover:border-l-[#e10600]"
                      >
                        {/* Rank Badge */}
                        <td className="py-3.5 px-4 text-center font-display font-black text-sm">
                          {player.displayRank === 1 && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                              🥇
                            </span>
                          )}
                          {player.displayRank === 2 && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-300/20 border border-slate-300/40 text-slate-200">
                              🥈
                            </span>
                          )}
                          {player.displayRank === 3 && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-700/20 border border-amber-700/40 text-amber-400">
                              🥉
                            </span>
                          )}
                          {player.displayRank > 3 && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-zinc-400 group-hover:border-zinc-400 group-hover:text-white transition-colors">
                              #{player.displayRank.toString().padStart(2, '0')}
                            </span>
                          )}
                        </td>

                        {/* Contender Name, Discord Avatar & Details */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/15 bg-zinc-900 shrink-0 flex items-center justify-center group-hover:border-red-500/60 transition-colors shadow-inner">
                              <img
                                src={player.avatar || `https://unavatar.io/discord/${encodeURIComponent(player.gamerTag)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(player.gamerTag)}%26backgroundColor%3D09090b`}
                                alt={player.gamerTag}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.gamerTag)}&backgroundColor=09090b,18181b`;
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white group-hover:text-[#ff4d4d] transition-colors block text-xs truncate">
                                  {player.playerName}
                                </span>
                                {player.discordUserId && (
                                  <span className="inline-flex items-center text-[9px] px-1 py-0.2 rounded bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2] font-tech font-bold shrink-0">
                                    DISCORD
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-400 font-mono block truncate">
                                @{player.gamerTag} {player.discordUsername && player.discordUsername !== player.gamerTag ? `• ${player.discordUsername}` : ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Discipline Tag */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-tech font-semibold bg-white/5 border border-white/5 text-zinc-300 uppercase">
                            {player.game || 'ALL'}
                          </span>
                        </td>

                        {/* Events Participated */}
                        <td className="py-3.5 px-4 text-center text-zinc-300 text-xs">
                          {player.eventsParticipated} / 5 WEEKS
                        </td>

                        {/* Wins Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                            player.winsCount > 0 
                              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' 
                              : 'text-zinc-500'
                          }`}>
                            <Trophy className="w-3 h-3" />
                            {player.winsCount} Wins
                          </span>
                        </td>

                        {/* Total Points */}
                        <td className="py-3.5 px-4 text-right font-display font-black text-base text-white">
                          <span className={player.displayRank === 1 ? 'text-amber-300 text-glow-gold' : 'text-[#ff3333]'}>
                            {player.totalPoints}
                          </span>{' '}
                          <span className="text-[10px] text-zinc-500 font-tech">PTS</span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenHistory(player.playerId)}
                              className="px-2 py-1 rounded bg-white/5 hover:bg-[#e10600] text-zinc-300 hover:text-white transition-all text-[10px] font-tech flex items-center gap-1 cursor-pointer"
                              title="Audit History Ledger"
                            >
                              <History className="w-3 h-3" />
                              <span className="hidden sm:inline">Ledger</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenProfile(player)}
                              className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-all text-[10px] font-tech flex items-center gap-1 cursor-pointer"
                              title="View Full Profile"
                            >
                              <span>Profile</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Empty Search State */}
              {filteredAndSorted.length === 0 && (
                <div className="p-12 text-center text-zinc-400 space-y-3">
                  <Search className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="font-display font-bold text-sm text-zinc-300 uppercase">
                    NO CONTENDERS MATCH YOUR QUERY
                  </p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    No registered players found under &quot;{search}&quot; for {selectedGame}. Try searching another term or resetting your filter.
                  </p>
                  <button
                    onClick={() => {
                      sfx.playClick();
                      setSearch('');
                      setSelectedGame('ALL');
                    }}
                    className="px-4 py-1.5 rounded-lg bg-[#e10600] text-white text-xs font-tech font-bold uppercase transition-all cursor-pointer shadow-md"
                  >
                    Reset Search &amp; Filters
                  </button>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ─── TAB 2: BASE POINT MODEL ─── */}
        {activeTab === 'points' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-600/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#ff2a2a]" />
                <div>
                  <span className="font-tech text-xs sm:text-sm uppercase tracking-wider text-white font-bold block">
                    BASE LEAGUE POINT MODEL
                  </span>
                  <span className="text-[10px] font-tech text-zinc-400 uppercase tracking-widest">
                    STANDARDIZED SCORING CRITERIA
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-tech text-red-400 px-2 py-0.5 rounded bg-red-950/60 border border-red-600/40 font-bold uppercase">
                IMMUTABLE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {LEAGUE_POINTS_RULES.map((rule, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-[#0c0c10] border border-white/10 hover:border-red-500/50 flex flex-col justify-between transition-all group hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-tech text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                      {rule.badge}
                    </span>
                    <Star className="w-3.5 h-3.5 text-[#ff2a2a] group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="font-display font-black text-lg text-white uppercase group-hover:text-red-200 transition-colors">
                    {rule.rank}
                  </h4>
                  <div className="mt-3 pt-2.5 border-t border-white/10 flex items-baseline justify-between">
                    <span className="text-[10px] font-tech text-zinc-400 uppercase">AWARD:</span>
                    <span className="font-display font-black text-xl text-[#ff2a2a] text-glow-red">
                      {rule.points}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-zinc-400 font-sans text-center bg-black/40 p-3 rounded-xl border border-white/5">
              * League Points cannot be modified retroactively after official match sheets are filed by tournament marshals.
            </p>
          </div>
        )}

        {/* ─── TAB 3: MONTHLY REWARD POOL BREAKDOWN ─── */}
        {activeTab === 'prizes' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/70 via-red-900/40 to-red-950/70 border border-red-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(225,6,0,0.25)]">
              <div>
                <span className="font-tech text-[11px] text-red-300 uppercase tracking-widest block font-bold mb-1">
                  MONTHLY LEAGUE REWARD POOL
                </span>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase">
                  ₹600 CUMULATIVE PRIZE DISTRIBUTION
                </h3>
              </div>
              <div className="text-right">
                <span className="font-display font-black text-3xl sm:text-4xl text-white text-glow-red">
                  ₹600 INR
                </span>
                <span className="block text-[9px] font-tech text-zinc-400 uppercase mt-0.5">8 DISTINCT WINNER TIERS</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {MONTHLY_REWARDS_BREAKDOWN.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-[#0c0c10] border border-white/10 hover:border-red-500/50 flex flex-col justify-between transition-all group hover:scale-[1.01]"
                >
                  <div>
                    <span className="text-[9px] font-tech text-zinc-400 uppercase tracking-widest block mb-1">
                      {item.pointsNote}
                    </span>
                    <h4 className="font-display font-black text-base text-white uppercase group-hover:text-red-200 transition-colors">
                      {item.title}
                    </h4>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-baseline justify-between">
                    <span className="text-[9px] font-tech text-zinc-400 uppercase">CASH REWARD:</span>
                    <span className="font-display font-black text-xl text-[#ff2a2a]">
                      {item.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Point History Ledger Modal */}
      <PlayerPointHistoryModal
        playerId={selectedPlayerId}
        onClose={() => setSelectedPlayerId(null)}
      />

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
