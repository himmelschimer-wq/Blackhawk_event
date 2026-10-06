import { db } from './db.js';

const FIREBASE_BASE_URL = (
  process.env.VITE_FIREBASE_DATABASE_URL ||
  'https://blackhawk-tournament-default-rtdb.asia-southeast1.firebasedatabase.app'
).replace(/\/$/, '');

/**
 * Clean data for Firebase REST API (sanitize nested JSON strings if present)
 */
function cleanForFirebase(data: any): any {
  if (data === null || data === undefined) return null;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(cleanForFirebase);

  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    // If it's a JSON string like gameSpecificData, parse it for clean tree storage
    if (k === 'gameSpecificData' && typeof v === 'string') {
      try {
        out[k] = JSON.parse(v);
        continue;
      } catch {}
    }
    out[k] = cleanForFirebase(v);
  }
  return out;
}

/**
 * Write a single record to Firebase Realtime Database
 */
export async function syncRecordToFirebase(collection: string, id: string, data: any): Promise<boolean> {
  try {
    const url = `${FIREBASE_BASE_URL}/blackhawk/${collection}/${encodeURIComponent(id)}.json`;
    const payload = cleanForFirebase(data);

    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`[Firebase Sync] Failed to sync ${collection}/${id}: ${res.statusText}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`[Firebase Sync] Error syncing ${collection}/${id}:`, err.message);
    return false;
  }
}

/**
 * Delete a record from Firebase Realtime Database
 */
export async function deleteRecordFromFirebase(collection: string, id: string): Promise<boolean> {
  try {
    const url = `${FIREBASE_BASE_URL}/blackhawk/${collection}/${encodeURIComponent(id)}.json`;
    const res = await fetch(url, { method: 'DELETE' });
    return res.ok;
  } catch (err: any) {
    console.warn(`[Firebase Sync] Error deleting ${collection}/${id}:`, err.message);
    return false;
  }
}

/**
 * Sync all SQLite tables to Firebase in one batch
 */
export async function syncAllTablesToFirebase(): Promise<{ success: boolean; counts: Record<string, number>; error?: string }> {
  try {
    const collections = ['players', 'registrations', 'games', 'events', 'leaderboard'];
    const fullTree: Record<string, any> = {
      meta: {
        lastSyncedAt: new Date().toISOString(),
        service: 'blackhawk-tournament-cloud-sync',
      }
    };
    const counts: Record<string, number> = {};

    for (const col of collections) {
      try {
        const rows = db.prepare(`SELECT * FROM ${col}`).all() as any[];
        const map: Record<string, any> = {};
        for (const r of rows) {
          const id = r.id || r.playerId || `item-${Math.random()}`;
          map[id] = cleanForFirebase(r);
        }
        fullTree[col] = map;
        counts[col] = rows.length;
      } catch (e: any) {
        console.warn(`[Firebase Sync] Error reading ${col}:`, e.message);
      }
    }

    // Sync stats
    try {
      const totalPlayers = (db.prepare('SELECT COUNT(*) as count FROM players').get() as any).count;
      const totalRegistrations = (db.prepare('SELECT COUNT(*) as count FROM registrations').get() as any).count;
      const activeEvents = (db.prepare("SELECT COUNT(*) as count FROM events WHERE eventStatus != 'CANCELLED'").get() as any).count;
      const prizeSum = (db.prepare("SELECT SUM(prizePool) as sum FROM events WHERE eventStatus != 'CANCELLED'").get() as any).sum || 0;

      fullTree.stats = {
        totalPlayers,
        totalRegistrations,
        activeEvents,
        totalPrizePool: prizeSum,
        updatedAt: new Date().toISOString()
      };
    } catch {}

    const url = `${FIREBASE_BASE_URL}/blackhawk.json`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullTree)
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, counts, error: `Firebase responded ${res.status}: ${errText}` };
    }

    console.log(`[Firebase Sync] Successfully mirrored all tournament tables to Firebase RTDB.`);
    return { success: true, counts };
  } catch (err: any) {
    return { success: false, counts: {}, error: err.message };
  }
}
