import type { SignInProvider } from '../server/better-auth';
import { signInProviders } from '../server/better-auth';
import { readOnly } from '../utils/server-calls';

export type { SignInProvider };

/**
 * The OAuth providers the sign-in form offers, beside the email and
 * password it always has. The server offers one only where both of its
 * credentials are set, so this is asked of the server rather than baked
 * into the build
 */
export default async function listSignInProviders(): Promise<SignInProvider[]> {
  return providersOnServer();
}

// Read before anybody is signed in, so there is no token to check. A server function has to be async
// oxlint-disable-next-line typescript/require-await
async function providersOnServer(): Promise<SignInProvider[]> {
  'use server';
  return signInProviders();
}
readOnly(providersOnServer);
