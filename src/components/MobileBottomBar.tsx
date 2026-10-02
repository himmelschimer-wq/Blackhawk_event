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
        className="flex items-center justify-between px-2 py-1.5 rounded-2xl bg-[#0a0a0e]/95 backdrop-blur-xl border border-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.85),0_0_1px_rgba(255,255,255,0.2)]"
      >
        {/* Games shortcut */}
        <button
          type="button"
          onClick={() => {
            sfx.playClick();
            onNavigate('games');
          }}
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-zinc-400 hover:text-white active:scale-90 transition-all cursor-pointer touch-manipulation"
        >
          <Gamepad2 className="w-4 h-4 mb-0.5 text-zinc-300" />
          <span className="text-[8px] font-tech font-bold uppercase tracking-wider">Games</span>
        </button>

        {/* Events shortcut */}
        <button
          type="button"
          onClick={() => {
            sfx.playClick();
            onNavigate('events');
          }}
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-zinc-400 hover:text-white active:scale-90 transition-all cursor-pointer touch-manipulation"
        >
          <Calendar className="w-4 h-4 mb-0.5 text-zinc-300" />
          <span className="text-[8px] font-tech font-bold uppercase tracking-wider">Events</span>
        </button>

        {/* Discord Link (Next to Registration) */}
        <a
          href="https://discord.gg/WrxHsKbHY"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sfx.playClick()}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl bg-[#5865F2]/15 border border-[#5865F2]/40 text-[#5865F2] hover:text-white active:scale-90 transition-all cursor-pointer touch-manipulation shrink-0"
        >
          <svg className="w-4 h-4 fill-current mb-0.5" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          <span className="text-[8px] font-tech font-bold uppercase tracking-wider">Discord</span>
        </a>

        {/* Center / Highlight: Fast Register CTA */}
        <button
          type="button"
          onClick={() => {
            sfx.playClick();
            onRegisterClick();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D71920] to-[#b3141a] active:scale-95 text-white shadow-[0_0_16px_rgba(215,25,32,0.45)] transition-all cursor-pointer touch-manipulation shrink-0"
        >
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span className="text-[11px] font-cinzel font-bold tracking-wider uppercase">REGISTER</span>
        </button>

        {/* Leaderboard shortcut */}
        <button
          type="button"
          onClick={() => {
            sfx.playClick();
            onNavigate('leaderboard');
          }}
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-zinc-400 hover:text-white active:scale-90 transition-all cursor-pointer touch-manipulation"
        >
          <Trophy className="w-4 h-4 mb-0.5 text-[#f5c464]" />
          <span className="text-[8px] font-tech font-bold uppercase tracking-wider">Ranks</span>
        </button>

        {/* Rules shortcut */}
        <button
          type="button"
          onClick={() => {
            sfx.playClick();
            onOpenRules();
          }}
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-zinc-400 hover:text-white active:scale-90 transition-all cursor-pointer touch-manipulation"
        >
          <Shield className="w-4 h-4 mb-0.5 text-zinc-300" />
          <span className="text-[8px] font-tech font-bold uppercase tracking-wider">Rules</span>
        </button>
      </nav>
    </div>
  );
};
