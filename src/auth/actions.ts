import authClient from './auth-client';
import authRefusal from './refusal';
import { forgetIdToken } from './session';

/**
 * Signing in and out, through the site's own Better Auth routes.
 *
 * OAuth is redirect-based: the page navigates to the provider and comes
 * back to the page the player left, with the session in a cookie
 */

/**
 * Where the provider sends the player back: the page they left,
 * query and hash dropped so an old auth response cannot ride along
 */
function returnTo(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

async function signInWith(provider: 'google' | 'github'): Promise<void> {
  const { error } = await authClient.signIn.social({ provider, callbackURL: returnTo() });

  if (error != null) {
    throw authRefusal(error);
  }
}

export async function signInWithGoogle(): Promise<void> {
  return signInWith('google');
}

export async function signInWithGithub(): Promise<void> {
  return signInWith('github');
}

/** Offered where `EMAIL_SIGN_IN` is: development, and hosts that set it */
export async function signInWithEmail(email: string, password: string): Promise<void> {
  forgetIdToken();

  const { error } = await authClient.signIn.email({ email, password });

  if (error != null) {
    throw authRefusal(error);
  }
}

/** A new account is signed in straight away: nothing waits on a confirmation email */
export async function registerWithEmail(email: string, password: string): Promise<void> {
  forgetIdToken();

  const { error } = await authClient.signUp.email({ email, password, name: '' });

  if (error != null) {
    throw authRefusal(error);
  }
}

export async function signOut(): Promise<void> {
  forgetIdToken();

  const { error } = await authClient.signOut();

  if (error != null) {
    throw authRefusal(error, 'Could not sign you out just now.');
  }
}
