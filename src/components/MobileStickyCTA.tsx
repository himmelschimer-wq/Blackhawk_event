import React from 'react';
import { ArrowRight, Trophy } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface MobileStickyCTAProps {
  onRegisterClick: () => void;
}

export const MobileStickyCTA: React.FC<MobileStickyCTAProps> = ({ onRegisterClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-[#08080a]/95 backdrop-blur-md border-t border-red-600/40 md:hidden flex items-center justify-between gap-3 shadow-[0_-5px_25px_rgba(0,0,0,0.8)]">
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1 text-[10px] font-tech text-[#ff4d4d] uppercase font-bold tracking-wider">
          <Trophy className="w-3 h-3" />
          <span>₹2,000 PRIZE POOL</span>
        </div>
        <span className="font-display font-black text-sm text-white uppercase tracking-wider mt-0.5">
          5-WEEK LEAGUE
        </span>
      </div>

      <button
        onClick={() => {
          sfx.playClick();
          onRegisterClick();
        }}
        className="px-6 py-2.5 bg-[#e10600] active:bg-[#ff1e1e] text-white font-display font-black text-sm uppercase tracking-wider clip-corner-tr flex items-center gap-1.5 shadow-[0_0_15px_rgba(225,6,0,0.5)] shrink-0"
      >
        <span>REGISTER NOW</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
