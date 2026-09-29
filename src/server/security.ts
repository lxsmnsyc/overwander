import 'server-only';
import { verifyPassword } from 'better-auth/crypto';
import { getSql } from './db';
import { asString } from './read';

/**
 * The password check that opens an account's security settings, where
 * two-factor and passkeys are set up. Better Auth's own routes for
 * those refuse an account that has not passed it recently.
 */

/** How long a confirmed password keeps the security settings open */
const UNLOCK_MS = 15 * 60_000;

const unlockKey = (uid: string): string => `security-unlock:${uid}`;

/** The account's password hash, or empty where it signs in some other way only */
async function passwordHash(uid: string): Promise<string> {
  const rows = await getSql()`
    select password from identities
    where user_id = ${uid} and provider_id = 'credential' and password is not null
  `;

  return rows.at(0) == null ? '' : asString(rows[0].password);
}

export type UnlockResult = 'unlocked' | 'wrong' | 'no-password';

/** Confirm the account's password, which opens its security settings for a while */
export async function unlockSecurity(uid: string, password: string): Promise<UnlockResult> {
  const hash = await passwordHash(uid);

  if (hash === '') {
    return 'no-password';
  }
  if (!(await verifyPassword({ hash, password }))) {
    return 'wrong';
  }

  const sql = getSql();

  await sql.begin(async (tx) => {
    await tx`delete from verifications where identifier = ${unlockKey(uid)}`;
    await tx`
      insert into verifications (identifier, value, expires_at)
      values (${unlockKey(uid)}, ${uid}, ${new Date(Date.now() + UNLOCK_MS)})
    `;
  });
  return 'unlocked';
}

/** Whether the account confirmed its password recently enough to change its security settings */
export async function securityUnlocked(uid: string): Promise<boolean> {
  const rows = await getSql()`
    select 1 from verifications where identifier = ${unlockKey(uid)} and expires_at > now()
  `;

  return rows.length > 0;
}

export interface SecurityState {
  /** Whether the account has a password to confirm */
  password: boolean;
  twoFactor: boolean;
}

export async function readSecurity(uid: string): Promise<SecurityState> {
  const [hash, rows] = await Promise.all([
    passwordHash(uid),
    getSql()`select two_factor_enabled from users where id = ${uid}`,
  ]);

  return { password: hash !== '', twoFactor: rows.at(0)?.two_factor_enabled === true };
}
