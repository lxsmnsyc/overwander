import getSupabase from './supabase';

/**
 * Signing in and out.
 *
 * OAuth is redirect-based PKCE end to end: the page navigates to the
 * provider and comes back with the session in the URL, which the SDK
 * collects on load. The popup machinery the old stack needed (blocker
 * detection, Safari's closing IndexedDB, COOP handshakes) is gone
 * because there is no popup to fail.
 */

/**
 * Where the provider sends the player back: the page they left,
 * query and hash dropped so an old auth response cannot ride along
 */
function returnTo(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: returnTo() },
  });

  if (error != null) {
    throw new Error(error.message);
  }
}

export async function signInWithGithub(): Promise<void> {
  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: returnTo() },
  });

  if (error != null) {
    throw new Error(error.message);
  }
}

/**
 * Development only: the local stack skips address confirmation, so a
 * sign-up answers with a live session, which is what the browser
 * tests need
 */
export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({ email, password });

  if (error != null) {
    throw new Error(error.message);
  }
}

export async function registerWithEmail(email: string, password: string): Promise<void> {
  const { error } = await getSupabase().auth.signUp({ email, password });

  if (error != null) {
    throw new Error(error.message);
  }
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();

  if (error != null) {
    throw new Error(error.message);
  }
}
