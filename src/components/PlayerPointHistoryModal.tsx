import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { tournamentStore } from '../lib/tournamentStore';
import { X, Trophy, ShieldCheck, CheckCircle } from 'lucide-react';
import { sfx } from '../utils/sfx';

interface PlayerPointHistoryModalProps {
  playerId: string | null;
  onClose: () => void;
}

export const PlayerPointHistoryModal: React.FC<PlayerPointHistoryModalProps> = ({ playerId, onClose }) => {
  useEffect(() => {
    if (!playerId) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sfx.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playerId, onClose]);

  if (!playerId) return null;
  if (typeof document === 'undefined') return null;

  const data = tournamentStore.getPlayerPointHistory(playerId);
  if (!data) return null;

  const { player, totalPoints, history } = data;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* ─── Fullscreen Backdrop Overlay ─── */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200 cursor-pointer"
        onClick={() => {
          sfx.playClick();
          onClose();
        }}
        aria-hidden="true"
      />

      {/* ─── Modal Dialog Card ─── */}
      <div 
        className="bg-[#0c0c12] border-2 border-red-600/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(225,6,0,0.3)] relative z-10 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-red-950/40 via-black to-black">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#ff2a2a] animate-pulse"></span>
              <span className="font-tech text-xs text-[#ff4d4d] uppercase tracking-widest font-bold">
                AUDITED POINT LEDGER
              </span>
            </div>
            <h3 className="font-display font-black text-3xl text-white uppercase">
              {player.fullName}
            </h3>
            <span className="font-mono text-sm text-zinc-400">@{player.gamerTag} • Discord: {player.discordUsername}</span>
          </div>

          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Points Summary Callout */}
        <div className="p-6 bg-black/40 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-950 flex items-center justify-center shadow-[0_0_15px_rgba(225,6,0,0.6)]">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-tech text-zinc-400 uppercase tracking-widest block">
                CUMULATIVE LEAGUE POINTS
              </span>
              <span className="font-display font-black text-3xl text-white text-glow-red">
                {totalPoints} <span className="text-sm font-tech text-zinc-400 font-normal">PTS TOTAL</span>
              </span>
            </div>
          </div>

          <div className="text-right font-tech text-xs">
            <span className="text-zinc-400 block uppercase">EVENT PARTICIPATION</span>
            <span className="font-bold text-white uppercase">{history.length} ROUNDS RECORDED</span>
          </div>
        </div>

        {/* Detailed Week-by-Week Breakdown */}
        <div className="p-6 space-y-4">
          <span className="font-tech text-xs text-zinc-400 uppercase tracking-widest block font-bold">
            TRANSPARENT SCORING BREAKDOWN
          </span>

          {history.length === 0 ? (
            <div className="p-6 rounded-xl bg-white/5 border border-white/5 text-center text-zinc-400 font-tech text-sm uppercase">
              No published match results yet for this player.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-xl bg-[#111118] border border-white/10 hover:border-red-600/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-950/60 text-[#ff4d4d] border border-red-600/30 text-[10px] font-tech font-bold uppercase tracking-wider">
                        {record.week}
                      </span>
                      <span className="font-display font-black text-lg text-white uppercase">
                        {record.gameName}
                      </span>
                    </div>

                    <span className="font-display font-black text-xl text-[#ff2a2a] text-glow-red">
                      +{record.totalPoints} PTS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-xs font-tech text-zinc-400">
                    <div>
                      <span className="block text-[10px] uppercase">PLACEMENT:</span>
                      <span className="text-white font-bold">
                        {record.placement ? `${record.placement} Place (${record.basePoints} pts)` : 'Unranked'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase">PARTICIPATION:</span>
                      <span className="text-white font-bold">
                        {record.participationPoints > 0 ? `+${record.participationPoints} pt` : 'None'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase">CHALLENGE BONUS:</span>
                      <span className="text-white font-bold">
                        {record.challengeBonus > 0 ? `+${record.challengeBonus} pts` : 'None'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase">RISING STAR:</span>
                      <span className="text-white font-bold">
                        {record.risingStarBonus > 0 ? `+${record.risingStarBonus} pts` : 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] font-sans text-zinc-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    <span>{record.explanation}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/60 border-t border-white/10 flex items-center justify-between text-xs font-tech text-zinc-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#ff2a2a]" />
            DERIVED FROM PUBLISHED TOURNAMENT RESULTS
          </span>
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white font-tech font-bold uppercase transition-colors"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

