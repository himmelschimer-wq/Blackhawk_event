import React, { useState } from 'react';
import { GAME_EVENTS, type GameEvent } from '../data/tournamentData';
import { ChevronDown, ChevronUp, AlertCircle, ArrowRight, ShieldCheck, Gamepad } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface GameEventsProps {
  onRegisterForGame: (gameName: string) => void;
}

export const GameEvents: React.FC<GameEventsProps> = ({ onRegisterForGame }) => {
  const [expandedGame, setExpandedGame] = useState<string | null>("freefire");

  const toggleExpand = (id: string) => {
    sfx.playClick();
    setExpandedGame(prev => (prev === id ? null : id));
  };

  return (
    <section id="games" className="relative py-14 sm:py-16 bg-[#050505]">
      {/* Background Decor */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-red-600/10 blur-[150px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#8b0000]/10 blur-[140px] pointer-events-none rounded-full"></div>
      <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-red-950/40 border border-red-600/30 text-[11px] font-tech font-bold uppercase tracking-widest text-[#ff3333] mb-2">
              <Gamepad className="w-3 h-3" />
              <span>OFFICIAL TITLE LINEUP</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-tight">
              THE FIVE <span className="text-[#e10600]">BATTLEGROUNDS</span>
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-sans mt-1.5 max-w-xl">
              From high-stakes mobile battle royales to tactical masterminds and casual party showstoppers. Every title features dedicated prize pools and multiple ways to win.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-[#0d0d12] border border-white/10 px-3.5 py-2 rounded-lg shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#ff2a2a] shrink-0" />
            <div className="text-[11px] font-tech">
              <span className="block text-white font-bold uppercase tracking-wider">OFFICIAL RULES ACTIVE</span>
              <span className="text-zinc-400">Prizes disbursed within 48–72h of verification</span>
            </div>
          </div>
        </div>

        {/* 5 Interactive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {GAME_EVENTS.map((game: GameEvent) => {
            const isExpanded = expandedGame === game.id;

            return (
              <div
                key={game.id}
                id={`game-${game.id}`}
                className={`relative rounded-xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                  isExpanded
                    ? 'bg-gradient-to-b from-[#120808] via-[#0c0c10] to-[#07070a] border-red-600/60 shadow-[0_0_25px_rgba(225,6,0,0.2)] ring-1 ring-red-500/30'
                    : 'bg-[#0a0a0e] border-white/10 hover:border-red-600/40 hover:bg-[#0f0f14]'
                }`}
              >
                {/* Top Accent Strip */}
                <div className="h-1 w-full bg-gradient-to-r from-red-700 via-[#e10600] to-red-900"></div>

                <div className="p-4 sm:p-5">
                  {/* Card Header Meta */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-tech font-bold text-[10px] text-zinc-300 uppercase tracking-widest">
                      {game.week}
                    </span>
                    <span className="text-[10px] font-tech text-[#ff4d4d] tracking-wider uppercase font-semibold">
                      {game.genre}
                    </span>
                  </div>

                  {/* Title & Prize Pool */}
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-wider">
                      {game.name}
                    </h3>
                    <div className="text-right">
                      <span className="block text-[9px] font-tech text-zinc-400 uppercase tracking-wider">PRIZE POOL</span>
                      <span className="font-display font-black text-lg sm:text-xl text-[#ff2a2a] text-glow-red">
                        {game.totalPrize}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                    {game.tagline}
                  </p>

                  {/* Date Status Placeholder Badge */}
                  <div className="mb-3 inline-block px-2 py-0.5 bg-black/60 border border-white/10 rounded font-tech text-[10px] text-zinc-400 uppercase tracking-wider">
                    {game.dateStatus}
                  </div>

                  {/* Highlight Important Note (e.g. BGMI Squad Pool Clarification) */}
                  {game.importantNote && (
                    <div className="mb-3 p-2.5 rounded-lg bg-red-950/40 border border-red-600/40 flex items-start gap-2 text-xs text-red-200">
                      <AlertCircle className="w-3.5 h-3.5 text-[#ff2a2a] shrink-0 mt-0.5" />
                      <span className="leading-snug font-sans text-[11px]">
                        <strong className="font-tech uppercase tracking-wider block text-white mb-0.5">RULE CLARIFICATION:</strong>
                        {game.importantNote}
                      </span>
                    </div>
                  )}

                  {/* Challenges List Preview */}
                  <div className="mb-3">
                    <span className="text-[9px] font-tech text-zinc-400 uppercase tracking-widest block mb-1.5 font-bold">
                      FEATURED CHALLENGES & MODES:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {game.challenges.map((c, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[10px] font-tech bg-white/5 text-zinc-300 border border-white/5"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expandable Rewards Section */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-tech text-[#ff4d4d] uppercase tracking-wider font-bold">
                          DETAILED REWARDS BREAKDOWN
                        </span>
                        <span className="text-[10px] font-tech text-zinc-400">
                          Total: {game.totalPrize}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {game.rewards.map((rew, i) => (
                          <div
                            key={i}
                            className="p-1.5 rounded bg-black/40 border border-white/5 flex items-center justify-between text-xs"
                          >
                            <div className="pr-2">
                              <span className="font-semibold text-zinc-200 block text-[11px]">{rew.label}</span>
                              {rew.desc && <span className="text-[9px] text-zinc-400 block">{rew.desc}</span>}
                            </div>
                            <span className="font-display font-black text-xs sm:text-sm text-[#ff2a2a] shrink-0">
                              {rew.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-3 bg-black/50 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleExpand(game.id)}
                    className="text-[11px] font-tech font-bold uppercase tracking-wider text-zinc-400 hover:text-white flex items-center gap-1 transition-colors py-1 cursor-pointer"
                  >
                    {isExpanded ? (
                      <>
                        <span>HIDE REWARDS</span>
                        <ChevronUp className="w-3 h-3 text-[#ff2a2a]" />
                      </>
                    ) : (
                      <>
                        <span>VIEW REWARDS</span>
                        <ChevronDown className="w-3 h-3 text-[#ff2a2a]" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      sfx.playClick();
                      onRegisterForGame(game.name);
                    }}
                    onMouseEnter={() => sfx.playHover()}
                    className="px-3 py-1.5 bg-[#e10600] hover:bg-[#ff1e1e] text-white font-display font-black text-[11px] uppercase tracking-wider clip-corner-tr flex items-center gap-1 shadow-[0_0_12px_rgba(225,6,0,0.35)] transition-all cursor-pointer"
                  >
                    <span>REGISTER FOR {game.name}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
