import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, Check, ArrowRight, ShieldAlert } from 'lucide-react';
import { sfx } from '../utils/sfx';
import { type DBEventItem } from './UpcomingEventsAndLeaderboard';
import { FormattedRuleText } from '../utils/ruleFormatter';

interface EventRulesBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: DBEventItem | null;
  onProceedToRegister: (gameName: string, eventId: string) => void;
}

export const EventRulesBriefingModal: React.FC<EventRulesBriefingModalProps> = ({
  isOpen,
  onClose,
  event,
  onProceedToRegister,
}) => {
  const [agreedToRules, setAgreedToRules] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setAgreedToRules(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  // Parse rules into readable lines
  const parseRules = (text?: string): string[] => {
    if (!text) return [];
    return text
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean);
  };

  const specificRules = parseRules(event.rules);
  const defaultGeneralRules = [
    "1. Room ID & Password are [gold]ONLY distributed via our official Discord server[/gold] (no other way). Please ensure you are active in the tournament Discord channel before match time.",
    "2. Fair play is strictly enforced: [red]Zero tolerance[/red] for aimbots, scripts, teaming in solos, or unauthorized emulators.",
    "3. Screen recording is not compulsory for players; however, [cyan]Tournament Admins and Event Managers[/cyan] hold full authority and will make the final conclusions on all match results and disputes.",
    "4. Prize pool distribution is awarded according to each specific event's rules and briefing, transferred directly via [green]UPI / Bank Transfer[/green] following result verification."
  ];
  const generalRules = parseRules(event.generalRules).length > 0 ? parseRules(event.generalRules) : defaultGeneralRules;

  const handleProceed = () => {
    if (!agreedToRules) return;
    sfx.playClick();
    onProceedToRegister(event.gameName, event.id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Dark Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={() => {
          sfx.playClick();
          onClose();
        }}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-[#0c0c10] border-0 sm:border sm:border-white/10 rounded-none sm:rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-10 overflow-hidden h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/[0.08] bg-[#09090b]/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#D71920]/15 border border-[#D71920]/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#D71920]" />
            </div>
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-tech text-[#ff4d4d] font-bold uppercase tracking-wider">
                  {event.gameName}
                </span>
                <span className="text-[10px] font-tech text-zinc-400 uppercase">
                  RULES & BRIEFING
                </span>
              </div>
              <h3 className="font-cinzel text-xs sm:text-base font-bold text-white uppercase truncate mt-0.5">
                {event.title}
              </h3>
            </div>
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

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-zinc-300 overscroll-contain">
          
          {/* Quick Tournament Specs Pill Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-black/60 border border-white/5 text-center">
            <div className="p-1">
              <span className="text-[9px] font-tech text-zinc-500 uppercase block">DISCIPLINE</span>
              <span className="font-cinzel text-xs sm:text-sm font-bold text-white">{event.gameName}</span>
            </div>
            <div className="p-1 border-l border-white/5">
              <span className="text-[9px] font-tech text-zinc-500 uppercase block">FORMAT</span>
              <span className="font-tech text-xs sm:text-sm font-bold text-zinc-200">{event.format}</span>
            </div>
            <div className="p-1 border-l border-white/5">
              <span className="text-[9px] font-tech text-zinc-500 uppercase block">MATCH SCHEDULE</span>
              <span className="font-tech text-xs sm:text-sm font-bold text-zinc-200">{event.date}</span>
            </div>
            <div className="p-1 border-l border-white/5">
              <span className="text-[9px] font-tech text-zinc-500 uppercase block">PRIZE POOL</span>
              <span className="font-bebas text-sm sm:text-base text-[#f5c464] tracking-wider leading-none block mt-0.5">
                ₹{(event.prizePool || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Description if present */}
          {event.description && (
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-zinc-300 leading-relaxed font-sans">
              <span className="text-[10px] font-tech uppercase text-[#D71920] font-bold block mb-1.5 tracking-wider">
                TOURNAMENT OVERVIEW:
              </span>
              <FormattedRuleText text={event.description} asParagraphs={true} />
            </div>
          )}

          {/* 1. Specific Event Rules */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-white/10">
              <FileText className="w-4 h-4 text-[#D71920]" />
              <h4 className="font-cinzel font-bold text-sm sm:text-base text-white uppercase tracking-wide">
                1. {event.gameName} SPECIFIC RULES & MATCH FORMAT
              </h4>
            </div>

            <div className="space-y-2 bg-black/40 p-3 sm:p-4 rounded-xl border border-white/5">
              {specificRules.length > 0 ? (
                specificRules.map((r, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] mt-2 shrink-0" />
                    <FormattedRuleText text={r} />
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400">
                  Standard tournament rules apply. No emulators, third-party scripts, or aim assist tools permitted.
                </p>
              )}
            </div>
          </div>

          {/* 2. BlackHawk General Organization Guidelines */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-white/10">
              <ShieldAlert className="w-4 h-4 text-[#D71920]" />
              <h4 className="font-cinzel font-bold text-sm sm:text-base text-white uppercase tracking-wide">
                2. BLACKHAWK GENERAL CODE OF CONDUCT & DISBURSEMENT
              </h4>
            </div>

            <div className="space-y-2 bg-black/40 p-3 sm:p-4 rounded-xl border border-white/5">
              {generalRules.map((gr, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500/80 mt-2 shrink-0" />
                  <FormattedRuleText text={gr} />
                </div>
              ))}
            </div>
          </div>

          {/* Mandatory Agreement Checkbox */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950/30 to-black border border-[#D71920]/40">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div 
                className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center shrink-0 border transition-all ${
                  agreedToRules 
                    ? 'bg-[#D71920] border-[#D71920] text-white shadow-sm' 
                    : 'bg-black/60 border-white/30 text-transparent hover:border-white/50'
                }`}
                onClick={() => {
                  sfx.playClick();
                  setAgreedToRules(!agreedToRules);
                }}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1" onClick={() => {
                sfx.playClick();
                setAgreedToRules(!agreedToRules);
              }}>
                <span className="text-xs sm:text-sm font-semibold text-white block leading-snug">
                  I have read and agree to follow the {event.gameName} tournament rules and the BlackHawk general code of conduct.
                </span>
                <span className="text-[10px] text-zinc-400 font-tech mt-0.5 block">
                  Violations will result in immediate disqualification and forfeiture of any prize earnings.
                </span>
              </div>
            </label>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-white/[0.08] bg-[#09090b] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.02] text-xs font-tech font-bold uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleProceed}
            disabled={!agreedToRules}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-full font-cinzel font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              agreedToRules
                ? 'bg-gradient-to-r from-[#D71920] to-[#b3141a] hover:from-[#e3262e] hover:to-[#c4161d] text-white shadow-[0_0_20px_rgba(215,25,32,0.4)] active:scale-95'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-60'
            }`}
          >
            <span>PROCEED TO REGISTRATION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
