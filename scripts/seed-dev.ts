/**
 * Dev seed: a couple of accounts and enough rows to walk the game.
 *
 * Runs against the development database (`compose.dev.yaml`) after a
 * reset, over the owner connection, and refuses any other. Accounts are written straight into Better Auth's tables
 * with a bcrypt hash, which the server's password check accepts.
 */
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';

const DB_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54324/overwander_dev';

// The seed makes admin accounts with a published password, so it only ever writes a development database
const name = new URL(DB_URL).pathname.slice(1);

if (!name.endsWith('_dev')) {
  console.error(
    `Refusing to seed "${name}": pnpm seed only writes a database whose name ends in _dev.`,
  );
  process.exit(1);
}
const PASSWORD = 'walking-in-the-tall-grass';

const sql = postgres(DB_URL, { prepare: false });

async function ensureUser(email: string, nickname: string): Promise<string> {
  const found = (await sql`select id from users where email = ${email}`).at(0);

  // Already seeded: the rerun finds the account instead of failing
  if (found != null) {
    return String(found.id);
  }

  const uid = randomUUID();

  await sql`insert into users (id, name, email, email_verified) values (${uid}, ${nickname}, ${email}, true)`;
  await sql`
    insert into identities (account_id, provider_id, user_id, password, updated_at)
    values (${uid}, 'credential', ${uid}, ${bcrypt.hashSync(PASSWORD, 10)}, now())
  `;
  await sql`insert into profiles (id, nickname, role) values (${uid}, ${nickname}, 'admin')`;
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
