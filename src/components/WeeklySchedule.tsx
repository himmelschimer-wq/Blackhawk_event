import React, { useState } from 'react';
import { WEEKLY_OPS_SCHEDULE } from '../data/tournamentData';
import { Calendar, UserPlus, Target, Trophy, Swords, Sparkles, Dices, Award, Clock } from 'lucide-react';
import { sfx } from '../utils/sfx';

export const WeeklySchedule: React.FC = () => {
  const [activeDay, setActiveDay] = useState<number>(2); // Default to Wednesday (Main Competition)

  const getDayIcon = (iconName: string) => {
    switch (iconName) {
      case 'UserPlus': return <UserPlus className="w-5 h-5 text-[#ff2a2a]" />;
      case 'Target': return <Target className="w-5 h-5 text-[#ff2a2a]" />;
      case 'Trophy': return <Trophy className="w-5 h-5 text-[#ff2a2a]" />;
      case 'Swords': return <Swords className="w-5 h-5 text-[#ff2a2a]" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-[#ff2a2a]" />;
      case 'Dices': return <Dices className="w-5 h-5 text-[#ff2a2a]" />;
      case 'Award': return <Award className="w-5 h-5 text-[#ff2a2a]" />;
      default: return <Clock className="w-5 h-5 text-[#ff2a2a]" />;
    }
  };

  return (
    <section id="schedule" className="relative py-14 sm:py-16 bg-[#050505]">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-tech-grid opacity-25 pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-red-600/10 blur-[150px] pointer-events-none rounded-full"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-red-950/40 border border-red-600/30 text-[11px] font-tech font-bold uppercase tracking-widest text-[#ff3333] mb-2">
            <Calendar className="w-3 h-3" />
            <span>ROUTINE OPERATIONS CADENCE</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-tight mb-2">
            WEEKLY EVENT <span className="text-[#e10600]">FLOW</span>
          </h2>

          <div className="w-14 h-0.5 bg-gradient-to-r from-transparent via-[#e10600] to-transparent mx-auto mb-4"></div>

          <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
            Every week follows a structured 7-day competitive rhythm from Monday room registration to Sunday payout and leaderboard updates.
          </p>
        </div>

        {/* Horizontal Ops Days Tabs (Scrollable on mobile) */}
        <div className="relative mb-6 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex sm:grid sm:grid-cols-7 gap-2 min-w-[620px] sm:min-w-0">
            {WEEKLY_OPS_SCHEDULE.map((item, idx) => {
              const isSelected = activeDay === idx;
              return (
                <button
                  key={item.day}
                  onClick={() => {
                    sfx.playClick();
                    setActiveDay(idx);
                  }}
                  onMouseEnter={() => sfx.playHover()}
                  className={`p-2.5 rounded-lg border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#180808] to-[#0c0c10] border-red-600 shadow-[0_0_15px_rgba(225,6,0,0.35)] ring-1 ring-red-500/50'
                      : 'bg-[#0b0b0f] border-white/10 hover:border-white/20 hover:bg-[#101016]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-tech text-[9px] text-zinc-400 uppercase tracking-widest">
                      DAY 0{idx + 1}
                    </span>
                    <div className="p-0.5 rounded bg-black/40">
                      {getDayIcon(item.icon)}
                    </div>
                  </div>

                  <div>
                    <span className={`block font-display font-black text-sm sm:text-base tracking-wider uppercase ${
                      isSelected ? 'text-white' : 'text-zinc-300'
                    }`}>
                      {item.day}
                    </span>
                    <span className={`block text-[11px] font-tech font-semibold truncate ${
                      isSelected ? 'text-[#ff4d4d]' : 'text-zinc-400'
                    }`}>
                      {item.phase}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="mt-1.5 h-0.5 w-full bg-[#e10600] rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Expanded Detail Card */}
        <div className="bg-gradient-to-r from-[#100808] via-[#0d0d12] to-[#100808] border border-red-600/40 rounded-xl p-4 sm:p-6 relative overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-950 flex items-center justify-center shadow-[0_0_15px_rgba(225,6,0,0.6)] shrink-0">
                {getDayIcon(WEEKLY_OPS_SCHEDULE[activeDay].icon)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-tech text-[#ff4d4d] tracking-widest uppercase font-bold">
                    DAY 0{activeDay + 1} OPERATIONS
                  </span>
                  <span className="text-zinc-500 font-mono">•</span>
                  <span className="text-[10px] font-tech text-zinc-400 tracking-wider uppercase">
                    TIMINGS: 7:00 PM - 10:30 PM IST
                  </span>
                </div>
                <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-wider">
                  {WEEKLY_OPS_SCHEDULE[activeDay].day} — {WEEKLY_OPS_SCHEDULE[activeDay].phase}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 font-sans mt-1 max-w-2xl leading-relaxed">
                  {WEEKLY_OPS_SCHEDULE[activeDay].desc}
                </p>
              </div>
            </div>

            <div className="bg-black/60 border border-white/10 p-3 rounded-lg text-right shrink-0">
              <span className="text-[9px] font-tech text-zinc-400 uppercase tracking-widest block mb-0.5">
                COORDINATION CHANNEL
              </span>
              <span className="font-tech text-xs font-bold text-white uppercase block">
                #match-day-briefing
              </span>
              <span className="text-[10px] text-[#ff3333] font-tech uppercase block mt-0.5">
                PASSWORDS 15M PRIOR
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
