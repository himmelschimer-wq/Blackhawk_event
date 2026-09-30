import React from 'react';
import { TIMELINE_OVERVIEW } from '../data/tournamentData';
import { Trophy, ChevronRight, Zap, Target } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface OverviewProps {
  onSelectGame: (gameId: string) => void;
}

export const EventOverview: React.FC<OverviewProps> = ({ onSelectGame }) => {
  return (
    <section id="overview" className="relative py-14 sm:py-16 bg-[#08080a] border-y border-white/5">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-tech-dots opacity-40 pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-red-600/10 blur-[130px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-red-950/40 border border-red-600/30 text-[11px] font-tech font-bold uppercase tracking-widest text-[#ff3333] mb-2">
            <Target className="w-3 h-3" />
            <span>FORMAT & TIMELINE</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-tight mb-2">
            ONE LEAGUE. <span className="text-[#e10600]">FIVE WEEKS.</span>
          </h2>

          <div className="w-14 h-0.5 bg-gradient-to-r from-transparent via-[#e10600] to-transparent mx-auto mb-4"></div>

          <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed mb-1">
            This league is not built around a single winner-takes-all tournament.
          </p>
          <p className="text-xs sm:text-xs text-zinc-400 font-sans leading-relaxed text-balance">
            Every week features a different game and multiple ways to earn rewards through performance, challenges, improvement, or participation.
          </p>
        </div>

        {/* Visual 5-Week Timeline with Red Connectors */}
        <div className="relative">
          
          {/* Timeline Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-[48px] left-[5%] right-[5%] h-0.5 bg-gradient-to-r from-[#e10600]/30 via-[#e10600] to-[#e10600]/30 z-0">
            {/* Glowing runner indicator */}
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#ff2a2a] blur-xs animate-pulse-subtle"></div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 relative z-10">
            {TIMELINE_OVERVIEW.map((item, idx) => {
              const isMonthly = idx === 5;
              const gameTarget = item.game.toLowerCase().replace(/\s+/g, '');
              
              return (
                <div
                  key={item.week}
                  onClick={() => {
                    sfx.playClick();
                    if (!isMonthly) {
                      onSelectGame(gameTarget);
                    } else {
                      const el = document.getElementById('monthly');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  onMouseEnter={() => sfx.playHover()}
                  className={`group relative cursor-pointer p-3.5 sm:p-4 rounded-lg border transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between ${
                    isMonthly
                      ? 'bg-gradient-to-b from-[#180d0d] via-[#100808] to-[#0a0a0c] border-red-500/50 shadow-[0_0_20px_rgba(225,6,0,0.25)] hover:border-[#ff2a2a]'
                      : 'bg-[#0e0e12] border-white/10 hover:border-red-600/50 hover:bg-[#121218] hover:shadow-[0_8px_20px_rgba(0,0,0,0.5)]'
                  }`}
                >
                  {/* Top Week Tag & Index Node */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-black text-xs ${
                        isMonthly
                          ? 'bg-[#e10600] text-white shadow-[0_0_10px_rgba(225,6,0,0.8)]'
                          : 'bg-[#1a1a20] text-zinc-300 border border-white/10 group-hover:border-red-500 group-hover:text-white'
                      }`}>
                        {idx === 5 ? <Trophy className="w-3.5 h-3.5" /> : `0${idx + 1}`}
                      </div>
                      <span className={`text-[9px] font-tech uppercase tracking-widest px-1.5 py-0.5 rounded font-bold ${
                        isMonthly ? 'bg-red-500/20 text-[#ff4d4d]' : 'bg-white/5 text-zinc-400'
                      }`}>
                        {item.week}
                      </span>
                    </div>

                    {/* Game Name */}
                    <h3 className="font-display font-black text-base sm:text-lg uppercase tracking-wider text-white mb-1 group-hover:text-[#ff3333] transition-colors">
                      {item.game}
                    </h3>

                    {/* Description */}
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  {/* Bottom Prize Callout */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="block text-[9px] font-tech text-zinc-400 uppercase tracking-wider">
                        {isMonthly ? 'FINALE REWARD' : 'WEEKLY POOL'}
                      </span>
                      <span className={`font-display font-black text-base sm:text-lg ${
                        isMonthly ? 'text-[#ff2a2a] text-glow-red' : 'text-white group-hover:text-[#ff2a2a]'
                      }`}>
                        {item.prize}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#ff2a2a] group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* Corner Accent Highlight */}
                  <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-transparent group-hover:border-[#e10600] transition-colors"></div>
                </div>
              );
            })}
          </div>

          {/* Grand Total Strip */}
          <div className="mt-6 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-red-950/40 via-red-900/30 to-red-950/40 border border-red-600/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#e10600] flex items-center justify-center shadow-[0_0_12px_rgba(225,6,0,0.5)]">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-display font-black text-sm sm:text-base text-white uppercase tracking-wider">
                  TOTAL LEAGUE DISTRIBUTION
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Weekly game pools (₹1,400) + Monthly Cumulative Standings (₹600)
                </p>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-tech text-[10px] uppercase text-zinc-400 tracking-widest">CUMULATIVE:</span>
              <span className="font-display font-black text-2xl sm:text-3xl text-white text-glow-red">
                ₹2,000 INR
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
