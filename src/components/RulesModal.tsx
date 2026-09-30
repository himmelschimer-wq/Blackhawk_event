import React, { useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, Award } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
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
            <span className="w-2 h-2 rounded-full bg-[#D71920]" />
            <h3 className="font-cinzel text-xs sm:text-base font-bold tracking-wider text-white uppercase truncate">
              TOURNAMENT CODE OF CONDUCT & RULES
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
          {/* Section 1 */}
          <div className="space-y-2 border-b border-white/[0.06] pb-4">
            <h4 className="font-cinzel text-white text-base font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D71920]" />
              1. FAIR PLAY & ZERO TOLERANCE
            </h4>
            <p>
              Any form of third-party software, scripts, aim assist mods, emulators (where banned), or teaming in solo tournaments will result in immediate disqualification and a permanent blacklist from all BlackHawk events.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2 border-b border-white/[0.06] pb-4">
            <h4 className="font-cinzel text-white text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D71920]" />
              2. CHECK-IN & ROOM ID DISTRIBUTION
            </h4>
            <p>
              Room ID and Password are sent via our official Discord server and WhatsApp/email notification 15 minutes prior to match schedule. Players failing to join within 10 minutes will forfeit their slot.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2 border-b border-white/[0.06] pb-4">
            <h4 className="font-cinzel text-white text-base font-semibold flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D71920]" />
              3. PRIZE DISBURSEMENT
            </h4>
            <p>
              All prizes (₹50,000+ total league prize pool) will be transferred directly to winners via instant UPI or Bank Transfer within 2 hours of official result verification and screenshot audit.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h4 className="font-cinzel text-white text-base font-semibold">
              4. RECORDING & EVIDENCE
            </h4>
            <p>
              Top 3 players or squads in every tournament may be requested to provide continuous POV screen recording or death cam footage in case of dispute.
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#09090b] flex justify-end">
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-full bg-[#D71920] hover:bg-[#e3262e] text-white text-xs font-semibold tracking-wide transition-all"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
