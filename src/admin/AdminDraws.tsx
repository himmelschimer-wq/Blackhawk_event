import React, { useState } from 'react';
import { tournamentStore, type DrawRecord } from '../lib/tournamentStore';
import confetti from 'canvas-confetti';
import { Dices, Trophy } from 'lucide-react';
import { sfx } from '../utils/sfx';

export const AdminDraws: React.FC = () => {
  const events = tournamentStore.getEvents();
  const registrations = tournamentStore.getRegistrations();
  const draws = tournamentStore.getDraws();

  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || 'evt-1');
  const [isSpinning, setIsSpinning] = useState(false);
  const [latestWinner, setLatestWinner] = useState<DrawRecord | null>(null);

  const existingWinnerIds = new Set(draws.map(d => d.winnerPlayerId));
  const eligiblePlayers = registrations.filter(r => !existingWinnerIds.has(r.playerId));

  const handleRunDraw = () => {
    sfx.playClick();
    setIsSpinning(true);
    setLatestWinner(null);

    setTimeout(() => {
      const drawResult = tournamentStore.runParticipationDraw(selectedEventId);
      setIsSpinning(false);
      setLatestWinner(drawResult);

      if (drawResult) {
        sfx.playSuccess();
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#e10600', '#ff1e1e', '#ffd700', '#ffffff']
          });
        } catch {}
      }
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
            PARTICIPATION DRAW TERMINAL
          </h2>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Provably fair random selector awarding ₹25 cash to verified match participants.
          </p>
        </div>

        <div className="flex items-center gap-2 font-tech text-xs">
          <span className="px-3 py-1.5 rounded bg-black/60 border border-white/10 text-zinc-300">
            COMPLETED DRAWS: <strong className="text-white">{draws.length}</strong>
          </span>
        </div>
      </div>

      {/* Main Execution Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Execution Controls (7 cols) */}
        <div className="lg:col-span-7 bg-[#0c0c12] border border-red-600/40 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2">
                <Dices className="w-5 h-5 text-[#ff2a2a]" />
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-white">
                  CONFIGURED RAFFLE ENGINE
                </h3>
              </div>
              <span className="text-xs font-tech text-green-400 uppercase font-bold">
                {eligiblePlayers.length} ELIGIBLE PLAYERS
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                  Target Event Round
                </label>
                <select
                  value={selectedEventId}
                  onChange={e => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded font-tech text-sm text-white focus:outline-none"
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.week} — {ev.gameName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 rounded bg-black/40 border border-white/5 space-y-1.5 text-xs font-tech text-zinc-400">
                <div className="flex justify-between">
                  <span>REWARD CASH PRIZE:</span>
                  <span className="text-white font-bold">₹25 INR</span>
                </div>
                <div className="flex justify-between">
                  <span>DUPLICATE WINNER PREVENTION:</span>
                  <span className="text-green-400 font-bold">ACTIVE (1 Win Limit)</span>
                </div>
                <div className="flex justify-between">
                  <span>AUDIT TRAIL:</span>
                  <span className="text-zinc-200">Permanently Recorded</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleRunDraw}
            disabled={isSpinning || eligiblePlayers.length === 0}
            className="w-full py-4 bg-[#e10600] hover:bg-[#ff1e1e] text-white font-display font-black text-lg tracking-widest uppercase clip-corner-tr shadow-[0_0_25px_rgba(225,6,0,0.5)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isSpinning ? (
              <>
                <Dices className="w-6 h-6 animate-spin text-white" />
                <span>SPINNING RANDOM SEED...</span>
              </>
            ) : (
              <>
                <Dices className="w-5 h-5" />
                <span>RUN RANDOM PARTICIPATION DRAW</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Winner Announcement Pod (5 cols) */}
        <div className="lg:col-span-5 bg-[#0c0c12] border border-white/10 rounded-xl p-6 flex flex-col justify-between text-center">
          <div>
            <span className="text-[10px] font-tech text-zinc-400 uppercase tracking-widest block mb-2 font-bold">
              OFFICIAL DRAW RESULT
            </span>

            {latestWinner ? (
              <div className="p-6 rounded-xl bg-gradient-to-b from-[#1c0808] via-black to-black border-2 border-red-500 shadow-[0_0_35px_rgba(225,6,0,0.4)] animate-in fade-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-[#e10600] text-white flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(225,6,0,0.8)]">
                  <Trophy className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-tech text-[#ff4d4d] uppercase font-black tracking-widest block">
                  WINNER CONFIRMED
                </span>
                <h3 className="font-display font-black text-3xl text-white uppercase mt-1">
                  {latestWinner.winnerName}
                </h3>
                <span className="font-mono text-sm text-zinc-400">@{latestWinner.winnerTag}</span>
                <div className="mt-4 pt-3 border-t border-white/10 flex justify-around font-tech text-xs">
                  <div>
                    <span className="block text-zinc-400">REWARD</span>
                    <span className="font-bold text-white text-lg">₹{latestWinner.rewardAmount}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-400">DISCIPLINE</span>
                    <span className="font-bold text-white text-sm">{latestWinner.gameName}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-xl bg-black/40 border border-white/5 text-zinc-500 font-tech text-xs uppercase flex flex-col items-center justify-center">
                <Dices className="w-10 h-10 mb-2 opacity-30" />
                <span>CLICK "RUN RANDOM DRAW" TO SELECT WINNER</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 text-[10px] font-tech text-zinc-500 uppercase">
            CERTIFIED TRANSPARENT RANDOM RAFFLE
          </div>
        </div>

      </div>

      {/* Historical Draws Ledger */}
      <div className="bg-[#0b0b0f] border border-white/10 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-black/50 border-b border-white/10">
          <span className="font-tech text-xs text-white uppercase font-bold tracking-wider">
            PERMANENT DRAW AUDIT HISTORY ({draws.length} WINNERS)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-tech text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-[10px] uppercase tracking-widest text-zinc-400">
                <th className="py-3 px-4">DRAW ID</th>
                <th className="py-3 px-4">WINNING ATHLETE</th>
                <th className="py-3 px-4">EVENT</th>
                <th className="py-3 px-4 text-center">ELIGIBLE POOL</th>
                <th className="py-3 px-4 text-center">AWARD</th>
                <th className="py-3 px-4 text-right">DATE / CONDUCTOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {draws.map(d => (
                <tr key={d.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-mono text-[#ff4d4d]">{d.id}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-white block">{d.winnerName}</span>
                    <span className="font-mono text-zinc-400">@{d.winnerTag}</span>
                  </td>
                  <td className="py-3 px-4 text-zinc-300">{d.gameName} ({d.week})</td>
                  <td className="py-3 px-4 text-center text-zinc-400">{d.eligibleCount} players</td>
                  <td className="py-3 px-4 text-center font-bold text-green-400">₹{d.rewardAmount}</td>
                  <td className="py-3 px-4 text-right text-zinc-400">
                    <span className="block text-white">{d.conductedBy}</span>
                    <span className="text-[10px]">{new Date(d.drawnAt).toLocaleDateString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
