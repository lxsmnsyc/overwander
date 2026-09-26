import { hashPassword } from 'better-auth/crypto';
import bcrypt from 'bcryptjs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import { readSecurity, securityUnlocked, unlockSecurity } from '../../src/server/security';
import { ADMIN_ROLE, MODERATOR_ROLE, OWNER_ROLE } from '../../src/auth/staff';
import makePasswordLink from '../../src/server/password-links';

/**
 * The password check that opens the security settings, and who may
 * hand out a password link
 */

let player: Actor;
let staff: Actor;

async function givePassword(uid: string, hash: string): Promise<void> {
  await sql`
    insert into identities (account_id, provider_id, user_id, password, updated_at)
    values (${uid}, 'credential', ${uid}, ${hash}, now())
  `;
}

async function setRole(uid: string, role: string): Promise<void> {
  await sql`update profiles set role = ${role} where id = ${uid}`;
}

beforeAll(async () => {
  await clearAll();
  player = await actor('guarded');
  staff = await actor('keeper');
});

beforeEach(async () => {
  await sql`delete from identities`;
  await sql`delete from verifications`;
  await setRole(player.uid, '');
  await setRole(staff.uid, ADMIN_ROLE);
});

afterAll(async () => {
  await sql.end();
});

describe('unlockSecurity', () => {
  it('says so for an account with no password', async () => {
    expect(await unlockSecurity(player.uid, 'anything at all')).toBe('no-password');
    expect(await securityUnlocked(player.uid)).toBe(false);
  });

  it('refuses the wrong password and opens nothing', async () => {
    await givePassword(player.uid, await hashPassword('right password'));

    expect(await unlockSecurity(player.uid, 'wrong password')).toBe('wrong');
    expect(await securityUnlocked(player.uid)).toBe(false);
  });

  it('opens the settings for the right one', async () => {
    await givePassword(player.uid, await hashPassword('right password'));

    expect(await unlockSecurity(player.uid, 'right password')).toBe('unlocked');
    expect(await securityUnlocked(player.uid)).toBe(true);
    expect(await securityUnlocked(staff.uid)).toBe(false);
  });

  it('checks a bcrypt hash brought over from Supabase', async () => {
    await givePassword(player.uid, await bcrypt.hash('old password', 4));

    expect(await unlockSecurity(player.uid, 'old password')).toBe('unlocked');
  });

  it('closes again once the unlock expires', async () => {
    await givePassword(player.uid, await hashPassword('right password'));
    await unlockSecurity(player.uid, 'right password');
    await sql`update verifications set expires_at = now() - interval '1 second'`;

    expect(await securityUnlocked(player.uid)).toBe(false);
  });
});

describe('readSecurity', () => {
  it('reports the password and two-factor', async () => {
    expect(await readSecurity(player.uid)).toEqual({ password: false, twoFactor: false });

    await givePassword(player.uid, await hashPassword('right password'));
    await sql`update users set two_factor_enabled = true where id = ${player.uid}`;

    expect(await readSecurity(player.uid)).toEqual({ password: true, twoFactor: true });
  });
});

describe('makePasswordLink', () => {
  it('makes a link for an account below an admin, replacing the last one', async () => {
    const first = await makePasswordLink(staff.uid, player.uid);
    const second = await makePasswordLink(staff.uid, player.uid);

    expect(first).toMatch(/\/reset-password\?token=/);
    expect(second).not.toBe(first);

    const rows = await sql`select identifier from verifications where value = ${player.uid}`;

    expect(rows).toHaveLength(1);
    expect(rows[0].identifier).toBe(
      `reset-password:${new URL(second ?? '').searchParams.get('token')}`,
    );
  });

  it('refuses a moderator', async () => {
    await setRole(staff.uid, MODERATOR_ROLE);

    expect(await makePasswordLink(staff.uid, player.uid)).toBeNull();
  });

  it('refuses an account at or above the caller, and the caller themselves', async () => {
    await setRole(player.uid, ADMIN_ROLE);
    expect(await makePasswordLink(staff.uid, player.uid)).toBeNull();

    await setRole(player.uid, OWNER_ROLE);
    expect(await makePasswordLink(staff.uid, player.uid)).toBeNull();

    expect(await makePasswordLink(staff.uid, staff.uid)).toBeNull();
  });

  it('refuses a player', async () => {
    await setRole(staff.uid, '');

    expect(await makePasswordLink(staff.uid, player.uid)).toBeNull();
    expect(await sql`select 1 from verifications`).toHaveLength(0);
  });
});
