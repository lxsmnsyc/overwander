import { m } from '../i18n/paraglide/messages.js';

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
  message?: string;
}

/** Refusals a player can do something about, by Better Auth's code */
const AUTH_REFUSALS = new Map<string, () => string>([
  ['INVALID_EMAIL_OR_PASSWORD', m.auth_refusal_wrong_password],
  ['EMAIL_NOT_VERIFIED', m.auth_refusal_email_not_verified],
  ['USER_ALREADY_EXISTS', m.auth_refusal_account_exists],
  ['USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL', m.auth_refusal_account_exists],
  ['PASSWORD_TOO_SHORT', m.auth_refusal_password_short],
  ['INVALID_EMAIL', m.auth_refusal_invalid_email],
  ['PASSWORD_TOO_LONG', m.auth_refusal_password_long],
  ['INVALID_TOKEN', m.auth_refusal_invalid_token],
  ['INVALID_CODE', m.auth_refusal_invalid_code],
  ['INVALID_BACKUP_CODE', m.auth_refusal_invalid_backup_code],
  ['INVALID_TWO_FACTOR_COOKIE', m.auth_refusal_two_factor_expired],
  ['ACCOUNT_TEMPORARILY_LOCKED', m.auth_refusal_locked],
  ['TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE', m.auth_refusal_too_many_codes],
  ['AUTH_CANCELLED', m.auth_refusal_cancelled],
]);

/** Too many tries, which Better Auth answers by status rather than code */
const TOO_MANY = 429;

/**
 * A sign-in refusal, as a player reads it. The fallback is a message
 * read when the refusal is made, so it is said in the player's language
 */
export default function authRefusal(
  error: AuthFailure,
  fallback: () => string = m.auth_refusal_fallback,
): Error {
  if (error.status === TOO_MANY) {
    return new Error(m.auth_refusal_too_many());
  }
  // A malformed address comes back as a generic validation error that
  // only its message ties to the email field
  if (error.code === 'VALIDATION_ERROR' && error.message?.includes('body.email') === true) {
    return new Error(m.auth_refusal_invalid_email());
  }

  const known = error.code == null ? undefined : AUTH_REFUSALS.get(error.code);

  return new Error((known ?? fallback)());
}
