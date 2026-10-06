import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';

export const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL ||
  'https://inwyqpxnnirfaqltzorz.supabase.co'
).trim();

export const SUPABASE_ANON_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlud3lxcHhubmlyZmFxbHR6b3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzQxOTYsImV4cCI6MjEwNjQ1MDE5Nn0.Ls1fM8YlTsCJFL83vp790pw9_T7rZ686uJEs7ljxnj8'
).trim();

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('xyzcompany')
);

// Initialize Supabase Client
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

export type SupabaseConnectionState = 'connecting' | 'connected' | 'disconnected' | 'permission-denied' | 'error' | 'not-configured';

export interface SupabaseStatusInfo {
  state: SupabaseConnectionState;
  supabaseUrl: string;
  isConfigured: boolean;
  lastSyncedAt: string | null;
  errorMessage?: string;
}

type StatusListener = (status: SupabaseStatusInfo) => void;

class SupabaseConnectionManager {
  private status: SupabaseStatusInfo = {
    state: isSupabaseConfigured ? 'connecting' : 'not-configured',
    supabaseUrl: SUPABASE_URL,
    isConfigured: isSupabaseConfigured,
    lastSyncedAt: null
  };

  private listeners: Set<StatusListener> = new Set();
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && isSupabaseConfigured) {
      this.checkInitialConnection();
    }
  }

  public getStatus(): SupabaseStatusInfo {
    return { ...this.status };
  }

  public subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const s = this.getStatus();
    this.listeners.forEach((fn) => {
      try { fn(s); } catch (e) { console.error(e); }
    });
  }

  public setCustomStatus(partial: Partial<SupabaseStatusInfo>) {
    this.status = { ...this.status, ...partial };
    this.notify();
  }

  public async checkInitialConnection(): Promise<void> {
    if (!isSupabaseConfigured) {
      this.setCustomStatus({ state: 'not-configured' });
      return;
    }

    try {
      this.setCustomStatus({ state: 'connecting' });
      // Probe public table or health
      const { error } = await supabase
        .from('games')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42501' || error.message.toLowerCase().includes('permission')) {
          this.setCustomStatus({
            state: 'permission-denied',
            errorMessage: 'Supabase RLS Policy locked. Check schema.sql RLS policies.'
          });
        } else {
          this.setCustomStatus({
            state: 'error',
            errorMessage: error.message
          });
        }
      } else {
        this.setCustomStatus({
          state: 'connected',
          lastSyncedAt: new Date().toISOString(),
          errorMessage: undefined
        });
      }
    } catch (err: any) {
      this.setCustomStatus({
        state: 'error',
        errorMessage: err?.message || 'Connection failed'
      });
    }
  }

  public async testConnection(): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const start = performance.now();

    if (!isSupabaseConfigured) {
      return {
        success: false,
        message: 'Supabase URL / Anon Key not set. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env',
        latencyMs: 0
      };
    }

    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, name')
        .limit(5);

      const elapsed = Math.round(performance.now() - start);

      if (error) {
        this.setCustomStatus({ state: 'error', errorMessage: error.message });
        return {
          success: false,
          message: `Supabase Error (${error.code || 'FAIL'}): ${error.message}`,
          latencyMs: elapsed
        };
      }

      this.setCustomStatus({
        state: 'connected',
        lastSyncedAt: new Date().toISOString(),
        errorMessage: undefined
      });

      return {
        success: true,
        message: `Connected to Supabase PostgreSQL in ${elapsed}ms (${data?.length || 0} games verified)`,
        latencyMs: elapsed
      };
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      return {
        success: false,
        message: `Network Exception: ${err?.message || 'Unknown network error'}`,
        latencyMs: elapsed
      };
    }
  }

  public getOrCreateChannel(name: string): RealtimeChannel {
    if (this.channels.has(name)) {
      return this.channels.get(name)!;
    }
    const channel = supabase.channel(name);
    this.channels.set(name, channel);
    return channel;
  }
}

export const supabaseConnectionManager = new SupabaseConnectionManager();
