import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Gamepad2,
  Copy,
  Check,
  Crown,
  Sparkles,
  Target,
  Users
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
  banner?: string;
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

// ─── Prestigious Esports Rank Crest Component (Proportionally Scaled) ───
const RankCrest: React.FC<{ rank?: number }> = ({ rank = 1 }) => {
  const isRank1 = rank === 1;
  const isRank2 = rank === 2;
  const isRank3 = rank === 3;

  const ribbonColor = isRank1 ? '#8B0000' : isRank2 ? '#1E293B' : isRank3 ? '#7C2D12' : '#1E1E24';
  const ribbonBorder = isRank1 ? '#DC2626' : isRank2 ? '#64748B' : isRank3 ? '#EA580C' : '#475569';

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-20 h-16 sm:w-22 sm:h-18 flex items-center justify-center filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
        <svg
          viewBox="0 0 160 140"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`goldGrad-${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isRank1 ? '#FFF385' : isRank2 ? '#FFFFFF' : isRank3 ? '#FED7AA' : '#E2E8F0'} />
              <stop offset="40%" stopColor={isRank1 ? '#F59E0B' : isRank2 ? '#CBD5E1' : isRank3 ? '#F97316' : '#94A3B8'} />
              <stop offset="100%" stopColor={isRank1 ? '#B45309' : isRank2 ? '#64748B' : isRank3 ? '#9A3412' : '#475569'} />
            </linearGradient>

            <linearGradient id={`medallionGrad-${rank}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isRank1 ? '#FBBF24' : isRank2 ? '#E2E8F0' : isRank3 ? '#FB923C' : '#94A3B8'} />
              <stop offset="100%" stopColor={isRank1 ? '#78350F' : isRank2 ? '#334155' : isRank3 ? '#7C2D12' : '#1E293B'} />
            </linearGradient>

            <linearGradient id={`ribbonGrad-${rank}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={ribbonColor} />
              <stop offset="100%" stopColor="#2A0505" />
            </linearGradient>

            <filter id={`crestGlow-${rank}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Golden Winged Laurels - Left Side */}
          <g filter={`url(#crestGlow-${rank})`}>
            <path d="M 60 68 C 45 56 30 42 22 22 C 28 36 42 54 60 68 Z" fill={`url(#goldGrad-${rank})`} />
            <path d="M 56 76 C 38 70 20 58 14 38 C 24 52 40 66 56 76 Z" fill={`url(#goldGrad-${rank})`} />
            <path d="M 55 84 C 36 83 18 76 12 58 C 22 70 38 80 55 84 Z" fill={`url(#goldGrad-${rank})`} />
            <path d="M 58 92 C 42 94 26 90 18 76 C 28 86 44 92 58 92 Z" fill={`url(#goldGrad-${rank})`} />
            <path d="M 62 100 C 48 104 34 102 28 92 C 38 98 52 101 62 100 Z" fill={`url(#goldGrad-${rank})`} />
          </g>

          {/* Golden Winged Laurels - Right Side */}
          <g filter={`url(#crestGlow-${rank})`}>
            <path d="M 100 68 C 115 56 130 42 138 22 C 132 36 118 54 100 68 Z" fill={`url(#goldGrad-${rank})`} />
            <path d="M 104 76 C 122 70 140 58 146 38 C 136 52 120 66 104 76 Z" fill={`url(#goldGrad-${rank})`} />
            <path d="M 105 84 C 124 83 142 76 148 58 C 138 70 122 80 105 84 Z" fill={`url(#goldGrad-${rank})`} />
            <path d="M 102 92 C 118 94 134 90 142 76 C 132 86 116 92 102 92 Z" fill={`url(#goldGrad-${rank})`} />
            <path d="M 98 100 C 112 104 126 102 132 92 C 122 98 108 101 98 100 Z" fill={`url(#goldGrad-${rank})`} />
          </g>

          {/* Royal Crown on Top */}
          <g filter={`url(#crestGlow-${rank})`}>
            <path
              d="M 62 36 L 66 18 L 73 26 L 80 12 L 87 26 L 94 18 L 98 36 Z"
              fill={`url(#goldGrad-${rank})`}
              stroke={isRank1 ? '#FDE68A' : '#F1F5F9'}
              strokeWidth="1.2"
            />
            {/* Crown Base Band */}
            <rect x="62" y="34" width="36" height="5" rx="1.5" fill={`url(#goldGrad-${rank})`} />
            {/* Crown Jewels */}
            <circle cx="80" cy="12" r="2.2" fill="#DC2626" />
            <circle cx="66" cy="18" r="1.8" fill="#2563EB" />
            <circle cx="94" cy="18" r="1.8" fill="#2563EB" />
            <circle cx="72" cy="36.5" r="1.3" fill="#FFFFFF" />
            <circle cx="80" cy="36.5" r="1.6" fill="#DC2626" />
            <circle cx="88" cy="36.5" r="1.3" fill="#FFFFFF" />
          </g>

          {/* Central Medallion Outer Bezel */}
          <circle
            cx="80"
            cy="74"
            r="30"
            fill="#0F0F14"
            stroke={`url(#goldGrad-${rank})`}
            strokeWidth="3.5"
            filter={`url(#crestGlow-${rank})`}
          />

          {/* Medallion Inner Ring */}
          <circle
            cx="80"
            cy="74"
            r="24"
            fill={`url(#medallionGrad-${rank})`}
            stroke={isRank1 ? '#FDE68A' : '#E2E8F0'}
            strokeWidth="1"
          />

          {/* Subtle Inner Glow Rim */}
          <circle cx="80" cy="74" r="22" fill="#181318" fillOpacity="0.45" />

          {/* Medallion Rank Number */}
          <text
            x="80"
            y="84"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Cinzel, serif, Georgia"
            fontWeight="900"
            fontSize={rank && rank > 99 ? '18' : '26'}
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.85))"
          >
            {rank || 1}
          </text>

          {/* Draped Red Ribbon Banner underneath */}
          <g>
            {/* Left Ribbon Tail */}
            <path
              d="M 50 98 L 38 106 L 30 100 L 38 116 L 54 108 Z"
              fill={`url(#ribbonGrad-${rank})`}
              stroke={ribbonBorder}
              strokeWidth="0.8"
            />
            {/* Right Ribbon Tail */}
            <path
              d="M 110 98 L 122 106 L 130 100 L 122 116 L 106 108 Z"
              fill={`url(#ribbonGrad-${rank})`}
              stroke={ribbonBorder}
              strokeWidth="0.8"
            />
            {/* Main Center Ribbon Arc */}
            <path
              d="M 42 96 C 58 107 102 107 118 96 L 114 109 C 100 119 60 119 46 109 Z"
              fill={`url(#ribbonGrad-${rank})`}
              stroke={ribbonBorder}
              strokeWidth="1.2"
            />
          </g>
        </svg>
      </div>

      {/* Clean Compact Rank Label */}
      <span
        className={`font-cinzel text-xs sm:text-sm font-black tracking-wider uppercase mt-0.5 ${
          isRank1
            ? 'text-[#f5c464] drop-shadow-[0_2px_8px_rgba(245,196,100,0.5)]'
            : isRank2
            ? 'text-slate-200 drop-shadow-[0_2px_6px_rgba(226,232,240,0.5)]'
            : isRank3
            ? 'text-amber-500 drop-shadow-[0_2px_6px_rgba(245,158,11,0.5)]'
            : 'text-zinc-300'
        }`}
      >
        RANK #{rank || '—'}
      </span>
    </div>
  );
};

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ player, onClose }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!player) return;

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
  }, [player, onClose]);

  if (!player) return null;
  if (typeof document === 'undefined') return null;

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

  const avatarUrl = player.avatar || `https://unavatar.io/discord/${encodeURIComponent(player.gamerTag)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(player.gamerTag)}%26backgroundColor%3D09090b`;

  // ─── Banner is dynamically based on their Avatar ───
  const bannerImage = player.banner || player.avatar || avatarUrl;

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

      {/* ─── Compact Profile Dialog Card ─── */}
      <div 
        className="relative w-full max-w-[420px] sm:max-w-[430px] bg-[#0a0b10] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] animate-in zoom-in-95 duration-200 z-10 my-auto max-h-[92vh] overflow-y-auto overflow-x-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Top Cinematic Banner (Derived from Avatar) ─── */}
        <div className="relative h-28 sm:h-32 w-full overflow-hidden shrink-0 bg-zinc-950">
          <img
            src={bannerImage}
            alt={`${player.gamerTag} banner`}
            className="w-full h-full object-cover object-center scale-110 filter blur-[1px] brightness-[0.7] contrast-[1.1]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/minecraft_sunset_banner.jpg';
            }}
          />

          {/* Smooth Fade Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0a0b10]" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0a0b10] via-[#0a0b10]/80 to-transparent" />

          {/* Header Controls (Game Pill & Close Button) */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-white font-tech text-[10px] font-bold uppercase tracking-wider shadow-md">
              <Gamepad2 className="w-3 h-3 text-amber-400" />
              <span>{player.game || 'FREE FIRE'}</span>
            </div>

            <button
              onClick={() => {
                sfx.playClick();
                onClose();
              }}
              className="w-7 h-7 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-zinc-400 hover:text-white hover:border-white/30 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-md"
              aria-label="Close modal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ─── Avatar & Standing Row (Overlaps Banner Seamlessly) ─── */}
        <div className="px-4 sm:px-5 relative -mt-10 sm:-mt-12 mb-2.5 flex items-end justify-between z-10">
          {/* Avatar with Golden Glowing Border */}
          <div className="relative">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-[#f59e0b] bg-zinc-900 shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center">
              <img
                src={avatarUrl}
                alt={player.gamerTag}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.gamerTag)}&backgroundColor=09090b`;
                }}
              />
            </div>

            {/* Golden Crown Badge on Avatar */}
            {player.rank === 1 && (
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 flex items-center justify-center shadow-[0_2px_8px_rgba(245,158,11,0.6)] border border-amber-200/70 z-20">
                <Crown className="w-3.5 h-3.5 text-zinc-950 fill-zinc-950" />
              </div>
            )}
          </div>

          {/* Right: Winged Laurel Crest & Rank */}
          <div className="shrink-0 -mb-1">
            <RankCrest rank={player.rank} />
          </div>
        </div>

        {/* ─── Player Name & Verified Badge ─── */}
        <div className="px-4 sm:px-5 mb-2.5">
          <div className="flex items-center gap-1.5">
            <h3 className="font-sans text-lg sm:text-xl font-black text-white tracking-wide truncate">
              {player.playerName || player.gamerTag}
            </h3>
            <div 
              className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)] shrink-0" 
              title="Verified Tournament Player"
            >
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          </div>
          {effectiveIgn && effectiveIgn.toLowerCase() !== (player.playerName || player.gamerTag).toLowerCase() && (
            <span className="text-[11px] font-tech text-zinc-400 block mt-0.5">
              In-Game Alias: <strong className="text-zinc-200">&quot;{effectiveIgn}&quot;</strong>
            </span>
          )}
        </div>

        {/* ─── Compact Credentials Bar (Discord, FF UID, ID) ─── */}
        <div className="px-4 sm:px-5 mb-3 flex flex-wrap items-center gap-1.5 font-tech text-[11px]">
          {/* Discord Username */}
          <button
            type="button"
            onClick={() => handleCopy(effectiveDiscordUser, 'dcUser')}
            className="px-2.5 py-1 rounded-lg bg-[#5865F2]/15 hover:bg-[#5865F2]/25 border border-[#5865F2]/30 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
            title="Copy Discord Username"
          >
            <svg className="w-3 h-3 text-[#5865F2] shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span className="font-semibold text-zinc-100">@{effectiveDiscordUser}</span>
            {copiedField === 'dcUser' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400 group-hover:text-white transition-colors" />}
          </button>

          {/* Free Fire UID / Game UID */}
          {effectiveFfUid && (
            <button
              type="button"
              onClick={() => handleCopy(effectiveFfUid, 'ffUid')}
              className="px-2.5 py-1 rounded-lg bg-red-950/30 hover:bg-red-900/40 border border-red-500/40 text-red-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
              title="Copy Game UID"
            >
              <div className="w-3 h-3 rounded-full border border-red-400/60 flex items-center justify-center shrink-0">
                <Target className="w-2 h-2 text-red-400" />
              </div>
              <span className="font-bold text-red-400">FF UID:</span>
              <span className="font-mono text-white">{effectiveFfUid}</span>
              {copiedField === 'ffUid' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-red-400/60 group-hover:text-red-300 transition-colors" />}
            </button>
          )}

          {/* Player System ID */}
          {effectiveId && (
            <button
              type="button"
              onClick={() => handleCopy(effectiveId, 'id')}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
              title="Copy Player ID"
            >
              <span className="px-1 py-0.5 rounded bg-white/10 text-[9px] font-bold text-zinc-400">ID</span>
              <span className="font-mono text-zinc-200 truncate max-w-[110px]">{effectiveId}</span>
              {copiedField === 'id' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />}
            </button>
          )}
        </div>

        {/* ─── Featured League Points & Combat Record Card ─── */}
        <div className="px-4 sm:px-5 mb-2.5">
          <div className="relative rounded-2xl border border-amber-500/35 bg-gradient-to-r from-[#141210]/95 via-[#0c0d12]/95 to-[#120e10]/95 p-3 sm:p-3.5 shadow-[0_0_20px_rgba(245,158,11,0.06)] overflow-hidden">
            {/* Background Watermark silhouette */}
            <Crown className="absolute right-1/4 top-1/2 -translate-y-1/2 w-24 h-24 text-amber-500/[0.04] pointer-events-none select-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Left Side: League Points */}
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-tech text-[10px] tracking-wider text-zinc-400 font-bold uppercase">
                    <span className="text-amber-400">L</span>EAGUE POINTS
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-none">
                    {totalPoints}
                  </span>
                  <span className="font-tech text-[11px] text-zinc-500 font-bold tracking-wider">
                    PTS
                  </span>
                </div>
              </div>

              {/* Right Side: Combat Record */}
              <div className="text-left sm:text-right">
                <span className="font-tech text-[9px] text-zinc-400 uppercase tracking-widest font-bold block mb-1.5">
                  COMBAT RECORD
                </span>

                <div className="flex items-center sm:justify-end gap-3 sm:gap-4">
                  {/* Wins */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Target className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-white text-sm leading-none">
                        {wins}
                      </span>
                      <span className="block text-[9px] font-tech text-zinc-400 mt-0.5">
                        Wins
                      </span>
                    </div>
                  </div>

                  {/* Matches */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
                      <Users className="w-3 h-3 text-sky-400" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-white text-sm leading-none">
                        {matches}
                      </span>
                      <span className="block text-[9px] font-tech text-zinc-400 mt-0.5">
                        Matches
                      </span>
                    </div>
                  </div>

                  {/* Kills */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="9" cy="10" r="1.5" fill="#18181b" />
                        <circle cx="15" cy="10" r="1.5" fill="#18181b" />
                        <path d="M12 2a8 8 0 0 0-8 8c0 3 1.5 5.5 3 6.5V19h10v-2.5c1.5-1 3-3.5 3-6.5a8 8 0 0 0-8-8zm-2 15v-1h4v1h-4z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-white text-sm leading-none">
                        {kills}
                      </span>
                      <span className="block text-[9px] font-tech text-zinc-400 mt-0.5">
                        Kills
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4-Column Stat Cards Grid (Placement, Kill Score, Challenges, Participation) ─── */}
        <div className="px-4 sm:px-5 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {/* 1. Placement */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#101118]/80 border border-white/5 hover:border-red-500/30 flex flex-col items-center justify-center text-center transition-all group shadow-[0_2px_12px_rgba(239,68,68,0.03)]">
              <div className="w-6 h-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Target className="w-3 h-3 text-red-500" />
              </div>
              <span className="text-[10px] font-tech text-zinc-400 tracking-wider">
                Placement
              </span>
              <strong className="text-white font-bold text-xs mt-0.5">
                {placementPoints} pts
              </strong>
            </div>

            {/* 2. Kill Score */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#101118]/80 border border-white/5 hover:border-amber-500/30 flex flex-col items-center justify-center text-center transition-all group shadow-[0_2px_12px_rgba(245,158,11,0.03)]">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <span className="text-[10px] font-tech text-zinc-400 tracking-wider">
                Kill Score
              </span>
              <strong className="text-white font-bold text-xs mt-0.5">
                {killPoints} pts
              </strong>
            </div>

            {/* 3. Challenges */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#101118]/80 border border-white/5 hover:border-purple-500/30 flex flex-col items-center justify-center text-center transition-all group shadow-[0_2px_12px_rgba(168,85,247,0.03)]">
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-3 h-3 text-purple-400" />
              </div>
              <span className="text-[10px] font-tech text-zinc-400 tracking-wider">
                Challenges
              </span>
              <strong className="text-white font-bold text-xs mt-0.5">
                {challengeBonus} pts
              </strong>
            </div>

            {/* 4. Participation */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#101118]/80 border border-white/5 hover:border-sky-500/30 flex flex-col items-center justify-center text-center transition-all group shadow-[0_2px_12px_rgba(14,165,233,0.03)]">
              <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Users className="w-3 h-3 text-sky-400" />
              </div>
              <span className="text-[10px] font-tech text-zinc-400 tracking-wider">
                Participation
              </span>
              <strong className="text-white font-bold text-xs mt-0.5">
                {participationPoints} pts
              </strong>
            </div>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
