import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { RegistrationSection } from './RegistrationSection';
import { sfx } from '../utils/sfx';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedGame?: string;
  preSelectedEventId?: string;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  preSelectedGame,
  preSelectedEventId,
}) => {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-5 overflow-y-auto">
      {/* Dark Backdrop with subtle blur */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={() => {
          sfx.playClick();
          onClose();
        }}
      />

      {/* Modal Dialog Container: Fullscreen on mobile, centered card on desktop */}
      <div className="relative w-full max-w-4xl bg-[#0c0c0f] border-0 sm:border sm:border-white/10 rounded-none sm:rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-10 overflow-hidden h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col">
        {/* Top Header Bar (Sticky on mobile) */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/[0.08] bg-[#09090b]/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <img
              src="/assets/blackhawk_navbar_logo.png"
              alt="BlackHawk"
              className="h-5 sm:h-6 w-auto object-contain"
            />
            <span className="text-white/20">|</span>
            <span className="font-cinzel text-xs sm:text-sm font-bold tracking-wider text-white uppercase truncate">
              TOURNAMENT REGISTRATION
            </span>
          </div>

          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-full border border-white/10 hover:border-white/25 active:scale-90 bg-white/[0.03] hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content: Registration Section */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          <RegistrationSection
            preSelectedGame={preSelectedGame}
            preSelectedEventId={preSelectedEventId}
            onRegistrationSuccess={() => {
              // Registration successful
            }}
          />
        </div>
      </div>
    </div>
  );
};
