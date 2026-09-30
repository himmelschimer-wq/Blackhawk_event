import React from 'react';
import { ArrowRight, Trophy, Flame } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface FinalCTAProps {
  onRegisterClick: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onRegisterClick }) => {
  return (
    <section className="relative py-14 sm:py-16 bg-gradient-to-b from-[#050505] via-[#140606] to-[#08080a] border-t border-red-600/30 overflow-hidden">
      {/* Background Red Ambient Glow & Spotlights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-red-600/25 via-[#e10600]/20 to-red-600/25 blur-[160px] pointer-events-none rounded-full"></div>
      <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 flex flex-col items-center">
        
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-600/50 text-[11px] font-tech font-bold uppercase tracking-[0.2em] text-[#ff4d4d] mb-4">
          <Flame className="w-3.5 h-3.5 text-[#ff2a2a]" />
          <span>A BLACKHAWK TEAM GAMING EVENT</span>
          <Flame className="w-3.5 h-3.5 text-[#ff2a2a]" />
        </div>

        {/* Headline */}
        <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-white uppercase tracking-tight mb-3 drop-shadow-2xl">
          YOUR NEXT WIN <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff3333] via-[#e10600] to-[#b30000] text-glow-red">
            STARTS HERE.
          </span>
        </h2>

        {/* Subheading */}
        <p className="font-tech text-xs sm:text-sm md:text-base text-zinc-300 uppercase tracking-widest font-semibold mb-6 max-w-xl">
          Compete. Improve. Participate. Make your moment.
        </p>

        {/* Registration CTA Button */}
        <button
          onClick={() => {
            sfx.playClick();
            onRegisterClick();
          }}
          onMouseEnter={() => sfx.playHover()}
          className="px-6 py-3 bg-[#e10600] hover:bg-[#ff1e1e] text-white font-display font-black text-sm sm:text-base tracking-widest uppercase clip-corner-tr transition-all duration-200 shadow-[0_0_25px_rgba(225,6,0,0.5)] hover:shadow-[0_0_35px_rgba(225,6,0,0.8)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer group"
        >
          <span>REGISTER FOR THE LEAGUE</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
        </button>

        {/* Sub text badge */}
        <div className="mt-5 flex items-center gap-2 text-[11px] font-tech tracking-wider text-zinc-400 uppercase">
          <Trophy className="w-3.5 h-3.5 text-[#ff2a2a]" />
          <span>₹2,000 TOTAL REWARDS • 5 WEEKS • FREE REGISTRATION</span>
        </div>

      </div>
    </section>
  );
};
