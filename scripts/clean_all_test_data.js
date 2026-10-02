import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://inwyqpxnnirfaqltzorz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlud3lxcHhubmlyZmFxbHR6b3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzQxOTYsImV4cCI6MjEwNjQ1MDE5Nn0.Ls1fM8YlTsCJFL83vp790pw9_T7rZ686uJEs7ljxnj8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
