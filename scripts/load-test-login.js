// Sprint 4 load-shape check: simulates a spiky cohort of concurrent logins against the
// real Supabase project, mirroring exactly what src/actions/auth.js's signIn() does
// (signInWithPassword, then a profiles.role select) so the measured latency reflects the
// actual bottleneck path, not just raw Auth throughput. Reports p50/p95/p99 client-side
// latency; Postgres connection count must be watched manually in the Supabase Dashboard
// (Database -> Reports) during the run — this script has no direct Postgres access.
//
// Usage:
//   node scripts/load-test-login.js [concurrency] [--keep]
//     concurrency  number of simulated concurrent logins (default 50)
//     --keep       skip deleting the temporary load-test users afterward
const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error('Missing required env vars in .env.local (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

const args = process.argv.slice(2);
const keepUsers = args.includes('--keep');
const concurrency = Number(args.find((a) => /^\d+$/.test(a))) || 50;

const PASSWORD = 'LoadTest123!';
const EMAIL_PREFIX = 'loadtest-user-';
const EMAIL_DOMAIN = '@test.graceway.com';

function createAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function emailFor(i) {
  return `${EMAIL_PREFIX}${String(i).padStart(3, '0')}${EMAIL_DOMAIN}`;
}

async function findUserByEmail(admin, email) {
  const perPage = 200;
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const match = users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (users.length < perPage) return null;
  }
  return null;
}

async function ensureLoadTestUser(admin, email) {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (!createError && created?.user) return created.user;

  const alreadyExists = createError && (createError.status === 422 || /already registered|already exists/i.test(createError.message || ''));
  if (!alreadyExists) throw createError;

  const existing = await findUserByEmail(admin, email);
  if (!existing) throw new Error(`Load-test user ${email} reported "already exists" but was not found via listUsers().`);

  const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
    password: PASSWORD,
    email_confirm: true,
  });
  if (updateError) throw updateError;
  return updated.user;
}

async function seedLoadTestUsers(admin, n) {
  console.log(`Seeding ${n} temporary load-test users (idempotent)...`);
  const users = [];
  for (let i = 1; i <= n; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const user = await ensureLoadTestUser(admin, emailFor(i));
    users.push(user);
  }
  console.log(`  ${users.length} accounts ready.`);
  return users;
}

// Mirrors src/actions/auth.js's signIn() exactly: signInWithPassword, then getUser(),
// then a profiles.role select — the same two round trips a real login triggers.
async function simulateLogin(email) {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const start = performance.now();
  try {
    const { error: signInError } = await client.auth.signInWithPassword({ email, password: PASSWORD });
    if (signInError) return { ok: false, ms: performance.now() - start, error: signInError.message };

    const { data: { user } } = await client.auth.getUser();
    if (!user) return { ok: false, ms: performance.now() - start, error: 'no user after sign-in' };

    const { error: profileError } = await client.from('profiles').select('role').eq('id', user.id).single();
    if (profileError) return { ok: false, ms: performance.now() - start, error: profileError.message };

    return { ok: true, ms: performance.now() - start };
  } catch (err) {
    return { ok: false, ms: performance.now() - start, error: err.message };
  }
}

function percentile(sortedMs, p) {
  if (sortedMs.length === 0) return 0;
  const idx = Math.min(sortedMs.length - 1, Math.ceil((p / 100) * sortedMs.length) - 1);
  return sortedMs[idx];
}

async function main() {
  const admin = createAdminClient();

  const users = await seedLoadTestUsers(admin, concurrency);

  console.log('\n>>> Watch the Supabase Dashboard now: Database -> Reports (connection count) <<<');
  console.log(`>>> Firing ${concurrency} concurrent logins in 5 seconds... <<<\n`);
  await new Promise((r) => setTimeout(r, 5000));

  const wallStart = performance.now();
  const results = await Promise.all(users.map((u) => simulateLogin(u.email)));
  const wallMs = performance.now() - wallStart;

  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const sortedMs = ok.map((r) => r.ms).sort((a, b) => a - b);

  console.log('=== Results ===');
  console.log(`Concurrency:     ${concurrency}`);
  console.log(`Succeeded:       ${ok.length}/${concurrency}`);
  console.log(`Failed:          ${failed.length}/${concurrency}`);
  console.log(`Wall time:       ${wallMs.toFixed(0)}ms (all requests fired concurrently)`);
  if (sortedMs.length > 0) {
    console.log(`p50 latency:     ${percentile(sortedMs, 50).toFixed(0)}ms`);
    console.log(`p95 latency:     ${percentile(sortedMs, 95).toFixed(0)}ms`);
    console.log(`p99 latency:     ${percentile(sortedMs, 99).toFixed(0)}ms`);
    console.log(`max latency:     ${sortedMs[sortedMs.length - 1].toFixed(0)}ms`);
    console.log(`min latency:     ${sortedMs[0].toFixed(0)}ms`);
  }
  if (failed.length > 0) {
    console.log('\nFailure samples (up to 5):');
    failed.slice(0, 5).forEach((f) => console.log(`  - ${f.error}`));
  }

  if (!keepUsers) {
    console.log('\nCleaning up temporary load-test users...');
    for (const u of users) {
      // eslint-disable-next-line no-await-in-loop
      await admin.auth.admin.deleteUser(u.id).catch((e) => console.error(`  Failed to delete ${u.email}: ${e.message}`));
    }
    console.log('  Done.');
  } else {
    console.log('\n--keep passed: leaving load-test users in place for a rerun.');
  }
}

main().catch((err) => {
  console.error('\nLoad test failed:');
  console.error(err?.message || err);
  process.exit(1);
});
