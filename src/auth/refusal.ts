/**
 * What a player is told when signing in is refused.
 *
 * The service's own message can name tables and internals, which is
 * nothing a player can act on, so it is never passed on
 */

/** What Better Auth answers a refused call with */
export interface AuthFailure {
  code?: string;
  status?: number;
}

/** Refusals a player can do something about, by Better Auth's code */
const AUTH_REFUSALS = new Map<string, string>([
  ['INVALID_EMAIL_OR_PASSWORD', 'That email and password do not match.'],
  ['EMAIL_NOT_VERIFIED', 'Confirm your email address first.'],
  ['USER_ALREADY_EXISTS', 'There is already an account with that email.'],
  ['USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL', 'There is already an account with that email.'],
  ['PASSWORD_TOO_SHORT', 'Choose a longer password.'],
  ['INVALID_EMAIL', 'That is not an email address.'],
  ['PASSWORD_TOO_LONG', 'Choose a shorter password.'],
  ['INVALID_TOKEN', 'This link has been used or has expired. Ask staff for a new one.'],
  ['INVALID_CODE', 'That code is not right.'],
  ['INVALID_BACKUP_CODE', 'That backup code is not right, or was used already.'],
  ['INVALID_TWO_FACTOR_COOKIE', 'That took too long. Sign in again.'],
  ['ACCOUNT_TEMPORARILY_LOCKED', 'Too many wrong codes. Wait a while and try again.'],
  ['TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE', 'Too many wrong codes. Sign in again.'],
  ['AUTH_CANCELLED', 'The passkey was cancelled.'],
]);

/** Too many tries, which Better Auth answers by status rather than code */
const TOO_MANY = 429;

const AUTH_FALLBACK = 'Could not sign you in just now.';

/** A sign-in refusal, as a player reads it */
export default function authRefusal(error: AuthFailure, fallback = AUTH_FALLBACK): Error {
  if (error.status === TOO_MANY) {
    return new Error('Too many tries. Wait a moment and try again.');
  }
  return new Error((error.code == null ? undefined : AUTH_REFUSALS.get(error.code)) ?? fallback);
}
