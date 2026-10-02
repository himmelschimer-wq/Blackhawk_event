import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env file safely
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
} catch {}

const FIREBASE_BASE_URL = (
  process.env.FIREBASE_DATABASE_URL ||
  process.env.VITE_FIREBASE_DATABASE_URL ||
  'https://blackhawk-tournament-default-rtdb.asia-southeast1.firebasedatabase.app'
).replace(/\/$/, '');

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ''
).trim().replace(/\/$/, '');

const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

console.log('===========================================================');
console.log(' BLACKHAWK: FIREBASE TO SUPABASE MIGRATION RUNNER');
console.log('===========================================================');
console.log(`Source Firebase RTDB: ${FIREBASE_BASE_URL}`);
console.log(`Target Supabase DB  : ${SUPABASE_URL || '(Not set)'}`);
console.log('-----------------------------------------------------------');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\n❌ ERROR: SUPABASE_URL or SUPABASE_KEY is missing in your environment variables.');
  console.error('Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function fetchFirebaseCollection<T = any>(pathName: string): Promise<T[]> {
  try {
    const url = `${FIREBASE_BASE_URL}/blackhawk/${pathName}.json`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`⚠️ Warning: Failed to fetch ${url} (Status ${res.status})`);
      return [];
    }
    const data = await res.json();
    if (!data) return [];
    if (Array.isArray(data)) return data.filter(Boolean);
    return Object.values(data);
  } catch (err: any) {
    console.warn(`⚠️ Error reading Firebase path ${pathName}:`, err.message);
    return [];
  }
}

async function migrateAll() {
  const stats: Record<string, { read: number; migrated: number; errors: number }> = {};

  // 1. GAMES
  console.log('\n[1/10] Migrating Games...');
  const games = await fetchFirebaseCollection('games');
  stats.games = { read: games.length, migrated: 0, errors: 0 };
  for (const g of games) {
    const row = {
      id: g.id,
      name: g.name,
      description: g.description || '',
      logo: g.logo || '',
      banner: g.banner || '',
      category: g.category || '',
      default_prize_pool: Number(g.defaultPrizePool || g.prizePool || 0),
      format: g.format || 'SOLO',
      active: Boolean(g.active ?? true),
      created_at: g.createdAt || new Date().toISOString()
    };
    const { error } = await supabase.from('games').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`  ❌ Failed game ${g.id}:`, error.message);
      stats.games.errors++;
    } else {
      stats.games.migrated++;
    }
  }
  console.log(`  ✓ Games migrated: ${stats.games.migrated}/${stats.games.read}`);

  // 2. EVENTS
  console.log('\n[2/10] Migrating Events...');
  const events = await fetchFirebaseCollection('events');
  stats.events = { read: events.length, migrated: 0, errors: 0 };
  for (const e of events) {
    const row = {
      id: e.id,
      game_id: e.gameId || 'freefire',
      game_name: e.gameName || 'Free Fire',
      title: e.title || 'Tournament Event',
      description: e.description || '',
      date: e.date || 'TBD',
      time: e.time || 'TBD',
      format: e.format || 'SOLO',
      prize_pool: Number(e.prizePool || 0),
      max_participants: Number(e.maxParticipants || 100),
      registration_status: e.registrationStatus || 'OPEN',
      event_status: e.eventStatus || 'REGISTRATION OPEN',
      rules: e.rules || '',
      general_rules: e.generalRules || '',
      banner: e.banner || '',
      prize_rules: e.prizeRules || null,
      created_at: e.createdAt || new Date().toISOString(),
      updated_at: e.updatedAt || new Date().toISOString()
    };
    const { error } = await supabase.from('events').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`  ❌ Failed event ${e.id}:`, error.message);
      stats.events.errors++;
    } else {
      stats.events.migrated++;
    }
  }
  console.log(`  ✓ Events migrated: ${stats.events.migrated}/${stats.events.read}`);

  // 3. PLAYERS
  console.log('\n[3/10] Migrating Players...');
  const players = await fetchFirebaseCollection('players');
  stats.players = { read: players.length, migrated: 0, errors: 0 };
  for (const p of players) {
    const row = {
      id: p.id,
      full_name: p.fullName || p.gamerTag || 'Player',
      gamer_tag: p.gamerTag || p.fullName || `player_${p.id}`,
      discord_username: p.discordUsername || 'N/A',
      email: p.email || '',
      phone: p.phone || '',
      game: p.game || 'ALL',
      team: p.team || null,
      status: p.status || 'ACTIVE',
      joined_at: p.joinedAt || p.createdAt || new Date().toISOString(),
      created_at: p.createdAt || new Date().toISOString()
    };
    const { error } = await supabase.from('players').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`  ❌ Failed player ${p.id}:`, error.message);
      stats.players.errors++;
    } else {
      stats.players.migrated++;
    }
  }
  console.log(`  ✓ Players migrated: ${stats.players.migrated}/${stats.players.read}`);

  // 4. REGISTRATIONS
  console.log('\n[4/10] Migrating Registrations...');
  const registrations = await fetchFirebaseCollection('registrations');
  stats.registrations = { read: registrations.length, migrated: 0, errors: 0 };
  for (const r of registrations) {
    const row = {
      id: r.id,
      player_id: r.playerId || null,
      player_name: r.playerName || 'Participant',
      gamer_tag: r.gamerTag || r.playerName || 'Player',
      discord_username: r.discordUsername || 'N/A',
      email: r.email || '',
      phone: r.phone || '',
      game_id: r.gameId || 'freefire',
      game_name: r.gameName || 'Free Fire',
      event_id: r.eventId || null,
      event_title: r.eventTitle || '',
      week: r.week || '',
      play_type: r.playType || 'Solo',
      team_name: r.teamName || null,
      team_members: r.teamMembers || null,
      game_specific_details: r.gameSpecificDetails || {},
      status: r.status || 'REGISTERED',
      registered_at: r.registeredAt || r.createdAt || new Date().toISOString(),
      created_at: r.createdAt || new Date().toISOString()
    };
    const { error } = await supabase.from('registrations').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`  ❌ Failed registration ${r.id}:`, error.message);
      stats.registrations.errors++;
    } else {
      stats.registrations.migrated++;
    }
  }
  console.log(`  ✓ Registrations migrated: ${stats.registrations.migrated}/${stats.registrations.read}`);

  // 5. LEADERBOARD
  console.log('\n[5/10] Migrating Leaderboard...');
  const leaderboard = await fetchFirebaseCollection('leaderboard');
  stats.leaderboard = { read: leaderboard.length, migrated: 0, errors: 0 };
  for (const lb of leaderboard) {
    const row = {
      id: lb.id,
      player_id: lb.playerId || lb.id,
      player_name: lb.playerName || lb.gamerTag || 'Player',
      gamer_tag: lb.gamerTag || lb.playerName || 'Player',
      discord_username: lb.discordUsername || 'N/A',
      game: lb.game || 'ALL',
      points: Number(lb.points || 0),
      score: Number(lb.score || lb.points || 0),
      wins: Number(lb.wins || 0),
      matches: Number(lb.matches || 0),
      rank: Number(lb.rank || 1),
      avatar: lb.avatar || null,
      created_at: lb.createdAt || new Date().toISOString(),
      updated_at: lb.updatedAt || new Date().toISOString()
    };
    const { error } = await supabase.from('leaderboard').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`  ❌ Failed leaderboard entry ${lb.id}:`, error.message);
      stats.leaderboard.errors++;
    } else {
      stats.leaderboard.migrated++;
    }
  }
  console.log(`  ✓ Leaderboard migrated: ${stats.leaderboard.migrated}/${stats.leaderboard.read}`);

  // 6. MATCH RESULTS / SCORES
  console.log('\n[6/10] Migrating Match Results...');
  const results = await fetchFirebaseCollection('results');
  const scores = await fetchFirebaseCollection('match_scores');
  const allResults = [...results, ...scores];
  stats.results = { read: allResults.length, migrated: 0, errors: 0 };
  for (const res of allResults) {
    const row = {
      id: res.id,
      event_id: res.eventId || null,
      game_name: res.gameName || res.game || 'Tournament',
      week: res.week || '',
      player_id: res.playerId || 'unknown',
      player_name: res.playerName || 'Player',
      gamer_tag: res.gamerTag || res.playerName || 'Player',
      placement: res.placement ? Number(res.placement) : null,
      participated: Boolean(res.participated ?? true),
      challenge_winner: Boolean(res.challengeWinner ?? false),
      rising_star: Boolean(res.risingStar ?? false),
      points: res.points || {},
      total_points: Number(res.totalPoints || (typeof res.points === 'number' ? res.points : 0)),
      status: res.status || 'PUBLISHED',
      published_at: res.publishedAt || null,
      updated_at: res.updatedAt || res.recordedAt || new Date().toISOString(),
      recorded_at: res.recordedAt || new Date().toISOString()
    };
    const { error } = await supabase.from('match_results').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`  ❌ Failed match result ${res.id}:`, error.message);
      stats.results.errors++;
    } else {
      stats.results.migrated++;
    }
  }
  console.log(`  ✓ Match results migrated: ${stats.results.migrated}/${stats.results.read}`);

  // 7. DRAWS
  console.log('\n[7/10] Migrating Lucky Draws...');
  const draws = await fetchFirebaseCollection('draws');
  stats.draws = { read: draws.length, migrated: 0, errors: 0 };
  for (const d of draws) {
    const row = {
      id: d.id,
      event_id: d.eventId || null,
      game_name: d.gameName || 'Tournament',
      week: d.week || '',
      winner_player_id: d.winnerPlayerId || 'unknown',
      winner_name: d.winnerName || 'Winner',
      winner_tag: d.winnerTag || 'Winner',
      reward_amount: Number(d.rewardAmount || 25),
      eligible_count: Number(d.eligibleCount || 0),
      conducted_by: d.conductedBy || 'Admin',
      drawn_at: d.drawnAt || new Date().toISOString()
    };
    const { error } = await supabase.from('draws').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`  ❌ Failed draw ${d.id}:`, error.message);
      stats.draws.errors++;
    } else {
      stats.draws.migrated++;
    }
  }
  console.log(`  ✓ Draws migrated: ${stats.draws.migrated}/${stats.draws.read}`);

  // 8. AUDIT LOGS
  console.log('\n[8/10] Migrating Audit Logs...');
  const auditLogs = await fetchFirebaseCollection('auditLogs');
  stats.auditLogs = { read: auditLogs.length, migrated: 0, errors: 0 };
  for (const l of auditLogs) {
    const row = {
      id: l.id,
      admin_user: l.adminUser || 'System',
      role: l.role || 'ADMIN',
      action: l.action || 'ACTION',
      target_entity: l.targetEntity || 'System',
      target_id: l.targetId || 'N/A',
      old_value: l.oldValue || null,
      new_value: l.newValue || null,
      timestamp: l.timestamp || new Date().toISOString()
    };
    const { error } = await supabase.from('audit_logs').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`  ❌ Failed audit log ${l.id}:`, error.message);
      stats.auditLogs.errors++;
    } else {
      stats.auditLogs.migrated++;
    }
  }
  console.log(`  ✓ Audit logs migrated: ${stats.auditLogs.migrated}/${stats.auditLogs.read}`);

  // 9. ADMINS
  console.log('\n[9/10] Migrating Admins...');
  const admins = await fetchFirebaseCollection('admins');
  stats.admins = { read: admins.length, migrated: 0, errors: 0 };
  for (const a of admins) {
    const row = {
      id: a.id,
      username: a.username,
      display_name: a.displayName || 'Admin',
      password_hash: a.passwordHash,
      role: a.role || 'ADMIN',
      created_at: a.createdAt || new Date().toISOString()
    };
    const { error } = await supabase.from('admins').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`  ❌ Failed admin ${a.id}:`, error.message);
      stats.admins.errors++;
    } else {
      stats.admins.migrated++;
    }
  }
  console.log(`  ✓ Admins migrated: ${stats.admins.migrated}/${stats.admins.read}`);

  // 10. PAYOUTS
  console.log('\n[10/10] Migrating Payouts...');
  const payouts = await fetchFirebaseCollection('payouts');
  stats.payouts = { read: payouts.length, migrated: 0, errors: 0 };
  for (const p of payouts) {
    const row = {
      id: p.id || `payout_${p.eventId}`,
      event_id: p.eventId || 'ev-ff-1',
      total_payout: Number(p.totalPayout || 0),
      winners_json: p.winners || [],
      calculations_json: p.calculations || {},
      created_at: p.createdAt || new Date().toISOString(),
      updated_at: p.updatedAt || new Date().toISOString()
    };
    const { error } = await supabase.from('payouts').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error(`  ❌ Failed payout ${p.id}:`, error.message);
      stats.payouts.errors++;
    } else {
      stats.payouts.migrated++;
    }
  }
  console.log(`  ✓ Payouts migrated: ${stats.payouts.migrated}/${stats.payouts.read}`);

  console.log('\n===========================================================');
  console.log('🎉 FIREBASE TO SUPABASE MIGRATION COMPLETED SUCCESSFULLY!');
  console.log('===========================================================');
  console.table(stats);
}

migrateAll().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
