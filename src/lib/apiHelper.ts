import { supabase, isSupabaseConfigured } from './supabase';
import { normalizeDbRow } from './adminApi';

/**
 * Safely fetches JSON from an API endpoint.
 * Avoids uncaught "SyntaxError: Unexpected token <" or 404 HTML responses.
 * Optionally falls back to direct client-side Supabase query if backend is unreachable.
 */
export async function safeFetchJson<T>(
  url: string,
  fallback: T,
  supabaseTableFallback?: string
): Promise<T> {
  try {
    const res = await fetch(url);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data !== undefined && data !== null) {
        if (Array.isArray(data)) {
          return data.map(r => normalizeDbRow(r)) as unknown as T;
        }
        return (typeof data === 'object' ? normalizeDbRow(data) : data) as T;
      }
    }
  } catch (err) {
    console.warn(`[API Client] Error requesting ${url}:`, err);
  }

  // Direct Supabase fallback if configured and table specified
  if (supabaseTableFallback && isSupabaseConfigured) {
    try {
      const normalizedTable =
        supabaseTableFallback === 'results'
          ? 'match_results'
          : supabaseTableFallback === 'auditLogs'
          ? 'audit_logs'
          : supabaseTableFallback;

      const { data, error } = await supabase.from(normalizedTable).select('*');
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(r => normalizeDbRow(r)) as unknown as T;
      }
    } catch (e) {
      console.warn(`[Supabase Fallback] Error querying ${supabaseTableFallback}:`, e);
    }
  }

  return fallback;
}
