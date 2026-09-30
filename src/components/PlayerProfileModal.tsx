import React from 'react';
import { 
  X, 
  Trophy, 
  Award, 
  Flame, 
  ShieldCheck, 
  Gamepad2
} from 'lucide-react';
import { sfx } from '../utils/sfx';

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
  teamName?: string;
  updatedAt?: string;
}

interface PlayerProfileModalProps {
  player: PlayerProfileData | null;
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ player, onClose }) => {
  if (!player) return null;

  const winRate = player.matches > 0 ? Math.round((player.wins / player.matches) * 100) : 0;
  const avgPtsPerMatch = player.matches > 0 ? (player.points / player.matches).toFixed(1) : player.points.toString();
  const avatarUrl = player.avatar || `https://unavatar.io/discord/${encodeURIComponent(player.gamerTag)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(player.gamerTag)}%26backgroundColor%3D09090b`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#0d0d11] border border-white/15 rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner Background */}
        <div className="relative h-28 bg-gradient-to-r from-[#200a0c] via-[#15090b] to-[#0a0a0f] border-b border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(215,25,32,0.35),transparent_70%)]" />
          
          {/* Close Button */}
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-white/15 text-zinc-400 hover:text-white hover:border-white/30 flex items-center justify-center transition-all cursor-pointer z-20"
            aria-label="Close profile modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Game Discipline Tag */}
          <div className="absolute top-3 left-4 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/70 border border-white/10 text-zinc-300 font-tech text-[10px] font-bold uppercase tracking-wider">
            <Gamepad2 className="w-3 h-3 text-[#D71920]" />
            <span>{player.game || 'ALL DISCIPLINES'}</span>
          </div>
        </div>

        {/* Profile Avatar & Identity */}
        <div className="relative px-6 pb-6 pt-0">
          <div className="flex items-end justify-between -mt-12 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 border-[#D71920] bg-black shadow-[0_0_25px_rgba(215,25,32,0.4)] flex items-center justify-center">
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
                <span className="absolute -top-2 -right-2 text-xl" title="Rank #1 Champion">
                  👑
                </span>
              )}
            </div>

            {/* Rank Position Badge */}
            <div className="text-right">
              <span className="text-[10px] font-tech text-zinc-400 font-bold uppercase tracking-widest block">
                LEADERBOARD STANDING
              </span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className={`font-cinzel text-xl sm:text-2xl font-black ${
                  player.rank === 1 ? 'text-[#f5c464]' : player.rank === 2 ? 'text-zinc-200' : player.rank === 3 ? 'text-amber-600' : 'text-zinc-300'
                }`}>
                  RANK #{player.rank || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Player Name & Tag */}
          <div className="space-y-1 mb-5">
            <div className="flex items-center gap-2">
              <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wide">
                {player.gamerTag}
              </h3>
              <span title="Verified BlackHawk Athlete">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans flex items-center gap-2">
              <span>{player.playerName || player.teamName || 'Athlete'}</span>
              {player.discordUsername && (
                <>
                  <span>•</span>
                  <span className="text-indigo-400 font-mono">@{player.discordUsername}</span>
                </>
              )}
            </p>
          </div>

          {/* Key Combat Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {/* Total Points */}
            <div className="p-3 rounded-xl bg-gradient-to-b from-[#180a0c] to-[#0f090a] border border-red-500/25 text-center">
              <span className="text-[9.5px] font-tech text-zinc-400 uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3 text-[#D71920]" />
                <span>TOTAL POINTS</span>
              </span>
              <p className="font-bebas text-2xl sm:text-3xl text-white tracking-wider mt-0.5 drop-shadow-[0_0_10px_rgba(215,25,32,0.4)]">
                {player.points}
              </p>
            </div>

            {/* Total Wins */}
            <div className="p-3 rounded-xl bg-[#121216] border border-white/10 text-center">
              <span className="text-[9.5px] font-tech text-zinc-400 uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                <Award className="w-3 h-3 text-emerald-400" />
                <span>WINS (WWCD)</span>
              </span>
              <p className="font-bebas text-2xl sm:text-3xl text-emerald-400 tracking-wider mt-0.5">
                {player.wins}
              </p>
            </div>

            {/* Total Kills */}
            <div className="p-3 rounded-xl bg-[#121216] border border-white/10 text-center">
              <span className="text-[9.5px] font-tech text-zinc-400 uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-[#ff5555]" />
                <span>TOTAL KILLS</span>
              </span>
              <p className="font-bebas text-2xl sm:text-3xl text-white tracking-wider mt-0.5">
                {player.score || 0}
              </p>
            </div>
          </div>

          {/* Detailed Statistics Row */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/50 border border-white/10 text-xs font-mono mb-4">
            <div className="text-center">
              <span className="text-[9px] text-zinc-500 block uppercase font-tech">Matches Played</span>
              <strong className="text-zinc-200 text-sm">{player.matches}</strong>
            </div>
            <div className="text-center border-x border-white/10">
              <span className="text-[9px] text-zinc-500 block uppercase font-tech">Win Rate</span>
              <strong className="text-emerald-400 text-sm">{winRate}%</strong>
            </div>
            <div className="text-center">
              <span className="text-[9px] text-zinc-500 block uppercase font-tech">Avg Pts / Match</span>
              <strong className="text-white text-sm">{avgPtsPerMatch}</strong>
            </div>
          </div>

          {/* Performance & Accolades Badge Row */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-tech text-zinc-400 font-bold uppercase tracking-wider block">
              BLACKHAWK TOURNAMENT ACCOLADES
            </span>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {player.rank === 1 && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1">
                  👑 Grand Champion
                </span>
              )}
              {player.wins >= 3 && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1">
                  🏆 Multi-Match Winner
                </span>
              )}
              {(player.score || 0) >= 10 && (
                <span className="px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 font-bold flex items-center gap-1">
                  ⚡ Eliminator (10+ Kills)
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#D71920]" />
                <span>Verified Athlete</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
