import 'server-only';
import { type JWTPayload, createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';
import { getSql } from './db';
import { PACE_MESSAGE, Pace, type PaceCost, admit } from './pace';
import { CLOSED_MESSAGE, Feature, MAINTENANCE_MESSAGE } from './switches';

/**
 * Who a token says the caller is, checked without a round trip.
 *
 * The token's own header decides how: an HS256 token is checked
 * against the shared `SUPABASE_JWT_SECRET`, anything else against the
 * stack's published JWKS — current stacks sign asymmetrically (ES256)
 * even locally. Each key is resolved once and reused.
 */

/**
 * What a banned account is told, wherever it tries to act
 */
export const BANNED_MESSAGE = 'This account is banned.';

const AUDIENCE = 'authenticated';

let sharedSecret: Uint8Array | null = null;

let remoteKeys: ReturnType<typeof createRemoteJWKSet> | null = null;

function secretKey(): Uint8Array {
  if (sharedSecret == null) {
    const secret = process.env.SUPABASE_JWT_SECRET;

    if (secret == null || secret === '') {
      throw new Error('Set SUPABASE_JWT_SECRET so HS256 tokens can be verified.');
    }
    sharedSecret = new TextEncoder().encode(secret);
  }
  return sharedSecret;
}

function jwks(): ReturnType<typeof createRemoteJWKSet> {
  if (remoteKeys == null) {
    const origin = process.env.SUPABASE_URL;

    if (origin == null || origin === '') {
      throw new Error('Set SUPABASE_URL so tokens can be verified against its JWKS.');
    }
    remoteKeys = createRemoteJWKSet(new URL('/auth/v1/.well-known/jwks.json', origin));
  }
  return remoteKeys;
}

async function verify(token: string): Promise<JWTPayload> {
  const { alg } = decodeProtectedHeader(token);

  if (alg === 'HS256') {
    return (await jwtVerify(token, secretKey(), { audience: AUDIENCE })).payload;
  }
  return (await jwtVerify(token, jwks(), { audience: AUDIENCE })).payload;
}

/**
 * The caller is whoever their token says they are, never whoever the
 * request claims. Every privileged write starts here: signature and
 * audience are checked, and a missing, expired or forged token is
 * refused rather than defaulted.
 *
 * A **banned** account is refused here too, which is what makes a ban
 * a ban: every call that writes anything passes through this line, so
 * one check shuts all of them rather than each remembering to ask.
 *
 * Every call is **paced** here too, in the same statement as the ban
 * check: it spends from the player's `Pace.Any` bucket, and from
 * `pace` as well where the caller names one (see `./pace`). A player
 * acting faster than the game can is refused.
 *
 * And maintenance is checked here, in the same statement again: while
 * the `everything` switch is closed, every call from a player without a
 * role is refused (see `./switches`).
 *
 * Resolves the caller's uid
 */
export async function requireUid(token: string, pace?: Pace, cost = 1): Promise<string> {
  return admitCaller(token, pace, cost);
}

/**
 * `requireUid` for a call that starts something in one part of the
 * game, which that part's switch may have closed. Calls that leave,
 * cancel, read or settle take `requireUid` instead, so a closed part
 * never strands anybody halfway through it
 */
export async function requireUidFor(
  token: string,
  feature: Feature,
  pace?: Pace,
  cost = 1,
): Promise<string> {
  return admitCaller(token, pace, cost, feature);
}

async function admitCaller(
  token: string,
  pace: Pace | undefined,
  cost: number,
  feature?: Feature,
): Promise<string> {
  if (token === '') {
    throw new Error('Not signed in');
  }

  const payload = await verify(token);
  const uid = payload.sub;

  if (uid == null || uid === '') {
    throw new Error('Not signed in');
  }

  const costs: PaceCost[] = [{ pace: Pace.Any, cost: 1 }];

  if (pace != null && cost > 0) {
    costs.push({ pace, cost });
  }

  const { banned, paced, closed } = await admit(getSql(), uid, costs, Date.now(), feature);

  if (banned) {
    throw new Error(BANNED_MESSAGE);
  }
  if (closed != null) {
    const fallback = closed.feature === Feature.Everything ? MAINTENANCE_MESSAGE : CLOSED_MESSAGE;

    throw new Error(closed.message === '' ? fallback : closed.message);
  }
  if (!paced) {
    throw new Error(PACE_MESSAGE);
  }
  return uid;
}
