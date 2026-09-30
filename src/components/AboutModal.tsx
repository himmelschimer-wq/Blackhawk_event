import React, { useEffect } from 'react';
import { X, Target, Users, Flame } from 'lucide-react';
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
        {/* Header (Sticky on mobile) */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/[0.08] bg-[#09090b]/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img
              src="/assets/blackhawk_navbar_logo.png"
              alt="BlackHawk"
              className="h-5 sm:h-6 w-auto object-contain"
            />
            <span className="text-white/20">|</span>
            <h3 className="font-cinzel text-xs sm:text-base font-bold tracking-wider text-white uppercase truncate">
              ABOUT BLACKHAWK ESPORTS
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 text-xs sm:text-sm text-[#a0a0a8] leading-relaxed flex-1 overscroll-contain">
          <div className="relative rounded-xl overflow-hidden border border-white/10 h-40 bg-zinc-900 flex items-center justify-center">
            <img
              src="/assets/blackhawk_hero_official_banner.png"
              alt="BlackHawk Sanctuary"
              className="absolute inset-0 w-full h-full object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0f] via-transparent to-transparent" />
            <img
              src="/assets/blackhawk_emblem_aura.png"
              alt="Emblem"
              className="relative h-28 w-auto object-contain animate-float-slow drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]"
            />
          </div>

          <div className="space-y-3">
            <h4 className="font-cinzel text-lg font-bold text-white tracking-wide">
              THE WARRIOR SPIRIT (黑鷹)
            </h4>
            <p>
              Born from the philosophy of precision, relentless aggression, and brotherhood, BlackHawk is an independent esports ecosystem crafted for players who value skill above all.
            </p>
            <p>
              We bring together high-octane battle royales (BGMI, Free Fire), razor-sharp tactical FPS (Valorant), and creative sandbox mastery (Minecraft) under one unified competitive league.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <Target className="w-5 h-5 text-[#D71920] mb-1.5" />
              <p className="text-xs font-bold text-white uppercase">100% Meritocracy</p>
              <p className="text-[11px] text-[#71717a] mt-1">Zero pay-to-win. Clean tournaments with anti-cheat screening.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <Users className="w-5 h-5 text-[#D71920] mb-1.5" />
              <p className="text-xs font-bold text-white uppercase">Active Community</p>
              <p className="text-[11px] text-[#71717a] mt-1">500+ passionate gamers on Discord organizing daily scrims.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <Flame className="w-5 h-5 text-[#D71920] mb-1.5" />
              <p className="text-xs font-bold text-white uppercase">Instant Payouts</p>
              <p className="text-[11px] text-[#71717a] mt-1">Direct UPI transfers immediately upon match completion.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#09090b] flex justify-end">
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-full border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] text-white text-xs font-medium tracking-wide transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
