import { calculatePoints, type PointBreakdown } from './pointEngine';
import { 
  rtdb, 
  firebaseConnectionManager, 
  sanitizeForFirebase, 
  parseFirebaseList 
} from './firebase';
import { ref, onValue, set, remove, update } from 'firebase/database';

export type UserRole = 'ADMIN' | 'ORGANIZER' | 'VIEWER';

export interface PlayerRecord {
  id: string;
  fullName: string;
  gamerTag: string;
  discordUsername: string;
  status: 'ACTIVE' | 'DISQUALIFIED' | 'BENCHED';
  joinedAt: string;
}

export interface RegistrationRecord {
  id: string; // BHL-XXXXXX
  playerId: string;
  playerName: string;
  gamerTag: string;
  discordUsername: string;
  gameId: string;
  gameName: string;
  eventId?: string;
  eventTitle?: string;
  week?: string;
  status: 'REGISTERED' | 'APPROVED' | 'REJECTED' | 'DISQUALIFIED';
  playType: 'Solo' | 'Team / Squad';
  teamName?: string;
  teamMembers?: string;
  gameSpecificDetails: Record<string, string>;
  createdAt: string;
}

export interface EventRecord {
  id: string;
  gameId: string;
  gameName: string;
  week: string;
  weekNumber: number;
  prizePool: number;
  registrationStatus: 'OPEN' | 'CLOSED';
  eventStatus: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ARCHIVED';
  startDate: string;
  endDate: string;
  description: string;
}

export interface MatchResultRecord {
  id: string;
  eventId: string;
  gameName: string;
  week: string;
  playerId: string;
  playerName: string;
  gamerTag: string;
  placement: number | null;
  participated: boolean;
  challengeWinner: boolean;
  risingStar: boolean;
  points: PointBreakdown;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED';
  publishedAt?: string;
  updatedAt: string;
}

export interface DrawRecord {
  id: string;
  eventId: string;
  gameName: string;
  week: string;
  winnerPlayerId: string;
  winnerName: string;
  winnerTag: string;
  rewardAmount: number;
  eligibleCount: number;
  conductedBy: string;
  drawnAt: string;
}

export interface AuditLogRecord {
  id: string;
  adminUser: string;
  role: UserRole;
  action: string;
  targetEntity: string;
  targetId: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface RewardConfig {
  mainCompetition: number;
  clashChallenge: number;
  risingStar: number;
  participationDraw: number;
  communityMoment: number;
  monthlyLeagueTotal: number;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  gamerTag: string;
  discordUsername: string;
  totalPoints: number;
  eventsParticipated: number;
  winsCount: number;
  breakdown: Array<{
    week: string;
    gameName: string;
    placement?: number | null;
    challengeWin: boolean;
    risingStar: boolean;
    pointsAwarded: number;
    explanation: string;
  }>;
}

// Initial Seed Data
const INITIAL_EVENTS: EventRecord[] = [
  {
    id: 'evt-1',
    gameId: 'freefire',
    gameName: 'FREE FIRE',
    week: 'WEEK 01',
    weekNumber: 1,
    prizePool: 350,
    registrationStatus: 'OPEN',
    eventStatus: 'LIVE',
    startDate: 'EVENT DATE — COMING SOON',
    endDate: 'TO BE ANNOUNCED',
    description: 'Fast-paced mobile battle royale showdown with sniper clash and rising star rewards.'
  },
  {
    id: 'evt-2',
    gameId: 'bgmi',
    gameName: 'BGMI',
    week: 'WEEK 02',
    weekNumber: 2,
    prizePool: 350,
    registrationStatus: 'OPEN',
    eventStatus: 'UPCOMING',
    startDate: 'EVENT DATE — COMING SOON',
    endDate: 'TO BE ANNOUNCED',
    description: 'Squad battle royale intensity. Reward is total winning squad prize.'
  },
  {
    id: 'evt-3',
    gameId: 'minecraft',
    gameName: 'MINECRAFT',
    week: 'WEEK 03',
    weekNumber: 3,
    prizePool: 350,
    registrationStatus: 'OPEN',
    eventStatus: 'UPCOMING',
    startDate: 'EVENT DATE — COMING SOON',
    endDate: 'TO BE ANNOUNCED',
    description: 'Build speed, survival gauntlets, and creative architectural battles.'
  },
  {
    id: 'evt-4',
    gameId: 'chess',
    gameName: 'CHESS',
    week: 'WEEK 04',
    weekNumber: 4,
    prizePool: 200,
    registrationStatus: 'OPEN',
    eventStatus: 'UPCOMING',
    startDate: 'EVENT DATE — COMING SOON',
    endDate: 'TO BE ANNOUNCED',
    description: 'Tactical blitz and rapid mastery on 64 squares.'
  },
  {
    id: 'evt-5',
    gameId: 'scribble',
    gameName: 'SCRIBBLE',
    week: 'WEEK 05',
    weekNumber: 5,
    prizePool: 150,
    registrationStatus: 'OPEN',
    eventStatus: 'UPCOMING',
    startDate: 'EVENT DATE — COMING SOON',
    endDate: 'TO BE ANNOUNCED',
    description: 'Speed-drawing hilarity, fastest guessers, and iconic community moments.'
  }
];

const INITIAL_PLAYERS: PlayerRecord[] = [
  { id: 'p-1', fullName: 'Kirito Kumar', gamerTag: 'Kirito_99', discordUsername: 'kirito#1010', status: 'ACTIVE', joinedAt: '2026-09-20' },
  { id: 'p-2', fullName: 'Rohan Sharma', gamerTag: 'CrimsonHawk', discordUsername: 'crimson#4421', status: 'ACTIVE', joinedAt: '2026-09-20' },
  { id: 'p-3', fullName: 'Aarav Patel', gamerTag: 'ShadowStriker', discordUsername: 'aarav_shadow', status: 'ACTIVE', joinedAt: '2026-09-21' },
  { id: 'p-4', fullName: 'Kavya Verma', gamerTag: 'ApexBlaze', discordUsername: 'kavya_blaze', status: 'ACTIVE', joinedAt: '2026-09-22' },
  { id: 'p-5', fullName: 'Devansh Singh', gamerTag: 'NeonViper', discordUsername: 'dev_viper', status: 'ACTIVE', joinedAt: '2026-09-22' },
  { id: 'p-6', fullName: 'Tanmay Joshi', gamerTag: 'IronClaw', discordUsername: 'ironclaw#789', status: 'ACTIVE', joinedAt: '2026-09-23' },
  { id: 'p-7', fullName: 'Zack Fernandez', gamerTag: 'GhostRider', discordUsername: 'ghostzack', status: 'ACTIVE', joinedAt: '2026-09-24' },
];

const INITIAL_REGISTRATIONS: RegistrationRecord[] = [
  {
    id: 'BHL-712849',
    playerId: 'p-1',
    playerName: 'Kirito Kumar',
    gamerTag: 'Kirito_99',
    discordUsername: 'kirito#1010',
    gameId: 'freefire',
    gameName: 'FREE FIRE',
    week: 'WEEK 01',
    status: 'APPROVED',
    playType: 'Solo',
    gameSpecificDetails: { 'Free Fire UID': '982736152', 'In-Game Name': 'Kirito_FF', 'Format': 'Solo' },
    createdAt: '2026-09-21T10:00:00Z'
  },
  {
    id: 'BHL-409182',
    playerId: 'p-2',
    playerName: 'Rohan Sharma',
    gamerTag: 'CrimsonHawk',
    discordUsername: 'crimson#4421',
    gameId: 'freefire',
    gameName: 'FREE FIRE',
    week: 'WEEK 01',
    status: 'APPROVED',
    playType: 'Team / Squad',
    teamName: 'Team Crimson',
    teamMembers: 'CrimsonHawk, Blazer, SniperKing, Phoenix',
    gameSpecificDetails: { 'Free Fire UID': '887261520', 'In-Game Name': 'CHK_Rohan', 'Format': 'Team' },
    createdAt: '2026-09-21T11:30:00Z'
  },
  {
    id: 'BHL-938120',
    playerId: 'p-3',
    playerName: 'Aarav Patel',
    gamerTag: 'ShadowStriker',
    discordUsername: 'aarav_shadow',
    gameId: 'bgmi',
    gameName: 'BGMI',
    week: 'WEEK 02',
    status: 'APPROVED',
    playType: 'Team / Squad',
    teamName: 'Team Alpha',
    teamMembers: 'ShadowStriker, Viper, Thunder, Falcon',
    gameSpecificDetails: { 'BGMI UID': '5192837461', 'In-Game Name': 'Alpha_Shadow' },
    createdAt: '2026-09-22T09:15:00Z'
  },
  {
    id: 'BHL-615243',
    playerId: 'p-4',
    playerName: 'Kavya Verma',
    gamerTag: 'ApexBlaze',
    discordUsername: 'kavya_blaze',
    gameId: 'minecraft',
    gameName: 'MINECRAFT',
    week: 'WEEK 03',
    status: 'REGISTERED',
    playType: 'Solo',
    gameSpecificDetails: { 'Minecraft Username': 'ApexBlaze_MC', 'Edition': 'Java' },
    createdAt: '2026-09-23T14:20:00Z'
  },
  {
    id: 'BHL-882710',
    playerId: 'p-5',
    playerName: 'Devansh Singh',
    gamerTag: 'NeonViper',
    discordUsername: 'dev_viper',
    gameId: 'chess',
    gameName: 'CHESS',
    week: 'WEEK 04',
    status: 'REGISTERED',
    playType: 'Solo',
    gameSpecificDetails: { 'Chess Username': 'ViperGrandmaster', 'Platform': 'Chess.com', 'Rating': '1850' },
    createdAt: '2026-09-24T16:00:00Z'
  }
];

// Seeded Published and Draft Match Results
const INITIAL_RESULTS: MatchResultRecord[] = [
  {
    id: 'res-1',
    eventId: 'evt-1',
    gameName: 'FREE FIRE',
    week: 'WEEK 01',
    playerId: 'p-1',
    playerName: 'Kirito Kumar',
    gamerTag: 'Kirito_99',
    placement: 1,
    participated: true,
    challengeWinner: true,
    risingStar: false,
    points: calculatePoints({ placement: 1, participated: true, challengeWinner: true }),
    status: 'PUBLISHED',
    publishedAt: '2026-09-23T18:00:00Z',
    updatedAt: '2026-09-23T18:00:00Z'
  },
  {
    id: 'res-2',
    eventId: 'evt-1',
    gameName: 'FREE FIRE',
    week: 'WEEK 01',
    playerId: 'p-2',
    playerName: 'Rohan Sharma',
    gamerTag: 'CrimsonHawk',
    placement: 2,
    participated: true,
    challengeWinner: false,
    risingStar: false,
    points: calculatePoints({ placement: 2, participated: true }),
    status: 'PUBLISHED',
    publishedAt: '2026-09-23T18:00:00Z',
    updatedAt: '2026-09-23T18:00:00Z'
  },
  {
    id: 'res-3',
    eventId: 'evt-1',
    gameName: 'FREE FIRE',
    week: 'WEEK 01',
    playerId: 'p-3',
    playerName: 'Aarav Patel',
    gamerTag: 'ShadowStriker',
    placement: 3,
    participated: true,
    challengeWinner: false,
    risingStar: false,
    points: calculatePoints({ placement: 3, participated: true }),
    status: 'PUBLISHED',
    publishedAt: '2026-09-23T18:00:00Z',
    updatedAt: '2026-09-23T18:00:00Z'
  },
  {
    id: 'res-4',
    eventId: 'evt-1',
    gameName: 'FREE FIRE',
    week: 'WEEK 01',
    playerId: 'p-4',
    playerName: 'Kavya Verma',
    gamerTag: 'ApexBlaze',
    placement: null,
    participated: true,
    challengeWinner: false,
    risingStar: true,
    points: calculatePoints({ placement: null, participated: true, risingStar: true }),
    status: 'PUBLISHED',
    publishedAt: '2026-09-23T18:00:00Z',
    updatedAt: '2026-09-23T18:00:00Z'
  },
  {
    id: 'res-5',
    eventId: 'evt-1',
    gameName: 'FREE FIRE',
    week: 'WEEK 01',
    playerId: 'p-5',
    playerName: 'Devansh Singh',
    gamerTag: 'NeonViper',
    placement: null,
    participated: true,
    challengeWinner: false,
    risingStar: false,
    points: calculatePoints({ placement: null, participated: true }),
    status: 'PUBLISHED',
    publishedAt: '2026-09-23T18:00:00Z',
    updatedAt: '2026-09-23T18:00:00Z'
  }
];

const INITIAL_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: 'log-1',
    adminUser: 'Admin_Blackhawk',
    role: 'ADMIN',
    action: 'PUBLISH_RESULTS',
    targetEntity: 'Event Results',
    targetId: 'evt-1',
    oldValue: 'DRAFT',
    newValue: 'PUBLISHED (5 results updated)',
    timestamp: '2026-09-23T18:00:00Z'
  },
  {
    id: 'log-2',
    adminUser: 'Organizer_Dev',
    role: 'ORGANIZER',
    action: 'AWARD_RISING_STAR',
    targetEntity: 'Player Points',
    targetId: 'p-4',
    oldValue: '1 pt',
    newValue: '+2 pts bonus awarded (ApexBlaze)',
    timestamp: '2026-09-23T17:45:00Z'
  },
  {
    id: 'log-3',
    adminUser: 'Admin_Blackhawk',
    role: 'ADMIN',
    action: 'APPROVE_REGISTRATION',
    targetEntity: 'Registration',
    targetId: 'BHL-712849',
    oldValue: 'REGISTERED',
    newValue: 'APPROVED',
    timestamp: '2026-09-21T10:15:00Z'
  }
];

const INITIAL_REWARDS: RewardConfig = {
  mainCompetition: 150,
  clashChallenge: 75,
  risingStar: 50,
  participationDraw: 25,
  communityMoment: 50,
  monthlyLeagueTotal: 600
};

class TournamentStore {
  private events: EventRecord[] = INITIAL_EVENTS;
  private players: PlayerRecord[] = INITIAL_PLAYERS;
  private registrations: RegistrationRecord[] = INITIAL_REGISTRATIONS;
  private results: MatchResultRecord[] = INITIAL_RESULTS;
  private draws: DrawRecord[] = [];
  private auditLogs: AuditLogRecord[] = INITIAL_AUDIT_LOGS;
  private rewardsConfig: RewardConfig = INITIAL_REWARDS;
  private currentRole: UserRole | null = null;
  private currentAdminName: string = 'Blackhawk_Admin';
  private listeners: Array<() => void> = [];

  private isFirebaseInitialized: boolean = false;

  constructor() {
    this.loadFromStorage();
    this.initFirebaseListeners();
  }

  private saveToLocalStorageOnly() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('BHT_EVENTS', JSON.stringify(this.events));
        localStorage.setItem('BHT_PLAYERS', JSON.stringify(this.players));
        localStorage.setItem('BHT_REGISTRATIONS', JSON.stringify(this.registrations));
        localStorage.setItem('BHT_RESULTS', JSON.stringify(this.results));
        localStorage.setItem('BHT_DRAWS', JSON.stringify(this.draws));
        localStorage.setItem('BHT_AUDIT', JSON.stringify(this.auditLogs));
        localStorage.setItem('BHT_REWARDS', JSON.stringify(this.rewardsConfig));
      } catch (err) {
        console.error('Local storage cache error:', err);
      }
    }
  }

  private saveToStorage() {
    this.saveToLocalStorageOnly();
    if (typeof window !== 'undefined' && this.currentRole) {
      try {
        localStorage.setItem('BHT_ADMIN_ROLE', this.currentRole);
        localStorage.setItem('BHT_ADMIN_NAME', this.currentAdminName);
      } catch (err) {
        console.error('Storage error:', err);
      }
    }
    this.notify();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const ev = localStorage.getItem('BHT_EVENTS');
        if (ev) this.events = JSON.parse(ev);

        const pl = localStorage.getItem('BHT_PLAYERS');
        if (pl) this.players = JSON.parse(pl);

        const reg = localStorage.getItem('BHT_REGISTRATIONS');
        if (reg) this.registrations = JSON.parse(reg);

        const res = localStorage.getItem('BHT_RESULTS');
        if (res) this.results = JSON.parse(res);

        const dr = localStorage.getItem('BHT_DRAWS');
        if (dr) this.draws = JSON.parse(dr);

        const aud = localStorage.getItem('BHT_AUDIT');
        if (aud) this.auditLogs = JSON.parse(aud);

        const rew = localStorage.getItem('BHT_REWARDS');
        if (rew) this.rewardsConfig = JSON.parse(rew);

        const role = localStorage.getItem('BHT_ADMIN_ROLE');
        if (role) this.currentRole = role as UserRole;

        const name = localStorage.getItem('BHT_ADMIN_NAME');
        if (name) this.currentAdminName = name;
      } catch {
        // use defaults
      }
    }
  }

  private handleRtdbError(err: any) {
    const msg = err?.message || 'Firebase RTDB error';
    console.warn('[Firebase RTDB]:', msg);
    const isPerm = msg.toLowerCase().includes('permission_denied') || msg.toLowerCase().includes('permission denied');
    firebaseConnectionManager.setCustomStatus({
      state: isPerm ? 'permission-denied' : 'error',
      errorMessage: msg
    });
  }

  private async writeToRtdb(path: string, val: any) {
    try {
      await set(ref(rtdb, path), sanitizeForFirebase(val));
      firebaseConnectionManager.setCustomStatus({
        state: 'connected',
        lastSyncedAt: new Date().toISOString()
      });
    } catch (err: any) {
      this.handleRtdbError(err);
    }
  }

  private async removeFromRtdb(path: string) {
    try {
      await remove(ref(rtdb, path));
      firebaseConnectionManager.setCustomStatus({
        state: 'connected',
        lastSyncedAt: new Date().toISOString()
      });
    } catch (err: any) {
      this.handleRtdbError(err);
    }
  }

  private initFirebaseListeners() {
    if (typeof window === 'undefined' || this.isFirebaseInitialized) return;
    this.isFirebaseInitialized = true;

    try {
      // 1. Events listener
      onValue(ref(rtdb, 'events'), (snap) => {
        if (snap.exists() && snap.val()) {
          const list = parseFirebaseList<EventRecord>(snap.val());
          if (list.length > 0) {
            this.events = list.sort((a, b) => (a.weekNumber || 0) - (b.weekNumber || 0));
            this.saveToLocalStorageOnly();
            this.notify();
          }
        }
      }, (err) => this.handleRtdbError(err));

      // 2. Players listener
      onValue(ref(rtdb, 'players'), (snap) => {
        if (snap.exists() && snap.val()) {
          const list = parseFirebaseList<PlayerRecord>(snap.val());
          if (list.length > 0) {
            this.players = list;
            this.saveToLocalStorageOnly();
            this.notify();
          }
        }
      }, (err) => this.handleRtdbError(err));

      // 3. Registrations listener
      onValue(ref(rtdb, 'registrations'), (snap) => {
        if (snap.exists() && snap.val()) {
          const list = parseFirebaseList<RegistrationRecord>(snap.val());
          this.registrations = list.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          this.saveToLocalStorageOnly();
          this.notify();
        }
      }, (err) => this.handleRtdbError(err));

      // 4. Results listener
      onValue(ref(rtdb, 'results'), (snap) => {
        if (snap.exists() && snap.val()) {
          const list = parseFirebaseList<MatchResultRecord>(snap.val());
          this.results = list;
          this.saveToLocalStorageOnly();
          this.notify();
        }
      }, (err) => this.handleRtdbError(err));

      // 5. Draws listener
      onValue(ref(rtdb, 'draws'), (snap) => {
        if (snap.exists() && snap.val()) {
          const list = parseFirebaseList<DrawRecord>(snap.val());
          this.draws = list.sort(
            (a, b) => new Date(b.drawnAt || 0).getTime() - new Date(a.drawnAt || 0).getTime()
          );
          this.saveToLocalStorageOnly();
          this.notify();
        }
      }, (err) => this.handleRtdbError(err));

      // 6. Audit logs listener
      onValue(ref(rtdb, 'auditLogs'), (snap) => {
        if (snap.exists() && snap.val()) {
          const list = parseFirebaseList<AuditLogRecord>(snap.val());
          this.auditLogs = list
            .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
            .slice(0, 200);
          this.saveToLocalStorageOnly();
          this.notify();
        }
      }, (err) => this.handleRtdbError(err));

      // 7. Rewards config listener
      onValue(ref(rtdb, 'rewardsConfig'), (snap) => {
        if (snap.exists() && snap.val()) {
          this.rewardsConfig = { ...INITIAL_REWARDS, ...snap.val() };
          this.saveToLocalStorageOnly();
          this.notify();
        }
      }, (err) => this.handleRtdbError(err));

    } catch (err: any) {
      this.handleRtdbError(err);
    }
  }

  // Seed or Force Push all current tournament state to Firebase RTDB
  async syncAllToFirebase(): Promise<{ success: boolean; error?: string }> {
    try {
      const mapList = <T extends { id: string }>(arr: T[]) => {
        const m: Record<string, any> = {};
        for (const item of arr) {
          if (item && item.id) m[item.id] = sanitizeForFirebase(item);
        }
        return m;
      };

      await set(ref(rtdb, 'events'), mapList(this.events));
      await set(ref(rtdb, 'players'), mapList(this.players));
      await set(ref(rtdb, 'registrations'), mapList(this.registrations));
      await set(ref(rtdb, 'results'), mapList(this.results));
      await set(ref(rtdb, 'draws'), mapList(this.draws));
      await set(ref(rtdb, 'auditLogs'), mapList(this.auditLogs));
      await set(ref(rtdb, 'rewardsConfig'), sanitizeForFirebase(this.rewardsConfig));

      firebaseConnectionManager.setCustomStatus({
        state: 'connected',
        lastSyncedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Sync failed';
      this.handleRtdbError(err);
      return { success: false, error: msg };
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- Auth & Role Management ---
  getAuth() {
    return {
      role: this.currentRole,
      adminName: this.currentAdminName,
      isAuthenticated: this.currentRole !== null
    };
  }

  login(role: UserRole, adminName: string = 'Blackhawk_Operator') {
    this.currentRole = role;
    this.currentAdminName = adminName;
    this.logAudit('ADMIN_LOGIN', 'Session', role, 'Logged Out', `Logged in as ${role}`);
    this.saveToStorage();
  }

  logout() {
    const prev = this.currentRole;
    this.currentRole = null;
    if (prev) {
      this.logAudit('ADMIN_LOGOUT', 'Session', prev, prev, 'Logged Out');
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('BHT_ADMIN_ROLE');
    }
    this.saveToStorage();
  }

  // --- Audit Logging ---
  logAudit(action: string, targetEntity: string, targetId: string, oldValue?: string, newValue?: string) {
    const log: AuditLogRecord = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      adminUser: this.currentAdminName,
      role: this.currentRole || 'ORGANIZER',
      action,
      targetEntity,
      targetId,
      oldValue,
      newValue,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    // keep maximum 200 logs
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
    this.writeToRtdb(`auditLogs/${log.id}`, log);
  }

  getAuditLogs(): AuditLogRecord[] {
    return [...this.auditLogs];
  }

  // --- Public Player Registration ---
  registerPlayer(data: {
    fullName: string;
    gamerTag: string;
    discordUsername: string;
    gameId: string;
    gameName: string;
    week: string;
    playType: 'Solo' | 'Team / Squad';
    teamName?: string;
    teamMembers?: string;
    gameSpecificDetails: Record<string, string>;
  }): { registrationId: string; player: PlayerRecord } {
    // 1. Find or create player
    let player = this.players.find(p => p.gamerTag.toLowerCase() === data.gamerTag.toLowerCase());
    if (!player) {
      player = {
        id: `p-${Date.now()}`,
        fullName: data.fullName,
        gamerTag: data.gamerTag,
        discordUsername: data.discordUsername,
        status: 'ACTIVE',
        joinedAt: new Date().toISOString().split('T')[0]
      };
      this.players.push(player);
    } else {
      // Update discord or full name if changed
      player.fullName = data.fullName;
      player.discordUsername = data.discordUsername;
    }

    // 2. Generate Registration ID: BHL-XXXXXX
    const regNum = Math.floor(100000 + Math.random() * 900000);
    const regId = `BHL-${regNum}`;

    const reg: RegistrationRecord = {
      id: regId,
      playerId: player.id,
      playerName: player.fullName,
      gamerTag: player.gamerTag,
      discordUsername: player.discordUsername,
      gameId: data.gameId,
      gameName: data.gameName,
      week: data.week,
      status: 'REGISTERED',
      playType: data.playType,
      teamName: data.teamName,
      teamMembers: data.teamMembers,
      gameSpecificDetails: data.gameSpecificDetails,
      createdAt: new Date().toISOString()
    };

    this.registrations.unshift(reg);
    this.logAudit('PLAYER_REGISTRATION', 'Registration', regId, 'None', `Registered for ${data.gameName}`);
    this.saveToStorage();

    // Sync directly to Firebase Realtime Database
    this.writeToRtdb(`players/${player.id}`, player);
    this.writeToRtdb(`registrations/${regId}`, reg);

    return { registrationId: regId, player };
  }

  // --- Public Player Multi-Game Registration ---
  registerPlayerMultiple(data: {
    fullName: string;
    gamerTag: string;
    discordUsername: string;
    games: Array<{
      gameId: string;
      gameName: string;
      week: string;
      playType: 'Solo' | 'Team / Squad';
      teamName?: string;
      teamMembers?: string;
      gameSpecificDetails: Record<string, string>;
    }>;
  }): { player: PlayerRecord; registrations: RegistrationRecord[] } {
    // 1. Find or create athlete player record
    let player = this.players.find(p => p.gamerTag.toLowerCase() === data.gamerTag.toLowerCase());
    if (!player) {
      player = {
        id: `p-${Date.now()}`,
        fullName: data.fullName,
        gamerTag: data.gamerTag,
        discordUsername: data.discordUsername,
        status: 'ACTIVE',
        joinedAt: new Date().toISOString().split('T')[0]
      };
      this.players.push(player);
    } else {
      player.fullName = data.fullName;
      player.discordUsername = data.discordUsername;
    }

    const createdRegistrations: RegistrationRecord[] = [];
    const now = new Date().toISOString();

    for (const g of data.games) {
      const regNum = Math.floor(100000 + Math.random() * 900000);
      const regId = `BHL-${regNum}`;

      const reg: RegistrationRecord = {
        id: regId,
        playerId: player.id,
        playerName: player.fullName,
        gamerTag: player.gamerTag,
        discordUsername: player.discordUsername,
        gameId: g.gameId,
        gameName: g.gameName,
        week: g.week,
        status: 'REGISTERED',
        playType: g.playType,
        teamName: g.teamName,
        teamMembers: g.teamMembers,
        gameSpecificDetails: g.gameSpecificDetails,
        createdAt: now
      };

      this.registrations.unshift(reg);
      createdRegistrations.push(reg);
      this.writeToRtdb(`registrations/${regId}`, reg);
    }

    const gameNames = data.games.map(g => g.gameName).join(', ');
    this.logAudit(
      'MULTI_REGISTRATION', 
      'Registration', 
      createdRegistrations.map(r => r.id).join('; '), 
      'None', 
      `Registered for ${data.games.length} games: ${gameNames}`
    );

    this.saveToStorage();
    this.writeToRtdb(`players/${player.id}`, player);

    return { player, registrations: createdRegistrations };
  }

  // --- Queries ---
  getEvents(): EventRecord[] {
    return [...this.events];
  }

  getPlayers(): PlayerRecord[] {
    return [...this.players];
  }

  getRegistrations(): RegistrationRecord[] {
    return [...this.registrations];
  }

  getResults(): MatchResultRecord[] {
    return [...this.results];
  }

  getDraws(): DrawRecord[] {
    return [...this.draws];
  }

  getRewardsConfig(): RewardConfig {
    return { ...this.rewardsConfig };
  }

  // --- Event Management ---
  updateEvent(eventId: string, updates: Partial<EventRecord>) {
    const idx = this.events.findIndex(e => e.id === eventId);
    if (idx === -1) return;
    const old = { ...this.events[idx] };
    this.events[idx] = { ...this.events[idx], ...updates };
    this.logAudit(
      'UPDATE_EVENT',
      'Event',
      eventId,
      `Status: ${old.eventStatus}, Reg: ${old.registrationStatus}`,
      `Status: ${this.events[idx].eventStatus}, Reg: ${this.events[idx].registrationStatus}`
    );
    this.saveToStorage();
    this.writeToRtdb(`events/${eventId}`, this.events[idx]);
  }

  // --- Registration Management ---
  updateRegistrationStatus(regId: string, newStatus: 'APPROVED' | 'REJECTED' | 'DISQUALIFIED') {
    const reg = this.registrations.find(r => r.id === regId);
    if (!reg) return;
    const oldStatus = reg.status;
    reg.status = newStatus;
    this.logAudit('UPDATE_REGISTRATION_STATUS', 'Registration', regId, oldStatus, newStatus);
    this.saveToStorage();
    this.writeToRtdb(`registrations/${regId}/status`, newStatus);
  }

  removeRegistration(regId: string) {
    const reg = this.registrations.find(r => r.id === regId);
    if (!reg) return;
    this.registrations = this.registrations.filter(r => r.id !== regId);
    this.logAudit('REMOVE_REGISTRATION', 'Registration', regId, reg.playerName, 'Deleted');
    this.saveToStorage();
    this.removeFromRtdb(`registrations/${regId}`);
  }

  // --- Player Management ---
  updatePlayerStatus(playerId: string, newStatus: 'ACTIVE' | 'DISQUALIFIED' | 'BENCHED') {
    const p = this.players.find(item => item.id === playerId);
    if (!p) return;
    const old = p.status;
    p.status = newStatus;
    this.logAudit('UPDATE_PLAYER_STATUS', 'Player', playerId, old, newStatus);
    this.saveToStorage();
    this.writeToRtdb(`players/${playerId}/status`, newStatus);
  }

  removePlayer(playerId: string) {
    const p = this.players.find(item => item.id === playerId);
    if (!p) return;
    this.players = this.players.filter(item => item.id !== playerId);
    this.registrations = this.registrations.filter(item => item.playerId !== playerId);
    this.results = this.results.filter(item => item.playerId !== playerId);
    this.logAudit('REMOVE_PLAYER', 'Player', playerId, p.gamerTag, 'Removed with related records');
    this.saveToStorage();
    this.removeFromRtdb(`players/${playerId}`);
  }

  // --- Result Entry & Publishing Workflow ---
  saveResultRecord(data: {
    eventId: string;
    gameName: string;
    week: string;
    playerId: string;
    playerName: string;
    gamerTag: string;
    placement: number | null;
    participated: boolean;
    challengeWinner: boolean;
    risingStar: boolean;
    status: 'DRAFT' | 'REVIEW' | 'PUBLISHED';
  }) {
    const points = calculatePoints({
      placement: data.placement,
      participated: data.participated,
      challengeWinner: data.challengeWinner,
      risingStar: data.risingStar
    });

    const existingIdx = this.results.findIndex(
      r => r.eventId === data.eventId && r.playerId === data.playerId
    );

    const now = new Date().toISOString();
    let savedRecord: MatchResultRecord;

    if (existingIdx !== -1) {
      const old = this.results[existingIdx];
      savedRecord = {
        ...old,
        ...data,
        points,
        updatedAt: now,
        publishedAt: data.status === 'PUBLISHED' ? (old.publishedAt || now) : undefined
      };
      this.results[existingIdx] = savedRecord;
      this.logAudit(
        'EDIT_RESULT',
        'MatchResult',
        old.id,
        `${old.status} (Pts: ${old.points.totalPoints})`,
        `${data.status} (Pts: ${points.totalPoints})`
      );
    } else {
      savedRecord = {
        id: `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...data,
        points,
        updatedAt: now,
        publishedAt: data.status === 'PUBLISHED' ? now : undefined
      };
      this.results.push(savedRecord);
      this.logAudit('CREATE_RESULT', 'MatchResult', savedRecord.id, 'None', `${data.status} for ${data.gamerTag}`);
    }

    this.saveToStorage();
    this.writeToRtdb(`results/${savedRecord.id}`, savedRecord);
  }

  publishEventResults(eventId: string) {
    let count = 0;
    const now = new Date().toISOString();
    const updatedMap: Record<string, any> = {};

    this.results = this.results.map(r => {
      if (r.eventId === eventId && r.status !== 'PUBLISHED') {
        count++;
        const pub = {
          ...r,
          status: 'PUBLISHED' as const,
          publishedAt: now,
          updatedAt: now
        };
        updatedMap[pub.id] = sanitizeForFirebase(pub);
        return pub;
      }
      return r;
    });

    this.logAudit('PUBLISH_RESULTS', 'Event', eventId, 'Draft/Review', `Published ${count} result records`);
    this.saveToStorage();

    if (Object.keys(updatedMap).length > 0) {
      update(ref(rtdb, 'results'), updatedMap).catch(err => this.handleRtdbError(err));
    }
  }

  deleteResult(resultId: string) {
    const res = this.results.find(r => r.id === resultId);
    if (!res) return;
    this.results = this.results.filter(r => r.id !== resultId);
    this.logAudit('DELETE_RESULT', 'MatchResult', resultId, `${res.gamerTag} (${res.points.totalPoints} pts)`, 'Deleted');
    this.saveToStorage();
    this.removeFromRtdb(`results/${resultId}`);
  }

  // --- Participation Draw ---
  runParticipationDraw(eventId: string): DrawRecord | null {
    // Eligible participants: all players registered/active in this event who haven't won a draw yet
    const eventRegs = this.registrations.filter(r => r.gameId === eventId || r.week === eventId);
    const existingWinnerIds = new Set(this.draws.map(d => d.winnerPlayerId));

    // Fallback: use all active players if specific event regs are few
    let eligible = eventRegs.filter(r => !existingWinnerIds.has(r.playerId) && r.status === 'APPROVED');
    if (eligible.length === 0) {
      eligible = this.registrations.filter(r => !existingWinnerIds.has(r.playerId));
    }
    if (eligible.length === 0) {
      eligible = this.registrations;
    }
    if (eligible.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * eligible.length);
    const chosen = eligible[randomIndex];
    const eventItem = this.events.find(e => e.id === eventId) || this.events[0];

    const draw: DrawRecord = {
      id: `draw-${Date.now()}`,
      eventId: eventItem.id,
      gameName: eventItem.gameName,
      week: eventItem.week,
      winnerPlayerId: chosen.playerId,
      winnerName: chosen.playerName,
      winnerTag: chosen.gamerTag,
      rewardAmount: this.rewardsConfig.participationDraw,
      eligibleCount: eligible.length,
      conductedBy: this.currentAdminName,
      drawnAt: new Date().toISOString()
    };

    this.draws.unshift(draw);
    this.logAudit('RUN_PARTICIPATION_DRAW', 'Draw', draw.id, 'None', `Winner: ${chosen.gamerTag} (₹${draw.rewardAmount})`);
    this.saveToStorage();
    this.writeToRtdb(`draws/${draw.id}`, draw);
    return draw;
  }

  // --- Rising Star Quick Award ---
  awardRisingStarQuick(playerId: string, eventId: string, reason: string) {
    const player = this.players.find(p => p.id === playerId);
    const eventItem = this.events.find(e => e.id === eventId) || this.events[0];
    if (!player) return;

    this.saveResultRecord({
      eventId: eventItem.id,
      gameName: eventItem.gameName,
      week: eventItem.week,
      playerId: player.id,
      playerName: player.fullName,
      gamerTag: player.gamerTag,
      placement: null,
      participated: true,
      challengeWinner: false,
      risingStar: true,
      status: 'PUBLISHED'
    });

    this.logAudit('AWARD_RISING_STAR', 'Player Points', playerId, 'Base', `+2 pts Rising Star: "${reason}"`);
  }

  // --- Rewards Config Update ---
  updateRewardsConfig(updates: Partial<RewardConfig>) {
    const old = { ...this.rewardsConfig };
    this.rewardsConfig = { ...this.rewardsConfig, ...updates };
    this.logAudit('UPDATE_REWARDS_CONFIG', 'Rewards', 'Global', JSON.stringify(old), JSON.stringify(this.rewardsConfig));
    this.saveToStorage();
    this.writeToRtdb('rewardsConfig', this.rewardsConfig);
  }

  // --- Automatic Leaderboard Generation ---
  // Must be strictly derived from published results
  getLeaderboard(): LeaderboardEntry[] {
    const publishedResults = this.results.filter(r => r.status === 'PUBLISHED');
    const playerMap = new Map<string, {
      player: PlayerRecord;
      points: number;
      eventsCount: Set<string>;
      wins: number;
      breakdown: LeaderboardEntry['breakdown'];
    }>();

    // Initialize all active players so everyone appears or only participating players
    this.players.forEach(p => {
      playerMap.set(p.id, {
        player: p,
        points: 0,
        eventsCount: new Set(),
        wins: 0,
        breakdown: []
      });
    });

    // Sum points from published results
    publishedResults.forEach(res => {
      const entry = playerMap.get(res.playerId);
      if (entry) {
        entry.points += res.points.totalPoints;
        entry.eventsCount.add(res.eventId);
        if (res.placement === 1) {
          entry.wins += 1;
        }
        entry.breakdown.push({
          week: res.week,
          gameName: res.gameName,
          placement: res.placement,
          challengeWin: res.challengeWinner,
          risingStar: res.risingStar,
          pointsAwarded: res.points.totalPoints,
          explanation: res.points.explanation
        });
      }
    });

    // Convert map to sorted list
    const list: LeaderboardEntry[] = Array.from(playerMap.values())
      .filter(item => item.player.status !== 'DISQUALIFIED')
      .map(item => ({
        rank: 1,
        playerId: item.player.id,
        playerName: item.player.fullName,
        gamerTag: item.player.gamerTag,
        discordUsername: item.player.discordUsername,
        totalPoints: item.points,
        eventsParticipated: item.eventsCount.size,
        winsCount: item.wins,
        breakdown: item.breakdown
      }))
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return b.winsCount - a.winsCount;
      });

    // Assign ranking numbers
    list.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return list;
  }

  // Get single player point history
  getPlayerPointHistory(playerId: string) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;

    const publishedResults = this.results.filter(r => r.playerId === playerId && r.status === 'PUBLISHED');
    const totalPoints = publishedResults.reduce((acc, r) => acc + r.points.totalPoints, 0);

    return {
      player,
      totalPoints,
      history: publishedResults.map(r => ({
        id: r.id,
        week: r.week,
        gameName: r.gameName,
        placement: r.placement,
        basePoints: r.points.basePoints,
        participationPoints: r.points.participationPoints,
        challengeBonus: r.points.challengeBonus,
        risingStarBonus: r.points.risingStarBonus,
        totalPoints: r.points.totalPoints,
        explanation: r.points.explanation,
        publishedAt: r.publishedAt
      }))
    };
  }
}

export const tournamentStore = new TournamentStore();
