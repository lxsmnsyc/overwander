import getSupabase from './supabase';

/**
 * The signed-in player's access token, which is what a privileged
 * server function trusts. Everything that mints or moves value goes
 * through one of those, and the token is how the server knows who is
 * asking; the uid a client passes alongside it is never taken at face
 * value.
 *
 * The SDK refreshes the session on its own, so what this answers is
 * always fresh enough to verify. The name survives the platform: the
 * ninety call sites say `getIdToken`, and what matters to them is
 * "the proof it is me", not which company signed it.
 *
 * Throws when nobody is signed in: a write with no caller has no
 * owner, and silently doing nothing would look like it worked
 */
export default async function getIdToken(): Promise<string> {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;

  if (token == null || token === '') {
    throw new Error('Not signed in');
  }
  return token;
}
