import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

// Cache for Discord avatar resolution
const avatarCache = new Map();

/**
 * Extract Discord User ID (17-21 digits snowflake) from registration details or discord username
 */
export function extractDiscordUserId(details, discordUsername) {
  if (details && typeof details === 'object') {
    for (const key of Object.keys(details)) {
      if (/discord.*(user.*)?id/i.test(key)) {
        const val = String(details[key]).trim();
        if (/^\d{16,21}$/.test(val)) return val;
      }
    }
    // Also check standard UID if it matches Discord snowflake length
    if (details.UID && /^\d{17,20}$/.test(String(details.UID).trim())) {
      // Free Fire UIDs are typically 8-10 digits, Discord snowflakes are 17-20 digits
      return String(details.UID).trim();
    }
  }
  const cleanDiscord = (discordUsername || '').trim();
  if (/^\d{16,21}$/.test(cleanDiscord)) {
    return cleanDiscord;
  }
  return null;
}

/**
 * Resolve Discord Avatar URL using Discord User ID via JAPI and Discord CDN
 */
export async function resolveDiscordAvatar(userId, discordUsername, gamerTag) {
  const cleanId = (userId || '').trim();
  const cleanUser = (discordUsername || gamerTag || 'player').trim().replace(/^@/, '');

  if (/^\d{16,21}$/.test(cleanId)) {
    if (avatarCache.has(cleanId)) {
      return avatarCache.get(cleanId);
    }
    try {
      const res = await fetch(`https://japi.rest/discord/v1/user/${cleanId}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const json = await res.json();
        const data = json?.data;
        if (data?.avatarURL) {
          avatarCache.set(cleanId, data.avatarURL);
          return data.avatarURL;
        }
        if (data?.defaultAvatarURL) {
          avatarCache.set(cleanId, data.defaultAvatarURL);
          return data.defaultAvatarURL;
        }
      }
    } catch (e) {
      console.warn(`[Discord Avatar] JAPI lookup failed for ID ${cleanId}:`, e.message);
    }

    // Instant Discord CDN snowflake calculation fallback
    try {
      const idx = Number((BigInt(cleanId) >> 22n) % 6n);
      const discordEmbedAvatar = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
      avatarCache.set(cleanId, discordEmbedAvatar);
      return discordEmbedAvatar;
    } catch {}
  }

  // Fallback to username unavatar
  if (cleanUser && !cleanUser.includes(' ') && cleanUser !== 'N/A') {
    return `https://unavatar.io/discord/${encodeURIComponent(cleanUser)}?fallback=https%3A%2F%2Fapi.dicebear.com%2F7.x%2Fbottts%2Fsvg%3Fseed%3D${encodeURIComponent(cleanUser)}%26backgroundColor%3D09090b%2C18181b`;
  }

  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(gamerTag || 'Player')}&backgroundColor=09090b,18181b`;
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

  // Map gamer_tag -> discord_user_id found across registrations
  const playerDiscordIdMap = new Map();
  for (const r of activeRegs) {
    const normTag = (r.gamer_tag || '').trim().toLowerCase();
    const uid = extractDiscordUserId(r.game_specific_details, r.discord_username);
    if (normTag && uid && !playerDiscordIdMap.has(normTag)) {
      playerDiscordIdMap.set(normTag, uid);
    }
  }

  // 4. Map existing players by normalized gamer_tag
  const playerMap = new Map();
  for (const p of activePlayers) {
    const normTag = (p.gamer_tag || '').trim().toLowerCase();
    if (!normTag) continue;
    if (!playerMap.has(normTag)) {
      playerMap.set(normTag, p);
    }
  }

  // 5. Process every registration: Trim fields, deduplicate, ensure player exists
  const regMap = new Map();
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
      const newPlayerId = reg.player_id && reg.player_id.startsWith('ply-') ? reg.player_id : `ply-${crypto.randomUUID()}`;
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
      console.log(`🗑️ Removing duplicate registration ${reg.id} for player ${trimmedTag} in game ${gameName}`);
      await supabase.from('registrations').delete().eq('id', reg.id);
    }
  }

  // 6. Ensure every Player in `players` has a corresponding entry in `leaderboard` with Discord PFP
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
    const discordUserId = playerDiscordIdMap.get(normTag) || extractDiscordUserId(null, p.discord_username);
    
    // Resolve real Discord avatar using Discord User ID
    const pfp = await resolveDiscordAvatar(discordUserId, p.discord_username, p.gamer_tag);
    console.log(`🎨 Resolved PFP for [${p.gamer_tag}] (Discord ID: ${discordUserId || 'none'}): ${pfp}`);

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
      console.log(`🏆 Created synced leaderboard entry for player ${p.gamer_tag} with Discord avatar`);
    } else {
      // Update info & replace avatar with real Discord PFP
      await supabase.from('leaderboard').update({
        player_id: p.id,
        player_name: p.full_name || p.gamer_tag,
        gamer_tag: p.gamer_tag,
        discord_username: p.discord_username || 'N/A',
        avatar: pfp,
        updated_at: new Date().toISOString()
      }).eq('id', existingLb.id);
      console.log(`🔄 Updated leaderboard avatar for player ${p.gamer_tag}`);
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
  console.log('Leaderboard Avatars:');
  vLb?.forEach((l, idx) => {
    console.log(` ${idx + 1}. [${l.id}] ${l.player_name} (@${l.gamer_tag}) -> Avatar: ${l.avatar}`);
  });
  console.log('====================================================\n');

  return {
    playersCount: vPlayers?.length || 0,
    registrationsCount: vRegs?.length || 0,
    leaderboardCount: vLb?.length || 0,
    players: vPlayers,
    registrations: vRegs,
    leaderboard: vLb
  };
}

syncRegistrationsAndPlayers();
