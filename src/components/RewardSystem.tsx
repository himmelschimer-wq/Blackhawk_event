import React from 'react';
import { FIVE_WAYS_TO_WIN } from '../data/tournamentData';
import { Trophy, Swords, Sparkles, Dices, Video, CheckCircle2 } from 'lucide-react';
import { sfx } from '../utils/sfx';

export const RewardSystem: React.FC = () => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Trophy': return <Trophy className="w-6 h-6 text-[#ff2a2a]" />;
      case 'Swords': return <Swords className="w-6 h-6 text-[#ff2a2a]" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-[#ff2a2a]" />;
      case 'Dices': return <Dices className="w-6 h-6 text-[#ff2a2a]" />;
      case 'Video': return <Video className="w-6 h-6 text-[#ff2a2a]" />;
      default: return <Trophy className="w-6 h-6 text-[#ff2a2a]" />;
    }
  };

  const getPlayerType = (id: number) => {
    switch (id) {
      case 1: return "FOR THE CHAMPIONS";
      case 2: return "FOR THE SPECIALISTS";
      case 3: return "FOR THE GRINDERS";
      case 4: return "FOR EVERY ATTENDEE";
      case 5: return "FOR CREATORS & ENTERTAINERS";
      default: return "COMPETITOR";
    }
  };

  return (
    <section id="rewards" className="relative py-14 sm:py-16 bg-[#08080a] border-y border-white/5">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-carbon opacity-30 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-600/10 blur-[160px] pointer-events-none rounded-full"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-red-950/40 border border-red-600/30 text-[11px] font-tech font-bold uppercase tracking-widest text-[#ff3333] mb-2">
            <Trophy className="w-3 h-3" />
            <span>INCLUSIVE REWARD PHILOSOPHY</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-tight mb-2">
            FIVE WAYS <span className="text-[#e10600]">TO WIN</span>
          </h2>

          <div className="w-14 h-0.5 bg-gradient-to-r from-transparent via-[#e10600] to-transparent mx-auto mb-4"></div>

          <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
            Esports is more than just raw rank. Blackhawk Team recognizes pure skill, clutch creativity, rapid development, active sportsmanship, and entertaining community memories.
          </p>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FIVE_WAYS_TO_WIN.map((card, idx) => (
            <div
              key={card.id}
              onMouseEnter={() => sfx.playHover()}
              className={`group relative p-4 sm:p-5 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                idx === 0
                  ? 'lg:col-span-2 bg-gradient-to-r from-[#170909] via-[#0f0a0e] to-[#0a0a0e] border-red-600/50 shadow-[0_0_20px_rgba(225,6,0,0.2)]'
                  : 'bg-[#0b0b0f] border-white/10 hover:border-red-600/40 hover:bg-[#101017]'
              }`}
            >
              {/* Badge & Type */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-tech text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-red-950/50 text-[#ff4d4d] border border-red-600/30 font-bold">
                    {getPlayerType(card.id)}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center group-hover:border-red-500/50 transition-colors">
                    {getIcon(card.iconName)}
                  </div>
                </div>

                {/* Title & Amount */}
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <h3 className="font-display font-black text-lg sm:text-xl text-white uppercase tracking-wider">
                    {card.title}
                  </h3>
                  <span className="font-display font-black text-lg sm:text-xl text-[#ff2a2a] text-glow-red">
                    {card.amount}
                  </span>
                </div>

                {/* Tagline */}
                <p className="font-tech text-xs sm:text-sm font-semibold text-red-200 mb-2 uppercase tracking-wider">
                  "{card.tagline}"
                </p>

                {/* Description */}
                <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-3">
                  {card.description}
                </p>

                {/* Examples if present (Clash / Challenge) */}
                {card.examples && (
                  <div className="mt-2.5 pt-2.5 border-t border-white/10">
                    <span className="text-[9px] font-tech text-zinc-400 uppercase tracking-widest block mb-1.5 font-bold">
                      EXAMPLE FORMATS:
                    </span>
                    <ul className="space-y-1 text-[11px] text-zinc-300">
                      {card.examples.map((ex, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-[#ff2a2a] shrink-0" />
                          <span>{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Bottom Subtle Bar */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-tech text-zinc-400 uppercase tracking-widest">
                <span>REWARD TIER 0{card.id}</span>
                <span className="text-[#ff3333] font-bold">DISBURSED WEEKLY</span>
              </div>

              {/* Corner Notch */}
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-transparent group-hover:border-[#e10600] transition-colors"></div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
