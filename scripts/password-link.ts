import postgres from 'postgres';
import createPasswordLink, { PASSWORD_LINK_DAYS } from '../db/password-link.ts';

/**
 * `pnpm password-link <email or nickname>`: a one-time link for the
 * account to choose a password, against the database in DATABASE_URL.
 * The admin page makes these too; this is for an account nobody above
 * it can reach, such as the owner's own.
 */
const url = process.env.DATABASE_URL ?? '';
const who = process.argv[2] ?? '';

if (url === '' || who === '') {
  console.error('Usage: pnpm password-link <email or nickname>, with DATABASE_URL set.');
  process.exit(1);
}

const sql = postgres(url, { prepare: false, onnotice: () => undefined });
const found = await sql`
  select users.id, users.email, profiles.nickname from users
  left join profiles on profiles.id = users.id
  where lower(users.email) = lower(${who}) or profiles.nickname = ${who}
`;

if (found.length !== 1) {
  console.error(
    found.length === 0
      ? `No account matches ${who}.`
      : `${found.length} accounts match ${who}; use the email.`,
  );
  await sql.end();
  process.exit(1);
}

const origin = process.env.BETTER_AUTH_URL ?? '';
const link = await createPasswordLink(
  sql,
  String(found[0].id),
  origin === '' ? 'http://localhost:3000' : origin,
);

console.log(`For ${String(found[0].email)}, valid for ${PASSWORD_LINK_DAYS} days:\n${link}`);
await sql.end();
