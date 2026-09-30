import React from 'react';
import { EVENT_FLOW_STEPS } from '../data/tournamentData';
import { ArrowDown, GitBranch } from 'lucide-react';
import { sfx } from '../utils/sfx';

export const EventFlow: React.FC = () => {
  return (
    <section id="how-it-works" className="relative py-14 sm:py-16 bg-[#050505]">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-red-600/10 blur-[160px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#8b0000]/10 blur-[150px] pointer-events-none rounded-full"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-red-950/40 border border-red-600/30 text-[11px] font-tech font-bold uppercase tracking-widest text-[#ff3333] mb-2">
            <GitBranch className="w-3 h-3" />
            <span>OPERATIONAL BLUEPRINT</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-tight mb-2">
            THE TOURNAMENT <span className="text-[#e10600]">JOURNEY</span>
          </h2>

          <div className="w-14 h-0.5 bg-gradient-to-r from-transparent via-[#e10600] to-transparent mx-auto mb-4"></div>

          <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
            From single sign-on to weekly cash prizes and the season-ending Monthly League Championship.
          </p>
        </div>

        {/* 9-Step Process Grid / Pipeline */}
        <div className="relative">
          
          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 relative z-10">
            {EVENT_FLOW_STEPS.map((step, idx) => (
              <div
                key={step.step}
                onMouseEnter={() => sfx.playHover()}
                className="group relative p-4 bg-[#0c0c10] border border-white/10 hover:border-red-600/50 rounded-xl transition-all duration-300 hover:bg-[#121016] flex flex-col justify-between"
              >
                <div>
                  {/* Step Indicator Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display font-black text-2xl text-zinc-600 group-hover:text-[#ff2a2a] transition-colors">
                      {step.step}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-tech text-zinc-400 bg-white/5 border border-white/5 uppercase tracking-widest">
                      PHASE 0{idx + 1}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-black text-base sm:text-lg text-white uppercase tracking-wider mb-1.5 group-hover:text-[#ff3333] transition-colors">
                    {step.title}
                  </h3>

                  {/* Explanation */}
                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Progress Indicator Arrow */}
                {idx < EVENT_FLOW_STEPS.length - 1 && (
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-zinc-600 group-hover:text-[#ff2a2a] transition-colors">
                    <span className="text-[9px] font-tech uppercase tracking-widest">NEXT PHASE</span>
                    <ArrowDown className="w-3.5 h-3.5 md:-rotate-90" />
                  </div>
                )}
                {idx === EVENT_FLOW_STEPS.length - 1 && (
                  <div className="mt-3 pt-2.5 border-t border-red-500/20 flex items-center justify-between text-[#ff2a2a]">
                    <span className="text-[9px] font-tech uppercase tracking-widest font-bold">GRAND FINALE</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff2a2a] animate-ping"></span>
                  </div>
                )}

                {/* Corner accent */}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-transparent group-hover:border-[#e10600] transition-colors"></div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
