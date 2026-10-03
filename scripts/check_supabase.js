import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://inwyqpxnnirfaqltzorz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlud3lxcHhubmlyZmFxbHR6b3J6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDg3NDE5NiwiZXhwIjoyMTA2NDUwMTk2fQ.hWk0VauGFv4PIYiAl5RewYIl4iNaOKj70vYurX8Q9CY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function check() {
  const { data: players, error: pErr } = await supabase.from('players').select('*');
  const { data: regs, error: rErr } = await supabase.from('registrations').select('*');
  const { data: lb, error: lErr } = await supabase.from('leaderboard').select('*');
  const { data: events, error: eErr } = await supabase.from('events').select('*');
  const { data: games, error: gErr } = await supabase.from('games').select('*');

  console.log('--- SUPABASE STATUS ---');
  console.log('Players count:', players?.length, 'error:', pErr?.message);
  console.log('Registrations count:', regs?.length, 'error:', rErr?.message);
  console.log('Leaderboard count:', lb?.length, 'error:', lErr?.message);
  console.log('Events count:', events?.length, 'error:', eErr?.message);
  console.log('Games count:', games?.length, 'error:', gErr?.message);

  if (players && players.length > 0) {
    console.log('\n--- PLAYERS SAMPLE ---');
    console.log(JSON.stringify(players, null, 2));
  }
  if (regs && regs.length > 0) {
    console.log('\n--- REGISTRATIONS SAMPLE ---');
    console.log(JSON.stringify(regs, null, 2));
  }
  if (lb && lb.length > 0) {
    console.log('\n--- LEADERBOARD SAMPLE ---');
    console.log(JSON.stringify(lb, null, 2));
  }
}

check();
