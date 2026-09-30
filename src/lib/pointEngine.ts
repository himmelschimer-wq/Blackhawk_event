export interface PointInput {
  placement?: number | null; // 1, 2, 3, 4, 5, or higher/null
  participated: boolean;
  challengeWinner?: boolean;
  risingStar?: boolean;
}

export interface PointBreakdown {
  basePoints: number;
  participationPoints: number;
  challengeBonus: number;
  risingStarBonus: number;
  totalPoints: number;
  explanation: string;
}

/**
 * Pure Rule-Based Point Calculation Engine.
 * Follows Blackhawk Team League Specifications:
 * - 1st: 10 pts
 * - 2nd: 7 pts
 * - 3rd: 5 pts
 * - 4th-5th: 3 pts
 * - Outside 1st-5th who participated: 1 pt (Participation points DO NOT stack on top of top 5 placements)
 * - Challenge Win: +3 pts
 * - Rising Star: +2 pts
 */
export function calculatePoints(input: PointInput): PointBreakdown {
  let basePoints = 0;
  let participationPoints = 0;
  let challengeBonus = 0;
  let risingStarBonus = 0;
  const notes: string[] = [];

  const { placement, participated, challengeWinner, risingStar } = input;

  if (placement === 1) {
    basePoints = 10;
    notes.push('1st Place: 10 pts');
  } else if (placement === 2) {
    basePoints = 7;
    notes.push('2nd Place: 7 pts');
  } else if (placement === 3) {
    basePoints = 5;
    notes.push('3rd Place: 5 pts');
  } else if (placement === 4 || placement === 5) {
    basePoints = 3;
    notes.push(`${placement}th Place: 3 pts`);
  } else if (participated) {
    // Players outside 1st-5th who participated receive exactly 1 base point
    participationPoints = 1;
    notes.push('Participation: 1 pt');
  }

  if (challengeWinner) {
    challengeBonus = 3;
    notes.push('Challenge Win Bonus: +3 pts');
  }

  if (risingStar) {
    risingStarBonus = 2;
    notes.push('Rising Star Bonus: +2 pts');
  }

  const totalPoints = basePoints + participationPoints + challengeBonus + risingStarBonus;

  return {
    basePoints,
    participationPoints,
    challengeBonus,
    risingStarBonus,
    totalPoints,
    explanation: notes.join(' | ') || 'No points recorded'
  };
}
