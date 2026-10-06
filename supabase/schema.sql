-- ==============================================================================
-- BLACKHAWK ESPORTS TOURNAMENT PLATFORM - PRODUCTION HARDENED SCHEMA
-- ==============================================================================
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ADMINS TABLE (CRITICAL SENSITIVE - NO ANONYMOUS ACCESS)
CREATE TABLE IF NOT EXISTS public.admins (
    id TEXT PRIMARY KEY DEFAULT ('adm-' || encode(gen_random_bytes(8), 'hex')),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL DEFAULT 'BlackHawk Admin',
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'ORGANIZER', 'VIEWER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SESSIONS TABLE (CRITICAL SENSITIVE - NO ANONYMOUS ACCESS)
CREATE TABLE IF NOT EXISTS public.sessions (
    token TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    expires_at BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. GAMES TABLE (PUBLIC READABLE CATALOG)
CREATE TABLE IF NOT EXISTS public.games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo TEXT,
    banner TEXT,
    category TEXT,
    default_prize_pool NUMERIC NOT NULL DEFAULT 0 CHECK (default_prize_pool >= 0),
    format TEXT NOT NULL DEFAULT 'SOLO',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. EVENTS TABLE (PUBLIC READABLE TOURNAMENTS)
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY DEFAULT ('ev-' || encode(gen_random_bytes(8), 'hex')),
    game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    game_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'SOLO',
    prize_pool NUMERIC NOT NULL DEFAULT 0 CHECK (prize_pool >= 0),
    max_participants INTEGER NOT NULL DEFAULT 100 CHECK (max_participants > 0),
    registration_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (registration_status IN ('OPEN', 'CLOSED')),
    event_status TEXT NOT NULL DEFAULT 'REGISTRATION OPEN' CHECK (event_status IN ('UPCOMING', 'REGISTRATION OPEN', 'LIVE', 'COMPLETED', 'ARCHIVED', 'CANCELLED')),
    rules TEXT,
    general_rules TEXT,
    banner TEXT,
    prize_rules JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PLAYERS TABLE (SENSITIVE PII - ACCESS VIA AUTHENTICATED API ONLY)
CREATE TABLE IF NOT EXISTS public.players (
    id TEXT PRIMARY KEY DEFAULT ('ply-' || encode(gen_random_bytes(8), 'hex')),
    full_name TEXT NOT NULL,
    gamer_tag TEXT NOT NULL,
    discord_username TEXT NOT NULL DEFAULT 'N/A',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    game TEXT NOT NULL DEFAULT 'ALL',
    team TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISQUALIFIED', 'BENCHED')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. LEADERBOARD TABLE (PUBLIC SPECTATOR READABLE)
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id TEXT PRIMARY KEY DEFAULT ('lb-' || encode(gen_random_bytes(8), 'hex')),
    player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    gamer_tag TEXT NOT NULL,
    discord_username TEXT NOT NULL DEFAULT 'N/A',
    game TEXT NOT NULL DEFAULT 'ALL',
    points NUMERIC NOT NULL DEFAULT 0 CHECK (points >= 0),
    score NUMERIC NOT NULL DEFAULT 0 CHECK (score >= 0),
    wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
    matches INTEGER NOT NULL DEFAULT 0 CHECK (matches >= 0),
    rank INTEGER DEFAULT 1 CHECK (rank >= 1),
    avatar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. REGISTRATIONS TABLE (SENSITIVE PII - SERVER-CONTROLLED MUTATION)
CREATE TABLE IF NOT EXISTS public.registrations (
    id TEXT PRIMARY KEY DEFAULT ('BHL-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8))),
    player_id TEXT,
    player_name TEXT NOT NULL,
    gamer_tag TEXT NOT NULL,
    discord_username TEXT NOT NULL DEFAULT 'N/A',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    game_id TEXT NOT NULL,
    game_name TEXT NOT NULL,
    event_id TEXT,
    event_title TEXT,
    week TEXT,
    play_type TEXT NOT NULL DEFAULT 'Solo' CHECK (play_type IN ('Solo', 'Team / Squad', 'Team')),
    team_name TEXT,
    team_members TEXT,
    game_specific_details JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED', 'APPROVED', 'REJECTED', 'DISQUALIFIED')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. MATCH RESULTS / SCORES TABLE (PRIVILEGED TOURNAMENT DATA)
CREATE TABLE IF NOT EXISTS public.match_results (
    id TEXT PRIMARY KEY DEFAULT ('res-' || encode(gen_random_bytes(8), 'hex')),
    event_id TEXT,
    game_name TEXT NOT NULL,
    week TEXT,
    player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    gamer_tag TEXT NOT NULL,
    placement INTEGER CHECK (placement IS NULL OR placement >= 0),
    participated BOOLEAN NOT NULL DEFAULT TRUE,
    challenge_winner BOOLEAN NOT NULL DEFAULT FALSE,
    rising_star BOOLEAN NOT NULL DEFAULT FALSE,
    points JSONB DEFAULT '{}'::jsonb,
    total_points NUMERIC NOT NULL DEFAULT 0 CHECK (total_points >= 0),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEW', 'PUBLISHED')),
    published_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. DRAWS TABLE (PRIVILEGED LUCKY DRAWS)
CREATE TABLE IF NOT EXISTS public.draws (
    id TEXT PRIMARY KEY DEFAULT ('draw-' || encode(gen_random_bytes(8), 'hex')),
    event_id TEXT,
    game_name TEXT NOT NULL,
    week TEXT,
    winner_player_id TEXT NOT NULL,
    winner_name TEXT NOT NULL,
    winner_tag TEXT NOT NULL,
    reward_amount NUMERIC NOT NULL DEFAULT 25 CHECK (reward_amount >= 0),
    eligible_count INTEGER NOT NULL DEFAULT 0 CHECK (eligible_count >= 0),
    conducted_by TEXT NOT NULL DEFAULT 'Admin',
    drawn_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. AUDIT LOGS TABLE (HIGH SECURITY SENSITIVE - SERVER EXCLUSIVE)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('log-' || encode(gen_random_bytes(8), 'hex')),
    admin_user TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'ORGANIZER', 'VIEWER')),
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. PAYOUTS TABLE (FINANCIAL SENSITIVE - SERVER EXCLUSIVE)
CREATE TABLE IF NOT EXISTS public.payouts (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    total_payout NUMERIC NOT NULL DEFAULT 0 CHECK (total_payout >= 0),
    winners_json JSONB DEFAULT '[]'::jsonb,
    calculations_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. SYSTEM SETTINGS TABLE (PRIVILEGED CONFIGURATION)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- DATABASE CONSTRAINTS & UNIQUE INDEXES (RACE CONDITION DEFENSE)
-- ==============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_lower_gamertag ON public.players(lower(gamer_tag));
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_player_game_active ON public.registrations(lower(gamer_tag), lower(game_id)) WHERE status != 'REJECTED';
CREATE INDEX IF NOT EXISTS idx_events_game_id ON public.events(game_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(event_status);
CREATE INDEX IF NOT EXISTS idx_leaderboard_game ON public.leaderboard(game);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON public.leaderboard(points DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_game_id ON public.registrations(game_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_match_results_event_id ON public.match_results(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- ==============================================================================
-- HARDENED ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Enable RLS on ALL tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Clean existing overly-permissive policies
DO $$
BEGIN
    -- Drop all legacy insecure public policies
    DROP POLICY IF EXISTS "Public Read Games" ON public.games;
    DROP POLICY IF EXISTS "Public Read Events" ON public.events;
    DROP POLICY IF EXISTS "Public Read Players" ON public.players;
    DROP POLICY IF EXISTS "Public Read Leaderboard" ON public.leaderboard;
    DROP POLICY IF EXISTS "Public Read Registrations" ON public.registrations;
    DROP POLICY IF EXISTS "Public Read Match Results" ON public.match_results;
    DROP POLICY IF EXISTS "Public Read Draws" ON public.draws;
    DROP POLICY IF EXISTS "Public Read Audit Logs" ON public.audit_logs;
    DROP POLICY IF EXISTS "Public Read Payouts" ON public.payouts;
    DROP POLICY IF EXISTS "Public Read System Settings" ON public.system_settings;
    DROP POLICY IF EXISTS "Public Insert Registrations" ON public.registrations;
    DROP POLICY IF EXISTS "Public Insert Players" ON public.players;

    -- Drop legacy wildcard service role policies
    DROP POLICY IF EXISTS "Service Role Full Access Games" ON public.games;
    DROP POLICY IF EXISTS "Service Role Full Access Events" ON public.events;
    DROP POLICY IF EXISTS "Service Role Full Access Players" ON public.players;
    DROP POLICY IF EXISTS "Service Role Full Access Leaderboard" ON public.leaderboard;
    DROP POLICY IF EXISTS "Service Role Full Access Registrations" ON public.registrations;
    DROP POLICY IF EXISTS "Service Role Full Access Match Results" ON public.match_results;
    DROP POLICY IF EXISTS "Service Role Full Access Draws" ON public.draws;
    DROP POLICY IF EXISTS "Service Role Full Access Audit Logs" ON public.audit_logs;
    DROP POLICY IF EXISTS "Service Role Full Access Payouts" ON public.payouts;
    DROP POLICY IF EXISTS "Service Role Full Access Admins" ON public.admins;
    DROP POLICY IF EXISTS "Service Role Full Access Sessions" ON public.sessions;
    DROP POLICY IF EXISTS "Service Role Full Access System Settings" ON public.system_settings;
END $$;

-- ─── 1. PUBLIC SPECTATOR ACCESS (SELECT ONLY FOR NON-SENSITIVE DATA) ──────────
-- Public may ONLY inspect the games list, active events, and public leaderboard
CREATE POLICY "Public Read Games" ON public.games
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Public Read Events" ON public.events
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Public Read Leaderboard" ON public.leaderboard
    FOR SELECT TO anon, authenticated
    USING (true);

-- ─── 2. RESTRICT SENSITIVE TABLES TO SERVICE ROLE ONLY ───────────────────────
-- Sensitive tables (admins, sessions, players, registrations, audit_logs, payouts,
-- match_results, draws, system_settings) CANNOT be queried by anon/browser directly.
-- The Express API service role is granted full access.

CREATE POLICY "Service Role Only Admins" ON public.admins
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Only Sessions" ON public.sessions
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Only Players" ON public.players
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Only Registrations" ON public.registrations
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Only Match Results" ON public.match_results
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Only Draws" ON public.draws
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Only Audit Logs" ON public.audit_logs
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Only Payouts" ON public.payouts
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Only System Settings" ON public.system_settings
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Games" ON public.games
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Events" ON public.events
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Service Role Full Leaderboard" ON public.leaderboard
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ==============================================================================
-- REALTIME REPLICATION (PUBLIC CHANNELS ONLY)
-- ==============================================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
END $$;

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================
INSERT INTO public.games (id, name, description, logo, banner, category, default_prize_pool, format, active)
VALUES 
('freefire', 'FREE FIRE', 'Free Fire high-octane survival clash, squad gauntlet & 1v1 challenge.', '/assets/badge_freefire.png', '/assets/official_game_freefire.png', 'SURVIVAL SHOOTER', 700, 'SQUAD & 1v1', true),
('bgmi', 'BGMI', 'Battlegrounds Mobile India premier championship series.', '/assets/badge_bgmi.png', '/assets/official_game_bgmi.png', 'BATTLE ROYALE', 350, 'SOLO / SQUAD', true),
('valorant', 'VALORANT', '5v5 tactical spike rush, precision gunplay, and clutch tournament.', '/assets/badge_valorant.png', '/assets/official_game_valorant.png', 'TACTICAL 5v5', 20000, '5v5', true),
('minecraft', 'MINECRAFT', 'Competitive build battle, survival games, and PvP arena clash.', '/assets/badge_minecraft.png', '/assets/official_game_minecraft.png', 'BUILD & PVP', 350, 'SOLO', true),
('chess', 'CHESS', 'Rapid and blitz tactical mastery across 64 squares.', '/assets/badge_bgmi.png', '/assets/official_game_bgmi.png', 'STRATEGY', 200, 'SOLO', true),
('scribble', 'SCRIBBLE', 'Lightning speed sketch & guess community showdown.', '/assets/badge_minecraft.png', '/assets/official_game_minecraft.png', 'PARTY & CASUAL', 150, 'SOLO', true)
ON CONFLICT (id) DO NOTHING;
