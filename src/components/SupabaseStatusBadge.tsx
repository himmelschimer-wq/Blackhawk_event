import React, { useState, useEffect } from 'react';
import { 
  supabaseConnectionManager, 
  SUPABASE_URL, 
  type SupabaseStatusInfo,
  isSupabaseConfigured
} from '../lib/supabase';
import { tournamentStore } from '../lib/tournamentStore';
import { 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Cloud, 
  Server,
  Zap
} from 'lucide-react';
import { sfx } from '../utils/sfx';

interface SupabaseStatusBadgeProps {
  variant?: 'compact' | 'full' | 'admin-header';
}

export const SupabaseStatusBadge: React.FC<SupabaseStatusBadgeProps> = ({ variant: _variant = 'compact' }) => {
  const [status, setStatus] = useState<SupabaseStatusInfo>(supabaseConnectionManager.getStatus());
  const [showModal, setShowModal] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    const unsub = supabaseConnectionManager.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsub();
  }, []);

  const handleTestConnection = async () => {
    sfx.playClick();
    setTesting(true);
    setTestResult(null);
    try {
      const res = await supabaseConnectionManager.testConnection();
      setTestResult(res.message);
    } catch (err: any) {
      setTestResult(err?.message || 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSyncToSupabase = async () => {
    sfx.playClick();
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await tournamentStore.syncAllToSupabase();
      if (res.success) {
        setSyncResult('Tournament data successfully synchronized to Supabase PostgreSQL!');
      } else {
        setSyncResult(`Sync failed: ${res.error}`);
      }
    } catch (err: any) {
      setSyncResult(`Error: ${err?.message || 'Failed'}`);
    } finally {
      setSyncing(false);
    }
  };

  const copySqlSchema = () => {
    sfx.playClick();
    const sqlNotice = `-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- View full script in file: supabase/schema.sql`;
    navigator.clipboard.writeText(sqlNotice);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // State styling badge
  const getBadgeStyle = () => {
    switch (status.state) {
      case 'connected':
        return {
          bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.15)]',
          dot: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
          label: 'SUPABASE LIVE'
        };
      case 'connecting':
        return {
          bg: 'bg-amber-950/60 border-amber-500/40 text-amber-400 hover:border-amber-400',
          dot: 'bg-amber-400 animate-pulse',
          label: 'SUPABASE CONNECTING'
        };
      case 'permission-denied':
        return {
          bg: 'bg-red-950/60 border-red-500/40 text-red-400 hover:border-red-400',
          dot: 'bg-red-500 animate-ping',
          label: 'RLS LOCKED'
        };
      case 'not-configured':
        return {
          bg: 'bg-blue-950/60 border-blue-500/40 text-blue-400 hover:border-blue-400',
          dot: 'bg-blue-400',
          label: 'SUPABASE READY'
        };
      default:
        return {
          bg: 'bg-zinc-900/80 border-zinc-700/50 text-zinc-400 hover:border-zinc-500',
          dot: 'bg-zinc-500',
          label: 'OFFLINE CACHE'
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <>
      {/* Badge Button Trigger */}
      <button
        onClick={() => {
          sfx.playClick();
          setShowModal(true);
        }}
        title="Supabase PostgreSQL Realtime Database Status"
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer shadow-sm ${badge.bg}`}
      >
        <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
        <Zap className="w-3.5 h-3.5 opacity-90 text-emerald-400" />
        <span className="hidden sm:inline">{badge.label}</span>
      </button>

      {/* Information & Diagnostics Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-[#0d0d11] border border-emerald-600/40 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)] p-6 overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
                    Supabase PostgreSQL Cloud
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      status.state === 'connected' ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300' :
                      status.state === 'permission-denied' ? 'bg-red-950 border border-red-500/40 text-red-300' :
                      status.state === 'not-configured' ? 'bg-blue-950 border border-blue-500/40 text-blue-300' :
                      'bg-amber-950 border border-amber-500/40 text-amber-300'
                    }`}>
                      {status.state.toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans">
                    PostgreSQL database & real-time tournament subscriptions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Details */}
            <div className="space-y-4">
              {/* Endpoint card */}
              <div className="p-3.5 bg-black/60 rounded-xl border border-white/5 space-y-1.5">
                <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    Target Supabase URL
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSupabaseConfigured ? 'text-emerald-400 bg-emerald-950/80' : 'text-amber-400 bg-amber-950/80'}`}>
                    {isSupabaseConfigured ? 'Configured' : 'Local Mock Cache'}
                  </span>
                </div>
                <div className="text-xs font-mono text-zinc-200 break-all bg-zinc-950 p-2 rounded border border-white/5 select-all">
                  {SUPABASE_URL}
                </div>
              </div>

              {/* Status info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5">
                  <div className="text-zinc-500 text-[10px] uppercase font-mono mb-1">State</div>
                  <div className="font-semibold text-white capitalize flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                    {status.state.replace('-', ' ')}
                  </div>
                </div>
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5">
                  <div className="text-zinc-500 text-[10px] uppercase font-mono mb-1">Last Synced</div>
                  <div className="font-semibold text-white truncate">
                    {status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleTimeString() : 'Ready on action'}
                  </div>
                </div>
              </div>

              {/* Schema SQL Guidance card */}
              <div className="p-3.5 bg-zinc-900/40 border border-emerald-500/20 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <Database className="w-4 h-4 shrink-0" />
                    <span>Supabase SQL Schema Ready</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">supabase/schema.sql</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  The complete schema script with tables, RLS policies, indexes, and Realtime replication is generated in <code className="text-emerald-300 bg-emerald-950/50 px-1 py-0.5 rounded">supabase/schema.sql</code>.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href="https://supabase.com/dashboard/project/_/sql"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold text-[11px] underline"
                  >
                    Open Supabase SQL Editor <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={copySqlSchema}
                    className="ml-auto px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded border border-white/10 text-[10px] flex items-center gap-1"
                  >
                    {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedSql ? 'Path Copied' : 'Copy File Info'}
                  </button>
                </div>
              </div>

              {/* Action feedback */}
              {testResult && (
                <div className="p-2.5 bg-zinc-900 border border-white/10 rounded-lg text-xs font-mono text-zinc-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{testResult}</span>
                </div>
              )}

              {syncResult && (
                <div className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 border ${
                  syncResult.includes('success') 
                    ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300' 
                    : 'bg-red-950/50 border-red-500/30 text-red-300'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{syncResult}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Testing...' : 'Test Supabase Link'}</span>
                </button>

                <button
                  onClick={handleSyncToSupabase}
                  disabled={syncing}
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
                >
                  <Cloud className={`w-3.5 h-3.5 ${syncing ? 'animate-pulse' : ''}`} />
                  <span>{syncing ? 'Synchronizing...' : 'Push Local State to Supabase'}</span>
                </button>
              </div>

              {/* Resilience note */}
              <p className="text-[11px] text-zinc-500 text-center font-sans">
                ✓ Offline Resilient: Instant local cache fallback with seamless live Supabase synchronization.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupabaseStatusBadge;
