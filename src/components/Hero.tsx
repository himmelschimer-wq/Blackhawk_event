import React, { useEffect, useState } from 'react';
import { sfx } from '../utils/sfx';

interface HeroProps {
  onRegisterClick: () => void;
  onExploreClick: () => void;
}

interface DBStats {
  totalPlayers: number;
  totalGames: number;
  totalPrizePool: number;
  activeEvents: number;
}

export const Hero: React.FC<HeroProps> = ({ onRegisterClick, onExploreClick }) => {
  const [scrollY, setScrollY] = useState(0);
  const [stats, setStats] = useState<DBStats | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch real statistics directly from the database API
  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.totalPlayers === 'number') {
          setStats(data);
        }
      })
      .catch(err => {
        console.error('Failed to load database stats:', err);
      });
  }, []);

  // Format currency
  const formatPrize = (val: number) => {
    if (!val || val === 0) return '₹0';
    if (val >= 1000) return `₹${Math.floor(val / 1000)}K+`;
    return `₹${val}`;
  };

  return (
    <section id="home" className="relative min-h-[90dvh] sm:min-h-[92vh] flex items-center pt-20 sm:pt-24 pb-12 sm:pb-16 overflow-hidden bg-[#080808]">
      {/* ─── Background Layer: Artwork with Shogun Warrior prominently aligned ─── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full bg-cover transition-transform duration-700 ease-out"
          style={{
            backgroundImage: `url('/assets/blackhawk_hero_official_banner.png')`,
            backgroundPosition: 'right 30% bottom',
            opacity: 0.45,
            transform: `translateY(${scrollY * 0.08}px) scale(1.02)`,
          }}
        />

        {/* Left Dark Gradient: Ensures text area is pure deep #080808 */}
        <div className="absolute inset-y-0 left-0 w-full md:w-[60%] lg:w-[52%] bg-gradient-to-r from-[#080808] via-[#080808]/92 to-transparent" />

        {/* Bottom Fade to Pure #080808 */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#080808] via-[#080808]/80 to-transparent" />

        {/* Top Fade Under Navbar */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#080808] to-transparent" />

        {/* Extremely Subtle Atmospheric Red Glow in the Center */}
        <div className="absolute top-1/2 left-[50%] -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[550px] h-[300px] sm:h-[400px] bg-[#D71920]/[0.08] rounded-full blur-[100px] sm:blur-[130px] pointer-events-none" />

        {/* Subtle Restrained Drifting Embers */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-10 left-[20%] w-1.5 h-1.5 rounded-full bg-[#D71920]/70 blur-[1px] animate-ember" style={{ animationDuration: '8s', animationDelay: '0s' }} />
          <div className="absolute bottom-16 left-[45%] w-1 h-1 rounded-full bg-[#ff4a4a]/80 blur-[0.5px] animate-ember" style={{ animationDuration: '11s', animationDelay: '2s' }} />
          <div className="absolute bottom-6 left-[65%] w-1.5 h-1.5 rounded-full bg-[#D71920]/60 blur-[1px] animate-ember" style={{ animationDuration: '9s', animationDelay: '4s' }} />
          <div className="absolute bottom-12 left-[80%] w-1 h-1 rounded-full bg-[#e3262e]/75 blur-[0.5px] animate-ember" style={{ animationDuration: '10s', animationDelay: '1.5s' }} />
        </div>
      </div>

      {/* ─── Hero Content Grid ─── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 xl:col-span-6 space-y-4 sm:space-y-6 pt-2 sm:pt-4">
            {/* Small Eyebrow */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-5 sm:w-6 h-[1.5px] bg-[#D71920]" />
              <p className="text-[10px] sm:text-xs font-semibold tracking-[0.24em] sm:tracking-[0.28em] text-[#a8a8af] uppercase">
                DISCORD GAMING COMMUNITY
              </p>
            </div>

            {/* Main Headline: Bold Red Text with a Slow White Shine Every Few Seconds */}
            <div className="relative inline-block select-none py-0.5">
              <h1 className="font-cinzel text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-wider leading-[1.08]">
                <span className="text-red-white-shine">
                  BLACKHAWK
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-base text-[#9a9aa0] max-w-xl font-normal leading-relaxed">
              BlackHawk is a Discord community created by <span className="text-white font-medium">blackhawkop</span> where we host fun games and exciting events. This isn&apos;t a corporate esports organization — it&apos;s all about hosting fun community events to enjoy games even more with each other.
            </p>

            {/* Action Buttons: Full width & touch friendly on mobile */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
              <button
                onClick={() => {
                  sfx.playClick();
                  onRegisterClick();
                }}
                onMouseEnter={() => sfx.playHover()}
                className="group px-6 py-3.5 sm:py-3 rounded-full bg-gradient-to-r from-[#D71920] via-[#c7171d] to-[#ad1318] hover:from-[#e3262e] hover:to-[#c4161d] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 shadow-[0_0_25px_rgba(215,25,32,0.4)] hover:shadow-[0_0_35px_rgba(215,25,32,0.65)] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Register Now</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </button>

              <button
                onClick={() => {
                  sfx.playClick();
                  onExploreClick();
                }}
                onMouseEnter={() => sfx.playHover()}
                className="px-6 py-3.5 sm:py-3 rounded-full bg-[#121215]/80 hover:bg-[#1a1a1f] active:scale-[0.98] text-[#c0c0c5] hover:text-white text-xs sm:text-sm font-medium tracking-wide border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer flex items-center justify-center"
              >
                View Events
              </button>
            </div>
          </div>

          {/* Right Column: High Quality Floating Physical BlackHawk Emblem */}
          <div className="lg:col-span-5 xl:col-span-6 flex items-center justify-center relative py-4 sm:py-6 lg:py-0 pr-0 lg:pr-12">
            <div className="relative flex items-center justify-center w-full max-w-[260px] sm:max-w-[360px] lg:max-w-[440px]">
              {/* Refined Subtle Ambient Glow behind the BlackHawk Emblem */}
              <div className="absolute w-48 sm:w-64 h-48 sm:h-64 bg-[#D71920] opacity-20 rounded-full blur-[60px] sm:blur-[80px] pointer-events-none" />

              {/* High Quality Physical Floating Emblem with clean natural shadow */}
              <img
                src="/assets/blackhawk_emblem_hq.png"
                alt="BlackHawk Tournament Emblem"
                className="w-full h-auto object-contain animate-float-slow select-none pointer-events-none drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)] drop-shadow-[0_0_15px_rgba(215,25,32,0.2)]"
              />
            </div>
          </div>
        </div>

        {/* ─── Hero Database Statistics: Responsive 2x2 Grid on Mobile, 4 Col on Desktop ─── */}
        <div className="pt-8 sm:pt-16 border-t border-white/[0.08] mt-6 sm:mt-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {/* Stat 1: Total Players from DB */}
            <div className="p-3.5 sm:p-0 rounded-xl bg-white/[0.02] sm:bg-transparent border border-white/[0.06] sm:border-0 sm:border-r sm:border-white/10 sm:pr-8">
              <p className="font-bebas text-2xl sm:text-3xl lg:text-4xl text-[#f0f0f2] tracking-wider leading-none">
                {stats ? (stats.totalPlayers > 0 ? `${stats.totalPlayers}+` : '0') : '0'}
              </p>
              <p className="text-[9px] sm:text-[11px] font-semibold tracking-[0.2em] text-[#787880] uppercase mt-1">
                PLAYERS
              </p>
            </div>

            {/* Stat 2: Total Active Games from DB */}
            <div className="p-3.5 sm:p-0 rounded-xl bg-white/[0.02] sm:bg-transparent border border-white/[0.06] sm:border-0 sm:border-r sm:border-white/10 sm:pr-8">
              <p className="font-bebas text-2xl sm:text-3xl lg:text-4xl text-[#f0f0f2] tracking-wider leading-none">
                {stats ? stats.totalGames : '0'}
              </p>
              <p className="text-[9px] sm:text-[11px] font-semibold tracking-[0.2em] text-[#787880] uppercase mt-1">
                GAMES
              </p>
            </div>

            {/* Stat 3: Total Prize Pool from DB */}
            <div className="p-3.5 sm:p-0 rounded-xl bg-white/[0.02] sm:bg-transparent border border-white/[0.06] sm:border-0 sm:border-r sm:border-white/10 sm:pr-8">
              <p className="font-bebas text-2xl sm:text-3xl lg:text-4xl text-[#f0f0f2] tracking-wider leading-none">
                {stats ? formatPrize(stats.totalPrizePool) : '₹0'}
              </p>
              <p className="text-[9px] sm:text-[11px] font-semibold tracking-[0.2em] text-[#787880] uppercase mt-1">
                PRIZES
              </p>
            </div>

            {/* Stat 4: 100% Skill Based */}
            <div className="p-3.5 sm:p-0 rounded-xl bg-white/[0.02] sm:bg-transparent border border-white/[0.06] sm:border-0">
              <p className="font-bebas text-2xl sm:text-3xl lg:text-4xl text-[#D71920] tracking-wider leading-none">
                100%
              </p>
              <p className="text-[9px] sm:text-[11px] font-semibold tracking-[0.2em] text-[#787880] uppercase mt-1">
                SKILL BASED
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
