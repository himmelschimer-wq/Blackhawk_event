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

async function cleanAll() {
  console.log('Cleaning database from dummy players and events...');
  
  try {
    // 1. Delete match_results
    const { error: err1 } = await supabase.from('match_results').delete().neq('id', 'dummy_none');
    console.log('match_results cleaned:', err1 ? err1.message : 'OK');

    // 2. Delete registrations
    const { error: err2 } = await supabase.from('registrations').delete().neq('id', 'dummy_none');
    console.log('registrations cleaned:', err2 ? err2.message : 'OK');

    // 3. Delete leaderboard
    const { error: err3 } = await supabase.from('leaderboard').delete().neq('id', 'dummy_none');
    console.log('leaderboard cleaned:', err3 ? err3.message : 'OK');

    // 4. Delete players
    const { error: err4 } = await supabase.from('players').delete().neq('id', 'dummy_none');
    console.log('players cleaned:', err4 ? err4.message : 'OK');

    // 5. Delete events
    const { error: err5 } = await supabase.from('events').delete().neq('id', 'dummy_none');
    console.log('events cleaned:', err5 ? err5.message : 'OK');

    console.log('Database cleanup completed successfully!');
  } catch (e) {
    console.error('Error during cleanup:', e);
  }
}

cleanAll();
