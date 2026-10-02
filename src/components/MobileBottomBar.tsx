import React from 'react';
import { Gamepad2, Calendar, Trophy, Shield, Flame } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface MobileBottomBarProps {
  onRegisterClick: () => void;
  onNavigate: (sectionId: string) => void;
  onOpenRules: () => void;
  isRevealed?: boolean;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  onRegisterClick,
  onNavigate,
  onOpenRules,
  isRevealed = true,
}) => {
  return (
    <div className={`sm:hidden fixed bottom-3 inset-x-3 z-40 pointer-events-auto transition-opacity duration-300 ${
      isRevealed ? 'animate-site-bottomnav' : 'opacity-0 pointer-events-none'
    }`}>
      <nav
        aria-label="Mobile Quick Bar"
        className="flex items-center justify-between px-2.5 py-1.5 rounded-2xl bg-[#0a0a0e]/92 backdrop-blur-xl border border-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.85),0_0_1px_rgba(255,255,255,0.2)]"
      >
        {/* Games shortcut */}
        <button
          onClick={() => {
            sfx.playClick();
            onNavigate('games');
          }}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-zinc-400 hover:text-white active:scale-90 active:bg-white/5 transition-all cursor-pointer"
        >
          <Gamepad2 className="w-4 h-4 mb-0.5 text-zinc-300" />
          <span className="text-[9px] font-tech font-bold uppercase tracking-wider">Games</span>
        </button>

        {/* Events shortcut */}
        <button
          onClick={() => {
            sfx.playClick();
            onNavigate('events');
          }}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-zinc-400 hover:text-white active:scale-90 active:bg-white/5 transition-all cursor-pointer"
        >
          <Calendar className="w-4 h-4 mb-0.5 text-zinc-300" />
          <span className="text-[9px] font-tech font-bold uppercase tracking-wider">Events</span>
        </button>

        {/* Center / Highlight: Fast Register CTA */}
        <button
          onClick={() => {
            sfx.playClick();
            onRegisterClick();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D71920] to-[#b3141a] active:scale-95 text-white shadow-[0_0_16px_rgba(215,25,32,0.45)] transition-all cursor-pointer shrink-0"
        >
          <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
          <span className="text-[11px] font-cinzel font-bold tracking-wider uppercase">REGISTER</span>
        </button>

        {/* Leaderboard shortcut */}
        <button
          onClick={() => {
            sfx.playClick();
            onNavigate('leaderboard');
          }}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-zinc-400 hover:text-white active:scale-90 active:bg-white/5 transition-all cursor-pointer"
        >
          <Trophy className="w-4 h-4 mb-0.5 text-[#f5c464]" />
          <span className="text-[9px] font-tech font-bold uppercase tracking-wider">Ranks</span>
        </button>

        {/* Rules shortcut */}
        <button
          onClick={() => {
            sfx.playClick();
            onOpenRules();
          }}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-zinc-400 hover:text-white active:scale-90 active:bg-white/5 transition-all cursor-pointer"
        >
          <Shield className="w-4 h-4 mb-0.5 text-zinc-300" />
          <span className="text-[9px] font-tech font-bold uppercase tracking-wider">Rules</span>
        </button>
      </nav>
    </div>
  );
};
