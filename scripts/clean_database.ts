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

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL
)?.trim().replace(/\/$/, '');

const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY
)?.trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in environment');
  process.exit(1);
}

console.log('===========================================================');
console.log(' BLACKHAWK: SUPABASE DATABASE CLEANER');
console.log('===========================================================');
console.log(`Target Supabase DB  : ${SUPABASE_URL}`);
console.log('-----------------------------------------------------------');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function cleanDatabase() {
  console.log('Clearing events, registrations, match results, and leaderboard...');

  // 1. Delete events
  const { error: evErr } = await supabase
    .from('events')
    .delete()
    .neq('id', 'non_existing_dummy_id');
  if (evErr) console.warn('Error clearing events:', evErr.message);
  else console.log('✓ Cleaned events table');

  // 2. Delete registrations
  const { error: regErr } = await supabase
    .from('registrations')
    .delete()
    .neq('id', 'non_existing_dummy_id');
  if (regErr) console.warn('Error clearing registrations:', regErr.message);
  else console.log('✓ Cleaned registrations table');

  // 3. Delete match_results
  const { error: resErr } = await supabase
    .from('match_results')
    .delete()
    .neq('id', 'non_existing_dummy_id');
  if (resErr) console.warn('Error clearing match_results:', resErr.message);
  else console.log('✓ Cleaned match_results table');

  // 4. Delete leaderboard
  const { error: lbErr } = await supabase
    .from('leaderboard')
    .delete()
    .neq('id', 'non_existing_dummy_id');
  if (lbErr) console.warn('Error clearing leaderboard:', lbErr.message);
  else console.log('✓ Cleaned leaderboard table');

  // Check remaining games
  const { data: gamesData } = await supabase.from('games').select('id, name, active');
  console.log(`✓ Preserved games (${gamesData?.length || 0} active games intact):`, gamesData?.map(g => `${g.name} (active: ${g.active})`).join(', '));

  console.log('===========================================================');
  console.log('✅ DATABASE CLEAN COMPLETE! You can now create new events.');
  console.log('===========================================================');
}

cleanDatabase();
