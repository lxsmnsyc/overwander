import check, { PASSWORD, TOKEN } from '../server/validate';
import type { SecurityState, UnlockResult } from '../server/security';
import { readSecurity, unlockSecurity as unlockOnServerSide } from '../server/security';
import { requireReader, requireUid } from '../server/auth';
import authClient from './auth-client';
import getIdToken from './session';
import { readOnly } from '../utils/server-calls';

/**
 * The account's security settings: an authenticator app and passkeys.
 * Every change first needs the password confirmed by `unlockSecurity`,
 * which the server enforces on Better Auth's own routes.
 */

export type { SecurityState, UnlockResult };

export async function getSecurity(): Promise<SecurityState> {
  return securityOnServer(await getIdToken());
}

async function securityOnServer(token: string): Promise<SecurityState> {
  'use server';
  check(TOKEN, token);
  return readSecurity(await requireReader(token));
}
readOnly(securityOnServer);

export async function unlockSecurity(password: string): Promise<UnlockResult> {
  return unlockOnServer(await getIdToken(), password);
}

async function unlockOnServer(token: string, password: string): Promise<UnlockResult> {
  'use server';
  check(TOKEN, token);
  check(PASSWORD, password);
  return unlockOnServerSide(await requireUid(token), password);
}

/** A failed call, as the settings show it */
function refused(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message ?? fallback);
}

export interface TotpSetup {
  uri: string;
  backupCodes: string[];
}

/** Start two-factor: the app is set up from `uri`, and it is on once `confirmTotp` passes */
export async function startTotp(password: string): Promise<TotpSetup> {
  const { data, error } = await authClient.twoFactor.enable({ password, method: 'totp' });

  if (error != null || data.method !== 'totp') {
    throw refused(error, 'Could not start two-factor.');
  }
  return { uri: data.totpURI, backupCodes: data.backupCodes };
}

export async function confirmTotp(code: string): Promise<void> {
  const { error } = await authClient.twoFactor.verifyTotp({ code });

  if (error != null) {
    throw refused(error, 'That code is not right.');
  }
}

export async function disableTotp(password: string): Promise<void> {
  const { error } = await authClient.twoFactor.disable({ password });

  if (error != null) {
    throw refused(error, 'Could not turn two-factor off.');
  }
}

/** New backup codes, which replace the old ones */
export async function renewBackupCodes(password: string): Promise<string[]> {
  const { data, error } = await authClient.twoFactor.generateBackupCodes({ password });

  if (error != null) {
    throw refused(error, 'Could not make new backup codes.');
  }
  return data.backupCodes;
}

export interface PasskeyRow {
  id: string;
  name: string;
  createdAt: number;
}

export async function listPasskeys(): Promise<PasskeyRow[]> {
  const { data, error } = await authClient.passkey.listUserPasskeys();

  if (error != null) {
    throw refused(error, 'Could not read your passkeys.');
  }

  const rows: PasskeyRow[] = [];

  for (const one of data) {
    rows.push({
      id: one.id,
      name: one.name ?? '',
      createdAt: new Date(one.createdAt).getTime(),
    });
  }
  return rows;
}

export async function addPasskey(name: string): Promise<void> {
  const result = await authClient.passkey.addPasskey({ name });

  if (result.error != null) {
    throw refused(result.error, 'Could not add that passkey.');
  }
}

export async function removePasskey(id: string): Promise<void> {
  const { error } = await authClient.passkey.deletePasskey({ id });

  if (error != null) {
    throw refused(error, 'Could not remove that passkey.');
  }
}
