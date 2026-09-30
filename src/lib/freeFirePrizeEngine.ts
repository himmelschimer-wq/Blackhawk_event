/**
 * Free Fire Prize Rules & 1v1 Challenge Calculation Engine (Client Side)
 */

export interface FreeFirePrizeCategory {
  id: string;
  title: string;
  baseAmount: number;
  currency: string;
  eligibility: string;
  payoutCondition: string;
}

export interface FreeFire1v1Rules {
  challengeName: string;
  baseWinnerPrize: number;
  stakeAmount: number;
  maxWinnerPrize: number;
  minWinnerPrize: number;
  challengerRewardOnWin: number;
  challengerRewardOnLoss: number;
  payoutScenarios: Array<{
    outcome: 'WINNER_WON' | 'WINNER_LOST';
    label: string;
    winnerTotalPayout: number;
    challengerPayout: number;
    description: string;
  }>;
}

export interface FreeFirePrizeConfig {
  totalBasePool: number;
  currency: string;
  symbol: string;
  categories: FreeFirePrizeCategory[];
  challenge1v1Rules: FreeFire1v1Rules;
}

export const FREE_FIRE_PRIZE_CONFIG: FreeFirePrizeConfig = {
  totalBasePool: 700,
  currency: 'INR',
  symbol: '₹',
  categories: [
    {
      id: 'event_winner',
      title: 'Event Winner',
      baseAmount: 300,
      currency: 'INR',
      eligibility: '1st Place Champion in the main Free Fire tournament bracket',
      payoutCondition: 'Base ₹300; modified by 1v1 Challenge: ₹400 if won (+₹100 bonus), or ₹200 if lost (-₹100 penalty).'
    },
    {
      id: 'random_draw',
      title: 'Random Draw',
      baseAmount: 50,
      currency: 'INR',
      eligibility: 'All verified participating squads and players who completed their tournament matches',
      payoutCondition: 'Awarded to 1 randomly selected verified participant via automated lucky draw.'
    },
    {
      id: 'best_performance',
      title: 'Best Performance / Most Entertaining Gameplay',
      baseAmount: 50,
      currency: 'INR',
      eligibility: 'Athlete or squad exhibiting standout entertaining gameplay, highlight clutches, or exemplary sportsmanship',
      payoutCondition: 'Awarded after admin/community clip and match performance evaluation.'
    },
    {
      id: 'highest_eliminations',
      title: 'Highest Eliminations',
      baseAmount: 100,
      currency: 'INR',
      eligibility: 'Player or squad securing the highest total confirmed frags/kills across tournament matches',
      payoutCondition: 'Awarded directly to the top fragger according to official in-game match statistics.'
    },
    {
      id: 'challenge_1v1',
      title: '“Double or -₹100” 1v1 Challenge with Top Team',
      baseAmount: 200,
      currency: 'INR',
      eligibility: 'Event-winning team vs top challenger team',
      payoutCondition: 'If Event Winner wins: Event Winner total becomes ₹400, Challenger gets ₹0. If Event Winner loses: Event Winner receives ₹200, Challenger receives ₹100.'
    }
  ],
  challenge1v1Rules: {
    challengeName: '“Double or -₹100” 1v1 Challenge',
    baseWinnerPrize: 300,
    stakeAmount: 100,
    maxWinnerPrize: 400,
    minWinnerPrize: 200,
    challengerRewardOnWin: 100,
    challengerRewardOnLoss: 0,
    payoutScenarios: [
      {
        outcome: 'WINNER_WON',
        label: 'Event Winner Wins 1v1',
        winnerTotalPayout: 400,
        challengerPayout: 0,
        description: 'Event-winning team validates dominance and boosts total payout to ₹400.'
      },
      {
        outcome: 'WINNER_LOST',
        label: 'Challenger Wins 1v1',
        winnerTotalPayout: 200,
        challengerPayout: 100,
        description: 'Event-winning team receives ₹200 (-₹100 penalty); Challenging team receives ₹100.'
      }
    ]
  }
};

export interface FreeFireCalculationInput {
  winnerTeamName: string;
  winnerPlayerId?: string;
  challengerTeamName?: string;
  challengerPlayerId?: string;
  challenge1v1Outcome: 'WINNER_WON' | 'WINNER_LOST' | 'NO_CHALLENGE';
  randomDrawWinnerName: string;
  randomDrawPlayerId?: string;
  bestPerformanceWinnerName: string;
  bestPerformancePlayerId?: string;
  highestElimWinnerName: string;
  highestElimPlayerId?: string;
  notes?: string;
}

export interface ItemizedPayout {
  category: string;
  recipientName: string;
  recipientId?: string;
  amount: number;
  conditionApplied: string;
}

export interface FreeFirePayoutResult {
  eventId: string;
  game: string;
  winnerTeamName: string;
  challengerTeamName?: string;
  challengeOutcome: 'WINNER_WON' | 'WINNER_LOST' | 'NO_CHALLENGE';
  itemizedPayouts: ItemizedPayout[];
  totalPayoutDistributed: number;
  summaryByRecipient: Record<string, { totalAmount: number; categories: string[] }>;
  calculatedAt: string;
}

/**
 * Deterministically calculates all Free Fire event payouts based on the official rules
 */
export function calculateFreeFireEventPayouts(input: FreeFireCalculationInput): FreeFirePayoutResult {
  const itemizedPayouts: ItemizedPayout[] = [];
  const summaryByRecipient: Record<string, { totalAmount: number; categories: string[] }> = {};

  const addPayout = (category: string, name: string, id: string | undefined, amount: number, condition: string) => {
    itemizedPayouts.push({
      category,
      recipientName: name,
      recipientId: id,
      amount,
      conditionApplied: condition
    });

    if (!summaryByRecipient[name]) {
      summaryByRecipient[name] = { totalAmount: 0, categories: [] };
    }
    summaryByRecipient[name].totalAmount += amount;
    summaryByRecipient[name].categories.push(`${category} (₹${amount})`);
  };

  // 1. Calculate Event Winner & 1v1 Challenge Payouts
  if (input.challenge1v1Outcome === 'WINNER_WON') {
    addPayout(
      'Event Winner (1v1 Challenge Won)',
      input.winnerTeamName,
      input.winnerPlayerId,
      400,
      'Event-winning team won 1v1 challenge: ₹300 base + ₹100 bonus = ₹400 total payout'
    );
  } else if (input.challenge1v1Outcome === 'WINNER_LOST') {
    addPayout(
      'Event Winner (1v1 Challenge Lost)',
      input.winnerTeamName,
      input.winnerPlayerId,
      200,
      'Event-winning team lost 1v1 challenge: ₹300 base - ₹100 penalty = ₹200 total payout'
    );

    const challenger = input.challengerTeamName || 'Top Challenger Team';
    addPayout(
      '1v1 Challenge Bounty (Challenger Victory)',
      challenger,
      input.challengerPlayerId,
      100,
      'Challenging team defeated Event Winner in 1v1 challenge: ₹100 bounty awarded'
    );
  } else {
    // No challenge played
    addPayout(
      'Event Winner (Base Prize)',
      input.winnerTeamName,
      input.winnerPlayerId,
      300,
      'Event Winner base prize: ₹300 awarded (no 1v1 challenge conducted)'
    );
  }

  // 2. Random Draw (₹50)
  if (input.randomDrawWinnerName) {
    addPayout(
      'Random Draw',
      input.randomDrawWinnerName,
      input.randomDrawPlayerId,
      50,
      'Transparent automated random lucky draw across all verified participants'
    );
  }

  // 3. Best Performance / Entertaining Gameplay (₹50)
  if (input.bestPerformanceWinnerName) {
    addPayout(
      'Best Performance / Most Entertaining Gameplay',
      input.bestPerformanceWinnerName,
      input.bestPerformancePlayerId,
      50,
      'Adjudicated for standout gameplay highlight clips, entertainment, and sportsmanship'
    );
  }

  // 4. Highest Eliminations (₹100)
  if (input.highestElimWinnerName) {
    addPayout(
      'Highest Eliminations Bounty',
      input.highestElimWinnerName,
      input.highestElimPlayerId,
      100,
      'Awarded to the top fragger with the most confirmed in-game eliminations'
    );
  }

  const totalPayoutDistributed = itemizedPayouts.reduce((sum, p) => sum + p.amount, 0);

  return {
    eventId: 'ev-ff-1',
    game: 'Free Fire',
    winnerTeamName: input.winnerTeamName,
    challengerTeamName: input.challengerTeamName,
    challengeOutcome: input.challenge1v1Outcome,
    itemizedPayouts,
    totalPayoutDistributed,
    summaryByRecipient,
    calculatedAt: new Date().toISOString()
  };
}
