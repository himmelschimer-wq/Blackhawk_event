import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://inwyqpxnnirfaqltzorz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlud3lxcHhubmlyZmFxbHR6b3J6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDg3NDE5NiwiZXhwIjoyMTA2NDUwMTk2fQ.hWk0VauGFv4PIYiAl5RewYIl4iNaOKj70vYurX8Q9CY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

function getDiscordAvatar(discordUsername, gamerTag) {
  const clean = (discordUsername || '').trim();
  const seed = encodeURIComponent(clean || gamerTag || 'Player');
  if (clean && !clean.includes(' ') && clean !== 'N/A') {
    return `https://unavatar.io/discord/${seed}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${seed}%26backgroundColor%3D09090b%2C18181b`;
  }
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=09090b,18181b`;
}

export async function syncRegistrationsAndPlayers() {
  console.log('====================================================');
  console.log('🔄 STARTING SUPABASE REGISTRATIONS & PLAYERS SYNC');
  console.log('====================================================\n');

  // 1. Fetch all current tables
  const { data: rawPlayers, error: pErr } = await supabase.from('players').select('*');
  const { data: rawRegs, error: rErr } = await supabase.from('registrations').select('*');
  const { data: rawLb, error: lErr } = await supabase.from('leaderboard').select('*');

  if (pErr) console.error('Error fetching players:', pErr.message);
  if (rErr) console.error('Error fetching registrations:', rErr.message);
  if (lErr) console.error('Error fetching leaderboard:', lErr.message);

  const players = rawPlayers || [];
  const registrations = rawRegs || [];
  const leaderboard = rawLb || [];

  console.log(`Current counts -> Players: ${players.length}, Registrations: ${registrations.length}, Leaderboard: ${leaderboard.length}`);

  // 2. Remove test dummy players (e.g. DEDUP_CHAMP)
  const testRegs = registrations.filter(r => (r.gamer_tag || '').toUpperCase().includes('DEDUP_CHAMP') || (r.player_name || '').toUpperCase().includes('CHAMPION PLAYER'));
  for (const tr of testRegs) {
    await supabase.from('registrations').delete().eq('id', tr.id);
    console.log(`🗑️ Removed test registration ${tr.id} (${tr.gamer_tag})`);
  }

  const testPlayers = players.filter(p => (p.gamer_tag || '').toUpperCase().includes('DEDUP_CHAMP') || (p.full_name || '').toUpperCase().includes('CHAMPION PLAYER'));
  for (const tp of testPlayers) {
    await supabase.from('players').delete().eq('id', tp.id);
    console.log(`🗑️ Removed test player ${tp.id} (${tp.gamer_tag})`);
  }

  const testLb = leaderboard.filter(l => (l.gamer_tag || '').toUpperCase().includes('DEDUP_CHAMP') || (l.player_name || '').toUpperCase().includes('CHAMPION PLAYER'));
  for (const tl of testLb) {
    await supabase.from('leaderboard').delete().eq('id', tl.id);
    console.log(`🗑️ Removed test leaderboard entry ${tl.id} (${tl.gamer_tag})`);
  }

  // 3. Re-fetch clean data
  const { data: cleanRegs } = await supabase.from('registrations').select('*');
  const { data: cleanPlayers } = await supabase.from('players').select('*');
  const { data: cleanLb } = await supabase.from('leaderboard').select('*');

  const activeRegs = cleanRegs || [];
  const activePlayers = cleanPlayers || [];
  const activeLb = cleanLb || [];

  // 4. Map existing players by normalized gamer_tag
  const playerMap = new Map(); // normalized tag -> player record
  for (const p of activePlayers) {
    const normTag = (p.gamer_tag || '').trim().toLowerCase();
    if (!normTag) continue;
    if (!playerMap.has(normTag)) {
      playerMap.set(normTag, p);
    }
  }

  // 5. Process every registration: Trim fields, deduplicate, ensure player exists
  const regMap = new Map(); // key -> unique registration
  for (const reg of activeRegs) {
    const trimmedTag = (reg.gamer_tag || '').trim();
    const trimmedName = (reg.player_name || trimmedTag).trim();
    const trimmedDiscord = (reg.discord_username || 'N/A').trim();
    const trimmedEmail = (reg.email || '').trim();
    const trimmedPhone = (reg.phone || '').trim();
    const gameId = (reg.game_id || 'freefire').toLowerCase();
    const gameName = (reg.game_name || 'FREE FIRE').trim();
    const normTag = trimmedTag.toLowerCase();

    // Check if player exists in players table
    let player = playerMap.get(normTag);
    if (!player) {
      const newPlayerId = reg.player_id && reg.player_id.startsWith('ply-') ? reg.player_id : `ply-${Date.now().toString(36)}${Math.random().toString(36).substring(2, 5)}`;
      player = {
        id: newPlayerId,
        full_name: trimmedName,
        gamer_tag: trimmedTag,
        discord_username: trimmedDiscord,
        email: trimmedEmail,
        phone: trimmedPhone,
        game: gameName,
        team: reg.team_name || null,
        status: 'ACTIVE',
        joined_at: reg.registered_at || new Date().toISOString(),
        created_at: reg.created_at || new Date().toISOString()
      };

      const { error: insErr } = await supabase.from('players').upsert(player, { onConflict: 'id' });
      if (insErr) {
        console.warn(`Failed to insert player ${trimmedTag}:`, insErr.message);
      } else {
        console.log(`✅ Created player in DB: ${trimmedName} (@${trimmedTag}) -> ID: ${newPlayerId}`);
      }
      playerMap.set(normTag, player);
    } else {
      // Ensure player has latest info
      const updatedFields = {
        full_name: trimmedName || player.full_name,
        discord_username: trimmedDiscord !== 'N/A' ? trimmedDiscord : player.discord_username,
        email: trimmedEmail || player.email || '',
        phone: trimmedPhone || player.phone || ''
      };
      await supabase.from('players').update(updatedFields).eq('id', player.id);
    }

    // Key for duplicate detection: tag + game_id + event_id
    const dupKey = `${normTag}_${gameId}_${reg.event_id || 'general'}`;
    if (!regMap.has(dupKey)) {
      // First registration for this game
      regMap.set(dupKey, reg);
      
      // Update registration with normalized player_id and trimmed tags
      await supabase.from('registrations').update({
        player_id: player.id,
        player_name: trimmedName,
        gamer_tag: trimmedTag,
        discord_username: trimmedDiscord,
        email: trimmedEmail,
        phone: trimmedPhone,
        game_id: gameId,
        game_name: gameName
      }).eq('id', reg.id);
      console.log(`✓ Synchronized registration ${reg.id} for ${trimmedTag} -> Player ID: ${player.id}`);
    } else {
      // Duplicate registration found -> delete redundant row
      console.log(`🗑️ Removing duplicate registration ${reg.id} for player ${trimmedTag} in game ${gameName}`);
      await supabase.from('registrations').delete().eq('id', reg.id);
    }
  }

  // 6. Ensure every Player in `players` has a corresponding entry in `leaderboard`
  const { data: finalPlayers } = await supabase.from('players').select('*');
  const { data: currentLb } = await supabase.from('leaderboard').select('*');
  const lbTagMap = new Map();
  for (const l of (currentLb || [])) {
    const tag = (l.gamer_tag || '').trim().toLowerCase();
    if (tag) lbTagMap.set(tag, l);
  }

  for (const p of (finalPlayers || [])) {
    const normTag = (p.gamer_tag || '').trim().toLowerCase();
    if (!normTag) continue;

    const existingLb = lbTagMap.get(normTag);
    const pfp = getDiscordAvatar(p.discord_username, p.gamer_tag);

    if (!existingLb) {
      const newLbId = `lb-${p.id}`;
      const lbEntry = {
        id: newLbId,
        player_id: p.id,
        player_name: p.full_name || p.gamer_tag,
        gamer_tag: p.gamer_tag,
        discord_username: p.discord_username || 'N/A',
        game: p.game || 'FREE FIRE',
        points: 0,
        score: 0,
        wins: 0,
        matches: 0,
        rank: 1,
        avatar: pfp,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await supabase.from('leaderboard').upsert(lbEntry, { onConflict: 'id' });
      console.log(`🏆 Created synced leaderboard entry for player ${p.gamer_tag}`);
    } else {
      // Update info
      await supabase.from('leaderboard').update({
        player_id: p.id,
        player_name: p.full_name || p.gamer_tag,
        gamer_tag: p.gamer_tag,
        discord_username: p.discord_username || 'N/A',
        avatar: existingLb.avatar || pfp,
        updated_at: new Date().toISOString()
      }).eq('id', existingLb.id);
    }
  }

  // 7. Verify Final Synced Database State
  const { data: vPlayers } = await supabase.from('players').select('*');
  const { data: vRegs } = await supabase.from('registrations').select('*');
  const { data: vLb } = await supabase.from('leaderboard').select('*');

  console.log('\n====================================================');
  console.log('🎉 SYNC COMPLETE - FINAL DATABASE AUDIT');
  console.log('====================================================');
  console.log(`✅ Total Players      : ${vPlayers?.length}`);
  console.log(`✅ Total Registrations: ${vRegs?.length}`);
  console.log(`✅ Total Leaderboard  : ${vLb?.length}`);
  console.log('----------------------------------------------------');
  console.log('Synced Players:');
  vPlayers?.forEach((p, idx) => {
    console.log(` ${idx + 1}. [${p.id}] ${p.full_name} (@${p.gamer_tag}) - Discord: ${p.discord_username}`);
  });
  console.log('----------------------------------------------------');
  console.log('Synced Registrations:');
  vRegs?.forEach((r, idx) => {
    console.log(` ${idx + 1}. [${r.id}] Player: ${r.player_name} (@${r.gamer_tag}) -> Game: ${r.game_name} | Player ID: ${r.player_id}`);
  });
  console.log('====================================================\n');

  return {
    playersCount: vPlayers?.length || 0,
    registrationsCount: vRegs?.length || 0,
    leaderboardCount: vLb?.length || 0,
    players: vPlayers,
    registrations: vRegs
  };
}

syncRegistrationsAndPlayers();
