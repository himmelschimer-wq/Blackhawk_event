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
  const { data: regs } = await supabase.from('registrations').select('*').order('registered_at', { ascending: false });
  console.log('Total Registrations in DB:', regs?.length);
  regs?.forEach(r => {
    console.log(`[${r.id}] Tag: "${r.gamer_tag}" | Name: "${r.player_name}" | Game: "${r.game_name}" (${r.game_id}) | Event: "${r.event_title}" (${r.event_id}) | UID Details:`, JSON.stringify(r.game_specific_details));
  });
}
run();
