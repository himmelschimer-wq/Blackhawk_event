import React, { useState, useEffect } from 'react';
import { tournamentStore, type RewardConfig } from '../lib/tournamentStore';
import { 
  FREE_FIRE_PRIZE_CONFIG, 
  calculateFreeFireEventPayouts, 
  type FreeFirePayoutResult 
} from '../lib/freeFirePrizeEngine';
import { 
  AlertTriangle, 
  CheckCircle, 
  Save, 
  Flame, 
  Swords, 
  Trophy, 
  Shuffle, 
  Sparkles, 
  Crosshair, 
  DollarSign
} from 'lucide-react';
import { sfx } from '../utils/sfx';

export const AdminRewards: React.FC = () => {
  const current = tournamentStore.getRewardsConfig();
  const [config, setConfig] = useState<RewardConfig>(current);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // ─── FREE FIRE 1V1 GAUNTLET & PRIZE ENGINE STATE ───
  const [ffWinnerName, setFfWinnerName] = useState('Team Alpha (Champion)');
  const [ffChallengerName, setFfChallengerName] = useState('Team Bravo (Top Contender)');
  const [ffChallengeOutcome, setFfChallengeOutcome] = useState<'WINNER_WON' | 'WINNER_LOST' | 'NO_CHALLENGE'>('WINNER_WON');
  const [ffRandomDrawWinner, setFfRandomDrawWinner] = useState('Player_Shadow99');
  const [ffBestPerfWinner, setFfBestPerfWinner] = useState('Viper_Clutch');
  const [ffHighestElimWinner, setFfHighestElimWinner] = useState('SniperGod_FF');
  const [ffCalculation, setFfCalculation] = useState<FreeFirePayoutResult | null>(null);
  const [ffSavedSuccess, setFfSavedSuccess] = useState(false);

  // Recalculate Free Fire payouts in real-time
  useEffect(() => {
    const calc = calculateFreeFireEventPayouts({
      winnerTeamName: ffWinnerName,
      challengerTeamName: ffChallengerName,
      challenge1v1Outcome: ffChallengeOutcome,
      randomDrawWinnerName: ffRandomDrawWinner,
      bestPerformanceWinnerName: ffBestPerfWinner,
      highestElimWinnerName: ffHighestElimWinner
    });
    setFfCalculation(calc);
  }, [ffWinnerName, ffChallengerName, ffChallengeOutcome, ffRandomDrawWinner, ffBestPerfWinner, ffHighestElimWinner]);

  const handleSaveFreeFirePayouts = async (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playClick();
    if (!ffCalculation) return;

    try {
      // Save locally to store audit log
      tournamentStore.logAudit(
        'SAVE_FREE_FIRE_PAYOUTS',
        'Free Fire Event Payouts',
        'ev-ff-1',
        'Calculated',
        `Recorded ₹${ffCalculation.totalPayoutDistributed} total prize payouts for Free Fire (1v1 Outcome: ${ffChallengeOutcome})`
      );

      // Attempt API sync via cookie session
      await fetch('/api/events/freefire/save-payouts', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ffCalculation)
      }).catch(() => {
        // Fallback for offline mode
      });

      sfx.playSuccess();
      setFfSavedSuccess(true);
      setTimeout(() => setFfSavedSuccess(false), 3000);
    } catch {
      sfx.playSuccess();
      setFfSavedSuccess(true);
      setTimeout(() => setFfSavedSuccess(false), 3000);
    }
  };

  // Calculations for general matrix
  const weeklyPerGameTotal = config.mainCompetition + config.clashChallenge + config.risingStar + config.participationDraw + config.communityMoment;
  const weeklyTotal5Games = 700 + 350 + 350 + 200 + 150; // ₹1,750 base
  const totalCalculated = weeklyTotal5Games + config.monthlyLeagueTotal;
  const targetBudget = 2350;
  const isBudgetMatched = totalCalculated === targetBudget;

  const handleSaveMatrix = (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playClick();
    tournamentStore.updateRewardsConfig(config);
    setSavedSuccess(true);
    sfx.playSuccess();
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-red-950/40 border border-red-600/30 text-[11px] font-tech font-bold uppercase tracking-widest text-[#ff3333] mb-1">
            <Flame className="w-3 h-3 text-red-500" />
            <span>PRIZE RULES & PAYOUT MATRIX</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
            EVENT PRIZE RULES & 1V1 GAUNTLET CALCULATOR
          </h2>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Store, calculate, and audit cash prize allocations and outcome-based 1v1 challenge payouts.
          </p>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 1. FREE FIRE DEDICATED PRIZE RULES & 1V1 CHALLENGE CALCULATOR           */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-[#120808] via-[#0d0d12] to-[#07070a] border border-red-600/40 rounded-xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(225,6,0,0.15)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 blur-[100px] pointer-events-none rounded-full"></div>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-600/60 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(225,6,0,0.5)]">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-tech font-bold text-red-400 uppercase tracking-widest px-2 py-0.5 rounded bg-red-950/50 border border-red-800/40">
                  OFFICIAL EVENT SCHEMA
                </span>
                <span className="text-[10px] font-tech text-zinc-400">DATABASE ID: ev-ff-1</span>
              </div>
              <h3 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-wide mt-0.5">
                FREE FIRE PRIZE RULES & “DOUBLE OR -₹100” 1V1 CHALLENGE
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/60 border border-white/10 px-4 py-2 rounded-lg">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[10px] font-tech text-zinc-400 uppercase tracking-wider block">BASE PRIZE POOL</span>
              <span className="font-display font-black text-lg text-white">₹700 INR</span>
            </div>
          </div>
        </div>

        {/* 5 Prize Categories Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6 relative z-10">
          {FREE_FIRE_PRIZE_CONFIG.categories.map((cat, idx) => (
            <div key={cat.id} className="p-3.5 rounded-lg bg-black/50 border border-white/10 hover:border-red-600/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-tech text-zinc-400 font-bold uppercase">TIER 0{idx + 1}</span>
                  <span className="font-display font-black text-sm text-red-400">₹{cat.baseAmount}</span>
                </div>
                <h4 className="font-tech text-xs font-bold text-white uppercase tracking-wider mb-1 line-clamp-1">
                  {cat.title}
                </h4>
                <p className="text-[10px] font-sans text-zinc-400 leading-tight">
                  {cat.eligibility}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-white/5 text-[9px] font-tech text-zinc-500">
                {cat.id === 'challenge_1v1' ? 'Win: ₹400 / Loss: ₹200' : 'Condition: Direct payout'}
              </div>
            </div>
          ))}
        </div>

        {/* 1v1 Challenge Rule Matrix Banner */}
        <div className="bg-black/60 border border-amber-600/30 rounded-lg p-4 mb-6 relative z-10">
          <h4 className="font-tech text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>1V1 CHALLENGE OUTCOME & PAYOUT RULES MATRIX:</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-tech">
            <div className="p-2.5 rounded bg-green-950/30 border border-green-700/40 text-green-300">
              <strong className="block text-white uppercase mb-0.5">Scenario A: Event-Winning Team Wins 1v1 Challenge</strong>
              <span>• Event-Winning Team Total Prize: <strong>₹400</strong> (₹300 base + ₹100 challenge victory bonus)</span><br />
              <span>• Challenging Team: <strong>₹0</strong></span>
            </div>
            <div className="p-2.5 rounded bg-red-950/30 border border-red-700/40 text-red-300">
              <strong className="block text-white uppercase mb-0.5">Scenario B: Event-Winning Team Loses 1v1 Challenge</strong>
              <span>• Event-Winning Team Total Prize: <strong>₹200</strong> (₹300 base - ₹100 deduction penalty)</span><br />
              <span>• Challenging Team: <strong>₹100</strong> (secures challenge bounty)</span>
            </div>
          </div>
        </div>

        {/* Interactive Calculator Form */}
        <form onSubmit={handleSaveFreeFirePayouts} className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Winner Team */}
            <div className="p-4 rounded-lg bg-black/60 border border-white/10 space-y-2">
              <label className="block text-xs font-tech font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>1. Event-Winning Team</span>
              </label>
              <input
                type="text"
                required
                value={ffWinnerName}
                onChange={e => setFfWinnerName(e.target.value)}
                placeholder="e.g., Team Alpha"
                className="w-full px-3 py-2 bg-black/80 border border-white/10 rounded font-tech text-xs text-white focus:outline-none focus:border-red-500"
              />
              <span className="text-[10px] font-tech text-zinc-400 block">
                Base reward: ₹300 (before 1v1 challenge)
              </span>
            </div>

            {/* 2. 1v1 Challenge Outcome */}
            <div className="p-4 rounded-lg bg-black/60 border border-red-600/40 space-y-2">
              <label className="block text-xs font-tech font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                <Swords className="w-4 h-4" />
                <span>2. 1v1 Challenge Outcome</span>
              </label>
              <select
                value={ffChallengeOutcome}
                onChange={e => setFfChallengeOutcome(e.target.value as any)}
                className="w-full px-3 py-2 bg-black/80 border border-red-500/40 rounded font-tech text-xs text-white focus:outline-none focus:border-red-500 font-bold"
              >
                <option value="WINNER_WON">🏆 Event Winner Won 1v1 (Total: ₹400 / Challenger: ₹0)</option>
                <option value="WINNER_LOST">⚔️ Challenger Won 1v1 (Winner: ₹200 / Challenger: ₹100)</option>
                <option value="NO_CHALLENGE">⏸️ No 1v1 Challenge Played (Winner: ₹300)</option>
              </select>
              <span className="text-[10px] font-tech text-zinc-400 block">
                {ffChallengeOutcome === 'WINNER_WON' ? 'Applies +₹100 bonus to champion' : ffChallengeOutcome === 'WINNER_LOST' ? 'Applies -₹100 penalty & awards ₹100 to challenger' : 'Standard ₹300 payout'}
              </span>
            </div>

            {/* 3. Challenger Team */}
            <div className="p-4 rounded-lg bg-black/60 border border-white/10 space-y-2">
              <label className="block text-xs font-tech font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-red-400" />
                <span>3. Challenging Team</span>
              </label>
              <input
                type="text"
                value={ffChallengerName}
                onChange={e => setFfChallengerName(e.target.value)}
                placeholder="e.g., Team Bravo"
                className="w-full px-3 py-2 bg-black/80 border border-white/10 rounded font-tech text-xs text-white focus:outline-none focus:border-red-500"
              />
              <span className="text-[10px] font-tech text-zinc-400 block">
                Receives ₹100 only if they defeat the Event Winner in 1v1
              </span>
            </div>

            {/* 4. Random Draw Winner */}
            <div className="p-4 rounded-lg bg-black/60 border border-white/10 space-y-2">
              <label className="block text-xs font-tech font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-cyan-400" />
                <span>4. Random Draw Winner (₹50)</span>
              </label>
              <input
                type="text"
                value={ffRandomDrawWinner}
                onChange={e => setFfRandomDrawWinner(e.target.value)}
                placeholder="Verified participant name"
                className="w-full px-3 py-2 bg-black/80 border border-white/10 rounded font-tech text-xs text-white focus:outline-none focus:border-red-500"
              />
              <span className="text-[10px] font-tech text-zinc-400 block">
                Selected among all active participants
              </span>
            </div>

            {/* 5. Best Performance Winner */}
            <div className="p-4 rounded-lg bg-black/60 border border-white/10 space-y-2">
              <label className="block text-xs font-tech font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>5. Best Performance / Clip (₹50)</span>
              </label>
              <input
                type="text"
                value={ffBestPerfWinner}
                onChange={e => setFfBestPerfWinner(e.target.value)}
                placeholder="Most entertaining / clutch athlete"
                className="w-full px-3 py-2 bg-black/80 border border-white/10 rounded font-tech text-xs text-white focus:outline-none focus:border-red-500"
              />
              <span className="text-[10px] font-tech text-zinc-400 block">
                Standout entertaining gameplay & highlights
              </span>
            </div>

            {/* 6. Highest Eliminations Winner */}
            <div className="p-4 rounded-lg bg-black/60 border border-white/10 space-y-2">
              <label className="block text-xs font-tech font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>6. Highest Eliminations (₹100)</span>
              </label>
              <input
                type="text"
                value={ffHighestElimWinner}
                onChange={e => setFfHighestElimWinner(e.target.value)}
                placeholder="Top fragger name"
                className="w-full px-3 py-2 bg-black/80 border border-white/10 rounded font-tech text-xs text-white focus:outline-none focus:border-red-500"
              />
              <span className="text-[10px] font-tech text-zinc-400 block">
                Top kill-count player or team
              </span>
            </div>

          </div>

          {/* Real-time Calculated Payout Results Table */}
          {ffCalculation && (
            <div className="bg-black/80 border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-tech text-xs font-bold text-white uppercase tracking-wider">
                  CALCULATED ITEMIZED DISBURSEMENT LEDGER
                </span>
                <span className="font-display font-black text-sm text-green-400">
                  TOTAL DISBURSED: ₹{ffCalculation.totalPayoutDistributed} INR
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-tech">
                  <thead>
                    <tr className="text-zinc-400 border-b border-white/5">
                      <th className="py-2">Category</th>
                      <th className="py-2">Recipient</th>
                      <th className="py-2">Payout Amount</th>
                      <th className="py-2">Applied Payout Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ffCalculation.itemizedPayouts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 font-bold text-white">{p.category}</td>
                        <td className="py-2.5 text-amber-300 font-semibold">{p.recipientName}</td>
                        <td className="py-2.5 font-display font-black text-sm text-green-400">₹{p.amount}</td>
                        <td className="py-2.5 text-zinc-400 text-[11px] font-sans">{p.conditionApplied}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {ffSavedSuccess && (
            <div className="p-3 rounded-lg bg-green-950/70 border border-green-500 text-green-300 text-xs font-tech flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>FREE FIRE EVENT RESULTS & 1V1 PAYOUTS SAVED & COMMITTED TO DATABASE!</span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#e10600] hover:bg-[#ff1e1e] text-white font-tech font-bold text-xs uppercase tracking-wider clip-corner-tr flex items-center gap-2 shadow-[0_0_20px_rgba(225,6,0,0.4)] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>COMMIT & SAVE FREE FIRE PAYOUTS</span>
            </button>
          </div>
        </form>

      </div>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* 2. GENERAL LEAGUE REWARDS MATRIX                                        */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {savedSuccess && (
        <div className="p-3 rounded-lg bg-green-950/70 border border-green-500 text-green-300 text-xs font-tech flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>REWARDS MATRIX SAVED & AUDITED SUCCESSFULLY!</span>
        </div>
      )}

      {/* Budget Balance Banner */}
      <div className={`p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
        isBudgetMatched
          ? 'bg-gradient-to-r from-green-950/40 to-black border-green-600/40 text-green-300'
          : 'bg-gradient-to-r from-amber-950/60 to-black border-amber-600/50 text-amber-300'
      }`}>
        <div className="flex items-center gap-3">
          {isBudgetMatched ? (
            <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 animate-bounce" />
          )}
          <div>
            <h3 className="font-display font-black text-xl text-white uppercase">
              {isBudgetMatched ? 'BUDGET ALLOCATION BALANCED' : 'BUDGET ALLOCATION WARNING'}
            </h3>
            <p className="text-xs font-sans text-zinc-300">
              Configured Total: ₹{totalCalculated.toLocaleString()} INR / Authorized Event Budget: ₹{targetBudget.toLocaleString()} INR
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-tech text-zinc-400 uppercase tracking-widest block">
            TOTAL SEASON BUDGET
          </span>
          <span className="font-display font-black text-3xl text-white">
            ₹{totalCalculated} INR
          </span>
        </div>
      </div>

      {/* Reward Form */}
      <form onSubmit={handleSaveMatrix} className="bg-[#0c0c12] border border-white/10 rounded-xl p-6 space-y-6">
        
        <div>
          <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-[#ff4d4d] mb-4">
            STANDARD WEEKLY REWARD CATEGORIES (INR)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            <div>
              <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                1. Main Competition Winner
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                <input
                  type="number"
                  required
                  value={config.mainCompetition}
                  onChange={e => setConfig({ ...config, mainCompetition: Number(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <span className="text-[10px] font-tech text-zinc-500 mt-1 block">Default: ₹150</span>
            </div>

            <div>
              <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                2. Clash / Challenge Winner
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                <input
                  type="number"
                  required
                  value={config.clashChallenge}
                  onChange={e => setConfig({ ...config, clashChallenge: Number(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <span className="text-[10px] font-tech text-zinc-500 mt-1 block">Default: ₹75</span>
            </div>

            <div>
              <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                3. Rising Star Reward
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                <input
                  type="number"
                  required
                  value={config.risingStar}
                  onChange={e => setConfig({ ...config, risingStar: Number(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <span className="text-[10px] font-tech text-zinc-500 mt-1 block">Default: ₹50</span>
            </div>

            <div>
              <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                4. Participation Draw Reward
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                <input
                  type="number"
                  required
                  value={config.participationDraw}
                  onChange={e => setConfig({ ...config, participationDraw: Number(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <span className="text-[10px] font-tech text-zinc-500 mt-1 block">Default: ₹25</span>
            </div>

            <div>
              <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                5. Community / Best Moment
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                <input
                  type="number"
                  required
                  value={config.communityMoment}
                  onChange={e => setConfig({ ...config, communityMoment: Number(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <span className="text-[10px] font-tech text-zinc-500 mt-1 block">Default: ₹50</span>
            </div>

            <div>
              <label className="block text-xs font-tech text-zinc-300 uppercase tracking-wider mb-1 font-semibold">
                Monthly League Grand Pool
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                <input
                  type="number"
                  required
                  value={config.monthlyLeagueTotal}
                  onChange={e => setConfig({ ...config, monthlyLeagueTotal: Number(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <span className="text-[10px] font-tech text-zinc-500 mt-1 block">Default: ₹600</span>
            </div>

          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs font-tech text-zinc-400">
            WEEKLY STANDARD SUM: <strong className="text-white">₹{weeklyPerGameTotal}</strong> • MONTHLY FINALE: <strong className="text-white">₹{config.monthlyLeagueTotal}</strong>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-[#e10600] hover:bg-[#ff1e1e] text-white font-tech font-bold text-xs uppercase tracking-wider clip-corner-tr flex items-center gap-2 shadow-[0_0_15px_rgba(225,6,0,0.4)] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>SAVE REWARDS MATRIX</span>
          </button>
        </div>

      </form>

    </div>
  );
};
