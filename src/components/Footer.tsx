import React from 'react';
import { sfx } from '../utils/sfx';

interface FooterProps {
  onNavigate?: (sectionId: string) => void;
  onOpenRules?: () => void;
  onOpenAbout?: () => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenRules,
  onOpenAbout,
  onOpenAdmin,
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

          {/* Right: Social Icons + Admin Trigger */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Discord */}
            <a
              href="https://discord.gg/WrxHsKbHY"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
              className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 hover:border-white/20 flex items-center justify-center text-[#7a7a82] hover:text-white transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>

            {/* X (Twitter) */}
            <a
              href="https://x.com/blackhawk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 hover:border-white/20 flex items-center justify-center text-[#7a7a82] hover:text-white transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com/blackhawk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 hover:border-white/20 flex items-center justify-center text-[#7a7a82] hover:text-white transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com/@blackhawk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 hover:border-white/20 flex items-center justify-center text-[#7a7a82] hover:text-[#D71920] transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>

            {/* Admin Access link */}
            {onOpenAdmin && (
              <button
                onClick={() => {
                  sfx.playClick();
                  onOpenAdmin();
                }}
                title="Admin Control Room"
                className="px-2 py-1 rounded bg-white/[0.03] border border-white/10 text-[10px] text-zinc-500 hover:text-white font-mono transition-colors cursor-pointer"
              >
                ADMIN
              </button>
            )}
          </div>

        </div>
      </div>
    </footer>
  );
};
