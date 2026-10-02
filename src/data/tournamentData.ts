export interface GameReward {
  label: string;
  amount: string;
  desc?: string;
}

export interface GameEvent {
  id: string;
  name: string;
  week: string;
  weekNumber: number;
  totalPrize: string;
  prizeNumber: number;
  tagline: string;
  genre: string;
  format: string;
  dateStatus: string;
  badge: string;
  accentColor: string;
  importantNote?: string;
  rewards: GameReward[];
  challenges: string[];
}

export interface WinMethod {
  id: number;
  title: string;
  amount: string;
  tagline: string;
  description: string;
  examples?: string[];
  iconName: string;
}

export interface ScheduleDay {
  day: string;
  phase: string;
  desc: string;
  icon: string;
}

export interface PointRule {
  rank: string;
  points: string;
  badge?: string;
}

export interface MonthlyReward {
  title: string;
  amount: string;
  pointsNote?: string;
}

export interface RuleCategory {
  id: string;
  title: string;
  content: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const TOURNAMENT_CONFIG = {
  hostName: "Blackhawk Team",
  hostBadge: "HOSTED BY BLACKHAWK TEAM",
  subBrand: "A Blackhawk Team Gaming Event",
  leagueTitle: "BLACKHAWK GAMING LEAGUE",
  headline: "THE GAME IS ON.",
  subheading: "A 5-week gaming league where competitive performance, improvement, participation and community moments all create opportunities to win.",
  totalPrizePool: "₹2,000",
  totalPrizeNumeric: 2000,
  weeksCount: 5,
  gamesCount: 5,
  monthlyPrize: "₹600",
  eventDates: "EVENT DATE — COMING SOON",
  registrationDeadline: "REGISTRATION DEADLINE — TO BE ANNOUNCED",
  discordLink: "https://discord.gg/WrxHsKbHY",
  contactEmail: "contact@blackhawkteam.gg",
  socials: {
    discord: "https://discord.gg/WrxHsKbHY",
    instagram: "#",
    youtube: "#",
  }
};

export const TIMELINE_OVERVIEW = [
  {
    week: "WEEK 01",
    game: "FREE FIRE",
    prize: "₹700",
    numeric: 700,
    status: "Upcoming",
    desc: "Squad battle royale with ₹300 winner, ₹100 kill leader, ₹50 random draw, ₹50 best performance, & ₹200 1v1 challenge.",
  },
  {
    week: "WEEK 02",
    game: "BGMI",
    prize: "₹350",
    numeric: 350,
    status: "Upcoming",
    desc: "Squad battle royale intensity. Reward is total winning squad prize.",
  },
  {
    week: "WEEK 03",
    game: "MINECRAFT",
    prize: "₹350",
    numeric: 350,
    status: "Upcoming",
    desc: "Build speed, survival gauntlets, and creative architectural battles.",
  },
  {
    week: "WEEK 04",
    game: "CHESS",
    prize: "₹200",
    numeric: 200,
    status: "Upcoming",
    desc: "Tactical blitz and rapid mastery. Calculated minds battle on the 64 squares.",
  },
  {
    week: "WEEK 05",
    game: "SCRIBBLE",
    prize: "₹150",
    numeric: 150,
    status: "Upcoming",
    desc: "Speed-drawing hilarity, fastest guessers, and iconic community moments.",
  },
  {
    week: "MONTHLY FINALS",
    game: "LEAGUE STANDINGS",
    prize: "₹600",
    numeric: 600,
    status: "Cumulative",
    desc: "Consistency rewards across all 5 weeks. 8 distinct reward tiers.",
  }
];

export const GAME_EVENTS: GameEvent[] = [
  {
    id: "freefire",
    name: "FREE FIRE",
    week: "WEEK 01",
    weekNumber: 1,
    totalPrize: "₹700",
    prizeNumber: 700,
    tagline: "Survival of the sharpest in mobile battle royale & 1v1 challenge.",
    genre: "Battle Royale & 1v1 Gauntlet",
    format: "Squad Custom Rooms & 1v1 Challenge",
    dateStatus: "EVENT DATE — COMING SOON",
    badge: "WEEK 01 COMBAT",
    accentColor: "#E10600",
    importantNote: "“Double or -₹100” 1v1 Challenge: If Event Winner wins the 1v1, total prize becomes ₹400. If Event Winner loses, they receive ₹200 and Challenger receives ₹100.",
    rewards: [
      { label: "Event Winner", amount: "₹300", desc: "Top placement champion (modifies to ₹400 on 1v1 victory, or ₹200 on defeat)" },
      { label: "“Double or -₹100” 1v1 Challenge", amount: "₹200", desc: "Top team vs challenger showdown (Win: ₹400 total / Loss: ₹200 to winner, ₹100 to challenger)" },
      { label: "Highest Eliminations", amount: "₹100", desc: "Top fragger bounty awarded to the athlete/squad with most confirmed kills" },
      { label: "Best Performance / Entertaining Gameplay", amount: "₹50", desc: "Standout clutch highlight, entertaining gameplay, and sportsmanship" },
      { label: "Random Draw", amount: "₹50", desc: "Transparent automated lucky draw across all verified attendees" }
    ],
    challenges: [
      "Main Battle Royale Bracket (₹300)",
      "“Double or -₹100” 1v1 Challenge with Top Team (₹200)",
      "Highest Elimination Bounty (₹100)",
      "Best Performance / Entertaining Gameplay (₹50)",
      "Verified Participation Random Draw (₹50)"
    ]
  },
  {
    id: "bgmi",
    name: "BGMI",
    week: "WEEK 02",
    weekNumber: 2,
    totalPrize: "₹350",
    prizeNumber: 350,
    tagline: "Battlegrounds Mobile India squad domination.",
    genre: "Tactical Battle Royale",
    format: "Squad Custom Lobbies",
    dateStatus: "EVENT DATE — COMING SOON",
    badge: "WEEK 02 SQUAD",
    accentColor: "#FF2A2A",
    importantNote: "₹150 Main Competition reward is the total winning squad reward, not ₹150 per player.",
    rewards: [
      { label: "Main Competition", amount: "₹150", desc: "Winning squad total reward" },
      { label: "Clash / Challenge", amount: "₹75", desc: "Top fragger or final circle clash challenge" },
      { label: "Rising Star", amount: "₹50", desc: "Breakout player showing massive mechanical growth" },
      { label: "Participation Draw", amount: "₹25", desc: "Random draw among all active participating squads" },
      { label: "Community / Best Moment", amount: "₹50", desc: "Funniest vehicle wipe or epic 1v4 clutch" }
    ],
    challenges: [
      "Main Squad Custom Lobby",
      "Erangle & Miramar Drop Clash",
      "Highest Elimination Squad",
      "Rising Star Player",
      "Community Clip of the Week"
    ]
  },
  {
    id: "minecraft",
    name: "MINECRAFT",
    week: "WEEK 03",
    weekNumber: 3,
    totalPrize: "₹350",
    prizeNumber: 350,
    tagline: "Creative mastery and survival grit on custom servers.",
    genre: "Sandbox / Survival / PvP",
    format: "Timed Server Events",
    dateStatus: "EVENT DATE — COMING SOON",
    badge: "WEEK 03 ARENA",
    accentColor: "#D11A1A",
    rewards: [
      { label: "Main Competition", amount: "₹150", desc: "Tournament bracket or main challenge winner" },
      { label: "Build / Survival Challenge", amount: "₹75", desc: "60-minute build challenge or hardcore survival" },
      { label: "Rising Star", amount: "₹50", desc: "Fastest learner with notable technical execution" },
      { label: "Participation Draw", amount: "₹25", desc: "Random lucky draw across all verified builders" },
      { label: "Community Moment", amount: "₹50", desc: "Most creative build or hilarious trap clip" }
    ],
    challenges: [
      "Main Competition",
      "Build Challenge",
      "Survival Challenge",
      "Creative Challenge",
      "Rising Star",
      "Community Moment"
    ]
  },
  {
    id: "chess",
    name: "CHESS",
    week: "WEEK 04",
    weekNumber: 4,
    totalPrize: "₹200",
    prizeNumber: 200,
    tagline: "64 squares, infinite combinations, pure tactical warfare.",
    genre: "Strategy",
    format: "Rapid / Blitz Swiss & Knockouts",
    dateStatus: "EVENT DATE — COMING SOON",
    badge: "WEEK 04 MINDSPORT",
    accentColor: "#B51212",
    rewards: [
      { label: "Main Competition", amount: "₹100", desc: "Tournament grand champion" },
      { label: "Challenge Match", amount: "₹40", desc: "King of the Hill or handicap challenge winner" },
      { label: "Tactical Challenge", amount: "₹25", desc: "Fastest puzzle solver / tactical puzzle rush" },
      { label: "Best Newcomer", amount: "₹20", desc: "Highest ranked unrated / rookie participant" },
      { label: "Community Choice", amount: "₹15", desc: "Most exciting or dramatic endgame sacrifice" }
    ],
    challenges: [
      "Main Competition",
      "Challenge Match",
      "Tactical Challenge",
      "Best Newcomer",
      "Community Choice",
      "Best Game / Moment"
    ]
  },
  {
    id: "scribble",
    name: "SCRIBBLE",
    week: "WEEK 05",
    weekNumber: 5,
    totalPrize: "₹150",
    prizeNumber: 150,
    tagline: "Lightning reflexes, sketchy sketches, and pure chaos.",
    genre: "Party / Casual",
    format: "Private Custom Rooms",
    dateStatus: "EVENT DATE — COMING SOON",
    badge: "WEEK 05 SHOWDOWN",
    accentColor: "#9C0E0E",
    rewards: [
      { label: "Main Competition", amount: "₹75", desc: "Room champion with highest overall score" },
      { label: "Fastest Guesser", amount: "₹30", desc: "Speed demon with most instant guesses" },
      { label: "Drawing Challenge", amount: "₹25", desc: "Best artistic representation under 40 seconds" },
      { label: "Rising Star", amount: "₹10", desc: "Player who rallied back with big improvements" },
      { label: "Community Choice", amount: "₹10", desc: "Funniest drawing or iconic blunder" }
    ],
    challenges: [
      "Main Competition",
      "Drawing Challenge",
      "Fastest Guesser",
      "Rising Star",
      "Community Choice",
      "Best / Funniest Moment"
    ]
  }
];

export const FIVE_WAYS_TO_WIN: WinMethod[] = [
  {
    id: 1,
    title: "MAIN COMPETITION",
    amount: "₹150",
    tagline: "Reward the strongest actual competitive performance.",
    description: "Battle through tournament brackets, placement tables, and high-intensity match rounds to claim top honors.",
    iconName: "Trophy"
  },
  {
    id: 2,
    title: "CLASH / CHALLENGE",
    amount: "₹75",
    tagline: "A high-pressure matchup or special skill challenge.",
    description: "Special weekly side missions designed to test specific skills and clutch decision making under pressure.",
    examples: [
      "Top Player vs Challenger",
      "Highest Elimination Challenge",
      "60-Minute Build Challenge",
      "Tactical Challenge",
      "Fastest Guesser"
    ],
    iconName: "Swords"
  },
  {
    id: 3,
    title: "RISING STAR",
    amount: "₹50",
    tagline: "Reward meaningful improvement or an unexpectedly strong performance.",
    description: "Winning isn't only about being the strongest player. Players who show major improvement can also earn rewards.",
    iconName: "Sparkles"
  },
  {
    id: 4,
    title: "PARTICIPATION DRAW",
    amount: "₹25",
    tagline: "Complete the required participation criteria and enter a transparent random draw.",
    description: "Every player who completes their scheduled matches is automatically entered into a live, provably fair draw.",
    iconName: "Dices"
  },
  {
    id: 5,
    title: "COMMUNITY / BEST MOMENT",
    amount: "₹50",
    tagline: "Best play, funniest moment, sportsmanship, personality or community-selected moment.",
    description: "Voted by the Blackhawk Team community. Clips, comedy, clutches, and outstanding sportsmanship are celebrated.",
    iconName: "Video"
  }
];

export const EVENT_FLOW_STEPS = [
  { step: "01", title: "REGISTER", desc: "Complete the unified one-time registration form with your gamer credentials." },
  { step: "02", title: "CHOOSE / JOIN EVENT", desc: "Opt into your desired weekly game room or compete across all 5 disciplines." },
  { step: "03", title: "QUALIFY", desc: "Check in on game day and complete preliminary seeding or qualifier rounds." },
  { step: "04", title: "MAIN COMPETITION", desc: "Enter custom battle rooms, brackets, or chess boards for the main title." },
  { step: "05", title: "CLASH / SPECIAL CHALLENGE", desc: "Participate in mid-week bounties, speedruns, duels, and skill tests." },
  { step: "06", title: "WEEKLY AWARDS", desc: "Collect instant weekly cash rewards across all 5 winning categories." },
  { step: "07", title: "LEAGUE POINTS", desc: "Earn official points based on placement, challenge wins, and sportsmanship." },
  { step: "08", title: "MONTHLY LEADERBOARD", desc: "Watch your rank climb on the 5-week cumulative Blackhawk leaderboard." },
  { step: "09", title: "FINAL REWARDS", desc: "Top overall finishers share the ₹600 monthly league grand prize pool." },
];

export const LEAGUE_POINTS_RULES: PointRule[] = [
  { rank: "1st Place", points: "10 Points", badge: "Gold Standard" },
  { rank: "2nd Place", points: "7 Points", badge: "Podium Finish" },
  { rank: "3rd Place", points: "5 Points", badge: "Bronze Tier" },
  { rank: "4th – 5th", points: "3 Points", badge: "Top 5 Contender" },
  { rank: "Participation", points: "1 Point", badge: "Match Completed" },
  { rank: "Challenge Win", points: "+3 Points", badge: "Bonus Objective" },
  { rank: "Rising Star", points: "+2 Points", badge: "Growth Bonus" }
];

export const MONTHLY_REWARDS_BREAKDOWN: MonthlyReward[] = [
  { title: "League Champion", amount: "₹200", pointsNote: "#1 Overall Leaderboard" },
  { title: "Runner-up", amount: "₹100", pointsNote: "#2 Overall Leaderboard" },
  { title: "3rd Place", amount: "₹75", pointsNote: "#3 Overall Leaderboard" },
  { title: "Most Improved", amount: "₹50", pointsNote: "Biggest Elo / Point Leap" },
  { title: "Best Newcomer", amount: "₹50", pointsNote: "Top Rookie Debut" },
  { title: "Community MVP", amount: "₹50", pointsNote: "Most Community Votes" },
  { title: "Most Consistent", amount: "₹25", pointsNote: "Active in All 5 Weeks" },
  { title: "Final Challenge", amount: "₹50", pointsNote: "Super-Challenge Champion" },
];

export const LEADERBOARD_MOCKUP = [
  { rank: 1, name: "Vortex_Phantom", tag: "VP#991", points: 120, wins: 4, gamesPlayed: 5, badge: "Grandmaster" },
  { rank: 2, name: "CrimsonHawk", tag: "CHK#402", points: 104, wins: 3, gamesPlayed: 5, badge: "Master" },
  { rank: 3, name: "ShadowStriker", tag: "SS#118", points: 97, wins: 2, gamesPlayed: 5, badge: "Diamond" },
  { rank: 4, name: "ApexBlaze", tag: "AB#774", points: 84, wins: 2, gamesPlayed: 4, badge: "Platinum" },
  { rank: 5, name: "NeonViper", tag: "NV#230", points: 76, wins: 1, gamesPlayed: 5, badge: "Gold" },
  { rank: 6, name: "IronClaw", tag: "IC#091", points: 68, wins: 1, gamesPlayed: 4, badge: "Silver" },
];

export const WEEKLY_OPS_SCHEDULE: ScheduleDay[] = [
  { day: "MONDAY", phase: "Registration / Open", desc: "Game check-ins open, room roster confirmation, brackets seeded.", icon: "UserPlus" },
  { day: "TUESDAY", phase: "Qualifiers", desc: "Preliminary heats, placement matches, and lobby sorting.", icon: "Target" },
  { day: "WEDNESDAY", phase: "Main Competition", desc: "Prime-time championship match rooms & live tournament showdowns.", icon: "Trophy" },
  { day: "THURSDAY", phase: "Clash / Challenge", desc: "High-roller sniper duels, build sprints, and tactical side quests.", icon: "Swords" },
  { day: "FRIDAY", phase: "Rising Star + Community", desc: "Reviewing player growth data & community clip highlight voting.", icon: "Sparkles" },
  { day: "SATURDAY", phase: "Participation Draw", desc: "Transparent provably fair live raffle for verified players.", icon: "Dices" },
  { day: "SUNDAY", phase: "Results + Leaderboard Update", desc: "Prize payouts released, League Points verified, standings updated.", icon: "Award" },
];

export const RULES_DATA: RuleCategory[] = [
  {
    id: "general",
    title: "General Rules",
    content: [
      "All competitors must maintain a respectful sporting attitude at all times.",
      "Any form of cheating, third-party software, emulators (unless explicitly permitted for a specific game), or teaming is strictly prohibited.",
      "Organizers reserve the right to verify identities and request gameplay recordings or screen shares during dispute investigations."
    ]
  },
  {
    id: "eligibility",
    title: "Eligibility",
    content: [
      "Open to all players with valid in-game IDs and active Discord accounts.",
      "Players must use their registered in-game handle during official match lobbies.",
      "Eligibility details for specialized challenge brackets will be announced alongside the specific event notice."
    ]
  },
  {
    id: "match",
    title: "Match Rules",
    content: [
      "Lobby credentials (Room ID and Password) are distributed 15 minutes before scheduled match times via Discord.",
      "Matches will start precisely at the scheduled time; late arrivals forfeit their slot to reserve players.",
      "Disconnects during a match will be handled according to individual game engine disconnect standards."
    ]
  },
  {
    id: "team",
    title: "Team Rules",
    content: [
      "Team-based rewards must clearly state whether the reward is the total team pool or per-player.",
      "For BGMI, the ₹150 Main Competition reward is the total winning squad reward, not ₹150 per player.",
      "Rosters are locked once the tournament round begins; unauthorized substitutions result in squad disqualification."
    ]
  },
  {
    id: "clash",
    title: "Clash Rules",
    content: [
      "Clash matches are structured challenge duels or high-stakes sudden death rounds.",
      "Specific loadouts, weapon restrictions, or custom room settings will be outlined 24 hours prior to the clash."
    ]
  },
  {
    id: "challenge",
    title: "Challenge Rules",
    content: [
      "Side challenges (e.g., fastest puzzle, build speedrun, top fragger) are judged strictly against verified timestamps and screen captures.",
      "Reward amounts, eligibility and scoring rules should be published before the affected event begins."
    ]
  },
  {
    id: "league-points",
    title: "League Points",
    content: [
      "League Points are allocated according to the published Base League Point Model.",
      "League Points should not be changed after results are known.",
      "In the event of a points tie in the monthly leaderboard, head-to-head match placements will serve as the tiebreaker."
    ]
  },
  {
    id: "participation-draw",
    title: "Participation Draw",
    content: [
      "Participation Draw uses transparent random selection.",
      "To be eligible, a registered player must join their scheduled match and actively play to completion.",
      "The random draw is conducted openly with a transparent seed or live screen demonstration."
    ]
  },
  {
    id: "community-voting",
    title: "Community Voting",
    content: [
      "Community clip nominations must be submitted via the designated Blackhawk Team channel.",
      "Only votes from verified community members count towards final tally.",
      "Vote manipulation or botting results in immediate submission disqualification."
    ]
  },
  {
    id: "prize-distribution",
    title: "Prize Distribution",
    content: [
      "Weekly cash prizes are processed within 48–72 hours of Sunday results verification.",
      "Payments are distributed via direct UPI / Bank Transfer to the winning team captain or player.",
      "Players must provide matching payment information matching their registration profile."
    ]
  },
  {
    id: "disqualification",
    title: "Disqualification",
    content: [
      "Unsportsmanlike conduct, toxicity, toxic chat, or hate speech carries zero tolerance and leads to instantaneous banishment.",
      "Exploiting game-breaking bugs or geometry glitches will incur immediate disqualification and forfeiture of accrued points."
    ]
  },
  {
    id: "dispute-handling",
    title: "Dispute Handling",
    content: [
      "All disputes must be filed within 30 minutes of match conclusion along with unedited screenshot or video proof.",
      "The decision of the Blackhawk Team head tournament admin is final and binding."
    ]
  }
];

export const FAQ_DATA: FAQItem[] = [
  {
    id: "faq-1",
    question: "What is the Gaming League?",
    answer: "The Gaming League is a premier 5-week tournament series hosted by Blackhawk Team featuring 5 diverse games, weekly cash prizes across multiple achievement categories, and a cumulative ₹600 Monthly League grand leaderboard."
  },
  {
    id: "faq-2",
    question: "Who is hosting the event?",
    answer: "The tournament is hosted, operated, and organized exclusively by Blackhawk Team. Blackhawk Team oversees tournament operations, custom match lobbies, point tracking, and transparent prize distribution."
  },
  {
    id: "faq-3",
    question: "How much is the total prize pool?",
    answer: "The total prize pool is ₹2,000 INR. This includes ₹1,400 distributed across weekly competitions (Free Fire ₹350, BGMI ₹350, Minecraft ₹350, Chess ₹200, Scribble ₹150) plus an additional ₹600 dedicated to the Monthly League leaderboard champions."
  },
  {
    id: "faq-4",
    question: "Which games are included?",
    answer: "The league features 5 battlegrounds: Week 01 Free Fire, Week 02 BGMI, Week 03 Minecraft, Week 04 Chess, and Week 05 Scribble."
  },
  {
    id: "faq-5",
    question: "Do I need to participate in every week?",
    answer: "No. You can participate in individual weeks of your choice for weekly prizes. However, playing across multiple weeks earns you cumulative League Points which qualify you for the ₹600 Monthly League Grand Prize Pool."
  },
  {
    id: "faq-6",
    question: "How does the Participation Draw work?",
    answer: "Participation Draw uses transparent random selection. Simply check in and play your scheduled match to completion to receive a raffle entry. A live provably fair draw is held each Saturday."
  },
  {
    id: "faq-7",
    question: "What is Rising Star?",
    answer: "Rising Star is a dedicated ₹50 reward designed to honor players who demonstrate remarkable mechanical improvement, strategic growth, or surprising resilience, ensuring tournament victory isn't restricted only to veteran champions."
  },
  {
    id: "faq-8",
    question: "How are League Points calculated?",
    answer: "League Points use our standardized Base League Point Model: 1st Place = 10 pts, 2nd Place = 7 pts, 3rd Place = 5 pts, 4th–5th = 3 pts, Participation = 1 pt, Challenge Win = +3 bonus pts, Rising Star = +2 bonus pts."
  },
  {
    id: "faq-9",
    question: "Can casual players win?",
    answer: "Absolutely! The league was specifically designed with 5 ways to win: Main Competition, Clash/Challenge, Rising Star, Participation Draw, and Community Best Moments. Even if you don't place first, you can win cash and points."
  },
  {
    id: "faq-10",
    question: "How does the Monthly League work?",
    answer: "All points earned from match placements, side challenges, and participation across the 5 weeks accumulate on the global leaderboard. At the end of Week 5, the top 8 positions and special categories share the ₹600 monthly reward pool."
  },
  {
    id: "faq-11",
    question: "Are team rewards split between players?",
    answer: "Team-based rewards are stated as the total team prize. For example, in BGMI, the ₹150 Main Competition reward is the total winning squad reward, not ₹150 per individual player."
  },
  {
    id: "faq-12",
    question: "Where will event announcements be posted?",
    answer: "Official announcements, bracket links, room credentials, and live match updates will be posted inside the official Blackhawk Team Discord and community channels."
  },
  {
    id: "faq-13",
    question: "How do I contact Blackhawk Team?",
    answer: "You can reach out directly to the Blackhawk Team tournament staff through our official Discord server help desk or by emailing contact@blackhawkteam.gg."
  }
];
