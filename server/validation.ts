import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(2, 'Username must be at least 2 characters').max(50, 'Username too long'),
  password: z.string().min(1, 'Password is required').max(128, 'Password too long'),
});

export const singleGameRegistrationSchema = z.object({
  gameId: z.string().trim().min(1).max(50),
  gameName: z.string().trim().max(60).optional(),
  eventId: z.string().trim().max(60).nullable().optional(),
  eventTitle: z.string().trim().max(100).nullable().optional(),
  playType: z.enum(['Solo', 'Team / Squad', 'Team']).default('Solo'),
  teamName: z.string().trim().max(80).nullable().optional(),
  teamMembers: z.string().trim().max(500).nullable().optional(),
  gameSpecificDetails: z.record(z.string(), z.any()).optional().default({}),
  gameSpecificData: z.record(z.string(), z.any()).optional(),
});

export const registrationInputSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(80, 'Full name cannot exceed 80 characters'),
  gamerTag: z.string().trim().min(2, 'Gamer tag must be at least 2 characters').max(40, 'Gamer tag cannot exceed 40 characters')
    .regex(/^[a-zA-Z0-9_\- #.@]+$/, 'Gamer tag contains disallowed special characters'),
  username: z.string().trim().max(40).optional(),
  discordUsername: z.string().trim().max(60).optional().default('N/A'),
  discordId: z.string().trim().max(60).optional(),
  email: z.string().trim().max(120).refine(val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: 'Invalid email address'
  }).optional().default(''),
  phone: z.string().trim().max(20).refine(val => !val || /^[\d+\-\s()]{7,20}$/.test(val), {
    message: 'Invalid phone number format'
  }).optional().default(''),
  games: z.array(singleGameRegistrationSchema).min(1, 'At least one game must be selected').max(10, 'Cannot register for more than 10 games at once'),
});

export const gameCreateSchema = z.object({
  id: z.string().trim().max(50).optional(),
  name: z.string().trim().min(1, 'Game name is required').max(60),
  description: z.string().trim().max(1000).optional().default(''),
  logo: z.string().trim().max(300).optional().default('/assets/badge_bgmi.png'),
  banner: z.string().trim().max(300).optional().default('/assets/official_game_bgmi.png'),
  category: z.string().trim().max(50).optional().default('ESPORTS'),
  defaultPrizePool: z.number().min(0).max(10000000).default(0),
  format: z.string().trim().max(40).optional().default('SOLO'),
  active: z.boolean().default(true),
});

export const gameUpdateSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  description: z.string().trim().max(1000).optional(),
  logo: z.string().trim().max(300).optional(),
  banner: z.string().trim().max(300).optional(),
  category: z.string().trim().max(50).optional(),
  defaultPrizePool: z.number().min(0).max(10000000).optional(),
  format: z.string().trim().max(40).optional(),
  active: z.boolean().optional(),
});

export const eventCreateSchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(100),
  gameId: z.string().trim().min(1, 'Game ID is required').max(50),
  gameName: z.string().trim().max(60).optional(),
  description: z.string().trim().max(2000).optional().default(''),
  date: z.string().trim().max(60).optional().default('TBA'),
  time: z.string().trim().max(40).optional().default('TBA'),
  format: z.string().trim().max(50).optional().default('Solo'),
  prizePool: z.number().min(0).max(10000000).default(0),
  maxParticipants: z.number().int().min(2).max(10000).default(100),
  registrationStatus: z.enum(['OPEN', 'CLOSED']).default('OPEN'),
  eventStatus: z.enum(['UPCOMING', 'REGISTRATION OPEN', 'LIVE', 'COMPLETED', 'ARCHIVED', 'CANCELLED']).default('REGISTRATION OPEN'),
  rules: z.string().trim().max(5000).optional().default('Standard tournament rules apply.'),
  generalRules: z.string().trim().max(5000).optional().default(''),
  banner: z.string().trim().max(300).optional().default('/assets/official_game_bgmi.png'),
});

export const eventUpdateSchema = z.object({
  title: z.string().trim().min(2).max(100).optional(),
  gameId: z.string().trim().max(50).optional(),
  gameName: z.string().trim().max(60).optional(),
  description: z.string().trim().max(2000).optional(),
  date: z.string().trim().max(60).optional(),
  time: z.string().trim().max(40).optional(),
  format: z.string().trim().max(50).optional(),
  prizePool: z.number().min(0).max(10000000).optional(),
  maxParticipants: z.number().int().min(2).max(10000).optional(),
  registrationStatus: z.enum(['OPEN', 'CLOSED']).optional(),
  eventStatus: z.enum(['UPCOMING', 'REGISTRATION OPEN', 'LIVE', 'COMPLETED', 'ARCHIVED', 'CANCELLED']).optional(),
  rules: z.string().trim().max(5000).optional(),
  generalRules: z.string().trim().max(5000).optional(),
  banner: z.string().trim().max(300).optional(),
});

export const matchRecordSchema = z.object({
  playerId: z.string().trim().max(100).optional(),
  playerName: z.string().trim().max(80).optional(),
  gamerTag: z.string().trim().min(1, 'Gamer tag is required').max(50),
  game: z.string().trim().max(50).optional().default('BGMI'),
  eventId: z.string().trim().max(60).nullable().optional(),
  eventName: z.string().trim().max(100).nullable().optional(),
  points: z.number().int().min(0, 'Points must be non-negative').max(50000, 'Points exceed valid tournament limits').default(0),
  kills: z.number().int().min(0, 'Kills must be non-negative').max(500, 'Kills exceed valid match limit').default(0),
  placement: z.number().int().min(0).max(150).default(0),
  isWin: z.boolean().optional(),
  breakdown: z.record(z.string(), z.any()).optional().default({}),
  notes: z.string().trim().max(500).optional().default(''),
});

export const playerUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  gamerTag: z.string().trim().min(2).max(40).optional(),
  discordUsername: z.string().trim().max(60).optional(),
  game: z.string().trim().max(50).optional(),
  team: z.string().trim().max(80).nullable().optional(),
  status: z.enum(['ACTIVE', 'DISQUALIFIED', 'BENCHED']).optional(),
});

export const registrationUpdateSchema = z.object({
  status: z.enum(['REGISTERED', 'APPROVED', 'REJECTED', 'DISQUALIFIED']).optional(),
  playType: z.enum(['Solo', 'Team / Squad', 'Team']).optional(),
  teamName: z.string().trim().max(80).nullable().optional(),
  teamMembers: z.string().trim().max(500).nullable().optional(),
});

export const leaderboardUpdateSchema = z.object({
  playerName: z.string().trim().max(80).optional(),
  gamerTag: z.string().trim().max(50).optional(),
  game: z.string().trim().max(50).optional(),
  points: z.number().int().min(0).max(1000000).optional(),
  wins: z.number().int().min(0).max(50000).optional(),
  matches: z.number().int().min(0).max(100000).optional(),
  score: z.number().int().min(0).max(500000).optional(),
  status: z.enum(['ACTIVE', 'DISQUALIFIED', 'BENCHED']).optional(),
});

export const payoutCalculateSchema = z.object({
  winnerTeamName: z.string().trim().min(1, 'Winner team/player name is required').max(80),
  winnerPlayerId: z.string().trim().max(80).optional(),
  challengerTeamName: z.string().trim().max(80).optional(),
  challengerPlayerId: z.string().trim().max(80).optional(),
  challenge1v1Outcome: z.enum(['WINNER_WON', 'WINNER_LOST', 'NO_CHALLENGE']).default('NO_CHALLENGE'),
  randomDrawWinnerName: z.string().trim().max(80).default(''),
  randomDrawPlayerId: z.string().trim().max(80).optional(),
  bestPerformanceWinnerName: z.string().trim().max(80).default(''),
  bestPerformancePlayerId: z.string().trim().max(80).optional(),
  highestElimWinnerName: z.string().trim().max(80).default(''),
  highestElimPlayerId: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
});
