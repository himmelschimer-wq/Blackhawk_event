import React, { useState } from 'react';
import { RULES_DATA } from '../data/tournamentData';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Scale } from 'lucide-react';
import { sfx } from '../utils/sfx';

export const RulesSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Default open first

  const toggleAccordion = (idx: number) => {
    sfx.playClick();
    setOpenIndex(prev => (prev === idx ? null : idx));
  };

  const highlightRules = [
    {
      title: "PRE-EVENT TRANSPARENCY",
      desc: "Reward amounts, eligibility and scoring rules should be published before the affected event begins."
    },
    {
      title: "FAIR RAFFLE STANDARD",
      desc: "Participation Draw uses transparent random selection."
    },
    {
      title: "TEAM POOL SPECIFICATION",
      desc: "Team-based rewards must clearly state whether the reward is the total team pool or per-player."
    },
    {
      title: "LEAGUE POINT INTEGRITY",
      desc: "League Points should not be changed after results are known."
    }
  ];

  return (
    <section id="rules" className="relative py-14 sm:py-16 bg-[#050505]">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none"></div>
      <div className="absolute top-1/3 left-0 w-80 h-80 bg-red-600/10 blur-[150px] pointer-events-none rounded-full"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-red-950/40 border border-red-600/30 text-[11px] font-tech font-bold uppercase tracking-widest text-[#ff3333] mb-2">
            <Scale className="w-3 h-3" />
            <span>FAIR PLAY CODEX</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-tight mb-2">
            TOURNAMENT <span className="text-[#e10600]">RULES</span>
          </h2>

          <div className="w-14 h-0.5 bg-gradient-to-r from-transparent via-[#e10600] to-transparent mx-auto mb-4"></div>

          <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
            Every match is governed by strict tournament standards ensuring integrity, sportsmanlike etiquette, and prompt prize settlement.
          </p>
        </div>

        {/* Highlighted Core Principles Banner */}
        <div className="mb-8 p-4 sm:p-5 rounded-xl bg-gradient-to-r from-red-950/40 via-red-900/20 to-red-950/40 border border-red-600/50 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[#ff2a2a]" />
            <h3 className="font-display font-black text-base sm:text-lg text-white uppercase tracking-wider">
              FUNDAMENTAL LEAGUE MANDATES
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highlightRules.map((r, i) => (
              <div key={i} className="p-3 rounded bg-black/60 border border-red-600/30">
                <span className="font-tech text-[11px] text-[#ff4d4d] uppercase font-bold tracking-wider block mb-0.5">
                  {r.title}
                </span>
                <p className="text-xs text-zinc-200 font-sans leading-relaxed">
                  "{r.desc}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Accordions (12 Topics) */}
        <div className="space-y-2.5">
          {RULES_DATA.map((rule, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={rule.id}
                className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-[#0f0f15] border-red-600/60 shadow-[0_4px_20px_rgba(0,0,0,0.6)]'
                    : 'bg-[#0a0a0e] border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full p-3 sm:p-3.5 flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-bold text-xs text-[#ff2a2a] w-5">
                      0{idx + 1}
                    </span>
                    <span className="font-display font-black text-base sm:text-lg text-white uppercase tracking-wider">
                      {rule.title}
                    </span>
                  </div>

                  <div className="p-1 rounded bg-black/40 text-zinc-400">
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#ff2a2a]" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/5 animate-in fade-in duration-200">
                    <ul className="space-y-2">
                      {rule.content.map((point, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2.5 text-xs text-zinc-300 font-sans">
                          <CheckCircle className="w-3.5 h-3.5 text-[#ff2a2a] shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
