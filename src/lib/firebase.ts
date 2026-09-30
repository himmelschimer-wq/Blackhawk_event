import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, get, type Database } from 'firebase/database';

export const FIREBASE_RTDB_URL = 
  import.meta.env.VITE_FIREBASE_DATABASE_URL || 
  'https://blackhawk-tournament-default-rtdb.asia-southeast1.firebasedatabase.app/';

export const firebaseConfig = {
  databaseURL: FIREBASE_RTDB_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'blackhawk-tournament',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'blackhawk-tournament.firebaseapp.com',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'blackhawk-tournament.appspot.com',
};

// Initialize or reuse Firebase App
export const firebaseApp = getApps().length > 0 
  ? getApp() 
  : initializeApp(firebaseConfig);

// Initialize Realtime Database
export const rtdb: Database = getDatabase(firebaseApp, FIREBASE_RTDB_URL);

export type FirebaseConnectionState = 'connecting' | 'connected' | 'disconnected' | 'permission-denied' | 'error';

export interface FirebaseStatusInfo {
  state: FirebaseConnectionState;
  databaseUrl: string;
  errorMessage?: string;
  lastConnectedAt?: string;
  lastSyncedAt?: string;
}

class FirebaseConnectionManager {
  private status: FirebaseStatusInfo = {
    state: 'connecting',
    databaseUrl: FIREBASE_RTDB_URL
  };
  private listeners: Array<(status: FirebaseStatusInfo) => void> = [];

  constructor() {
    this.initConnectionWatcher();
  }

  private initConnectionWatcher() {
    try {
      const connectedRef = ref(rtdb, '.info/connected');
      onValue(
        connectedRef,
        (snapshot) => {
          const isConnected = snapshot.val() === true;
          this.status = {
            ...this.status,
            state: isConnected ? 'connected' : 'disconnected',
            lastConnectedAt: isConnected ? new Date().toISOString() : this.status.lastConnectedAt,
            errorMessage: undefined
          };
          this.notify();
        },
        (error) => {
          console.warn('[Firebase RTDB] Connection state error:', error.message);
          const isPerm = error.message?.toLowerCase().includes('permission_denied') || 
                         error.message?.toLowerCase().includes('permission denied');
          this.status = {
            ...this.status,
            state: isPerm ? 'permission-denied' : 'error',
            errorMessage: error.message
          };
          this.notify();
        }
      );
    } catch (err: any) {
      console.warn('[Firebase RTDB] Failed to bind .info/connected:', err);
      this.status = {
        ...this.status,
        state: 'error',
        errorMessage: err?.message || 'Initialization failed'
      };
    }
  }

  setCustomStatus(update: Partial<FirebaseStatusInfo>) {
    this.status = { ...this.status, ...update };
    this.notify();
  }

  getStatus(): FirebaseStatusInfo {
    return { ...this.status };
  }

  subscribe(listener: (status: FirebaseStatusInfo) => void) {
    this.listeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.getStatus()));
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const testRef = ref(rtdb, '.info/serverTimeOffset');
      const snap = await get(testRef);
      return { ok: true, message: `Connected to Firebase RTDB (offset: ${snap.val() ?? 0}ms)` };
    } catch (err: any) {
      const msg = err?.message || 'Connection check failed';
      const isPerm = msg.toLowerCase().includes('permission_denied') || msg.toLowerCase().includes('permission denied');
      if (isPerm) {
        this.setCustomStatus({ state: 'permission-denied', errorMessage: msg });
        return { ok: false, message: 'Permission Denied: Realtime Database security rules are locked.' };
      }
      return { ok: false, message: msg };
    }
  }
}

export function sanitizeForFirebase(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirebase(item));
  }
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = sanitizeForFirebase(val);
    }
  }
  return clean;
}

export function parseFirebaseList<T extends { id?: string }>(val: any): T[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.filter(Boolean) as T[];
  }
  if (typeof val === 'object') {
    return Object.values(val) as T[];
  }
  return [];
}

export const firebaseConnectionManager = new FirebaseConnectionManager();
