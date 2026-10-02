import React from 'react';
import { Gamepad2, Calendar, Trophy, Shield } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface MobileBottomBarProps {
  onRegisterClick?: () => void;
  onNavigate: (sectionId: string) => void;
  onOpenRules: () => void;
  isRevealed?: boolean;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  onNavigate,
  onOpenRules,
  isRevealed = true,
}) => {
  return (
    <div className={`sm:hidden fixed bottom-3 inset-x-4 z-40 pointer-events-auto transition-all duration-500 ease-out ${
      isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
    }`}>
      <nav
        aria-label="Mobile Quick Bar"
        className="grid grid-cols-4 items-center px-2 py-1.5 rounded-2xl bg-[#0a0a0e]/95 backdrop-blur-xl border border-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.85),0_0_1px_rgba(255,255,255,0.2)]"
      >
        {/* Games shortcut */}
        <button
          type="button"
          onClick={() => {
            sfx.playClick();
            onNavigate('games');
          }}
          className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-zinc-400 hover:text-white active:scale-90 transition-all cursor-pointer touch-manipulation"
        >
          <Gamepad2 className="w-4 h-4 mb-0.5 text-zinc-300" />
          <span className="text-[9px] font-tech font-bold uppercase tracking-wider">Games</span>
        </button>

        {/* Events shortcut */}
        <button
          type="button"
          onClick={() => {
            sfx.playClick();
            onNavigate('events');
          }}
          className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-zinc-400 hover:text-white active:scale-90 transition-all cursor-pointer touch-manipulation"
        >
          <Calendar className="w-4 h-4 mb-0.5 text-zinc-300" />
          <span className="text-[9px] font-tech font-bold uppercase tracking-wider">Events</span>
        </button>

        {/* Leaderboard shortcut */}
        <button
          type="button"
          onClick={() => {
            sfx.playClick();
            onNavigate('leaderboard');
          }}
          className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-zinc-400 hover:text-white active:scale-90 transition-all cursor-pointer touch-manipulation"
        >
          <Trophy className="w-4 h-4 mb-0.5 text-[#f5c464]" />
          <span className="text-[9px] font-tech font-bold uppercase tracking-wider">Ranks</span>
        </button>

        {/* Rules shortcut */}
        <button
          type="button"
          onClick={() => {
            sfx.playClick();
            onOpenRules();
          }}
          className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-zinc-400 hover:text-white active:scale-90 transition-all cursor-pointer touch-manipulation"
        >
          <Shield className="w-4 h-4 mb-0.5 text-zinc-300" />
          <span className="text-[9px] font-tech font-bold uppercase tracking-wider">Rules</span>
        </button>
      </nav>
    </div>
  );
};
