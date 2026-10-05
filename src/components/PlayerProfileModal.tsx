import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Gamepad2,
  Copy,
  Check,
  Crown,
  Sparkles,
  Target
} from 'lucide-react';
import { sfx } from '../utils/sfx';
import { tournamentStore } from '../lib/tournamentStore';

export interface PlayerProfileData {
  id: string;
  playerId?: string;
  playerName: string;
  gamerTag: string;
  game: string;
  avatar?: string;
  rank?: number;
  points: number;
  wins: number;
  matches: number;
  score: number; // Kills / Score
  status?: string;
  discordUsername?: string;
  discordUserId?: string;
  freeFireUid?: string;
  inGameName?: string;
  placementPoints?: number;
  killPoints?: number;
  challengeBonus?: number;
  risingStarBonus?: number;
  participationPoints?: number;
  totalPoints?: number;
  teamName?: string;
  updatedAt?: string;
}

interface PlayerProfileModalProps {
  player: PlayerProfileData | null;
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ player, onClose }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!player) return null;

  // Resolve credentials with fallback to store if needed
  const cachedPlayer = tournamentStore.getPlayers().find(p => 
    (p.gamerTag && p.gamerTag.toLowerCase() === player.gamerTag.toLowerCase()) || 
    p.id === player.id || 
    p.id === player.playerId
  );

  const cachedReg = tournamentStore.getRegistrations().find(r => 
    (r.gamerTag && r.gamerTag.toLowerCase() === player.gamerTag.toLowerCase()) || 
    r.playerId === player.id || 
    r.playerId === player.playerId
  );

  const details = cachedReg?.gameSpecificDetails;
  const regFfUid = details ? (details['Free Fire UID'] || details['UID'] || details['In-Game UID']) : null;
  const regIgn = details ? (details['In-Game Name'] || details['IGN']) : null;
  const regDcId = details ? (details['Discord User ID'] || (details.UID && String(details.UID).length >= 17 ? String(details.UID) : null)) : null;

  const effectiveFfUid = player.freeFireUid || cachedPlayer?.freeFireUid || regFfUid || null;
  const effectiveDiscordId = player.discordUserId || cachedPlayer?.discordUserId || regDcId || null;
  const effectiveDiscordUser = (player.discordUsername && player.discordUsername !== 'N/A')
    ? player.discordUsername
    : cachedPlayer?.discordUsername || cachedReg?.discordUsername || player.gamerTag;
  const effectiveIgn = player.inGameName || cachedPlayer?.inGameName || regIgn || null;
  const effectiveId = player.playerId || player.id || effectiveDiscordId;

  const winRate = player.matches > 0 ? Math.round((player.wins / player.matches) * 100) : 0;
  const avgPtsPerMatch = player.matches > 0 ? (player.points / player.matches).toFixed(1) : player.points.toString();
  const avatarUrl = player.avatar || `https://unavatar.io/discord/${encodeURIComponent(player.gamerTag)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(player.gamerTag)}%26backgroundColor%3D09090b`;

  // Total points and calculable point components
  const totalPoints = Number(player.totalPoints || player.points || 0);
  const wins = Number(player.wins || 0);
  const matches = Number(player.matches || 0);
  const kills = Number(player.score || 0);

  const placementPoints = player.placementPoints !== undefined ? Number(player.placementPoints) : (wins * 10);
  const killPoints = player.killPoints !== undefined ? Number(player.killPoints) : kills;
  const participationPoints = player.participationPoints !== undefined ? Number(player.participationPoints) : Math.max(0, matches > wins ? (matches - wins) : 0);
  const challengeBonus = player.challengeBonus !== undefined ? Number(player.challengeBonus) : Math.max(0, totalPoints - placementPoints - killPoints - participationPoints);

  const handleCopy = (text: string, fieldName: string) => {
    sfx.playClick();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#0d0d12] border border-white/15 rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Top Banner ─── */}
        <div className="relative h-20 bg-gradient-to-r from-red-950/80 via-[#180a0c] to-[#0d0d12] border-b border-white/10 px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/70 border border-white/10 text-white font-tech text-[10px] font-bold uppercase tracking-wider">
            <Gamepad2 className="w-3 h-3 text-[#ff3333]" />
            <span>{player.game || 'FREE FIRE'}</span>
          </div>

          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-black/70 border border-white/15 text-zinc-400 hover:text-white hover:border-white/30 flex items-center justify-center transition-all cursor-pointer z-20"
            aria-label="Close modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ─── Profile Content ─── */}
        <div className="px-5 pb-5 pt-0">
          
          {/* Avatar & Standing Row */}
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="relative">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-red-500 bg-zinc-900 shadow-[0_0_20px_rgba(225,6,0,0.4)] flex items-center justify-center">
                <img
                  src={avatarUrl}
                  alt={player.gamerTag}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.gamerTag)}&backgroundColor=09090b`;
                  }}
                />
              </div>
              {player.rank === 1 && (
                <div className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-amber-500 text-black shadow-md">
                  <Crown className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Standing */}
            <div className="text-right">
              <span className="text-[9px] font-tech text-zinc-400 uppercase tracking-widest block font-bold">
                LEADERBOARD
              </span>
              <span className={`font-cinzel text-lg sm:text-xl font-black ${
                player.rank === 1 ? 'text-[#f5c464] text-glow-gold' : player.rank === 2 ? 'text-slate-200' : player.rank === 3 ? 'text-amber-500' : 'text-zinc-300'
              }`}>
                {player.rank === 1 ? '🥇 RANK #1' : player.rank === 2 ? '🥈 RANK #2' : player.rank === 3 ? '🥉 RANK #3' : `RANK #${player.rank || '—'}`}
              </span>
            </div>
          </div>

          {/* Player Name */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5">
              <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white tracking-wide">
                {player.gamerTag}
              </h3>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            {effectiveIgn && effectiveIgn.toLowerCase() !== player.gamerTag.toLowerCase() && (
              <span className="text-[11px] font-tech text-zinc-400 block mt-0.5">
                In-Game Alias: <strong className="text-zinc-200">&quot;{effectiveIgn}&quot;</strong>
              </span>
            )}
          </div>

          {/* ─── Compact Credentials Bar (Discord, FF UID, ID) ─── */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3.5 font-tech text-[10px]">
            {/* Discord Username */}
            <button
              type="button"
              onClick={() => handleCopy(effectiveDiscordUser, 'dcUser')}
              className="px-2.5 py-1 rounded-lg bg-[#5865F2]/15 hover:bg-[#5865F2]/30 border border-[#5865F2]/30 text-[#8ea1e1] hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copy Discord Username"
            >
              <span className="font-bold">Discord:</span>
              <span className="text-white">@{effectiveDiscordUser}</span>
              {copiedField === 'dcUser' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 opacity-60" />}
            </button>

            {/* Free Fire UID */}
            {effectiveFfUid && (
              <button
                type="button"
                onClick={() => handleCopy(effectiveFfUid, 'ffUid')}
                className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                title="Copy Free Fire UID"
              >
                <Target className="w-3 h-3 text-[#ff3333]" />
                <span className="font-bold">FF UID:</span>
                <span className="text-white font-mono">{effectiveFfUid}</span>
                {copiedField === 'ffUid' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 opacity-60" />}
              </button>
            )}

            {/* ID */}
            {effectiveId && (
              <button
                type="button"
                onClick={() => handleCopy(effectiveId, 'id')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                title="Copy ID"
              >
                <span className="font-bold">ID:</span>
                <span className="text-zinc-200 font-mono truncate max-w-[120px]">{effectiveId}</span>
                {copiedField === 'id' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 opacity-60" />}
              </button>
            )}
          </div>

          {/* ─── Total Points & Combat Record Card ─── */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/40 via-[#14080a] to-black border border-red-500/25 mb-3 flex items-center justify-between">
            <div>
              <span className="font-tech text-[9px] uppercase tracking-widest text-zinc-400 font-bold block">
                TOTAL LEAGUE POINTS
              </span>
              <span className="font-display font-black text-2xl sm:text-3xl text-white text-glow-red">
                {totalPoints} <span className="text-xs font-tech text-zinc-400 font-normal">PTS</span>
              </span>
            </div>

            <div className="text-right font-tech">
              <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold block mb-0.5">
                COMBAT RECORD
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-400 font-bold">{wins} Wins</span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-300">{matches} Matches</span>
                <span className="text-zinc-500">•</span>
                <span className="text-[#ff5555] font-bold">{kills} Kills</span>
              </div>
            </div>
          </div>

          {/* ─── Calculable Points Breakdown (Clean 2x2 Grid) ─── */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-tech text-[10px] text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                POINTS BREAKDOWN
              </span>
              <span className="text-[9px] font-tech text-zinc-500 uppercase">
                Official Rules
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 font-tech text-[10px]">
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span className="text-zinc-400">🎯 Placement</span>
                <strong className="text-white font-bold">{placementPoints} pts</strong>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span className="text-zinc-400">⚔️ Kill Score</span>
                <strong className="text-white font-bold">{killPoints} pts</strong>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span className="text-zinc-400">🌟 Challenges</span>
                <strong className="text-white font-bold">{challengeBonus} pts</strong>
              </div>
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <span className="text-zinc-400">🎮 Participation</span>
                <strong className="text-white font-bold">{participationPoints} pts</strong>
              </div>
            </div>
            
            <p className="text-[9px] font-tech text-zinc-500 pt-0.5">
              1st: 10pts • 2nd: 7pts • 3rd: 5pts • 4-5th: 3pts • Kills: 1pt/frag • Challenges: +3pts
            </p>
          </div>

          {/* ─── Combat Statistics Footer ─── */}
          <div className="grid grid-cols-3 gap-2 text-center font-tech text-[10px] text-zinc-400 pt-2 border-t border-white/5">
            <div>
              <span>Matches: </span>
              <strong className="text-white">{matches}</strong>
            </div>
            <div className="border-x border-white/10">
              <span>Win Rate: </span>
              <strong className="text-emerald-400">{winRate}%</strong>
            </div>
            <div>
              <span>Avg Pts: </span>
              <strong className="text-white">{avgPtsPerMatch}</strong>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
