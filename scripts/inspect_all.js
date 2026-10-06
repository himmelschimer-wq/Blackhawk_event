import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function run() {
  const { data: players } = await supabase.from('players').select('*');
  const { data: regs } = await supabase.from('registrations').select('*');
  const { data: lb } = await supabase.from('leaderboard').select('*');

  console.log('=== ALL PLAYERS in Supabase (' + (players?.length || 0) + ') ===');
  console.log(players);

  console.log('\n=== ALL REGISTRATIONS in Supabase (' + (regs?.length || 0) + ') ===');
  console.log(regs);

  console.log('\n=== ALL LEADERBOARD in Supabase (' + (lb?.length || 0) + ') ===');
  console.log(lb);
}

run();
