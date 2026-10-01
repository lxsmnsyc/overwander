import 'server-only';
import { type JWTPayload, type JWTVerifyGetKey, createLocalJWKSet, errors, jwtVerify } from 'jose';
import getAuth from './better-auth';
import { getSql } from './db';
import { PACE_MESSAGE, Pace, type PaceCost, admit } from './pace';
import { CLOSED_MESSAGE, Feature, MAINTENANCE_MESSAGE } from './switches';

/**
 * Who a token says the caller is, checked without a round trip: the
 * short-lived JWT Better Auth signs (see `./better-auth.ts`), against
 * its own key set. The keys are read once and read again only when a
 * token names one this process has not seen, which a key rotation does
 */

/**
 * What a banned account is told, wherever it tries to act
 */
export const BANNED_MESSAGE = 'This account is banned.';

let keys: Promise<JWTVerifyGetKey> | null = null;

async function loadKeys(): Promise<JWTVerifyGetKey> {
  try {
    return createLocalJWKSet(await getAuth().api.getJwks());
  } catch (error) {
    // Read again by the next call rather than failing every one after
    keys = null;
    throw error;
  }
}

async function verify(token: string): Promise<JWTPayload> {
  keys ??= loadKeys();
  try {
    return (await jwtVerify(token, await keys)).payload;
  } catch (error) {
    if (!(error instanceof errors.JWKSNoMatchingKey)) {
      throw error;
    }
    keys = loadKeys();
    return (await jwtVerify(token, await keys)).payload;
  }
}

/**
 * The caller is whoever their token says they are, never whoever the
 * request claims. Every privileged write starts here: signature and
 * expiry are checked, and a missing, expired or forged token is
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

/**
 * The caller of a read, checked by signature alone. Reads move nothing,
 * so they skip the pacing write, the ban and the switches
 */
export async function requireReader(token: string): Promise<string> {
  if (token === '') {
    throw new Error('Not signed in');
  }

  const uid = (await verify(token)).sub;

  if (uid == null || uid === '') {
    throw new Error('Not signed in');
  }
  return uid;
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
