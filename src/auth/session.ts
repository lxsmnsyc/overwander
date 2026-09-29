import { decodeJwt } from 'jose';
import authClient from './auth-client';

/**
 * The signed-in player's token, which is what a privileged server
 * function trusts. The uid a client passes alongside it is never taken
 * at face value.
 *
 * It is a short-lived JWT from `/api/auth/token`, kept until a minute
 * before it expires. Throws when nobody is signed in: a write with no
 * caller has no owner, and silently doing nothing would look like it
 * worked
 */

/** How long before a token expires it is fetched again, in milliseconds */
const MARGIN = 60_000;

let held: { token: string; expiresAt: number } | null = null;
let fetching: Promise<string> | null = null;

/** When a JWT expires, in milliseconds, or now for one that says nothing */
function expiryOf(token: string): number {
  try {
    return (decodeJwt(token).exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}

async function fetchToken(): Promise<string> {
  const { data } = await authClient.$fetch<{ token: string }>('/token');
  const token = data?.token ?? '';

  if (token === '') {
    throw new Error('Not signed in');
  }
  held = { token, expiresAt: expiryOf(token) };
  return token;
}

export default async function getIdToken(): Promise<string> {
  if (held != null && held.expiresAt - MARGIN > Date.now()) {
    return held.token;
  }
  fetching ??= fetchToken().finally(() => {
    fetching = null;
  });
  return fetching;
}

/** Drop the kept token, for a sign-out or a different player signing in */
export function forgetIdToken(): void {
  held = null;
}
