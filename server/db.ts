import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.DATABASE_URL || path.join(DATA_DIR, 'blackhawk.db');
export const db = new DatabaseSync(DB_PATH);

// Enable Foreign Keys & WAL mode for high performance
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  // 1. Admins Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      displayName TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'ADMIN',
      createdAt TEXT NOT NULL
    );
  `);

  // 2. Sessions Table (for secure authentication)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      adminId TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (adminId) REFERENCES admins(id) ON DELETE CASCADE
    );
  `);

  // 3. Games Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      logo TEXT,
      banner TEXT,
      category TEXT,
      defaultPrizePool INTEGER NOT NULL DEFAULT 0,
      format TEXT NOT NULL DEFAULT 'SOLO',
      active INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL
    );
  `);

  // 4. Events / Tournaments Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      gameName TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'SOLO',
      prizePool INTEGER NOT NULL DEFAULT 0,
      maxParticipants INTEGER NOT NULL DEFAULT 100,
      registrationStatus TEXT NOT NULL DEFAULT 'OPEN',
      eventStatus TEXT NOT NULL DEFAULT 'UPCOMING',
      rules TEXT,
      generalRules TEXT,
      banner TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE
    );
  `);

  // Add generalRules column if missing (migration for existing DBs)
  try { db.exec(`ALTER TABLE events ADD COLUMN generalRules TEXT DEFAULT ''`); } catch { /* column exists */ }

  // 5. Players Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      gamerTag TEXT UNIQUE NOT NULL,
      discordUsername TEXT NOT NULL,
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      game TEXT NOT NULL DEFAULT 'ALL',
      team TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      createdAt TEXT NOT NULL
    );
  `);

  // Add email/phone columns if missing (migration for existing DBs)
  try { db.exec(`ALTER TABLE players ADD COLUMN email TEXT DEFAULT ''`); } catch { /* column exists */ }
  try { db.exec(`ALTER TABLE players ADD COLUMN phone TEXT DEFAULT ''`); } catch { /* column exists */ }

  // 6. Registrations Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      playerId TEXT NOT NULL,
      playerName TEXT NOT NULL,
      gamerTag TEXT NOT NULL,
      discordUsername TEXT NOT NULL,
      gameId TEXT NOT NULL,
      gameName TEXT NOT NULL,
      eventId TEXT,
      eventTitle TEXT,
      teamName TEXT,
      teamMembers TEXT,
      gameSpecificData TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'REGISTERED',
      registeredAt TEXT NOT NULL,
      FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE
    );
  `);

  // Index for fast duplicate registration checks
  db.exec(`CREATE INDEX IF NOT EXISTS idx_registrations_gamer_game ON registrations(gamerTag, gameId)`);

  // Purge expired sessions on startup
  const now = Date.now();
  db.prepare('DELETE FROM sessions WHERE expiresAt < ?').run(now);
  const purged = db.prepare('SELECT changes() as c').get() as any;
  if (purged?.c > 0) console.log(`[Database] Purged ${purged.c} expired session(s).`);

  // 7. Leaderboard Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id TEXT PRIMARY KEY,
      playerId TEXT NOT NULL UNIQUE,
      playerName TEXT NOT NULL,
      gamerTag TEXT NOT NULL,
      game TEXT NOT NULL DEFAULT 'ALL',
      avatar TEXT,
      matches INTEGER NOT NULL DEFAULT 0,
      wins INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      points INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE
    );
  `);

  // Seed default admin if no admin exists (only if explicit environment credentials are provided)
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number };
  if (adminCount.count === 0 && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    const adminUser = process.env.ADMIN_USERNAME.trim();
    const adminPass = process.env.ADMIN_PASSWORD.trim();
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(adminPass, salt);
    const adminId = 'adm-' + Date.now();
    
    db.prepare(`
      INSERT INTO admins (id, username, displayName, passwordHash, role, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(adminId, adminUser, 'BlackHawk High Command', hash, 'ADMIN', new Date().toISOString());
    
    console.log(`[Database] Initial admin created from environment: username="${adminUser}"`);
  }

  // Seed default games if table is empty
  const gameCount = db.prepare('SELECT COUNT(*) as count FROM games').get() as { count: number };
  if (gameCount.count === 0) {
    const initialGames = [
      {
        id: 'freefire',
        name: 'FREE FIRE',
        description: 'Free Fire high-octane survival clash, squad gauntlet & 1v1 challenge.',
        logo: '/assets/badge_freefire.png',
        banner: '/assets/official_game_freefire.png',
        category: 'SURVIVAL SHOOTER',
        defaultPrizePool: 700,
        format: 'SQUAD & 1v1',
        active: 1
      },
      {
        id: 'bgmi',
        name: 'BGMI',
        description: 'Battlegrounds Mobile India squad & solo championship series.',
        logo: '/assets/badge_bgmi.png',
        banner: '/assets/official_game_bgmi.png',
        category: 'BATTLE ROYALE',
        defaultPrizePool: 350,
        format: 'SOLO / SQUAD',
        active: 1
      },
      {
        id: 'valorant',
        name: 'VALORANT',
        description: '5v5 tactical spike rush, precision gunplay, and clutch tournament.',
        logo: '/assets/badge_valorant.png',
        banner: '/assets/official_game_valorant.png',
        category: 'TACTICAL 5v5',
        defaultPrizePool: 20000,
        format: '5v5',
        active: 1
      },
      {
        id: 'minecraft',
        name: 'MINECRAFT',
        description: 'Competitive build battle, survival games, and PvP arena clash.',
        logo: '/assets/badge_minecraft.png',
        banner: '/assets/official_game_minecraft.png',
        category: 'BUILD & PVP',
        defaultPrizePool: 350,
        format: 'SOLO',
        active: 1
      },
      {
        id: 'chess',
        name: 'CHESS',
        description: 'Rapid and blitz tactical mastery across 64 squares.',
        logo: '/assets/badge_bgmi.png',
        banner: '/assets/official_game_bgmi.png',
        category: 'STRATEGY',
        defaultPrizePool: 200,
        format: 'SOLO',
        active: 1
      },
      {
        id: 'scribble',
        name: 'SCRIBBLE',
        description: 'Lightning speed sketch & guess community showdown.',
        logo: '/assets/badge_minecraft.png',
        banner: '/assets/official_game_minecraft.png',
        category: 'PARTY & CASUAL',
        defaultPrizePool: 150,
        format: 'SOLO',
        active: 1
      }
    ];

    const insertGame = db.prepare(`
      INSERT INTO games (id, name, description, logo, banner, category, defaultPrizePool, format, active, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const g of initialGames) {
      insertGame.run(g.id, g.name, g.description, g.logo, g.banner, g.category, g.defaultPrizePool, g.format, g.active, new Date().toISOString());
    }
    console.log('[Database] Seeded 6 official games into database.');
  }

  // Seed default events if table is empty
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
  if (eventCount.count === 0) {
    const initialEvents = [
      {
        id: 'ev-ff-1',
        gameId: 'freefire',
        gameName: 'FREE FIRE',
        title: 'Free Fire Squad Showdown & 1v1 Gauntlet',
        description: 'Squad battle royale with ₹300 winner, ₹100 kill leader, ₹50 draw, ₹50 best clip, and ₹200 1v1 challenge.',
        date: 'OCT 15, 2026',
        time: '7:00 PM',
        format: 'SQUAD & 1v1',
        prizePool: 700,
        maxParticipants: 48,
        registrationStatus: 'OPEN',
        eventStatus: 'REGISTRATION OPEN',
        rules: '1. 4-Man Squad custom room + optional 1v1 Gauntlet showdown.\n2. Mobile devices only. Emulators, iPad view mods, and third-party scripts strictly prohibited.\n3. Character skills & loadouts are permitted.\n4. Winning squad leader must submit in-game match end screenshot and victory POV recording upon request.\n5. “Double or -₹100” 1v1 Challenge is contested immediately following the main bracket.',
        generalRules: '1. All participating athletes must join the BlackHawk official Discord 15 minutes before scheduled match start.\n2. Fair play is enforced with zero tolerance for toxicity, hacking, or match-fixing.\n3. Prizes are disbursed directly via UPI / Bank Transfer within 24-48 hours of verification.\n4. High Command admin decisions on dispute resolutions and replay audits are final.',
        banner: '/assets/official_game_freefire.png'
      },
      {
        id: 'ev-bgmi-1',
        gameId: 'bgmi',
        gameName: 'BGMI',
        title: 'BGMI Squad Erangel Clash',
        description: 'Premier squad battle royale tournament across Erangel custom rooms.',
        date: 'OCT 12, 2026',
        time: '6:00 PM',
        format: 'SQUAD',
        prizePool: 350,
        maxParticipants: 64,
        registrationStatus: 'OPEN',
        eventStatus: 'REGISTRATION OPEN',
        rules: '1. Squad custom room lobby across Erangel & Miramar.\n2. Mobile devices only; emulators, triggers, and GFX tools are strictly forbidden.\n3. Squad captain must record voice comms and submit final kill tally screenshot.\n4. In case of room crash, the match will be restarted once.',
        generalRules: '1. Discord check-in mandatory 15 minutes prior to match time.\n2. Zero tolerance for unverified roster swaps.\n3. Transparent prize payouts within 24-48h of match verification.',
        banner: '/assets/official_game_bgmi.png'
      },
      {
        id: 'ev-val-1',
        gameId: 'valorant',
        gameName: 'VALORANT',
        title: 'Valorant 5v5 Spike Rush Cup',
        description: 'Single elimination bracket 5v5 spike plant competitive tournament.',
        date: 'OCT 18, 2026',
        time: '6:00 PM',
        format: '5v5',
        prizePool: 20000,
        maxParticipants: 16,
        registrationStatus: 'OPEN',
        eventStatus: 'REGISTRATION OPEN',
        rules: '1. 5v5 Spike Plant competitive custom tournament mode.\n2. Map veto conducted in Discord lobby 15 minutes prior.\n3. Riot Vanguard active; any injection or cheating leads to instant disqualification.\n4. Tactical timeouts permitted (1 per team per half).',
        generalRules: '1. Official Discord voice rooms used for team comms.\n2. Good sportsmanship and fair play enforced.\n3. Instant prize distribution post-verification.',
        banner: '/assets/official_game_valorant.png'
      },
      {
        id: 'ev-mc-1',
        gameId: 'minecraft',
        gameName: 'MINECRAFT',
        title: 'Minecraft Build Battle & Survival',
        description: 'Fast-paced theme building challenge and PvP survival gauntlet.',
        date: 'OCT 20, 2026',
        time: '5:00 PM',
        format: 'SOLO',
        prizePool: 350,
        maxParticipants: 50,
        registrationStatus: 'OPEN',
        eventStatus: 'REGISTRATION OPEN',
        rules: '1. Timed 60-minute Build Challenge + Hardcore Survival PvP Arena.\n2. Minecraft Java Edition 1.20+ vanilla client only (no X-Ray or hack clients).\n3. Judges score builds based on Creativity, Complexity, and Theme adherence.',
        generalRules: '1. Discord voice check-in required on match day.\n2. Griefing outside designated arena boundaries prohibited.\n3. Payout disbursed upon official judges score publication.',
        banner: '/assets/official_game_minecraft.png'
      },
      {
        id: 'ev-chess-1',
        gameId: 'chess',
        gameName: 'CHESS',
        title: 'BlackHawk Blitz Chess Championship',
        description: 'Tactical Swiss system rapid and blitz chess open.',
        date: 'OCT 22, 2026',
        time: '5:00 PM',
        format: 'SOLO',
        prizePool: 200,
        maxParticipants: 32,
        registrationStatus: 'OPEN',
        eventStatus: 'REGISTRATION OPEN',
        rules: '1. Swiss system blitz (3+2 / 5+0) via Chess.com / Lichess custom arena.\n2. Webcams / screen share in Discord mandatory for anti-cheat verification.\n3. Computer engine assistance, tablebases, or third-party hints strictly prohibited.',
        generalRules: '1. Strict anti-cheat algorithm checks applied to all moves.\n2. Disqualification for players failing to join Discord on time.\n3. Instant prize distribution upon fair-play clearance.',
        banner: '/assets/official_game_bgmi.png'
      },
      {
        id: 'ev-sc-1',
        gameId: 'scribble',
        gameName: 'SCRIBBLE',
        title: 'Scribble Speed-Guesser Blitz',
        description: 'Fast-paced party custom room for fastest guessers and best artists.',
        date: 'OCT 25, 2026',
        time: '6:00 PM',
        format: 'SOLO',
        prizePool: 150,
        maxParticipants: 24,
        registrationStatus: 'OPEN',
        eventStatus: 'REGISTRATION OPEN',
        rules: '1. Custom private rooms with 6 rounds of speed sketching.\n2. No writing out the word letters directly on canvas.\n3. Fastest guessers score maximum bonus multiplier.',
        generalRules: '1. Community fair play and respect in chat.\n2. Room IDs distributed 10 minutes prior on Discord.\n3. Instant winner payouts upon final scoreboard capture.',
        banner: '/assets/official_game_minecraft.png'
      }
    ];

    const insertEvent = db.prepare(`
      INSERT INTO events (id, gameId, gameName, title, description, date, time, format, prizePool, maxParticipants, registrationStatus, eventStatus, rules, generalRules, banner, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const ev of initialEvents) {
      insertEvent.run(
        ev.id, ev.gameId, ev.gameName, ev.title, ev.description,
        ev.date, ev.time, ev.format, ev.prizePool, ev.maxParticipants,
        ev.registrationStatus, ev.eventStatus, ev.rules, ev.generalRules, ev.banner,
        new Date().toISOString()
      );
    }
    console.log('[Database] Seeded 6 official events into database.');
  }
}


