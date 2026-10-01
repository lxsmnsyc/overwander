import { asRecord, asString } from './__normalize';

/**
 * The signed-in player as the interface reads one. It is this shape
 * rather than the SDK's `User` so the screens that show a name never
 * depend on which auth platform is behind it
 */
export interface PlayerIdentity {
  uid: string;
  email: string | null;
  displayName: string | null;
}

/**
 * The identity a session carries. OAuth providers give a name; an email
 * account has none. The provider's picture is not read: a trainer is
 * seen as an overworld character they earned, not as whatever their
 * sign-in happens to carry
 */
export function asPlayerIdentity(session: unknown): PlayerIdentity | null {
  const user = asRecord(asRecord(session).user);
  const uid = asString(user.id);

  if (uid === '') {
    return null;
  }

  const email = asString(user.email);
  const name = asString(user.name);

  return {
    uid,
    email: email === '' ? null : email,
    displayName: name === '' ? null : name,
  };
}
