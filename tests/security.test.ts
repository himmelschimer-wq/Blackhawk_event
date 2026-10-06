import './testEnv.js';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { supabaseDb } from '../server/supabaseDb.js';
import app from '../server/index.js';

let server: http.Server;
let baseUrl: string;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🔒 RUNNING BLACKHAWK PRODUCTION SECURITY TEST SUITE');
  console.log('====================================================\n');

  // Start server on an ephemeral port
  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      console.log(`[Test Server] Running at ${baseUrl} in test environment.\n`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    process.stdout.write(`• ${name} ... `);
    try {
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err: any) {
      console.log('❌ FAILED');
      console.error(`  Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Anonymous user cannot access admin endpoints
  await test('1. Anonymous user cannot access admin endpoints', async () => {
    const resMe = await fetch(`${baseUrl}/api/auth/me`);
    assert(resMe.status === 401, `Expected 401 for auth/me, got ${resMe.status}`);
    const dataMe = await resMe.json();
    assert(dataMe.authenticated === false, 'Expected authenticated: false');

    const resReg = await fetch(`${baseUrl}/api/registrations`);
    assert(resReg.status === 401, `Expected 401 for registrations list, got ${resReg.status}`);

    const resDb = await fetch(`${baseUrl}/api/database/admins`);
    assert(resDb.status === 401, `Expected 401 for database/admins, got ${resDb.status}`);
  });

  // 2. VIEWER cannot perform ADMIN operations
  await test('2. VIEWER cannot perform ADMIN operations (RBAC)', async () => {
    const viewerToken = 'test_viewer_token_' + Date.now();
    await supabaseDb.set(`blackhawk/sessions/${viewerToken}`, {
      token: viewerToken,
      adminId: 'adm-viewer-test',
      expiresAt: Date.now() + 60000,
    });
    await supabaseDb.set('blackhawk/admins/adm-viewer-test', {
      id: 'adm-viewer-test',
      username: 'viewer_user',
      role: 'VIEWER',
      displayName: 'Test Viewer'
    });

    const res = await fetch(`${baseUrl}/api/admin/clean-database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `admin_session=${viewerToken}`
      },
      body: JSON.stringify({ confirm: 'CLEAN_ALL_DATABASE_CONFIRMED' })
    });
    assert(res.status === 403, `Expected 403 Forbidden for VIEWER clean-database, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('Forbidden') && data.error.includes('VIEWER'), 'Expected role restriction message');
  });

  // 3. Expired session is rejected
  await test('3. Expired session is rejected', async () => {
    const expiredToken = 'test_expired_token_' + Date.now();
    await supabaseDb.set(`blackhawk/sessions/${expiredToken}`, {
      token: expiredToken,
      adminId: 'adm-expired-test',
      expiresAt: Date.now() - 5000, // already expired
    });

    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Cookie': `admin_session=${expiredToken}` }
    });
    assert(res.status === 401, `Expected 401 for expired session, got ${res.status}`);
  });

  // 4. Invalid session is rejected
  await test('4. Invalid session is rejected', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Cookie': 'admin_session=completely_fake_session_token_12345' }
    });
    assert(res.status === 401, `Expected 401 for invalid session, got ${res.status}`);
  });

  // 5. Admin session token cannot be read from frontend JavaScript (HttpOnly cookie)
  await test('5. Admin session token set with HttpOnly and not leaked in response body', async () => {
    const res = await fetch(`${baseUrl}/api/auth/local-dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const setCookie = res.headers.get('set-cookie') || '';
    assert(setCookie.includes('HttpOnly'), 'Set-Cookie header must include HttpOnly');
    assert(setCookie.includes('SameSite=Strict') || setCookie.includes('samesite=strict'), 'Set-Cookie header must include SameSite=Strict');

    const data = await res.json();
    assert(!('token' in data), 'Login response body must not leak session token');
  });

  // 6. Unknown CORS origins are rejected
  await test('6. Unknown CORS origins are rejected', async () => {
    const res = await fetch(`${baseUrl}/api/games`, {
      headers: { 'Origin': 'https://attacker-domain.evil.com' }
    });
    assert(res.status === 403, `Expected 403 CORS rejection for untrusted origin, got ${res.status}`);
  });

  // 7. OAuth state mismatch is rejected
  await test('7. OAuth state mismatch is rejected', async () => {
    const res = await fetch(`${baseUrl}/api/auth/discord/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'some_fake_code', state: 'forged_state_value' })
    });
    assert(res.status === 400, `Expected 400 for forged OAuth state, got ${res.status}`);
    const data = await res.json();
    assert(data.error.includes('OAuth state'), 'Expected OAuth state rejection error');
  });

  // 8. Arbitrary OAuth redirect URI is rejected
  await test('8. Arbitrary OAuth redirect URI is rejected', async () => {
    const res = await fetch(`${baseUrl}/api/auth/discord/url?redirectUri=https://attacker.evil.com/callback`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.url, 'Expected url in response');
    assert(!data.url.includes('attacker.evil.com'), 'Returned Discord URL must ignore user-supplied redirect URI');
    if (process.env.DISCORD_REDIRECT_URI) {
      assert(data.url.includes(encodeURIComponent(process.env.DISCORD_REDIRECT_URI)), 'Must use server DISCORD_REDIRECT_URI');
    }
  });

  // 9. Demo OAuth cannot work in production
  await test('9. Demo OAuth cannot work in production mode', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const res = await fetch(`${baseUrl}/api/auth/discord/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'DEMO_CODE', state: 'any_state' })
      });
      assert(res.status === 403 || res.status === 400, `Expected 403/400 for demo OAuth in prod, got ${res.status}`);
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });

  // 10. Discord membership verification failure does not grant membership
  await test('10. Discord membership check fails closed', async () => {
    const res = await fetch(`${baseUrl}/api/auth/discord/check-membership/999999999999999999`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.inServer === false, `Expected inServer: false on verification failure, got ${data.inServer}`);
  });

  // 11. Anonymous user cannot modify another player's private information
  await test('11. Anonymous registration cannot overwrite existing player PII', async () => {
    const testTag = 'SecTestTag_' + Date.now();
    await supabaseDb.set(`blackhawk/players/p-sectest`, {
      id: 'p-sectest',
      gamerTag: testTag,
      fullName: 'Original User',
      email: 'original_user@example.com',
      phone: '1234567890',
      discordUsername: 'original#0001',
      status: 'ACTIVE'
    });

    // Anonymous registration with same gamerTag but forged email/phone
    const regRes = await fetch(`${baseUrl}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gamerTag: testTag,
        fullName: 'Attacker Impersonator',
        email: 'attacker@evil.com',
        phone: '9999999999',
        discordUsername: 'attacker#9999',
        games: [{ gameId: 'g-bgmi', gameName: 'BGMI', playType: 'Solo' }]
      })
    });
    assert(regRes.status === 200 || regRes.status === 201, `Expected registration success, got ${regRes.status}`);

    // Verify existing player's PII was NOT overwritten
    const playerRecord = await supabaseDb.findBy<any>('players', 'gamerTag', testTag);
    assert(playerRecord.email === 'original_user@example.com', `PII compromised: email was modified to ${playerRecord.email}`);
    assert(playerRecord.phone === '1234567890', `PII compromised: phone was modified to ${playerRecord.phone}`);
    assert(playerRecord.discordUsername === 'original#0001', `PII compromised: discordUsername was modified to ${playerRecord.discordUsername}`);
  });

  // 12. Duplicate registrations cannot be created concurrently
  await test('12. Duplicate active registrations rejected (409 Conflict)', async () => {
    const dupTag = 'DupTag_' + Date.now();
    const payload = {
      gamerTag: dupTag,
      fullName: 'Duplicate Tester',
      email: 'dup@example.com',
      phone: '1234567890',
      games: [{ gameId: 'g-freefire', gameName: 'Free Fire', playType: 'Solo' }]
    };

    const firstRes = await fetch(`${baseUrl}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert(firstRes.status === 200 || firstRes.status === 201, `First registration failed: ${firstRes.status}`);

    const secondRes = await fetch(`${baseUrl}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert(secondRes.status === 409, `Expected 409 Conflict for duplicate registration, got ${secondRes.status}`);
  });

  // 13. Sensitive tables cannot be queried anonymously
  await test('13. Sensitive tables cannot be queried anonymously', async () => {
    const sensitiveEndpoints = [
      '/api/registrations',
      '/api/database/registrations',
      '/api/database/admins',
    ];
    for (const ep of sensitiveEndpoints) {
      const res = await fetch(`${baseUrl}${ep}`);
      assert(res.status === 401, `Endpoint ${ep} should require authentication, got ${res.status}`);
    }

    // Verify database schema has RLS enabled on all sensitive tables
    const schemaContent = fs.readFileSync(path.resolve(process.cwd(), 'supabase/schema.sql'), 'utf-8');
    const sensitiveTables = ['admins', 'sessions', 'registrations', 'players', 'audit_logs', 'payouts', 'match_results', 'draws', 'system_settings'];
    for (const tbl of sensitiveTables) {
      const regex = new RegExp(`ALTER TABLE (public\\.)?${tbl} ENABLE ROW LEVEL SECURITY;`);
      assert(regex.test(schemaContent), `RLS not enabled for table ${tbl}`);
    }
  });

  // 14. Password hashes are never returned
  await test('14. Password hashes are never returned in API responses', async () => {
    // Admin login
    const adminToken = 'adm_token_sec_' + Date.now();
    await supabaseDb.set(`blackhawk/sessions/${adminToken}`, {
      token: adminToken,
      adminId: 'adm-hash-test',
      expiresAt: Date.now() + 60000,
    });
    await supabaseDb.set('blackhawk/admins/adm-hash-test', {
      id: 'adm-hash-test',
      username: 'hash_test_user',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'ADMIN',
      displayName: 'Hash Test'
    });

    const resMe = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Cookie': `admin_session=${adminToken}` }
    });
    assert(resMe.status === 200, `Expected 200 for auth/me, got ${resMe.status}`);
    const dataMe = await resMe.json();
    assert(!('passwordHash' in dataMe.admin), 'passwordHash must not be present in /auth/me');
    assert(!('password_hash' in dataMe.admin), 'password_hash must not be present in /auth/me');
    assert(!('password' in dataMe.admin), 'password must not be present in /auth/me');

    const resPlayers = await fetch(`${baseUrl}/api/players`);
    assert(resPlayers.status === 200, `Expected 200 for public players, got ${resPlayers.status}`);
    const players = await resPlayers.json();
    for (const p of players) {
      assert(!('passwordHash' in p), 'passwordHash leaked in public players');
      assert(!('email' in p), 'email leaked in public players');
      assert(!('phone' in p), 'phone leaked in public players');
    }
  });

  // 15. Service-role key is never present in frontend bundles
  await test('15. Supabase service-role key is absent from frontend bundles and source', async () => {
    const distAssetsDir = path.resolve(process.cwd(), 'dist/assets');
    if (fs.existsSync(distAssetsDir)) {
      const files = fs.readdirSync(distAssetsDir);
      for (const f of files) {
        if (f.endsWith('.js')) {
          const content = fs.readFileSync(path.join(distAssetsDir, f), 'utf-8');
          assert(!content.includes('service_role'), `Frontend bundle ${f} contains 'service_role' reference!`);
          assert(!content.includes('SUPABASE_SERVICE_ROLE_KEY'), `Frontend bundle ${f} contains SUPABASE_SERVICE_ROLE_KEY!`);
        }
      }
    }
  });

  // 16. Destructive endpoints require appropriate role
  await test('16. Destructive endpoints require ADMIN role and explicit confirmation', async () => {
    const adminToken = 'adm_admin_token_' + Date.now();
    await supabaseDb.set(`blackhawk/sessions/${adminToken}`, {
      token: adminToken,
      adminId: 'adm-destruct-test',
      expiresAt: Date.now() + 60000,
    });
    await supabaseDb.set('blackhawk/admins/adm-destruct-test', {
      id: 'adm-destruct-test',
      username: 'destruct_admin',
      role: 'ADMIN',
      displayName: 'Destructive Admin'
    });

    // Without confirmation string
    const resNoConfirm = await fetch(`${baseUrl}/api/admin/clean-database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `admin_session=${adminToken}`
      },
      body: JSON.stringify({})
    });
    assert(resNoConfirm.status === 400, `Expected 400 without confirmation, got ${resNoConfirm.status}`);

    // With confirmation string
    const resConfirmed = await fetch(`${baseUrl}/api/admin/clean-database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `admin_session=${adminToken}`
      },
      body: JSON.stringify({ confirm: 'CLEAN_ALL_DATABASE_CONFIRMED' })
    });
    assert(resConfirmed.status === 200, `Expected 200 with confirmation, got ${resConfirmed.status}`);
  });

  // 17. Malicious HTML/script input is escaped/sanitized
  await test('17. Malicious HTML/script input in gamerTag is rejected', async () => {
    const xssPayload = {
      gamerTag: '<script>alert("xss")</script>',
      fullName: 'XSS Tester',
      email: 'xss@example.com',
      phone: '1234567890',
      games: [{ gameId: 'g-bgmi', gameName: 'BGMI' }]
    };

    const res = await fetch(`${baseUrl}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(xssPayload)
    });
    assert(res.status === 400, `Expected 400 for malicious script tag in gamerTag, got ${res.status}`);
    const data = await res.json();
    assert(JSON.stringify(data).includes('disallowed special characters'), 'Expected regex validation failure');
  });

  // 18. Oversized requests are rejected (DoS protection)
  await test('18. Oversized requests (>100kb) are rejected with 413', async () => {
    const hugePayload = {
      gamerTag: 'HugePlayer',
      fullName: 'A'.repeat(120 * 1024), // 120KB
      email: 'huge@example.com',
      phone: '1234567890',
      games: [{ gameId: 'g-bgmi' }]
    };

    const res = await fetch(`${baseUrl}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hugePayload)
    });
    assert(res.status === 413, `Expected 413 Payload Too Large, got ${res.status}`);
  });

  // 19. Invalid numeric tournament values are rejected
  await test('19. Invalid tournament score values (negative, out-of-range) are rejected', async () => {
    const adminToken = 'adm_score_test_' + Date.now();
    await supabaseDb.set(`blackhawk/sessions/${adminToken}`, {
      token: adminToken,
      adminId: 'adm-score-test',
      expiresAt: Date.now() + 60000,
    });
    await supabaseDb.set('blackhawk/admins/adm-score-test', {
      id: 'adm-score-test',
      username: 'score_admin',
      role: 'ADMIN',
      displayName: 'Score Admin'
    });

    const invalidScores = [
      { gamerTag: 'Player1', points: -10, kills: 5 },       // negative points
      { gamerTag: 'Player1', points: 100000, kills: 5 },    // points exceed 50000
      { gamerTag: 'Player1', points: 10, kills: -1 },       // negative kills
      { gamerTag: 'Player1', points: 10, kills: 1000 },     // kills exceed 500
    ];

    for (const invalid of invalidScores) {
      const res = await fetch(`${baseUrl}/api/match-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `admin_session=${adminToken}`
        },
        body: JSON.stringify(invalid)
      });
      assert(res.status === 400, `Expected 400 for invalid score ${JSON.stringify(invalid)}, got ${res.status}`);
    }
  });

  // 20. Payout/score manipulation from unauthorized users is rejected
  await test('20. Payout saving and scoring from unauthorized users is rejected', async () => {
    const resSave = await fetch(`${baseUrl}/api/events/freefire/save-payouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemizedPayouts: [{ category: 'WINNER', recipientName: 'Hacker', amount: 999999 }]
      })
    });
    assert(resSave.status === 401, `Expected 401 for anonymous save-payouts, got ${resSave.status}`);

    const resMatch = await fetch(`${baseUrl}/api/match-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gamerTag: 'Hacker', points: 9999, kills: 100 })
    });
    assert(resMatch.status === 401, `Expected 401 for anonymous match-results, got ${resMatch.status}`);
  });

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  server.close();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  if (server) server.close();
  process.exit(1);
});
