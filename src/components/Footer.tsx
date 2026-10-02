import React from 'react';
import { sfx } from '../utils/sfx';

interface FooterProps {
  onNavigate?: (sectionId: string) => void;
  onOpenRules?: () => void;
  onOpenAbout?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenRules,
  onOpenAbout,
}) => {
  const handleNavClick = (tab: 'home' | 'events' | 'games' | 'leaderboard' | 'rules' | 'about') => {
    sfx.playClick();
    if (tab === 'rules') {
      if (onOpenRules) onOpenRules();
      return;
    }
    if (tab === 'about') {
      if (onOpenAbout) onOpenAbout();
      return;
    }
    if (tab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const targetElement = document.getElementById(tab);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    } else if (onNavigate) {
      onNavigate(tab);
    }
  };

  return (
    <footer className="relative bg-[#060607] border-t border-white/[0.05] pt-8 pb-24 sm:py-10 text-[#8e8e93]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          {/* Left: BlackHawk Logo + Motto */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3.5">
            <img
              src="/assets/blackhawk_navbar_logo.png"
              alt="BlackHawk"
              className="h-6 w-auto object-contain opacity-90"
            />
            <span className="hidden sm:inline text-white/15 text-xs">|</span>
            <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] text-[#6b6b72] uppercase">
              PLAY &nbsp; COMPETE &nbsp; DOMINATE
            </p>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 sm:gap-x-6 gap-y-2 text-[11px] font-medium tracking-[0.14em] uppercase text-[#7a7a82]">
            {(
              [
                { id: 'home', label: 'Home' },
                { id: 'events', label: 'Events' },
                { id: 'games', label: 'Games' },
                { id: 'leaderboard', label: 'Leaderboard' },
                { id: 'rules', label: 'Rules' },
                { id: 'about', label: 'About' },
              ] as const
            ).map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="py-1 px-1.5 hover:text-white transition-colors cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right: Social Icons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Discord */}
            <a
              href="https://discord.gg/WrxHsKbHY"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
              className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 hover:border-[#5865F2]/50 hover:bg-[#5865F2]/10 flex items-center justify-center text-[#7a7a82] hover:text-[#5865F2] transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};
