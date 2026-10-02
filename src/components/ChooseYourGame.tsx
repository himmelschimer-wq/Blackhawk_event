import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Gamepad2, Calendar } from 'lucide-react';
import { sfx } from '../utils/sfx';

import { safeFetchJson } from '../lib/apiHelper';

interface ChooseYourGameProps {
  onSelectGame: (gameName: string) => void;
  onViewEventsForGame?: (gameName: string) => void;
  selectedGame?: string;
}

export interface DBGame {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  category?: string;
  defaultPrizePool?: number;
  format?: string;
  active?: number | boolean;
}

export const ChooseYourGame: React.FC<ChooseYourGameProps> = ({ 
  onSelectGame, 
  onViewEventsForGame,
  selectedGame 
}) => {
  const [games, setGames] = useState<DBGame[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGames = async () => {
    try {
      const data = await safeFetchJson<DBGame[]>('/api/games', [], 'games');
      if (Array.isArray(data)) {
        // Strict filter: only show games that are active (1 or true)
        const activeGames = data.filter(g => g.active === 1 || g.active === true);
        setGames(activeGames);
      }
    } catch (err) {
      console.warn('Failed to load games:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  return (
    <section id="games" className="py-7 sm:py-9 bg-[#080808] border-b border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-950/30 border border-red-500/25 text-[#ff4d4d] font-tech text-[9px] tracking-wider uppercase mb-1.5">
              <Gamepad2 className="w-2.5 h-2.5" />
              <span>COMMUNITY TITLES</span>
            </div>
            <h2 className="font-cinzel text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#f2f2f4]">
              CHOOSE YOUR <span className="text-[#D71920]">GAME</span>
            </h2>
            <p className="text-zinc-400 text-[11px] sm:text-xs font-sans mt-0.5">
              Pick a game title to filter events and view custom rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.18em] text-[#71717a] uppercase hidden sm:inline">
              CLICK TO BROWSE EVENTS
            </span>
            <div className="flex items-center gap-1">
              <button
                className="w-6 h-6 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                aria-label="Previous games"
                onClick={() => sfx.playClick()}
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                className="w-6 h-6 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                aria-label="Next games"
                onClick={() => sfx.playClick()}
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Empty State from Database */}
        {!loading && games.length === 0 && (
          <div className="py-10 text-center rounded-xl border border-white/5 bg-[#0c0c0e]">
            <Gamepad2 className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="font-cinzel text-sm font-bold text-zinc-400">NO ACTIVE GAMES AVAILABLE</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">Community games will appear here once activated.</p>
          </div>
        )}

        {/* Sleek Compact Game Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {games.map((game) => {
            const isSelected = selectedGame && selectedGame.toUpperCase() === game.name.toUpperCase();
            return (
              <div
                key={game.id}
                onClick={() => {
                  sfx.playClick();
                  if (onViewEventsForGame) {
                    onViewEventsForGame(game.name);
                  } else {
                    onSelectGame(game.name);
                  }
                }}
                onMouseEnter={() => sfx.playHover()}
                className={`group relative h-[120px] sm:h-[135px] md:h-[145px] rounded-xl overflow-hidden border transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_24px_rgba(215,25,32,0.22)] cursor-pointer ${
                  isSelected
                    ? 'border-[#D71920] ring-1 ring-[#D71920]/60 bg-[#140a0b]'
                    : 'border-white/[0.07] hover:border-[#D71920]/60 bg-[#0d0d10]'
                }`}
              >
                {/* Background Cinematic Poster Artwork from DB */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                  style={{
                    backgroundImage: `url('${game.banner || '/assets/official_game_bgmi.png'}')`,
                  }}
                />

                {/* Dark Gradient Overlay for razor-sharp text visibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/95 via-[#09090b]/80 to-[#09090b]/40 group-hover:via-[#09090b]/65 transition-colors duration-200" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-85" />

                {/* Panel Content */}
                <div className="relative h-full flex flex-col justify-between p-3 sm:p-3.5 z-10">
                  {/* Top Bar: Logo & Format Pill Perfectly Aligned */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Game Badge Logo */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/80 border border-white/15 backdrop-blur-md flex items-center justify-center p-1 shrink-0 shadow-md group-hover:border-[#D71920]/40 transition-colors">
                      <img
                        src={game.logo || '/assets/badge_bgmi.png'}
                        alt={game.name}
                        className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Right: Format Badge & Arrow */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[8px] font-tech font-bold uppercase tracking-wider text-zinc-300 px-1.5 py-0.5 rounded bg-black/80 border border-white/15 group-hover:border-white/30 backdrop-blur-sm">
                        {game.format || 'SOLO'}
                      </span>
                      <div className="w-5 h-5 rounded-full bg-black/70 border border-white/15 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-[#D71920]/60 transition-all duration-150">
                        <ArrowUpRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Game Details */}
                  <div className="space-y-1">
                    <div>
                      <span className="text-[7.5px] sm:text-[8.5px] font-tech text-[#ff4d4d] uppercase tracking-wider font-bold block truncate">
                        {game.category || 'COMMUNITY'}
                      </span>
                      <h3 className="font-cinzel text-xs sm:text-sm md:text-base font-bold text-white tracking-wide leading-tight group-hover:text-[#f8f8f8] truncate">
                        {game.name}
                      </h3>
                    </div>

                    {/* View Events Tag */}
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/[0.08]">
                      <span className="inline-flex items-center gap-1 text-[8.5px] sm:text-[9.5px] font-medium tracking-wide text-zinc-400 group-hover:text-[#ff6b6b] transition-colors duration-150">
                        <Calendar className="w-2.5 h-2.5 text-[#D71920]" />
                        <span>Events</span>
                      </span>

                      <span className="text-[8px] sm:text-[9px] font-tech text-zinc-500 uppercase tracking-wider shrink-0">
                        {isSelected ? 'SELECTED' : 'EXPLORE →'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
