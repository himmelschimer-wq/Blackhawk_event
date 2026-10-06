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

async function cleanExactDuplicates() {
  console.log('🔄 Cleaning duplicate registrations so each player appears only ONCE per game...');

  const { data: regs, error } = await supabase.from('registrations').select('*').order('registered_at', { ascending: false });
  if (error) {
    console.error('Error fetching registrations:', error.message);
    return;
  }

  const groups = new Map(); // key -> list of reg rows
  for (const r of (regs || [])) {
    const normTag = (r.gamer_tag || '').trim().toLowerCase();
    const gameId = (r.game_id || 'freefire').toLowerCase();
    const key = `${normTag}_${gameId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  for (const [key, list] of groups.entries()) {
    if (list.length > 1) {
      // Sort: prefer row with event_id, then most complete game_specific_details, then newest registered_at
      list.sort((a, b) => {
        const aHasEvent = Boolean(a.event_id && a.event_id !== 'null');
        const bHasEvent = Boolean(b.event_id && b.event_id !== 'null');
        if (aHasEvent && !bHasEvent) return -1;
        if (!aHasEvent && bHasEvent) return 1;

        const aDetailsLen = Object.keys(a.game_specific_details || {}).length;
        const bDetailsLen = Object.keys(b.game_specific_details || {}).length;
        if (aDetailsLen !== bDetailsLen) return bDetailsLen - aDetailsLen;

        return new Date(b.registered_at || 0).getTime() - new Date(a.registered_at || 0).getTime();
      });

      const primary = list[0];
      const duplicates = list.slice(1);

      console.log(`Keeping primary registration [${primary.id}] for "${primary.gamer_tag}" (Event: ${primary.event_title || 'General'})`);
      for (const dup of duplicates) {
        console.log(` 🗑️ Deleting duplicate registration [${dup.id}] for "${dup.gamer_tag}"`);
        await supabase.from('registrations').delete().eq('id', dup.id);
      }
    }
  }

  // Verify final count
  const { data: finalRegs } = await supabase.from('registrations').select('*').order('registered_at', { ascending: false });
  console.log('\n✅ DEDUPLICATION COMPLETE! Total unique registrations in DB:', finalRegs?.length);
  finalRegs?.forEach((r, idx) => {
    console.log(` ${idx + 1}. [${r.id}] ${r.player_name} (@${r.gamer_tag}) - Game: ${r.game_name} | Event: ${r.event_title || 'General'}`);
  });
}

cleanExactDuplicates();
