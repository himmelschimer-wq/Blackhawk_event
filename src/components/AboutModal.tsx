import React, { useEffect } from 'react';
import { X, Trophy, ShieldCheck, Gamepad2, Sparkles, MessageSquare } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-5 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={() => {
          sfx.playClick();
          onClose();
        }}
      />

      <div className="relative w-full max-w-3xl bg-[#0c0c0f] border-0 sm:border sm:border-white/10 rounded-none sm:rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-10 overflow-hidden h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/[0.08] bg-[#09090b]/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img
              src="/assets/blackhawk_navbar_logo.png"
              alt="BlackHawk"
              className="h-5 sm:h-6 w-auto object-contain"
            />
            <span className="text-white/20">|</span>
            <h3 className="font-cinzel text-xs sm:text-base font-bold tracking-wider text-white uppercase truncate">
              ABOUT BLACKHAWK COMMUNITY
            </h3>
          </div>
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-full border border-white/10 hover:border-white/25 active:scale-90 bg-white/[0.03] hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-xs sm:text-sm text-[#a0a0a8] leading-relaxed flex-1 overscroll-contain">
          
          {/* Banner */}
          <div className="relative rounded-xl overflow-hidden border border-white/10 h-44 bg-zinc-950 flex items-center justify-center">
            <img
              src="/assets/blackhawk_hero_official_banner.png"
              alt="BlackHawk Community Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0f] via-[#0c0c0f]/60 to-transparent" />
            <div className="relative z-10 flex flex-col items-center text-center px-4">
              <img
                src="/assets/blackhawk_emblem_hq.png"
                alt="Emblem"
                className="h-20 w-auto object-contain mb-2 drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)]"
              />
              <span className="font-cinzel text-lg sm:text-xl font-bold text-white tracking-widest uppercase">
                BLACKHAWK COMMUNITY
              </span>
              <span className="text-[11px] text-[#D71920] font-semibold tracking-wider uppercase mt-0.5">
                ESTABLISHED BY BLACKHAWKOP
              </span>
            </div>
          </div>

          {/* Main Story & Community Vision */}
          <div className="space-y-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <h4 className="font-cinzel text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D71920]" />
              WHO WE ARE
            </h4>
            <p className="text-zinc-300">
              <strong className="text-white">BlackHawk</strong> is a passionate Discord gaming community founded by <strong className="text-[#ff4d4d]">blackhawkop</strong>. We built this platform because we believe gaming is at its absolute best when shared with a close-knit, active community.
            </p>
            <p>
              This isn't a faceless corporate venture — it’s an authentic space where gamers come together to talk, hang out on voice channels, form squads, and compete in organized custom room tournaments.
            </p>
          </div>

          {/* Supported Games Grid */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-[#D71920]" />
              WHAT WE PLAY & HOST
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { name: 'BGMI', desc: 'Squad & Solo Custom Rooms', tag: 'Battle Royale' },
                { name: 'Free Fire', desc: 'Clash Squad & BR Lobbies', tag: 'Survival' },
                { name: 'Valorant', desc: '5v5 Custom Spike Matches', tag: 'Tactical FPS' },
                { name: 'Minecraft', desc: 'Bedwars, Survival & Builds', tag: 'Sandbox' },
                { name: 'Chess', desc: 'Blitz & Rapid Tournaments', tag: 'Strategy' },
                { name: 'Scribble & Party', desc: 'Casual Community Game Nights', tag: 'Fun & Casual' },
              ].map((game) => (
                <div key={game.name} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs">{game.name}</span>
                    <span className="text-[9px] font-mono text-[#D71920] uppercase">{game.tag}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">{game.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pillars of the Community */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <ShieldCheck className="w-5 h-5 text-[#D71920] mb-2" />
              <p className="text-xs font-bold text-white uppercase tracking-wider">Fair Play First</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Zero tolerance for cheats, hacks, or toxicity. Every match is moderated by community admins to ensure genuine competition.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <Trophy className="w-5 h-5 text-[#D71920] mb-2" />
              <p className="text-xs font-bold text-white uppercase tracking-wider">Leaderboards & Prizes</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Points are tracked across all tournaments on our live leaderboard with direct cash prize payouts for winning players and squads.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <MessageSquare className="w-5 h-5 text-[#D71920] mb-2" />
              <p className="text-xs font-bold text-white uppercase tracking-wider">Join The Discord</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Join our Discord to get match room IDs, passwords, tournament announcements, and connect with hundreds of other players.
              </p>
            </div>
          </div>
        </div>

        {/* Footer with Actions */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#09090b] flex items-center justify-between gap-3">
          <a
            href="https://discord.gg/WrxHsKbHY"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5865F2]/20 hover:bg-[#5865F2] border border-[#5865F2]/40 text-white text-xs font-medium transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Join Discord Community</span>
          </a>

          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-full border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] text-white text-xs font-medium tracking-wide transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
