import { randomBytes } from 'node:crypto';
import type { Sql } from 'postgres';

/**
 * A one-time link that lets a player choose a password for their
 * account, handed to them by staff rather than emailed.
 *
 * The row is the one Better Auth's own reset writes, so `/reset-password`
 * spends it through Better Auth, which adds a password sign-in to an
 * account that had none. Shared by the admin page and
 * `pnpm password-link`.
 */

/** How long a link works: long enough to reach a player by hand */
export const PASSWORD_LINK_DAYS = 7;

const DAY = 86_400_000;

/** The link for this account, replacing any earlier one that has not been used */
export default async function createPasswordLink(
  sql: Sql,
  uid: string,
  origin: string,
): Promise<string> {
  const token = randomBytes(24).toString('base64url');

  await sql.begin(async (tx) => {
    await tx`delete from verifications where identifier like 'reset-password:%' and value = ${uid}`;
    await tx`
      insert into verifications (identifier, value, expires_at)
      values (${`reset-password:${token}`}, ${uid}, ${new Date(Date.now() + PASSWORD_LINK_DAYS * DAY)})
    `;
  });
  return `${origin.replace(/\/$/, '')}/reset-password?token=${token}`;
}
