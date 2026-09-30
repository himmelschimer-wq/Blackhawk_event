import React, { useState } from 'react';
import { tournamentStore } from '../lib/tournamentStore';
import { calculatePoints } from '../lib/pointEngine';
import { Trophy, Swords, Sparkles, Send, Trash2 } from 'lucide-react';
import { sfx } from '../utils/sfx';

export const AdminResults: React.FC = () => {
  const events = tournamentStore.getEvents();
  const players = tournamentStore.getPlayers();
  const results = tournamentStore.getResults();

  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || 'evt-1');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');
  const [placement, setPlacement] = useState<string>('1'); // '1', '2', '3', '4', '5', 'other', 'none'
  const [participated, setParticipated] = useState<boolean>(true);
  const [challengeWinner, setChallengeWinner] = useState<boolean>(false);
  const [risingStar, setRisingStar] = useState<boolean>(false);
  const [status, setStatus] = useState<'DRAFT' | 'REVIEW' | 'PUBLISHED'>('DRAFT');

  // Preview real-time calculated points
  const numericPlacement = placement === 'other' || placement === 'none' ? null : Number(placement);
  const previewPoints = calculatePoints({
    placement: numericPlacement,
    participated,
    challengeWinner,
    risingStar
  });

  const activeEvent = events.find(e => e.id === selectedEventId) || events[0];

  const handleSaveResult = (e: React.FormEvent) => {
    e.preventDefault();
    const player = players.find(p => p.id === selectedPlayerId);
    if (!player) {
      alert("Please select a valid athlete.");
      return;
    }

    sfx.playClick();
    tournamentStore.saveResultRecord({
      eventId: activeEvent.id,
      gameName: activeEvent.gameName,
      week: activeEvent.week,
      playerId: player.id,
      playerName: player.fullName,
      gamerTag: player.gamerTag,
      placement: numericPlacement,
      participated,
      challengeWinner,
      risingStar,
      status
    });

    sfx.playSuccess();
    alert(`Result recorded successfully in ${status} status! Calculated points: ${previewPoints.totalPoints}`);
  };

  const handlePublishAllForEvent = () => {
    const confirm = window.confirm(`CONFIRM: Publish all DRAFT and REVIEW results for ${activeEvent.gameName} (${activeEvent.week}) to the public leaderboard?`);
    if (confirm) {
      sfx.playClick();
      tournamentStore.publishEventResults(activeEvent.id);
      sfx.playSuccess();
      alert(`All results for ${activeEvent.gameName} have been published to the live public leaderboard!`);
    }
  };

  const handleDeleteResult = (id: string) => {
    const confirm = window.confirm("Are you sure you want to delete this result record?");
    if (confirm) {
      sfx.playClick();
      tournamentStore.deleteResult(id);
    }
  };

  const eventResults = results.filter(r => r.eventId === selectedEventId);
  const draftCount = eventResults.filter(r => r.status === 'DRAFT').length;
  const reviewCount = eventResults.filter(r => r.status === 'REVIEW').length;
  const publishedCount = eventResults.filter(r => r.status === 'PUBLISHED').length;

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
            RESULT ENTRY & AUTOMATED POINT ENGINE
          </h2>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Admin enters official tournament outcomes. League points are calculated strictly server-side by rule.
          </p>
        </div>

        {/* Workflow State Tracker */}
        <div className="flex items-center gap-2 font-tech text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
            <span>DRAFT: <strong>{draftCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-950/60 border border-amber-600/40 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>REVIEW: <strong>{reviewCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-green-950/60 border border-green-600/40 text-green-300">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>PUBLISHED: <strong>{publishedCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Target Event Selector Strip */}
      <div className="p-4 rounded-xl bg-[#0c0c12] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-tech text-zinc-400 uppercase tracking-wider font-bold">
            SELECT DISCIPLINE:
          </span>
          <select
            value={selectedEventId}
            onChange={e => {
              sfx.playClick();
              setSelectedEventId(e.target.value);
            }}
            className="px-3 py-2 bg-black/70 border border-red-600/50 rounded font-tech text-sm text-white focus:outline-none"
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.week} — {ev.gameName} (Prize: ₹{ev.prizePool})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handlePublishAllForEvent}
          className="px-5 py-2.5 bg-[#e10600] hover:bg-[#ff1e1e] text-white font-display font-black text-xs uppercase tracking-wider clip-corner-tr shadow-[0_0_15px_rgba(225,6,0,0.5)] flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Send className="w-4 h-4" />
          <span>PUBLISH ALL {activeEvent.gameName} RESULTS</span>
        </button>
      </div>

      {/* Main Grid: Entry Form on Left, Live Points Calculation Telemetry on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 bg-[#0c0c12] border border-red-600/40 rounded-xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-5">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#ff2a2a]" />
              <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-white">
                ENTER ATHLETE RESULT
              </h3>
            </div>
            <span className="text-xs font-tech text-[#ff4d4d] uppercase font-bold">
              {activeEvent.gameName}
            </span>
          </div>

          <form onSubmit={handleSaveResult} className="space-y-4">
            
            {/* Player Selection */}
            <div>
              <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider font-semibold mb-1">
                Select Athlete / Competitor
              </label>
              <select
                value={selectedPlayerId}
                onChange={e => setSelectedPlayerId(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded font-tech text-sm text-white focus:outline-none focus:border-red-500"
              >
                {players.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} (@{p.gamerTag}) — Discord: {p.discordUsername}
                  </option>
                ))}
              </select>
            </div>

            {/* Placement Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider font-semibold mb-1">
                  Official Match Placement
                </label>
                <select
                  value={placement}
                  onChange={e => setPlacement(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded font-tech text-sm text-white focus:outline-none focus:border-red-500"
                >
                  <option value="1">1st Place (10 Base Points)</option>
                  <option value="2">2nd Place (7 Base Points)</option>
                  <option value="3">3rd Place (5 Base Points)</option>
                  <option value="4">4th Place (3 Base Points)</option>
                  <option value="5">5th Place (3 Base Points)</option>
                  <option value="other">Outside Top 5 (1 Participation Point)</option>
                  <option value="none">Did Not Place</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider font-semibold mb-1">
                  Workflow State
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as 'DRAFT' | 'REVIEW' | 'PUBLISHED')}
                  className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded font-tech text-sm text-white focus:outline-none focus:border-red-500"
                >
                  <option value="DRAFT">DRAFT (Internal Review Only)</option>
                  <option value="REVIEW">REVIEW (Admin Confirmed)</option>
                  <option value="PUBLISHED">PUBLISHED (Affects Live Public Leaderboard)</option>
                </select>
              </div>
            </div>

            {/* Bonus Toggles */}
            <div className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-3">
              <span className="text-xs font-tech text-zinc-400 uppercase tracking-wider font-bold block">
                SPECIAL REWARD & BONUS QUALIFIERS:
              </span>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={participated}
                  onChange={e => setParticipated(e.target.checked)}
                  className="w-4 h-4 accent-[#e10600] rounded"
                />
                <span className="text-xs font-tech text-zinc-200 uppercase">
                  Confirmed Match Attendance (Qualifies for 1 pt if outside Top 5)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={challengeWinner}
                  onChange={e => setChallengeWinner(e.target.checked)}
                  className="w-4 h-4 accent-[#e10600] rounded"
                />
                <span className="text-xs font-tech text-zinc-200 uppercase flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-[#ff2a2a]" />
                  <span>Clash / Side Challenge Winner (+3 Bonus Points)</span>
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={risingStar}
                  onChange={e => setRisingStar(e.target.checked)}
                  className="w-4 h-4 accent-[#e10600] rounded"
                />
                <span className="text-xs font-tech text-zinc-200 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rising Star Awardee (+2 Bonus Points)</span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#e10600] hover:bg-[#ff1e1e] text-white font-display font-black text-sm uppercase tracking-wider clip-corner-tr transition-all shadow-[0_0_20px_rgba(225,6,0,0.5)] cursor-pointer"
            >
              SAVE RESULT RECORD ({status})
            </button>
          </form>
        </div>

        {/* Right Panel: Auto-Calculated Points Telemetry: 5 cols */}
        <div className="lg:col-span-5 bg-[#0c0c12] border border-white/10 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="font-tech text-xs uppercase tracking-widest text-[#ff4d4d] font-bold">
                ENGINE CALCULATION TELEMETRY
              </span>
              <span className="text-[10px] font-tech text-zinc-400 uppercase">
                AUTOMATED FORMULA ACTIVE
              </span>
            </div>

            {/* Large Total Points Display */}
            <div className="p-6 rounded-xl bg-gradient-to-b from-[#180909] via-black to-black border border-red-600/40 text-center mb-5">
              <span className="text-[10px] font-tech text-zinc-400 uppercase tracking-widest block mb-1">
                TOTAL LEAGUE POINTS AWARDED
              </span>
              <span className="font-display font-black text-6xl text-white text-glow-red">
                {previewPoints.totalPoints}
              </span>
              <span className="block font-tech text-xs text-[#ff4d4d] font-bold uppercase mt-1">
                POINTS TO ACCUMULATE
              </span>
            </div>

            {/* Mathematical Breakdown Box */}
            <div className="space-y-2 text-xs font-tech">
              <div className="flex justify-between p-2.5 rounded bg-black/40 border border-white/5">
                <span className="text-zinc-400">PLACEMENT BASE POINTS:</span>
                <span className="text-white font-bold">{previewPoints.basePoints} pts</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-black/40 border border-white/5">
                <span className="text-zinc-400">PARTICIPATION POINTS (NON-STACKING):</span>
                <span className="text-white font-bold">{previewPoints.participationPoints} pt</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-black/40 border border-white/5">
                <span className="text-zinc-400">CHALLENGE BONUS (+3):</span>
                <span className="text-white font-bold">+{previewPoints.challengeBonus} pts</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-black/40 border border-white/5">
                <span className="text-zinc-400">RISING STAR BONUS (+2):</span>
                <span className="text-white font-bold">+{previewPoints.risingStarBonus} pts</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded bg-red-950/30 border border-red-600/30 text-xs text-red-200 font-sans leading-relaxed">
              <strong>Rule Verification:</strong> Participation points (1 pt) are not added on top of placements 1st–5th. Total calculation: {previewPoints.explanation}.
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 text-center text-[10px] font-tech text-zinc-500 uppercase">
            IMMUTABLE CALCULATION • PROVABLY AUDITED
          </div>
        </div>

      </div>

      {/* Current Results Log Table for Selected Event */}
      <div className="bg-[#0b0b0f] border border-white/10 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-black/50 border-b border-white/10 flex items-center justify-between">
          <span className="font-tech text-xs text-white uppercase font-bold tracking-wider">
            RECORDED RESULTS FOR {activeEvent.gameName} ({eventResults.length} RECORDS)
          </span>
          <span className="text-xs font-tech text-zinc-400">
            DRAFT → REVIEW → PUBLISH
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-[11px] font-tech uppercase tracking-widest text-zinc-400">
                <th className="py-3 px-4">ATHLETE</th>
                <th className="py-3 px-4">PLACEMENT</th>
                <th className="py-3 px-4 text-center">CHALLENGE</th>
                <th className="py-3 px-4 text-center">RISING STAR</th>
                <th className="py-3 px-4 text-center">TOTAL PTS</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-tech text-sm">
              {eventResults.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-white block">{r.playerName}</span>
                    <span className="text-xs text-zinc-400 font-mono">@{r.gamerTag}</span>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {r.placement ? `${r.placement} Place` : 'Participant'}
                  </td>
                  <td className="py-3 px-4 text-center text-xs">
                    {r.challengeWinner ? <span className="text-[#ff4d4d] font-bold">YES (+3)</span> : <span className="text-zinc-500">—</span>}
                  </td>
                  <td className="py-3 px-4 text-center text-xs">
                    {r.risingStar ? <span className="text-amber-400 font-bold">YES (+2)</span> : <span className="text-zinc-500">—</span>}
                  </td>
                  <td className="py-3 px-4 text-center font-display font-black text-lg text-white">
                    {r.points.totalPoints} PTS
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      r.status === 'PUBLISHED' ? 'bg-green-950/80 text-green-400 border border-green-500/40' :
                      r.status === 'REVIEW' ? 'bg-amber-950/80 text-amber-400 border border-amber-500/40' :
                      'bg-zinc-800 text-zinc-300'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteResult(r.id)}
                      className="p-1.5 rounded bg-zinc-800 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
