import React, { useState } from 'react';
import { tournamentStore } from '../lib/tournamentStore';
import { Sparkles, Trophy, Video, CheckCircle, Star } from 'lucide-react';
import { sfx } from '../utils/sfx';

export const AdminAwards: React.FC = () => {
  const players = tournamentStore.getPlayers();
  const events = tournamentStore.getEvents();

  // Rising star state
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || 'evt-1');
  const [risingStarReason, setRisingStarReason] = useState<string>('Improved from 18th place to 5th place with exceptional tactical growth.');
  const [risingStarSuccess, setRisingStarSuccess] = useState(false);

  // Community award state
  const [communityNomineeA, setCommunityNomineeA] = useState<string>(players[0]?.id || '');
  const [communityNomineeB, setCommunityNomineeB] = useState<string>(players[1]?.id || '');
  const [communityWinnerId, setCommunityWinnerId] = useState<string>(players[0]?.id || '');
  const [communityCategory, setCommunityCategory] = useState<string>('BEST MOMENT / FUNNIEST CLUTCH');
  const [communitySuccess, setCommunitySuccess] = useState(false);

  const handleAwardRisingStar = (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playClick();
    tournamentStore.awardRisingStarQuick(selectedPlayerId, selectedEventId, risingStarReason);
    sfx.playSuccess();
    setRisingStarSuccess(true);
    setTimeout(() => setRisingStarSuccess(false), 2500);
  };

  const handleAwardCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playClick();
    const winner = players.find(p => p.id === communityWinnerId);
    if (!winner) return;

    tournamentStore.logAudit(
      'AWARD_COMMUNITY_PRIZE',
      'Community Award',
      winner.id,
      'Nominee',
      `Won ${communityCategory} (₹50 awarded to ${winner.gamerTag})`
    );

    sfx.playSuccess();
    setCommunitySuccess(true);
    setTimeout(() => setCommunitySuccess(false), 2500);
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
            SPECIAL RECOGNITION: RISING STAR & COMMUNITY AWARDS
          </h2>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Admin station for awarding improvement bonuses (+2 League Points) and voting on community clip highlights (₹50).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Rising Star Award */}
        <div className="bg-[#0c0c12] border border-amber-600/40 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-white">
                  RISING STAR CITATION (+2 LEAGUE POINTS)
                </h3>
              </div>
              <span className="text-xs font-tech text-amber-400 font-bold uppercase">
                REWARD: ₹50 & +2 PTS
              </span>
            </div>

            <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-4">
              Reward meaningful improvement or an unexpectedly strong performance. Automatically appends +2 League Points to the athlete's ledger.
            </p>

            <form onSubmit={handleAwardRisingStar} className="space-y-4">
              <div>
                <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                  Select Athlete
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={e => setSelectedPlayerId(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} (@{p.gamerTag})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                  Event Week
                </label>
                <select
                  value={selectedEventId}
                  onChange={e => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-sm text-white focus:outline-none"
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.week} — {ev.gameName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                  Justification / Growth Reason
                </label>
                <textarea
                  rows={2}
                  required
                  value={risingStarReason}
                  onChange={e => setRisingStarReason(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-xs text-white focus:outline-none"
                />
              </div>

              {risingStarSuccess && (
                <div className="p-2.5 rounded bg-green-950/60 border border-green-500/50 flex items-center gap-2 text-xs text-green-300">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Rising Star (+2 Points) successfully published to athlete's ledger!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-display font-black text-sm uppercase tracking-wider rounded flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Star className="w-4 h-4" />
                <span>CONFIRM & AWARD RISING STAR (+2 PTS)</span>
              </button>
            </form>
          </div>
        </div>

        {/* Panel 2: Community / Best Moment Award */}
        <div className="bg-[#0c0c12] border border-red-600/40 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-[#ff2a2a]" />
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-white">
                  COMMUNITY AWARD CITATION (₹50 CASH)
                </h3>
              </div>
              <span className="text-xs font-tech text-[#ff4d4d] font-bold uppercase">
                REWARD: ₹50
              </span>
            </div>

            <p className="text-xs text-zinc-400 font-sans leading-relaxed mb-4">
              Best play, funniest moment, sportsmanship, personality or community-selected highlight clip of the week.
            </p>

            <form onSubmit={handleAwardCommunity} className="space-y-4">
              <div>
                <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                  Award Category
                </label>
                <select
                  value={communityCategory}
                  onChange={e => setCommunityCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-sm text-white focus:outline-none"
                >
                  <option value="BEST MOMENT / FUNNIEST CLUTCH">BEST MOMENT / FUNNIEST CLUTCH</option>
                  <option value="ICONIC BLUNDER OF THE WEEK">ICONIC BLUNDER OF THE WEEK</option>
                  <option value="COMMUNITY SPORTSMANSHIP MVP">COMMUNITY SPORTSMANSHIP MVP</option>
                  <option value="BEST ARCHITECTURAL BUILD">BEST ARCHITECTURAL BUILD</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-tech text-zinc-400 uppercase mb-1">Nominee A</label>
                  <select
                    value={communityNomineeA}
                    onChange={e => setCommunityNomineeA(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-xs text-white"
                  >
                    {players.map(p => (
                      <option key={p.id} value={p.id}>{p.gamerTag}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-tech text-zinc-400 uppercase mb-1">Nominee B</label>
                  <select
                    value={communityNomineeB}
                    onChange={e => setCommunityNomineeB(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded font-tech text-xs text-white"
                  >
                    {players.map(p => (
                      <option key={p.id} value={p.id}>{p.gamerTag}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                  Declared Winner
                </label>
                <select
                  value={communityWinnerId}
                  onChange={e => setCommunityWinnerId(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-sm text-white focus:outline-none"
                >
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} (@{p.gamerTag})
                    </option>
                  ))}
                </select>
              </div>

              {communitySuccess && (
                <div className="p-2.5 rounded bg-green-950/60 border border-green-500/50 flex items-center gap-2 text-xs text-green-300">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Community Award (₹50) confirmed and published!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#e10600] hover:bg-[#ff1e1e] text-white font-display font-black text-sm uppercase tracking-wider clip-corner-tr flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Trophy className="w-4 h-4" />
                <span>CONFIRM & PUBLISH COMMUNITY WINNER (₹50)</span>
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
};
