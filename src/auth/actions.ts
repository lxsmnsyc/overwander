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

/**
 * Resolves whether the account asks for a second factor, in which case
 * nobody is signed in until `verifySignInCode` or `verifyBackupCode` is
 */
export async function signInWithEmail(email: string, password: string): Promise<boolean> {
  forgetIdToken();

  const { data, error } = await authClient.signIn.email({ email, password });

  if (error != null) {
    throw authRefusal(error);
  }
  return 'twoFactorRedirect' in data && data.twoFactorRedirect === true;
}

/** The authenticator app's code, finishing a sign-in that asked for one */
export async function verifySignInCode(code: string, trustDevice: boolean): Promise<void> {
  const { error } = await authClient.twoFactor.verifyTotp({ code, trustDevice });

  if (error != null) {
    throw authRefusal(error);
  }
}

/** One of the account's backup codes, in place of the authenticator app's */
export async function verifyBackupCode(code: string): Promise<void> {
  const { error } = await authClient.twoFactor.verifyBackupCode({ code });

  if (error != null) {
    throw authRefusal(error);
  }
}

export async function signInWithPasskey(): Promise<void> {
  forgetIdToken();

  const result = await authClient.signIn.passkey();

  if (result.error != null) {
    throw authRefusal(result.error, 'That passkey did not sign you in.');
  }
}

/** Choose a password with a link staff handed out (see `db/password-link.ts`) */
export async function choosePassword(token: string, newPassword: string): Promise<void> {
  const { error } = await authClient.resetPassword({ token, newPassword });

  if (error != null) {
    throw authRefusal(error, 'Could not set that password.');
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
