/**
 * Dev seed: a couple of accounts and enough rows to walk the game.
 *
 * Runs against the local stack after `supabase db reset`, through the
 * same two doors the app uses: accounts via the auth admin API, data
 * via the owner connection. Nothing here touches auth.users directly,
 * since GoTrue owns that table's invariants.
 */
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (SERVICE_KEY === '') {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY (see `supabase status`).');
  process.exit(1);
}

const api = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const sql = postgres(DB_URL, { prepare: false });

async function ensureUser(email: string, nickname: string): Promise<string> {
  const { data, error } = await api.auth.admin.createUser({
    email,
    password: 'walking-in-the-tall-grass',
    email_confirm: true,
  });

  if (error != null) {
    // Already seeded: find the account instead of failing the rerun
    const { data: listed } = await api.auth.admin.listUsers();
    const found = listed.users.find((user) => user.email === email);

    if (found == null) {
      throw new Error(`cannot create or find ${email}: ${error.message}`);
    }
    return found.id;
  }

  const uid = data.user.id;

  await sql`update profiles set nickname = ${nickname}, role = 'admin' where id = ${uid}`;
  return uid;
}

const alice = await ensureUser('alice@example.com', 'Alice');
const bob = await ensureUser('bob@example.com', 'Bob');

// A starter bag each: a few balls and a potion
for (const uid of [alice, bob]) {
  await sql`
    insert into bag_items (player, item, count) values
      (${uid}, 15, 10), (${uid}, 16, 5), (${uid}, 33, 3)
    on conflict (player, item) do nothing
  `;
}

// One friendship, both directions, the way the server writes one
await sql`
  insert into friends (owner, friend, since) values
    (${alice}, ${bob}, ${Date.now()}), (${bob}, ${alice}, ${Date.now()})
  on conflict do nothing
`;

console.log('seeded', { alice, bob });
await sql.end();
