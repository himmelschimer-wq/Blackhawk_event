import { pgTable, text, integer, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';

// 1. Users / Admins
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  role: text('role', { enum: ['ADMIN', 'ORGANIZER', 'VIEWER'] }).notNull().default('ORGANIZER'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Games
export const games = pgTable('games', {
  id: text('id').primaryKey(), // freefire, bgmi, minecraft, chess, scribble
  name: text('name').notNull(),
  weekNumber: integer('week_number').notNull(),
  defaultPrizePool: integer('default_prize_pool').notNull(),
  format: text('format').notNull(),
  genre: text('genre').notNull(),
});

// 3. Events
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  gameId: text('game_id').references(() => games.id).notNull(),
  title: text('title').notNull(),
  week: text('week').notNull(),
  prizePool: integer('prize_pool').notNull(),
  registrationStatus: text('registration_status', { enum: ['OPEN', 'CLOSED'] }).default('OPEN').notNull(),
  eventStatus: text('event_status', { enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'ARCHIVED'] }).default('UPCOMING').notNull(),
  startDate: text('start_date'),
  endDate: text('end_date'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Teams
export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  gameId: text('game_id').references(() => games.id).notNull(),
  captainId: text('captain_id'),
  membersList: text('members_list'), // Comma separated handles
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Players
export const players = pgTable('players', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: text('full_name').notNull(),
  gamerTag: text('gamer_tag').notNull().unique(),
  discordUsername: text('discord_username').notNull(),
  status: text('status', { enum: ['ACTIVE', 'DISQUALIFIED', 'BENCHED'] }).default('ACTIVE').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Registrations
export const registrations = pgTable('registrations', {
  id: text('id').primaryKey(), // e.g. BHL-914210
  playerId: uuid('playerId').references(() => players.id).notNull(),
  gameId: text('game_id').references(() => games.id).notNull(),
  week: text('week').notNull(),
  status: text('status', { enum: ['REGISTERED', 'APPROVED', 'REJECTED', 'DISQUALIFIED'] }).default('REGISTERED').notNull(),
  gameSpecificData: text('game_specific_data').notNull(), // JSON stringified
  teamId: uuid('team_id').references(() => teams.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Matches
export const matches = pgTable('matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  stage: text('stage').notNull(), // "Main Competition", "Clash", "Qualifiers"
  scheduledAt: text('scheduled_at'),
  status: text('status', { enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] }).default('SCHEDULED').notNull(),
});

// 8. Match Results & League Points
export const matchResults = pgTable('match_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchId: uuid('match_id').references(() => matches.id).notNull(),
  playerId: uuid('player_id').references(() => players.id).notNull(),
  placement: integer('placement'), // 1, 2, 3, 4, 5, etc.
  participated: boolean('participated').default(true).notNull(),
  challengeWinner: boolean('challenge_winner').default(false).notNull(),
  risingStar: boolean('rising_star').default(false).notNull(),
  
  // Rule-based engine outputs
  basePoints: integer('base_points').notNull().default(0),
  challengeBonus: integer('challenge_bonus').notNull().default(0),
  risingStarBonus: integer('rising_star_bonus').notNull().default(0),
  totalPoints: integer('total_points').notNull().default(0),
  
  status: text('status', { enum: ['DRAFT', 'REVIEW', 'PUBLISHED'] }).default('DRAFT').notNull(),
  publishedAt: timestamp('published_at'),
});

// 9. Draws (Participation Draw)
export const draws = pgTable('draws', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  winnerPlayerId: uuid('winner_player_id').references(() => players.id).notNull(),
  rewardAmount: integer('reward_amount').default(25).notNull(),
  eligibleCount: integer('eligible_count').notNull(),
  conductedBy: text('conducted_by').notNull(),
  drawnAt: timestamp('drawn_at').defaultNow().notNull(),
});

// 10. Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminUser: text('admin_user').notNull(),
  action: text('action').notNull(),
  targetEntity: text('target_entity').notNull(),
  targetId: text('target_id').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
