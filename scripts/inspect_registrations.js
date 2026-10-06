import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://inwyqpxnnirfaqltzorz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlud3lxcHhubmlyZmFxbHR6b3J6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDg3NDE5NiwiZXhwIjoyMTA2NDUwMTk2fQ.hWk0VauGFv4PIYiAl5RewYIl4iNaOKj70vYurX8Q9CY';

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
