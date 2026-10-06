import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://inwyqpxnnirfaqltzorz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlud3lxcHhubmlyZmFxbHR6b3J6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDg3NDE5NiwiZXhwIjoyMTA2NDUwMTk2fQ.hWk0VauGFv4PIYiAl5RewYIl4iNaOKj70vYurX8Q9CY';

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
