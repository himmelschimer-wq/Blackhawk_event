import React, { useState, useEffect } from 'react';
import { Menu, X, Flame } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface NavbarProps {
  onRegisterClick: () => void;
  onNavigate?: (sectionId: string) => void;
  onOpenRules?: () => void;
  onOpenAbout?: () => void;
  isRevealed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRegisterClick,
  onNavigate,
  onOpenRules,
  onOpenAbout,
  isRevealed = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'events' | 'games' | 'leaderboard' | 'rules' | 'about'>('home');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (tab: 'home' | 'events' | 'games' | 'leaderboard' | 'rules' | 'about') => {
    sfx.playClick();
    setActiveTab(tab);
    setIsOpen(false);

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

  const handleRegister = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    sfx.playClick();
    setIsOpen(false);
    onRegisterClick();
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isRevealed ? 'animate-site-navbar' : 'opacity-0 pointer-events-none'
      } ${
        scrolled
          ? 'bg-[#080808]/92 backdrop-blur-md border-b border-white/5 py-3 shadow-[0_4px_25px_rgba(0,0,0,0.8)]'
          : 'bg-[#080808]/75 backdrop-blur-sm border-b border-white/[0.04] py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Left: BlackHawk Logo */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('home');
            }}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <img
              src="/assets/blackhawk_navbar_logo.png"
              alt="BlackHawk"
              className="h-7 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
            />
          </a>

          {/* Center: Minimal Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-7 lg:space-x-9">
            {(
              [
                { id: 'home', label: 'HOME' },
                { id: 'events', label: 'EVENTS' },
                { id: 'games', label: 'GAMES' },
                { id: 'leaderboard', label: 'LEADERBOARD' },
                { id: 'rules', label: 'RULES' },
                { id: 'about', label: 'ABOUT' },
              ] as const
            ).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  onMouseEnter={() => sfx.playHover()}
                  className={`relative py-1 text-[11px] lg:text-xs font-semibold tracking-[0.16em] uppercase transition-colors cursor-pointer ${
                    isActive ? 'text-white' : 'text-[#8e8e93] hover:text-[#e5e5e5]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-[#D71920] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Desktop: Discord Outlined Ghost Button + Red Register CTA */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Join Discord Ghost Button */}
            <a
              href="https://discord.gg/WrxHsKbHY"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => sfx.playHover()}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-[#5865F2]/40 text-[#c5c5d0] hover:text-white text-xs font-medium tracking-wide transition-all group shrink-0 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-[#5865F2] group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>Join Discord</span>
            </a>

            {/* Red Strong CTA */}
            <button
              type="button"
              onClick={handleRegister}
              onMouseEnter={() => sfx.playHover()}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#D71920] to-[#b3141a] hover:from-[#e3262e] hover:to-[#c4161d] text-white text-xs font-semibold tracking-wide shadow-[0_0_15px_rgba(215,25,32,0.35)] hover:shadow-[0_0_22px_rgba(215,25,32,0.55)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <span>Register Now</span>
              <span className="text-white/80">→</span>
            </button>
          </div>

          {/* Mobile Right Controls: Animated Hamburger */}
          <div className="flex md:hidden items-center">
            {/* Hamburger Toggle */}
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setIsOpen(!isOpen);
              }}
              className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/10 active:bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer touch-manipulation"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Backdrop & Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-x-0 top-[57px] bg-[#09090c]/98 backdrop-blur-2xl border-b border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-in slide-in-from-top-2 duration-200 z-50">
          <div className="px-5 py-4 space-y-1.5 max-h-[calc(100dvh-70px)] overflow-y-auto">
            {/* Direct Big Register CTA inside drawer */}
            <button
              type="button"
              onClick={handleRegister}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D71920] to-[#b3141a] active:scale-95 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(215,25,32,0.45)] transition-all flex items-center justify-center gap-2 mb-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>REGISTER FOR TOURNAMENTS</span>
            </button>

            {(
              [
                { id: 'home', label: 'HOME', icon: '⛩️' },
                { id: 'events', label: 'TOURNAMENT EVENTS', icon: '⚔️' },
                { id: 'games', label: 'OFFICIAL GAMES', icon: '🎮' },
                { id: 'leaderboard', label: 'LEADERBOARD', icon: '👑' },
                { id: 'rules', label: 'RULES & CODE OF CONDUCT', icon: '📜' },
                { id: 'about', label: 'ABOUT BLACKHAWK', icon: '🦅' },
              ] as const
            ).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center justify-between w-full py-3 px-3.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all text-left cursor-pointer touch-manipulation ${
                    isActive
                      ? 'bg-[#D71920]/15 text-white border border-[#D71920]/40'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D71920]" />
                  ) : (
                    <span className="text-zinc-600 text-xs">→</span>
                  )}
                </button>
              );
            })}

            {/* Quick Actions Footer inside Drawer */}
            <div className="pt-3 mt-2 border-t border-white/10">
              <a
                href="https://discord.gg/WrxHsKbHY"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 px-3 rounded-lg bg-[#5865F2]/15 border border-[#5865F2]/30 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <svg className="w-3.5 h-3.5 fill-[#5865F2] shrink-0" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>Discord</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
