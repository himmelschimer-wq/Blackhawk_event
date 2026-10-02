-- ==============================================================================
-- BLACKHAWK ESPORTS TOURNAMENT PLATFORM - SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================
-- Run this script directly in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.admins (
    id TEXT PRIMARY KEY DEFAULT ('adm-' || extract(epoch from now())::bigint),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL DEFAULT 'BlackHawk Admin',
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'ORGANIZER', 'VIEWER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.sessions (
    token TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    expires_at BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. GAMES TABLE
CREATE TABLE IF NOT EXISTS public.games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo TEXT,
    banner TEXT,
    category TEXT,
    default_prize_pool NUMERIC NOT NULL DEFAULT 0,
    format TEXT NOT NULL DEFAULT 'SOLO',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY DEFAULT ('ev-' || substr(md5(random()::text), 1, 8)),
    game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    game_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'SOLO',
    prize_pool NUMERIC NOT NULL DEFAULT 0,
    max_participants INTEGER NOT NULL DEFAULT 100,
    registration_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (registration_status IN ('OPEN', 'CLOSED')),
    event_status TEXT NOT NULL DEFAULT 'REGISTRATION OPEN' CHECK (event_status IN ('UPCOMING', 'REGISTRATION OPEN', 'LIVE', 'COMPLETED', 'ARCHIVED', 'CANCELLED')),
    rules TEXT,
    general_rules TEXT,
    banner TEXT,
    prize_rules JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.players (
    id TEXT PRIMARY KEY DEFAULT ('ply-' || substr(md5(random()::text), 1, 8)),
    full_name TEXT NOT NULL,
    gamer_tag TEXT UNIQUE NOT NULL,
    discord_username TEXT NOT NULL,
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    game TEXT NOT NULL DEFAULT 'ALL',
    team TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISQUALIFIED', 'BENCHED')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. LEADERBOARD TABLE
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id TEXT PRIMARY KEY DEFAULT ('lb-' || substr(md5(random()::text), 1, 8)),
    player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    gamer_tag TEXT NOT NULL,
    discord_username TEXT NOT NULL,
    game TEXT NOT NULL DEFAULT 'ALL',
    points NUMERIC NOT NULL DEFAULT 0,
    score NUMERIC NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    matches INTEGER NOT NULL DEFAULT 0,
    rank INTEGER DEFAULT 1,
    avatar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.registrations (
    id TEXT PRIMARY KEY DEFAULT ('BHL-' || floor(100000 + random() * 900000)::text),
    player_id TEXT,
    player_name TEXT NOT NULL,
    gamer_tag TEXT NOT NULL,
    discord_username TEXT NOT NULL,
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

-- 9. MATCH RESULTS / SCORES TABLE
CREATE TABLE IF NOT EXISTS public.match_results (
    id TEXT PRIMARY KEY DEFAULT ('res-' || substr(md5(random()::text), 1, 8)),
    event_id TEXT,
    game_name TEXT NOT NULL,
    week TEXT,
    player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    gamer_tag TEXT NOT NULL,
    placement INTEGER,
    participated BOOLEAN NOT NULL DEFAULT TRUE,
    challenge_winner BOOLEAN NOT NULL DEFAULT FALSE,
    rising_star BOOLEAN NOT NULL DEFAULT FALSE,
    points JSONB DEFAULT '{}'::jsonb,
    total_points NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEW', 'PUBLISHED')),
    published_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. DRAWS TABLE (Participation Lucky Draws)
CREATE TABLE IF NOT EXISTS public.draws (
    id TEXT PRIMARY KEY DEFAULT ('draw-' || substr(md5(random()::text), 1, 8)),
    event_id TEXT,
    game_name TEXT NOT NULL,
    week TEXT,
    winner_player_id TEXT NOT NULL,
    winner_name TEXT NOT NULL,
    winner_tag TEXT NOT NULL,
    reward_amount NUMERIC NOT NULL DEFAULT 25,
    eligible_count INTEGER NOT NULL DEFAULT 0,
    conducted_by TEXT NOT NULL DEFAULT 'Admin',
    drawn_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('log-' || substr(md5(random()::text), 1, 8)),
    admin_user TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ADMIN',
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS public.payouts (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    total_payout NUMERIC NOT NULL DEFAULT 0,
    winners_json JSONB DEFAULT '[]'::jsonb,
    calculations_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. SYSTEM SETTINGS / REWARDS CONFIG
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR ULTRA-FAST PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_events_game_id ON public.events(game_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(event_status);
CREATE INDEX IF NOT EXISTS idx_players_gamertag ON public.players(gamer_tag);
CREATE INDEX IF NOT EXISTS idx_players_game ON public.players(game);
CREATE INDEX IF NOT EXISTS idx_leaderboard_game ON public.leaderboard(game);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON public.leaderboard(points DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_game_id ON public.registrations(game_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_match_results_event_id ON public.match_results(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Enable RLS on all tables
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

-- 1. Public Read Policies for all tournament spectator tables
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Read Games" ON public.games;
    CREATE POLICY "Public Read Games" ON public.games FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public Read Events" ON public.events;
    CREATE POLICY "Public Read Events" ON public.events FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public Read Players" ON public.players;
    CREATE POLICY "Public Read Players" ON public.players FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public Read Leaderboard" ON public.leaderboard;
    CREATE POLICY "Public Read Leaderboard" ON public.leaderboard FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public Read Registrations" ON public.registrations;
    CREATE POLICY "Public Read Registrations" ON public.registrations FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public Read Match Results" ON public.match_results;
    CREATE POLICY "Public Read Match Results" ON public.match_results FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public Read Draws" ON public.draws;
    CREATE POLICY "Public Read Draws" ON public.draws FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public Read Audit Logs" ON public.audit_logs;
    CREATE POLICY "Public Read Audit Logs" ON public.audit_logs FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public Read Payouts" ON public.payouts;
    CREATE POLICY "Public Read Payouts" ON public.payouts FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public Read System Settings" ON public.system_settings;
    CREATE POLICY "Public Read System Settings" ON public.system_settings FOR SELECT USING (true);

    -- 2. Allow Public Insert for Tournament Registrations & Players
    DROP POLICY IF EXISTS "Public Insert Registrations" ON public.registrations;
    CREATE POLICY "Public Insert Registrations" ON public.registrations FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Insert Players" ON public.players;
    CREATE POLICY "Public Insert Players" ON public.players FOR INSERT WITH CHECK (true);

    -- 3. Service Role & Full Access for backend driver
    DROP POLICY IF EXISTS "Service Role Full Access Games" ON public.games;
    CREATE POLICY "Service Role Full Access Games" ON public.games FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service Role Full Access Events" ON public.events;
    CREATE POLICY "Service Role Full Access Events" ON public.events FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service Role Full Access Players" ON public.players;
    CREATE POLICY "Service Role Full Access Players" ON public.players FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service Role Full Access Leaderboard" ON public.leaderboard;
    CREATE POLICY "Service Role Full Access Leaderboard" ON public.leaderboard FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service Role Full Access Registrations" ON public.registrations;
    CREATE POLICY "Service Role Full Access Registrations" ON public.registrations FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service Role Full Access Match Results" ON public.match_results;
    CREATE POLICY "Service Role Full Access Match Results" ON public.match_results FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service Role Full Access Draws" ON public.draws;
    CREATE POLICY "Service Role Full Access Draws" ON public.draws FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service Role Full Access Audit Logs" ON public.audit_logs;
    CREATE POLICY "Service Role Full Access Audit Logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service Role Full Access Payouts" ON public.payouts;
    CREATE POLICY "Service Role Full Access Payouts" ON public.payouts FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service Role Full Access Admins" ON public.admins;
    CREATE POLICY "Service Role Full Access Admins" ON public.admins FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service Role Full Access Sessions" ON public.sessions;
    CREATE POLICY "Service Role Full Access Sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Service Role Full Access System Settings" ON public.system_settings;
    CREATE POLICY "Service Role Full Access System Settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ==============================================================================
-- REALTIME REPLICATION SETUP
-- ==============================================================================
-- Add tables to the supabase_realtime publication for instant live frontend syncing
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_results;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.draws;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payouts;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
END $$;
