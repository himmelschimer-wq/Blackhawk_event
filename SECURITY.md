# Security Policy & Deployment Hardening Guide

## CRITICAL: Key Rotation Required Before Production Deployment
The Supabase service-role key that was previously committed in historical commits must be **immediately rotated and revoked** in the Supabase Dashboard:
1. Navigate to: `https://supabase.com/dashboard/project/_/settings/api`
2. Under **Project API keys**, click **Rotate secret key** for `service_role`.
3. Set the new `SUPABASE_SERVICE_ROLE_KEY` exclusively inside your server environment variables (e.g. Railway, Render, Fly.io, or server `.env`).
4. **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to client-side bundles or `VITE_*` environment variables.

---

## Security Architecture Overview

### 1. Zero Trust Database Access & RLS Policies
- The public / anonymous Supabase API cannot read or write to sensitive tables (`admins`, `sessions`, `registrations`, `players`, `audit_logs`, `payouts`, `match_results`, `draws`, `system_settings`).
- All privileged data operations must be routed through the Express API using server-side authentication and role-based access control.
- Spectator queries (active games, public tournament schedules, sanitized leaderboard rankings) are granted read-only access.

### 2. Cookie-Based Admin Authentication
- Admin authentication uses secure `HttpOnly`, `SameSite=Strict` cookies (`admin_session`).
- Tokens are not stored in browser `localStorage` or `sessionStorage`.
- Sessions are backed by server-side database validation and expire automatically after 7 days.
- Logging out immediately destroys the server session and clears the cookie.

### 3. Role-Based Access Control (RBAC)
- **ADMIN**: Complete platform administration, database cleanup, payout confirmation, user management, and match scoring.
- **ORGANIZER**: Tournament event schedule management and registration approvals.
- **VIEWER**: Read-only administrative metrics and audit inspections.

### 4. Public Registration Data Integrity
- Unauthenticated registration submissions cannot overwrite existing players' PII (email, phone number, Discord identity).
- Unique database constraints prevent race conditions and concurrent double-registrations.
- Identifiers are generated using cryptographically secure random values (`crypto.randomUUID()`).

### 5. Discord OAuth2 Security
- OAuth `state` parameters are generated cryptographically and validated strictly server-side to prevent CSRF.
- The OAuth callback relies solely on the server-configured `DISCORD_REDIRECT_URI`.
- Development demo authentication is strictly isolated and automatically disabled in production (`NODE_ENV === 'production'`).
- Discord guild membership checks fail closed (`inServer: false`) upon error or timeout.

### 6. Defense-in-Depth Protection
- **Helmet**: Enforces Strict-Transport-Security, Content-Security-Policy, X-Content-Type-Options, and X-Frame-Options.
- **CORS**: Strict allowlisting of production domains with credentials support; wildcard origins and permissive fallbacks are prohibited.
- **Rate Limiting**: Defends authentication, OAuth callback, and registration endpoints against brute force and automated spam.
- **Input Sanitization**: Request bodies are parsed with strict schema validations and character limits.
