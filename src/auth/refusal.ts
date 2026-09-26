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
