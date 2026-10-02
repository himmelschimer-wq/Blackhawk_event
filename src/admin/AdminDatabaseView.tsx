import React, { useState, useEffect } from 'react';
import { adminApi } from '../lib/adminApi';
import { Database, Search, RefreshCw, Trash2, Eye, AlertCircle, ChevronLeft, ChevronRight, ShieldCheck, X } from 'lucide-react';
import { sfx } from '../utils/sfx';

type TableName = 'players' | 'games' | 'events' | 'registrations' | 'leaderboard' | 'admins';

interface TableMeta {
  id: TableName;
  label: string;
  desc: string;
}

const TABLES: TableMeta[] = [
  { id: 'players', label: 'PLAYERS', desc: 'Registered athlete profiles and gamer identity data' },
  { id: 'games', label: 'GAMES', desc: 'Supported games, banners, and activity flags' },
  { id: 'events', label: 'EVENTS', desc: 'Tournament schedules, prize pools, and rule sheets' },
  { id: 'registrations', label: 'REGISTRATIONS', desc: 'Tournament participation entries and roster rosters' },
  { id: 'leaderboard', label: 'LEADERBOARD', desc: 'Real-time ranking calculations, points, and score ties' },
  { id: 'admins', label: 'ADMINS', desc: 'Authorized control room operators (hashes redacted)' },
];

export const AdminDatabaseView: React.FC = () => {
  const [activeTable, setActiveTable] = useState<TableName>('players');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // View Row Modal
  const [viewingRow, setViewingRow] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchTableData = async (tbl: TableName) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getDatabaseTable(tbl);
      setRows(data);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch table data from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData(activeTable);
  }, [activeTable]);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      sfx.playClick();
      await adminApi.deleteDatabaseRow(activeTable, deleteConfirmId);
      setNotification(`Record ${deleteConfirmId} deleted from ${activeTable}.`);
      setDeleteConfirmId(null);
      fetchTableData(activeTable);
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete row');
    }
  };

  // Filter rows based on search
  const filteredRows = rows.filter((r) => {
    if (!search.trim()) return true;
    const str = JSON.stringify(r).toLowerCase();
    return str.includes(search.toLowerCase());
  });

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Column headers (extract from first row if available, omitting passwordHash or secret)
  const columns = rows.length > 0
    ? Object.keys(rows[0]).filter((k) => !k.toLowerCase().includes('password') && !k.toLowerCase().includes('hash'))
    : [];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-[#161616] border border-[#D71920]/60 px-4 py-3 rounded text-xs font-tech text-white shadow-2xl flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-black text-2xl text-white uppercase tracking-wider">
              DATABASE EXPLORER
            </h2>
            <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-tech text-emerald-400">
              SQLITE NATIVE
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Structured relational view of tables with credential redaction &amp; row management.
          </p>
        </div>

        <button
          onClick={() => fetchTableData(activeTable)}
          className="p-2 rounded bg-black/60 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-colors self-start sm:self-auto"
          title="Refresh Table"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {TABLES.map((t) => {
          const isActive = activeTable === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                sfx.playClick();
                setActiveTable(t.id);
                setSearch('');
              }}
              className={`p-3 rounded border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#180A0B] border-[#D71920] text-white shadow-[0_0_15px_rgba(215,25,32,0.25)]'
                  : 'bg-[#0A0A0A] border-white/10 text-zinc-400 hover:text-white hover:border-white/25'
              }`}
            >
              <div className="font-display font-black text-xs uppercase tracking-wider flex items-center justify-between">
                <span>{t.label}</span>
                <Database className={`w-3 h-3 ${isActive ? 'text-[#D71920]' : 'text-zinc-600'}`} />
              </div>
              <p className="text-[10px] text-zinc-500 line-clamp-1 mt-1 font-tech">
                {t.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search & Info Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0E0E0E] p-4 rounded border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search across ${activeTable}...`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 rounded font-tech text-xs text-white focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-tech text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>CREDENTIALS REDACTED</span>
          <span className="text-zinc-600">|</span>
          <span className="text-white font-bold">{filteredRows.length} ROWS</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/50 rounded flex items-center gap-3 text-red-300 text-xs font-tech">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Display */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/60 text-[11px] font-tech uppercase tracking-widest text-zinc-400">
                {columns.map((col) => (
                  <th key={col} className="py-3 px-4 whitespace-nowrap">
                    {col}
                  </th>
                ))}
                <th className="py-3 px-4 text-right whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-tech text-xs">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1 || 2} className="py-12 text-center text-zinc-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#D71920]" />
                    <span>Querying database table...</span>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1 || 2} className="py-12 text-center text-zinc-500">
                    No rows found in table <code className="text-[#D71920]">{activeTable}</code>.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const rowId = row.id || row.playerId || row.username || `row-${idx}`;
                  return (
                    <tr key={rowId} className="hover:bg-white/[0.02] transition-colors">
                      {columns.map((col) => {
                        const val = row[col];
                        const displayVal =
                          typeof val === 'object' && val !== null
                            ? JSON.stringify(val)
                            : String(val !== undefined && val !== null ? val : '');
                        return (
                          <td key={col} className="py-3 px-4 whitespace-nowrap max-w-xs truncate text-zinc-300">
                            {col === 'id' ? (
                              <span className="font-mono text-zinc-400 text-[11px]">{displayVal}</span>
                            ) : col.toLowerCase().includes('status') ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-900 border border-white/10 text-white">
                                {displayVal}
                              </span>
                            ) : (
                              displayVal
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              sfx.playClick();
                              setViewingRow(row);
                            }}
                            className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            title="Inspect Raw Fields"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {row.id && (
                            <button
                              onClick={() => {
                                sfx.playClick();
                                setDeleteConfirmId(row.id);
                              }}
                              className="p-1.5 rounded hover:bg-red-950/60 text-zinc-500 hover:text-red-400 transition-colors"
                              title="Delete Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between font-tech text-xs text-zinc-400">
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} records
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded bg-black/60 border border-white/10 disabled:opacity-30 hover:border-white/30 text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-white font-bold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded bg-black/60 border border-white/10 disabled:opacity-30 hover:border-white/30 text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW ROW MODAL */}
      {viewingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#0E0E0E] border border-white/10 rounded-lg p-6 shadow-2xl relative font-tech text-xs max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#D71920]" />
                <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">
                  RECORD INSPECTOR: {activeTable}
                </h3>
              </div>
              <button
                onClick={() => setViewingRow(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {Object.entries(viewingRow).map(([key, val]) => (
                <div key={key} className="p-2.5 bg-black/60 rounded border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{key}</span>
                  <div className="font-mono text-zinc-200 text-[11px] break-all select-all">
                    {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val ?? 'NULL')}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10 mt-4 shrink-0">
              <button
                onClick={() => setViewingRow(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded font-tech text-xs"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111111] border border-red-500/40 rounded p-6 shadow-2xl relative font-tech text-xs">
            <div className="flex items-center gap-3 text-red-500 mb-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-display font-black text-base text-white uppercase">
                DELETE DATABASE ROW?
              </h3>
            </div>
            <p className="text-zinc-400 mb-4">
              Delete record ID <strong className="text-white font-mono">{deleteConfirmId}</strong> from table <strong className="text-white">{activeTable}</strong>?
            </p>
            <p className="text-red-400 text-[11px] mb-5 font-bold uppercase tracking-wider">
              This executes a DELETE SQL statement directly in SQLite.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded bg-black border border-white/15 text-zinc-300 hover:text-white"
              >
                CANCEL
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 bg-[#D71920] hover:bg-[#E3262E] text-white font-bold rounded cursor-pointer shadow-[0_0_15px_rgba(215,25,32,0.5)]"
              >
                CONFIRM DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
