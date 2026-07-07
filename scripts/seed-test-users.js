// Seeds 3 confirmed test accounts (student/leader/admin) into the real Supabase project. Safe to rerun.
const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '.env.local');

  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, 'utf8');
  const lines = contents.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Strip surrounding single or double quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing required env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and ' +
      'SUPABASE_SERVICE_ROLE_KEY are set in .env.local before running this script.'
  );
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

function createAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

const supabase = createAdminClient();

const TEST_PASSWORD = 'TestPass123!';

const TEST_ACCOUNTS = [
  { email: 'student@test.graceway.com', role: 'student' },
  { email: 'leader@test.graceway.com', role: 'leader' },
  { email: 'admin@test.graceway.com', role: 'admin' },
];

async function findUserByEmail(email) {
  const perPage = 200;
  let page = 1;

  // Safety cap so a misbehaving API can't loop forever.
  for (let i = 0; i < 50; i += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const users = data?.users || [];
    const match = users.find(
      (u) => u.email && u.email.toLowerCase() === email.toLowerCase()
    );

    if (match) {
      return match;
    }

    if (users.length < perPage) {
      // No more pages.
      return null;
    }

    page += 1;
  }

  return null;
}

async function ensureAuthUser(email, password) {
  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (!createError && created?.user) {
    return { user: created.user, status: 'created' };
  }

  // If creation failed because the user already exists, look it up and
  // reset its password/confirmation state instead of erroring out.
  const alreadyExists =
    createError &&
    (createError.status === 422 ||
      /already registered|already exists/i.test(createError.message || ''));

  if (!alreadyExists) {
    throw createError;
  }

  const existing = await findUserByEmail(email);

  if (!existing) {
    throw new Error(
      `User creation for ${email} reported "already exists" but no matching user was found via listUsers().`
    );
  }

  const { data: updated, error: updateError } =
    await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });

  if (updateError) {
    throw updateError;
  }

  return { user: updated.user, status: 'existed' };
}

// profiles row itself is created by the handle_new_user trigger; this just sets the role.
async function ensureProfileRole(userId, role) {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) {
    throw error;
  }
}

async function seedAccount({ email, role }) {
  console.log(`\n--- ${email} (${role}) ---`);

  const { user, status } = await ensureAuthUser(email, TEST_PASSWORD);

  if (status === 'created') {
    console.log(`  auth user: created (id=${user.id})`);
  } else {
    console.log(`  auth user: already existed, password reset (id=${user.id})`);
  }

  await ensureProfileRole(user.id, role);
  console.log(`  profiles.role: set to "${role}"`);

  return { email, role, id: user.id, status };
}

async function main() {
  console.log('Seeding Graceway test accounts into the Supabase project...');
  console.log(`Target project: ${SUPABASE_URL}`);

  const results = [];

  for (const account of TEST_ACCOUNTS) {
    // eslint-disable-next-line no-await-in-loop
    const result = await seedAccount(account);
    results.push(result);
  }

  console.log('\n=== Summary ===');
  for (const r of results) {
    console.log(
      `  ${r.email.padEnd(28)} role=${r.role.padEnd(8)} status=${r.status} id=${r.id}`
    );
  }
  console.log('\nDone. Test accounts are confirmed and ready for Playwright login.');
}

main().catch((err) => {
  console.error('\nFailed to seed test users:');
  console.error(err?.message || err);
  process.exit(1);
});
