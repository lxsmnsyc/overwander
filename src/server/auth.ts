import 'server-only';
import { type JWTPayload, createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';
import { getSql } from './db';

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
 * Resolves the caller's uid
 */
export async function requireUid(token: string): Promise<string> {
  if (token === '') {
    throw new Error('Not signed in');
  }

  const payload = await verify(token);
  const uid = payload.sub;

  if (uid == null || uid === '') {
    throw new Error('Not signed in');
  }

  const sql = getSql();
  const rows = await sql`select banned from profiles where id = ${uid}`;

  if (rows[0]?.banned === true) {
    throw new Error(BANNED_MESSAGE);
  }
  return uid;
}
