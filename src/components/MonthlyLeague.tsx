import React, { useState, useEffect } from 'react';
import { LEAGUE_POINTS_RULES, MONTHLY_REWARDS_BREAKDOWN } from '../data/tournamentData';
import { tournamentStore, type LeaderboardEntry } from '../lib/tournamentStore';
import { PlayerPointHistoryModal } from './PlayerPointHistoryModal';
import { Award, Crown, Search, Star, ShieldCheck, Flame, History } from 'lucide-react';
import { sfx } from '../utils/sfx';

export const MonthlyLeague: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'points' | 'prizes'>('leaderboard');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(tournamentStore.getLeaderboard());
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = tournamentStore.subscribe(() => {
      setLeaderboardData(tournamentStore.getLeaderboard());
    });
    return unsubscribe;
  }, []);

  const filteredLeaderboard = leaderboardData.filter(p => 
    p.playerName.toLowerCase().includes(search.toLowerCase()) || 
    p.gamerTag.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section id="monthly" className="relative py-14 sm:py-16 bg-[#08080a] border-y border-white/5">
      {/* Background Decor */}
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-red-600/10 blur-[170px] pointer-events-none rounded-full"></div>
      <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-red-950/40 border border-red-600/30 text-[11px] font-tech font-bold uppercase tracking-widest text-[#ff3333] mb-2">
            <Crown className="w-3 h-3" />
            <span>SEASON 01 FINALE</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-tight mb-1.5">
            THE MONTHLY <span className="text-[#e10600]">LEAGUE</span>
          </h2>

          <p className="font-tech text-xs sm:text-sm text-red-200 font-bold tracking-widest uppercase mb-3">
            FIVE WEEKS. ONE LEADERBOARD.
          </p>

          <div className="w-14 h-0.5 bg-gradient-to-r from-transparent via-[#e10600] to-transparent mx-auto mb-3"></div>

          <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed text-balance">
            Weekly prizes reward individual games. League Points reward consistency and performance across the complete 5-week event.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center mb-6">
          <div className="p-0.5 rounded-lg bg-[#0f0f14] border border-white/10 flex items-center gap-1">
            <button
              onClick={() => {
                sfx.playClick();
                setActiveTab('leaderboard');
              }}
              className={`px-3.5 py-1.5 rounded-md font-tech font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-[#e10600] text-white shadow-[0_0_12px_rgba(225,6,0,0.5)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              STANDINGS MOCKUP
            </button>
            <button
              onClick={() => {
                sfx.playClick();
                setActiveTab('points');
              }}
              className={`px-3.5 py-1.5 rounded-md font-tech font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'points'
                  ? 'bg-[#e10600] text-white shadow-[0_0_12px_rgba(225,6,0,0.5)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              BASE POINT MODEL
            </button>
            <button
              onClick={() => {
                sfx.playClick();
                setActiveTab('prizes');
              }}
              className={`px-3.5 py-1.5 rounded-md font-tech font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'prizes'
                  ? 'bg-[#e10600] text-white shadow-[0_0_12px_rgba(225,6,0,0.5)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              ₹600 PRIZE POOL
            </button>
          </div>
        </div>

        {/* Tab 1: Leaderboard Standings Mockup */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Search and Top 3 Podium Highlights */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0d0d12] p-4 rounded-xl border border-white/10">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#ff2a2a]" />
                <span className="font-tech text-xs uppercase tracking-wider text-zinc-300 font-bold">
                  SIMULATED CUMULATIVE LEADERBOARD (MOCK DATA)
                </span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search player or tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            {/* Top 3 Podium Cards */}
            {leaderboardData.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* #2 Player */}
                <div 
                  onClick={() => {
                    sfx.playClick();
                    setSelectedPlayerId(leaderboardData[1].playerId);
                  }}
                  className="order-2 md:order-1 p-3.5 sm:p-4 rounded-xl bg-[#0d0d12] border border-white/10 hover:border-zinc-400 text-center flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div>
                    <div className="inline-block p-1.5 rounded-full bg-zinc-800 border border-zinc-500 mb-1.5">
                      <Award className="w-5 h-5 text-zinc-300" />
                    </div>
                    <span className="block font-tech text-[10px] text-zinc-400 uppercase tracking-widest font-bold">RANK #2 • RUNNER-UP</span>
                    <h4 className="font-display font-black text-lg sm:text-xl text-white uppercase mt-0.5">
                      {leaderboardData[1].playerName}
                    </h4>
                    <span className="font-mono text-xs text-zinc-400">@{leaderboardData[1].gamerTag}</span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/5 flex justify-around font-tech">
                    <div>
                      <span className="block text-[9px] text-zinc-400">POINTS</span>
                      <span className="font-display font-bold text-base text-white">{leaderboardData[1].totalPoints} pts</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-zinc-400">EST. REWARD</span>
                      <span className="font-display font-bold text-base text-[#ff3333]">₹100</span>
                    </div>
                  </div>
                </div>

                {/* #1 Champion */}
                <div 
                  onClick={() => {
                    sfx.playClick();
                    setSelectedPlayerId(leaderboardData[0].playerId);
                  }}
                  className="order-1 md:order-2 p-4 sm:p-5 rounded-xl bg-gradient-to-b from-[#1c0b0b] via-[#120707] to-[#0a0a0c] border border-red-500 text-center flex flex-col justify-between shadow-[0_0_25px_rgba(225,6,0,0.3)] z-10 cursor-pointer transition-all hover:scale-[1.03]"
                >
                  <div>
                    <div className="inline-block p-2 rounded-full bg-[#e10600] border border-white shadow-[0_0_12px_rgba(225,6,0,0.8)] mb-1.5">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <span className="block font-tech text-[10px] text-[#ff4d4d] uppercase tracking-widest font-black">RANK #1 • LEAGUE CHAMPION</span>
                    <h4 className="font-display font-black text-xl sm:text-2xl text-white uppercase mt-0.5">
                      {leaderboardData[0].playerName}
                    </h4>
                    <span className="font-mono text-xs text-zinc-400">@{leaderboardData[0].gamerTag}</span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-red-500/20 flex justify-around font-tech">
                    <div>
                      <span className="block text-[9px] text-zinc-400">TOTAL POINTS</span>
                      <span className="font-display font-black text-xl text-white text-glow-red">{leaderboardData[0].totalPoints} pts</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-zinc-400">CHAMPION CASH</span>
                      <span className="font-display font-black text-xl text-[#ff2a2a] text-glow-red">₹200</span>
                    </div>
                  </div>
                </div>

                {/* #3 Player */}
                <div 
                  onClick={() => {
                    sfx.playClick();
                    setSelectedPlayerId(leaderboardData[2].playerId);
                  }}
                  className="order-3 p-3.5 sm:p-4 rounded-xl bg-[#0d0d12] border border-white/10 hover:border-amber-500 text-center flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div>
                    <div className="inline-block p-1.5 rounded-full bg-amber-950/80 border border-amber-600/80 mb-1.5">
                      <Award className="w-5 h-5 text-amber-500" />
                    </div>
                    <span className="block font-tech text-[10px] text-amber-500 uppercase tracking-widest font-bold">RANK #3 • PODIUM</span>
                    <h4 className="font-display font-black text-lg sm:text-xl text-white uppercase mt-0.5">
                      {leaderboardData[2].playerName}
                    </h4>
                    <span className="font-mono text-xs text-zinc-400">@{leaderboardData[2].gamerTag}</span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/5 flex justify-around font-tech">
                    <div>
                      <span className="block text-[9px] text-zinc-400">POINTS</span>
                      <span className="font-display font-bold text-base text-white">{leaderboardData[2].totalPoints} pts</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-zinc-400">EST. REWARD</span>
                      <span className="font-display font-bold text-base text-[#ff3333]">₹75</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Complete Table List */}
            <div className="bg-[#0b0b0f] border border-white/10 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40 text-[10px] font-tech uppercase tracking-widest text-zinc-400">
                      <th className="py-2.5 px-3">RANK</th>
                      <th className="py-2.5 px-3">PLAYER NAME & GAMER TAG</th>
                      <th className="py-2.5 px-3 text-center">EVENTS</th>
                      <th className="py-2.5 px-3 text-center">WINS</th>
                      <th className="py-2.5 px-3 text-right">TOTAL POINTS</th>
                      <th className="py-2.5 px-3 text-center">AUDIT LEDGER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-tech text-xs">
                    {filteredLeaderboard.map((player) => (
                      <tr 
                        key={player.playerId} 
                        onClick={() => {
                          sfx.playClick();
                          setSelectedPlayerId(player.playerId);
                        }}
                        className="hover:bg-red-950/20 transition-colors cursor-pointer group"
                      >
                        <td className="py-2.5 px-3 font-display font-black text-base">
                          {player.rank === 1 && <span className="text-[#ff2a2a]">#01</span>}
                          {player.rank === 2 && <span className="text-zinc-300">#02</span>}
                          {player.rank === 3 && <span className="text-amber-500">#03</span>}
                          {player.rank > 3 && <span className="text-zinc-500">#{player.rank.toString().padStart(2, '0')}</span>}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-white group-hover:text-[#ff4d4d] transition-colors block text-xs">{player.playerName}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">@{player.gamerTag}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-zinc-400 text-xs">
                          {player.eventsParticipated} / 5 WEEKS
                        </td>
                        <td className="py-2.5 px-3 text-center text-zinc-300 text-xs">
                          {player.winsCount} Wins
                        </td>
                        <td className="py-2.5 px-3 text-right font-display font-black text-base text-white">
                          <span className="text-[#ff3333]">{player.totalPoints}</span> <span className="text-[10px] text-zinc-400">PTS</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            className="p-1 rounded bg-white/5 group-hover:bg-[#e10600] text-zinc-300 group-hover:text-white transition-all text-[11px] flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <History className="w-3 h-3" />
                            <span>View History</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Base League Point Model */}
        {activeTab === 'points' && (
          <div className="space-y-4 animate-in fade-in duration-300 max-w-4xl mx-auto">
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-600/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#ff2a2a]" />
                <span className="font-tech text-xs sm:text-sm uppercase tracking-wider text-white font-bold">
                  BASE LEAGUE POINT MODEL
                </span>
              </div>
              <span className="text-[10px] font-tech text-zinc-400 uppercase tracking-widest">
                IMMUTABLE SCORING STANDARD
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {LEAGUE_POINTS_RULES.map((rule, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-[#0c0c10] border border-white/10 hover:border-red-500/40 flex flex-col justify-between transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-tech text-[10px] uppercase tracking-widest text-zinc-400">
                      {rule.badge}
                    </span>
                    <Star className="w-3.5 h-3.5 text-[#ff2a2a]" />
                  </div>
                  <h4 className="font-display font-black text-lg text-white uppercase">
                    {rule.rank}
                  </h4>
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-baseline justify-between">
                    <span className="text-[10px] font-tech text-zinc-400 uppercase">AWARD:</span>
                    <span className="font-display font-black text-lg text-[#ff2a2a] text-glow-red">
                      {rule.points}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-zinc-400 font-sans text-center bg-black/40 p-2.5 rounded border border-white/5">
              * League Points should not be changed after results are known. All points are verified through official match sheets.
            </p>
          </div>
        )}

        {/* Tab 3: Monthly Reward Pool Breakdown */}
        {activeTab === 'prizes' && (
          <div className="space-y-4 animate-in fade-in duration-300 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/60 via-red-900/40 to-red-950/60 border border-red-500/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="font-tech text-[11px] text-red-300 uppercase tracking-widest block font-bold">
                  MONTHLY LEAGUE REWARD POOL
                </span>
                <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase">
                  ₹600 CUMULATIVE PRIZE DISTRIBUTION
                </h3>
              </div>
              <div className="text-right">
                <span className="font-display font-black text-2xl sm:text-3xl text-white text-glow-red">
                  ₹600 INR
                </span>
                <span className="block text-[9px] font-tech text-zinc-400 uppercase">8 DISTINCT WINNER CATEGORIES</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {MONTHLY_REWARDS_BREAKDOWN.map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#0c0c10] border border-white/10 hover:border-red-500/40 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[9px] font-tech text-zinc-400 uppercase tracking-widest block mb-0.5">
                      {item.pointsNote}
                    </span>
                    <h4 className="font-display font-black text-base text-white uppercase">
                      {item.title}
                    </h4>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-baseline justify-between">
                    <span className="text-[9px] font-tech text-zinc-400 uppercase">CASH REWARD:</span>
                    <span className="font-display font-black text-lg text-[#ff2a2a]">
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
    </section>
  );
};

