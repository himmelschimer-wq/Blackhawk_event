import React, { useState, useEffect } from 'react';
import { 
  firebaseConnectionManager, 
  FIREBASE_RTDB_URL, 
  type FirebaseStatusInfo 
} from '../lib/firebase';
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
  ShieldAlert,
  Server
} from 'lucide-react';
import { sfx } from '../utils/sfx';

interface FirebaseStatusBadgeProps {
  variant?: 'compact' | 'full' | 'admin-header';
}

export const FirebaseStatusBadge: React.FC<FirebaseStatusBadgeProps> = ({ variant: _variant = 'compact' }) => {
  const [status, setStatus] = useState<FirebaseStatusInfo>(firebaseConnectionManager.getStatus());
  const [showModal, setShowModal] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);

  useEffect(() => {
    const unsub = firebaseConnectionManager.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsub();
  }, []);

  const handleTestConnection = async () => {
    sfx.playClick();
    setTesting(true);
    setTestResult(null);
    try {
      const res = await firebaseConnectionManager.testConnection();
      setTestResult(res.message);
    } catch (err: any) {
      setTestResult(err?.message || 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSyncToFirebase = async () => {
    sfx.playClick();
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await tournamentStore.syncAllToFirebase();
      if (res.success) {
        setSyncResult('Tournament data successfully uploaded to Firebase RTDB!');
      } else {
        setSyncResult(`Sync failed: ${res.error}`);
      }
    } catch (err: any) {
      setSyncResult(`Error: ${err?.message || 'Failed'}`);
    } finally {
      setSyncing(false);
    }
  };

  const copySecurityRules = () => {
    sfx.playClick();
    const rulesJson = JSON.stringify({
      rules: {
        ".read": true,
        ".write": true
      }
    }, null, 2);
    navigator.clipboard.writeText(rulesJson);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  // State styling badge
  const getBadgeStyle = () => {
    switch (status.state) {
      case 'connected':
        return {
          bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:border-emerald-400',
          dot: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
          label: 'RTDB LIVE'
        };
      case 'connecting':
        return {
          bg: 'bg-amber-950/60 border-amber-500/40 text-amber-400 hover:border-amber-400',
          dot: 'bg-amber-400 animate-pulse',
          label: 'RTDB CONNECTING'
        };
      case 'permission-denied':
        return {
          bg: 'bg-red-950/60 border-red-500/40 text-red-400 hover:border-red-400',
          dot: 'bg-red-500 animate-ping',
          label: 'RULES LOCKED'
        };
      default:
        return {
          bg: 'bg-zinc-900/80 border-zinc-700/50 text-zinc-400 hover:border-zinc-500',
          dot: 'bg-zinc-500',
          label: 'RTDB CACHED'
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
        title="Firebase Realtime Database Cloud Sync Status"
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer shadow-sm ${badge.bg}`}
      >
        <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
        <Database className="w-3.5 h-3.5 opacity-80" />
        <span className="hidden sm:inline">{badge.label}</span>
      </button>

      {/* Information & Diagnostics Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-[#0d0d11] border border-red-600/40 rounded-2xl shadow-[0_0_50px_rgba(225,6,0,0.25)] p-6 overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
                    Firebase Cloud Sync
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      status.state === 'connected' ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300' :
                      status.state === 'permission-denied' ? 'bg-red-950 border border-red-500/40 text-red-300' :
                      'bg-amber-950 border border-amber-500/40 text-amber-300'
                    }`}>
                      {status.state.toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans">
                    Real-time tournament database synchronization
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
                <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-red-400" />
                  Target Realtime Database URL
                </div>
                <div className="text-xs font-mono text-zinc-200 break-all bg-zinc-950 p-2 rounded border border-white/5 select-all">
                  {FIREBASE_RTDB_URL}
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

              {/* Permission Denied Alert & Security Rules Guidance */}
              {status.state === 'permission-denied' && (
                <div className="p-3.5 bg-red-950/40 border border-red-600/40 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-red-400">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Firebase Security Rules Warning</span>
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    Your database is reachable, but its security rules are currently locked (default mode). 
                    To enable live registrations and public leaderboard sync, update your rules in the Firebase Console:
                  </p>
                  <div className="relative bg-black/80 p-2.5 rounded border border-red-500/20 font-mono text-[11px] text-emerald-400">
                    <pre className="overflow-x-auto">
{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
                    </pre>
                    <button
                      onClick={copySecurityRules}
                      className="absolute top-2 right-2 px-2 py-1 bg-red-900/40 hover:bg-red-800/60 text-red-200 rounded border border-red-500/30 text-[10px] flex items-center gap-1"
                    >
                      {copiedRules ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedRules ? 'Copied' : 'Copy Rules'}
                    </button>
                  </div>
                  <a
                    href="https://console.firebase.google.com/project/blackhawk-tournament/database/blackhawk-tournament-default-rtdb/rules"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 font-bold text-[11px] mt-1 underline"
                  >
                    Open Firebase Console Rules Tab <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

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
                  className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  onClick={handleSyncToFirebase}
                  disabled={syncing}
                  className="flex-1 px-3 py-2 bg-[#e10600] hover:bg-[#ff1e1e] text-white rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition shadow-[0_0_15px_rgba(225,6,0,0.3)] disabled:opacity-50"
                >
                  <Cloud className={`w-3.5 h-3.5 ${syncing ? 'animate-pulse' : ''}`} />
                  <span>{syncing ? 'Uploading Data...' : 'Sync Local Data to Firebase'}</span>
                </button>
              </div>

              {/* Offline fallback note */}
              <p className="text-[11px] text-zinc-500 text-center font-sans">
                ✓ Offline Resilient: All data is instantly cached locally and seamlessly syncs to Firebase RTDB.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
