import React, { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../lib/adminApi';
import { 
  Calculator, 
  Trophy, 
  CheckCircle2, 
  Copy, 
  Check, 
  AlertCircle, 
  Plus, 
  Trash2, 
  UserCheck, 
  Search, 
  ChevronRight, 
  Layers, 
  Tags,
  X
} from 'lucide-react';
import { sfx } from '../utils/sfx';

// Dynamic Calculable Metric (Key-Value Pair with Calculation Multiplier/Logic)
export interface CalculableMetric {
  id: string;
  key: string;              // e.g. "Placement Rank (#)", "Kills / Eliminations", "Rounds Won", "Beds Broken", "Damage", "Assists"
  type: 'rank_table' | 'multiplier';
  multiplier: number;       // Points per unit (e.g. 1 pt per kill, 2 pts per round, 5 pts per bed)
  defaultValue: number;
  placeholder?: string;
  isCustom?: boolean;
}

// Standard Battle Royale & Esports Placement Presets
const DEFAULT_PRESETS: Record<string, {
  name: string;
  placementPoints: Record<number, number>;
  metrics: CalculableMetric[];
}> = {
  BGMI: {
    name: 'BGMI Official (15-Pt Placement)',
    placementPoints: {
      1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1
    },
    metrics: [
      { id: 'placement', key: 'Placement Rank (#)', type: 'rank_table', multiplier: 1, defaultValue: 1, placeholder: 'e.g. 1' },
      { id: 'kills', key: 'Kills / Eliminations', type: 'multiplier', multiplier: 1, defaultValue: 0, placeholder: 'e.g. 8' },
      { id: 'damage', key: 'Damage Dealt', type: 'multiplier', multiplier: 0, defaultValue: 0, placeholder: 'e.g. 1540' }
    ]
  },
  FREE_FIRE: {
    name: 'Free Fire (12-Pt Placement)',
    placementPoints: {
      1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1
    },
    metrics: [
      { id: 'placement', key: 'Placement Rank (#)', type: 'rank_table', multiplier: 1, defaultValue: 1, placeholder: 'e.g. 1' },
      { id: 'kills', key: 'Kills / Eliminations', type: 'multiplier', multiplier: 1, defaultValue: 0, placeholder: 'e.g. 6' },
      { id: 'headshots', key: 'Headshots', type: 'multiplier', multiplier: 1, defaultValue: 0, placeholder: 'e.g. 3' }
    ]
  },
  VALORANT: {
    name: 'Valorant / Tactical Shooter',
    placementPoints: {
      1: 10, 2: 4
    },
    metrics: [
      { id: 'rounds_won', key: 'Rounds Won', type: 'multiplier', multiplier: 2, defaultValue: 13, placeholder: 'e.g. 13' },
      { id: 'kills', key: 'Kills / Frags', type: 'multiplier', multiplier: 1, defaultValue: 0, placeholder: 'e.g. 18' },
      { id: 'spike_plants', key: 'Spike Plants / Defuses', type: 'multiplier', multiplier: 1, defaultValue: 0, placeholder: 'e.g. 4' }
    ]
  },
  MINECRAFT: {
    name: 'Minecraft / Bedwars / Custom',
    placementPoints: {
      1: 10, 2: 6, 3: 4, 4: 2, 5: 1
    },
    metrics: [
      { id: 'placement', key: 'Survival Rank (#)', type: 'rank_table', multiplier: 1, defaultValue: 1, placeholder: 'e.g. 1' },
      { id: 'beds_broken', key: 'Beds Destroyed', type: 'multiplier', multiplier: 5, defaultValue: 0, placeholder: 'e.g. 2' },
      { id: 'final_kills', key: 'Final Kills', type: 'multiplier', multiplier: 2, defaultValue: 0, placeholder: 'e.g. 4' },
      { id: 'kills', key: 'Normal Kills', type: 'multiplier', multiplier: 1, defaultValue: 0, placeholder: 'e.g. 7' }
    ]
  }
};

interface EventItem {
  id: string;
  title: string;
  gameName: string;
  prizePool?: string;
  rules?: string;
  scoringRules?: string;
  status?: string;
}

interface RegistrationItem {
  id: string;
  teamName?: string;
  gamerTag?: string;
  fullName?: string;
  playerName?: string;
  gameId?: string;
  gameName?: string;
  eventId?: string;
  discordUsername?: string;
  phone?: string;
  status?: string;
}

export interface MatchEntry {
  id: string;
  matchNumber: number;
  matchLabel: string;
  // Key-value store of user entered values for each calculable metric: { [metricId]: value }
  metricValues: Record<string, number>;
}

export const AdminPointsCalculator: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copied, setCopied] = useState(false);

  // Selected Event & Scoring System
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [activeGamePreset, setActiveGamePreset] = useState<string>('BGMI');
  const [customPlacementPoints, setCustomPlacementPoints] = useState<Record<number, number>>({ ...DEFAULT_PRESETS.BGMI.placementPoints });

  // Dynamic Calculable Metric Key-Value Pairs
  const [calculableMetrics, setCalculableMetrics] = useState<CalculableMetric[]>([
    ...DEFAULT_PRESETS.BGMI.metrics
  ]);

  // Metric Add/Edit Modal
  const [isAddingMetric, setIsAddingMetric] = useState<boolean>(false);
  const [newMetricKey, setNewMetricKey] = useState<string>('');
  const [newMetricMultiplier, setNewMetricMultiplier] = useState<number>(1);

  // Selected Registered Player / Team
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string>('');
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');

  // Multiple Matches List
  const [matches, setMatches] = useState<MatchEntry[]>([
    {
      id: 'match_1',
      matchNumber: 1,
      matchLabel: 'Match 1',
      metricValues: {
        placement: 1,
        kills: 0,
        damage: 0
      }
    }
  ]);

  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch Events and Registrations
  useEffect(() => {
    const initData = async () => {
      try {
        const [evList, regList] = await Promise.all([
          adminApi.getEvents(),
          adminApi.getRegistrations()
        ]);
        setEvents(Array.isArray(evList) ? evList : []);
        setRegistrations(Array.isArray(regList) ? regList : []);

        if (Array.isArray(evList) && evList.length > 0) {
          setSelectedEventId(evList[0].id);
          detectAndApplyGamePreset(evList[0].gameName);
        }
      } catch (err: any) {
        showNotify(err.message || 'Failed to initialize calculator data.', 'error');
      }
    };
    initData();
  }, []);

  const detectAndApplyGamePreset = (gameName?: string) => {
    if (!gameName) return;
    const gUpper = gameName.toUpperCase();
    let targetPreset = 'BGMI';
    if (gUpper.includes('BGMI') || gUpper.includes('PUBG')) {
      targetPreset = 'BGMI';
    } else if (gUpper.includes('FREE') || gUpper.includes('FIRE')) {
      targetPreset = 'FREE_FIRE';
    } else if (gUpper.includes('VALORANT') || gUpper.includes('CS') || gUpper.includes('SHOOTER')) {
      targetPreset = 'VALORANT';
    } else if (gUpper.includes('MINECRAFT') || gUpper.includes('BEDWARS') || gUpper.includes('CRAFT')) {
      targetPreset = 'MINECRAFT';
    }

    setActiveGamePreset(targetPreset);
    const preset = DEFAULT_PRESETS[targetPreset] || DEFAULT_PRESETS.BGMI;
    setCustomPlacementPoints({ ...preset.placementPoints });
    setCalculableMetrics([...preset.metrics]);
  };

  const handleEventChange = (eventId: string) => {
    sfx.playClick();
    setSelectedEventId(eventId);
    setSelectedRegistrationId('');
    const ev = events.find(e => e.id === eventId);
    if (ev) {
      detectAndApplyGamePreset(ev.gameName);
    }
  };

  const handlePresetChange = (presetKey: string) => {
    sfx.playClick();
    setActiveGamePreset(presetKey);
    const preset = DEFAULT_PRESETS[presetKey] || DEFAULT_PRESETS.BGMI;
    setCustomPlacementPoints({ ...preset.placementPoints });
    setCalculableMetrics([...preset.metrics]);
  };

  const currentEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Filtered registered players for the selected event
  const eventRegistrations = useMemo(() => {
    if (!currentEvent) return registrations;
    return registrations.filter(r => {
      if (r.eventId && r.eventId === currentEvent.id) return true;
      if (r.gameName && currentEvent.gameName && r.gameName.toUpperCase() === currentEvent.gameName.toUpperCase()) return true;
      if (r.gameId && currentEvent.gameName && r.gameId.toUpperCase() === currentEvent.gameName.toUpperCase()) return true;
      return false;
    });
  }, [registrations, currentEvent]);

  // Search filtered list
  const filteredEventRegistrations = useMemo(() => {
    if (!playerSearchQuery.trim()) return eventRegistrations;
    const q = playerSearchQuery.toLowerCase();
    return eventRegistrations.filter(r =>
      (r.teamName && r.teamName.toLowerCase().includes(q)) ||
      (r.gamerTag && r.gamerTag.toLowerCase().includes(q)) ||
      (r.fullName && r.fullName.toLowerCase().includes(q)) ||
      (r.playerName && r.playerName.toLowerCase().includes(q)) ||
      (r.discordUsername && r.discordUsername.toLowerCase().includes(q))
    );
  }, [eventRegistrations, playerSearchQuery]);

  // Selected Player Profile
  const selectedPlayer = useMemo(() => {
    return registrations.find(r => r.id === selectedRegistrationId) || null;
  }, [registrations, selectedRegistrationId]);

  // ─── ADD/DELETE DYNAMIC CALCULABLE KEY-VALUE METRICS ───────────────────────
  const handleAddNewCalculableMetric = () => {
    if (!newMetricKey.trim()) {
      showNotify('Please enter a metric key name (e.g. Revives, Rounds Won).', 'error');
      return;
    }
    sfx.playClick();
    const id = `metric_${Date.now()}`;
    const newMetric: CalculableMetric = {
      id,
      key: newMetricKey.trim(),
      type: 'multiplier',
      multiplier: newMetricMultiplier,
      defaultValue: 0,
      placeholder: `e.g. 0`,
      isCustom: true
    };
    setCalculableMetrics([...calculableMetrics, newMetric]);
    setNewMetricKey('');
    setNewMetricMultiplier(1);
    setIsAddingMetric(false);
    showNotify(`Added calculable metric: "${newMetric.key}" (${newMetric.multiplier} pts/unit)`);
  };

  const handleDeleteCalculableMetric = (metricId: string) => {
    sfx.playClick();
    setCalculableMetrics(calculableMetrics.filter(m => m.id !== metricId));
  };

  // ─── REAL-TIME CALCULABLE METRICS COMPUTATION FOR MULTI-MATCH ───────────────
  const matchCalculations = useMemo(() => {
    return matches.map((m) => {
      let matchPoints = 0;
      let matchKills = 0;
      let placement = 1;
      const breakdowns: Array<{ key: string; rawValue: number; calculatedPoints: number; multiplier: number; type: string }> = [];

      calculableMetrics.forEach((metric) => {
        const rawValue = m.metricValues[metric.id] ?? metric.defaultValue ?? 0;
        let points = 0;

        if (metric.type === 'rank_table') {
          placement = Math.max(1, Math.round(rawValue));
          points = customPlacementPoints[placement] ?? 0;
          breakdowns.push({
            key: metric.key,
            rawValue: placement,
            calculatedPoints: points,
            multiplier: 1,
            type: 'rank_table'
          });
        } else {
          points = rawValue * metric.multiplier;
          if (metric.id.includes('kill') || metric.key.toLowerCase().includes('kill')) {
            matchKills += rawValue;
          }
          breakdowns.push({
            key: metric.key,
            rawValue,
            calculatedPoints: points,
            multiplier: metric.multiplier,
            type: 'multiplier'
          });
        }

        matchPoints += points;
      });

      const matchTotal = Math.max(0, matchPoints);
      const isWin = placement === 1;

      return {
        id: m.id,
        matchLabel: m.matchLabel,
        placement,
        matchKills,
        breakdowns,
        matchTotal,
        isWin
      };
    });
  }, [matches, calculableMetrics, customPlacementPoints]);

  // Grand Total Series Aggregation
  const seriesTotals = useMemo(() => {
    let totalPoints = 0;
    let totalKills = 0;
    let totalWins = 0;

    matchCalculations.forEach(calc => {
      totalPoints += calc.matchTotal;
      totalKills += calc.matchKills;
      if (calc.isWin) totalWins += 1;
    });

    return {
      totalMatches: matchCalculations.length,
      totalPoints,
      totalKills,
      totalWins
    };
  }, [matchCalculations]);

  const showNotify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Match Management
  const handleAddMatch = () => {
    sfx.playClick();
    const nextNum = matches.length + 1;
    const initialValues: Record<string, number> = {};
    calculableMetrics.forEach(m => {
      initialValues[m.id] = m.defaultValue ?? 0;
    });

    const newMatch: MatchEntry = {
      id: `match_${Date.now()}`,
      matchNumber: nextNum,
      matchLabel: `Match ${nextNum}`,
      metricValues: initialValues
    };
    setMatches([...matches, newMatch]);
    setActiveMatchIndex(matches.length);
    showNotify(`Added Match ${nextNum} to series.`, 'success');
  };

  const handleRemoveMatch = (index: number) => {
    if (matches.length === 1) {
      showNotify('Cannot remove the only match.', 'error');
      return;
    }
    sfx.playClick();
    const updated = matches.filter((_, i) => i !== index).map((m, i) => ({
      ...m,
      matchNumber: i + 1,
      matchLabel: m.matchLabel.startsWith('Match ') ? `Match ${i + 1}` : m.matchLabel
    }));
    setMatches(updated);
    setActiveMatchIndex(Math.max(0, index - 1));
  };

  const updateCurrentMatchMetricValue = (metricId: string, value: number) => {
    setMatches(prev => {
      const copy = [...prev];
      if (copy[activeMatchIndex]) {
        copy[activeMatchIndex] = {
          ...copy[activeMatchIndex],
          metricValues: {
            ...copy[activeMatchIndex].metricValues,
            [metricId]: value
          }
        };
      }
      return copy;
    });
  };

  const currentActiveMatch = matches[activeMatchIndex] || matches[0];

  // ─── SUBMIT MULTI-MATCH EVENT TOTAL TO LEADERBOARD ─────────────────────────
  const handleSaveSeriesToLeaderboard = async () => {
    sfx.playClick();
    if (!selectedPlayer) {
      showNotify('Please select a registered player or team first.', 'error');
      return;
    }

    const teamOrPlayerName = selectedPlayer.teamName || selectedPlayer.fullName || selectedPlayer.playerName || 'Player';
    const gamerTag = selectedPlayer.gamerTag || selectedPlayer.teamName || teamOrPlayerName;

    try {
      setIsSubmitting(true);

      const res = await adminApi.recordMatchScore({
        playerId: selectedPlayer.id,
        playerName: teamOrPlayerName,
        gamerTag,
        game: currentEvent?.gameName || activeGamePreset,
        eventId: currentEvent?.id,
        eventName: currentEvent?.title,
        points: seriesTotals.totalPoints,
        kills: seriesTotals.totalKills,
        placement: matches[0]?.metricValues['placement'] || 1,
        isWin: seriesTotals.totalWins > 0,
        breakdown: {
          seriesMatchesCount: matches.length,
          calculableMetrics,
          matchBreakdowns: matchCalculations
        },
        notes: `Calculated from ${matches.length} Matches in ${currentEvent?.title || 'Event'}`
      });

      sfx.playSuccess();
      showNotify(res.message || `Recorded ${seriesTotals.totalPoints} total points for ${gamerTag}!`, 'success');
    } catch (err: any) {
      sfx.playError();
      showNotify(err.message || 'Failed to save score to leaderboard.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate Multi-Match Discord Scorecard
  const generateMultiMatchDiscordScorecard = () => {
    const teamOrPlayer = selectedPlayer?.teamName || selectedPlayer?.gamerTag || selectedPlayer?.fullName || 'Squad / Player';
    const game = currentEvent?.gameName || activeGamePreset;
    const eventTitle = currentEvent?.title || 'BlackHawk Tournament';

    let card = `🏆 **BLACKHAWK MATCH SCORECARD** 🏆\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎮 **Event:** ${eventTitle} (${game})\n` +
      `👥 **Team / Player:** \`${teamOrPlayer}\`\n` +
      `📊 **Series Rounds:** ${matches.length} Matches\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    matchCalculations.forEach((mc) => {
      const breakdownText = mc.breakdowns
        .filter(b => b.calculatedPoints !== 0 || b.rawValue !== 0)
        .map(b => `${b.key}: ${b.rawValue} (➔ ${b.calculatedPoints}pts)`)
        .join(' | ');

      card += `▶️ **${mc.matchLabel}:** ${breakdownText} ➔ **${mc.matchTotal} PTS**${mc.isWin ? ' 👑' : ''}\n`;
    });

    card += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🥇 **Total Wins:** ${seriesTotals.totalWins}\n` +
      `🔥 **CUMULATIVE EVENT SCORE:** **${seriesTotals.totalPoints} POINTS**\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    return card;
  };

  const handleCopyDiscordCard = () => {
    sfx.playClick();
    const text = generateMultiMatchDiscordScorecard();
    navigator.clipboard.writeText(text);
    setCopied(true);
    showNotify('Discord Scorecard copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium shadow-lg transition-all animate-in slide-in-from-top-2 ${
          notification.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
            : 'bg-red-950/80 border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/40 border border-red-500/30 text-[#ff4d4d] font-tech text-[10px] tracking-wider uppercase mb-1.5">
            <Calculator className="w-3 h-3" />
            <span>CUSTOM KEY-VALUE POINT ASSESSMENT ENGINE</span>
          </div>
          <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-white tracking-wide uppercase">
            EVENT POINTS CALCULATOR
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Select an event, choose registered participants, and compute points via customizable key-value scoring inputs.
          </p>
        </div>

        {/* Add Calculable Key-Value Metric Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sfx.playClick();
              setIsAddingMetric(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#D71920] hover:bg-[#e3262e] text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(215,25,32,0.4)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Calculable Metric</span>
          </button>
        </div>
      </div>

      {/* ─── ADD CUSTOM CALCULABLE KEY-VALUE METRIC MODAL / DRAWER ─── */}
      {isAddingMetric && (
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#180a0c] via-[#100808] to-[#0a0a0f] border border-red-500/30 shadow-2xl space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Tags className="w-4 h-4 text-[#D71920]" />
              <h3 className="font-cinzel text-sm sm:text-base font-bold text-white uppercase">
                CREATE CUSTOM CALCULABLE KEY-VALUE METRIC
              </h3>
            </div>
            <button
              onClick={() => setIsAddingMetric(false)}
              className="w-7 h-7 rounded-full bg-black/60 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5 space-y-1">
              <label className="text-[10px] font-tech text-zinc-400 font-bold uppercase">Metric Key / Field Name</label>
              <input
                type="text"
                placeholder="e.g. Revives, Rounds Won, Beds Broken, Airdrop Loot"
                value={newMetricKey}
                onChange={(e) => setNewMetricKey(e.target.value)}
                className="w-full bg-[#141418] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#D71920] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4 space-y-1">
              <label className="text-[10px] font-tech text-zinc-400 font-bold uppercase">Points Per Unit (Multiplier)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={newMetricMultiplier}
                  onChange={(e) => setNewMetricMultiplier(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#141418] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-[#D71920] focus:outline-none"
                />
                <span className="text-[10px] text-zinc-400 shrink-0 font-mono">PTS/UNIT</span>
              </div>
            </div>

            <div className="sm:col-span-3">
              <button
                onClick={handleAddNewCalculableMetric}
                className="w-full py-2.5 px-4 rounded-xl bg-[#D71920] hover:bg-[#e3262e] text-white font-tech text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Metric</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN WORKFLOW: EVENT & REGISTERED DIRECTORY + DYNAMIC CALCULABLE METRICS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Event Selector & Registered Participants (4 Cols) */}
        <div className="lg:col-span-4 space-y-4 p-4 rounded-2xl bg-[#0c0c0e] border border-white/10 shadow-lg">
          {/* Step 1: Event Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-tech uppercase font-bold tracking-wider text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-white">
                <Trophy className="w-3.5 h-3.5 text-[#D71920]" />
                <span>1. Select Event</span>
              </span>
              <span className="text-zinc-500 font-mono">{events.length} events</span>
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              className="w-full bg-[#141418] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:border-[#D71920] focus:outline-none"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.gameName})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Registered Participants Directory */}
          <div className="space-y-2.5 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-tech uppercase font-bold tracking-wider text-white flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Registered Participants</span>
              </label>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono font-bold">
                {eventRegistrations.length} Teams
              </span>
            </div>

            {/* Quick Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search registered team / player..."
                value={playerSearchQuery}
                onChange={(e) => setPlayerSearchQuery(e.target.value)}
                className="w-full bg-[#141418] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:border-[#D71920] focus:outline-none"
              />
            </div>

            {/* List of Registered Players */}
            <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-1 scrollbar-none">
              {filteredEventRegistrations.map((reg) => {
                const isSelected = selectedRegistrationId === reg.id;
                const displayName = reg.teamName || reg.fullName || reg.playerName || 'Team';
                const tag = reg.gamerTag || reg.teamName || '';
                return (
                  <div
                    key={reg.id}
                    onClick={() => {
                      sfx.playClick();
                      setSelectedRegistrationId(reg.id);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#240a0b] to-[#120708] border-[#D71920] text-white shadow-[0_0_15px_rgba(215,25,32,0.3)] ring-1 ring-[#D71920]'
                        : 'bg-[#121216] border-white/5 hover:border-white/20 text-zinc-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold truncate">{displayName}</span>
                        {reg.teamName && (
                          <span className="text-[8.5px] px-1 rounded bg-black/60 text-zinc-400 font-tech">
                            SQUAD
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                        <span className="truncate">Tag: {tag}</span>
                        {reg.discordUsername && <span className="truncate text-indigo-400">@{reg.discordUsername}</span>}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-[#D71920] translate-x-0.5' : 'text-zinc-600'}`} />
                  </div>
                );
              })}

              {filteredEventRegistrations.length === 0 && (
                <div className="py-8 text-center text-zinc-500 text-xs">
                  {eventRegistrations.length === 0 ? 'No players registered yet for this event.' : 'No matching registered players found.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Match Builder & Dynamic Calculable Key-Value Cards (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Selected Player Profile Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#140a0b] via-[#0d0d10] to-[#0d0d10] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-[9.5px] font-tech text-[#ff4d4d] font-bold uppercase tracking-wider block">
                SCORING PROFILE
              </span>
              <h2 className="font-cinzel text-lg sm:text-xl font-bold text-white">
                {selectedPlayer?.teamName || selectedPlayer?.fullName || selectedPlayer?.playerName || (
                  <span className="text-zinc-500 italic">Select a registered player on the left</span>
                )}
              </h2>
              {selectedPlayer && (
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  GamerTag: <strong className="text-white">{selectedPlayer.gamerTag || selectedPlayer.teamName}</strong> | Event: <span className="text-[#ff4d4d]">{currentEvent?.title}</span>
                </p>
              )}
            </div>

            {/* Preset Switcher */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <select
                value={activeGamePreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="bg-[#141418] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:border-[#D71920] focus:outline-none"
              >
                <option value="BGMI">BGMI (15-Pt Placement)</option>
                <option value="FREE_FIRE">Free Fire (12-Pt Placement)</option>
                <option value="VALORANT">Valorant (Match/Rounds)</option>
                <option value="MINECRAFT">Minecraft (Bedwars/Kills)</option>
              </select>
            </div>
          </div>

          {/* ─── MULTI-MATCH TABS & DYNAMIC CALCULABLE METRICS ─── */}
          <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/10 space-y-4 shadow-lg">
            {/* Match Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                {matches.map((m, idx) => {
                  const isActive = activeMatchIndex === idx;
                  const calc = matchCalculations[idx];
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        sfx.playClick();
                        setActiveMatchIndex(idx);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-tech font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#D71920] text-white shadow-[0_0_12px_rgba(215,25,32,0.4)]'
                          : 'bg-[#141418] text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>{m.matchLabel}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isActive ? 'bg-black/40 text-white' : 'bg-black/60 text-[#ff4d4d]'}`}>
                        {calc?.matchTotal || 0}pt
                      </span>
                    </button>
                  );
                })}

                {/* Add Match Button */}
                <button
                  onClick={handleAddMatch}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white text-xs font-tech font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add Match</span>
                </button>
              </div>

              {matches.length > 1 && (
                <button
                  onClick={() => handleRemoveMatch(activeMatchIndex)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  title="Remove this match"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px] font-tech">Remove Match</span>
                </button>
              )}
            </div>

            {/* ─── DYNAMIC CALCULABLE KEY-VALUE CARDS GRID ─── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-tech uppercase font-bold tracking-wider text-zinc-400">
                  CALCULABLE SCORING METRICS FOR {currentActiveMatch.matchLabel}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {calculableMetrics.length} Metric Key-Value Inputs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {calculableMetrics.map((metric) => {
                  const currentValue = currentActiveMatch.metricValues[metric.id] ?? metric.defaultValue ?? 0;
                  const calculatedPoints = metric.type === 'rank_table'
                    ? (customPlacementPoints[Math.max(1, Math.round(currentValue))] ?? 0)
                    : (currentValue * metric.multiplier);

                  return (
                    <div
                      key={metric.id}
                      className="p-3.5 rounded-2xl bg-black/50 border border-white/10 hover:border-white/20 transition-all space-y-1.5 relative group"
                    >
                      {/* Metric Header & Key Name */}
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] text-zinc-300 block font-tech uppercase font-bold truncate">
                          {metric.key}
                        </label>
                        {metric.isCustom && (
                          <button
                            onClick={() => handleDeleteCalculableMetric(metric.id)}
                            className="text-zinc-600 hover:text-red-400 transition-colors p-0.5"
                            title="Remove metric"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Number Input Box */}
                      <div className="relative">
                        <input
                          type="number"
                          min={metric.type === 'rank_table' ? 1 : 0}
                          placeholder={metric.placeholder || '0'}
                          value={currentValue}
                          onChange={(e) => updateCurrentMatchMetricValue(metric.id, parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#141418] border border-white/15 rounded-xl px-3 py-2 text-base text-white focus:border-[#D71920] focus:outline-none font-mono font-bold"
                        />
                      </div>

                      {/* Real-time Calculated Subtext */}
                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <span className="text-[#ff4d4d] font-mono font-bold">
                          = {calculatedPoints} PTS
                        </span>
                        {metric.type === 'multiplier' ? (
                          <span className="text-zinc-500 font-mono text-[9.5px]">
                            ({metric.multiplier} pt/unit)
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-mono text-[9.5px]">
                            (Rank Table)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── CUMULATIVE MULTI-MATCH SUMMARY SCORECARD & SAVE ─── */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#180a0b] via-[#100808] to-[#08080a] border border-red-500/30 shadow-[0_0_30px_rgba(215,25,32,0.18)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-tech uppercase tracking-widest text-[#ff4d4d] font-bold block">
                  CUMULATIVE TOURNAMENT SERIES SUMMARY
                </span>
                <h3 className="font-cinzel text-base sm:text-lg font-bold text-white">
                  {selectedPlayer?.teamName || selectedPlayer?.fullName || selectedPlayer?.playerName || 'Select a player to calculate'}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <span className="text-white font-bold">{seriesTotals.totalMatches} Matches</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{seriesTotals.totalWins} Wins</span>
                <span>•</span>
                <span className="text-white font-bold">{seriesTotals.totalKills} Total Kills</span>
              </div>
            </div>

            {/* Individual Matches Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              {matchCalculations.map((mc) => (
                <div key={mc.id} className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-bold text-white">{mc.matchLabel}</span>
                    <span className="text-[#ff4d4d] font-bold">{mc.matchTotal} PTS</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 space-y-0.5 pt-1 border-t border-white/5">
                    {mc.breakdowns.filter(b => b.calculatedPoints > 0 || b.rawValue > 0).map((b, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="truncate max-w-[110px]">{b.key}: {b.rawValue}</span>
                        <span className="font-bold text-zinc-300">+{b.calculatedPoints}p</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Massive Grand Total Points Display */}
            <div className="pt-3 border-t border-red-500/30 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-tech text-zinc-400 uppercase tracking-widest block font-bold">
                  GRAND TOTAL EVENT POINTS (ALL MATCHES)
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  Calculated dynamically across {seriesTotals.totalMatches} matches and {calculableMetrics.length} metrics
                </span>
              </div>

              <div className="text-right">
                <span className="font-bebas text-4xl sm:text-5xl text-white tracking-wider drop-shadow-[0_0_15px_rgba(215,25,32,0.6)]">
                  {seriesTotals.totalPoints}
                </span>
                <span className="text-xs font-tech text-[#ff4d4d] ml-1 font-bold">PTS</span>
              </div>
            </div>

            {/* Save & Discord Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleSaveSeriesToLeaderboard}
                disabled={isSubmitting || !selectedPlayer}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#D71920] to-[#b01318] hover:from-[#e3262e] hover:to-[#c4161d] text-white font-tech text-xs uppercase font-bold tracking-wider transition-all shadow-[0_0_20px_rgba(215,25,32,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Recording Matches...' : `Credit ${seriesTotals.totalPoints} Pts to Leaderboard`}</span>
              </button>

              <button
                onClick={handleCopyDiscordCard}
                disabled={!selectedPlayer}
                className="py-3 px-4 rounded-xl bg-[#141418] hover:bg-[#1a1a20] border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-tech text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#D71920]" />}
                <span>{copied ? 'Scorecard Copied!' : 'Copy Multi-Match Scorecard'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
