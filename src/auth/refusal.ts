import type { AuthError } from '@supabase/supabase-js';

/**
 * What a player is told when the store refuses something.
 *
 * The store's own message names tables, columns and policies, which is
 * nothing a player can act on and more than the page should say about
 * the schema. So it is never passed on: each read or write says what it
 * was trying to do, in the game's own words.
 */

/**
 * Sign-in refusals a player can do something about, by the code the
 * auth service answers with. Anything else is the generic line
 */
const AUTH_REFUSALS = new Map<string, string>([
  ['invalid_credentials', 'That email and password do not match.'],
  ['email_not_confirmed', 'Confirm your email address first.'],
  ['user_already_exists', 'There is already an account with that email.'],
  ['email_exists', 'There is already an account with that email.'],
  ['weak_password', 'Choose a longer password.'],
  ['over_request_rate_limit', 'Too many tries. Wait a moment and try again.'],
  ['over_email_send_rate_limit', 'Too many tries. Wait a moment and try again.'],
]);

const AUTH_FALLBACK = 'Could not sign you in just now.';

/** A sign-in refusal, as a player reads it */
export default function authRefusal(error: AuthError, fallback = AUTH_FALLBACK): Error {
  return new Error((error.code == null ? undefined : AUTH_REFUSALS.get(error.code)) ?? fallback);
}
