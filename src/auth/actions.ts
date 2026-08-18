import {
  type AuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  type UserCredential,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import getFirebaseAuth from './firebase';

/**
 * Why a popup sign-in is worth a fallback.
 *
 * A popup is the nicer flow — the page stays where it is — but it
 * asks a great deal of the browser: a second window on another
 * origin, a message passed back to the opener, and a record written
 * to IndexedDB from a page the browser has just put in the
 * background. Every one of those has a browser that says no. A
 * blocker refuses the window outright; Safari and Firefox close the
 * database connection under a hidden page and the write fails on the
 * way through ("the database connection is closing"); and a page
 * served with a strict opener policy leaves the popup unable to
 * answer at all.
 *
 * None of it means the player cannot sign in — only that the popup
 * cannot. A redirect asks for none of it: one navigation out, one
 * back, no second window and no cross-window handshake. So the popup
 * is tried first and the redirect is what happens when it will not
 * work, which is also what makes the emulator's own popup — served
 * from a different port to the app — something that can be given up
 * on rather than something that stops a local run.
 */
const POPUP_FAILURES = new Set([
  'auth/popup-blocked',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
  'auth/web-storage-unsupported',
  'auth/internal-error',
]);

/**
 * Whether the failure was the popup rather than the sign-in.
 *
 * The storage failures do not arrive as auth codes at all — they are
 * the browser's own `InvalidStateError` coming up through the
 * persistence layer — so they are recognised by what they say rather
 * than by a code nobody assigned them
 */
function isPopupProblem(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const code = 'code' in error ? String(error.code) : '';

  if (POPUP_FAILURES.has(code)) {
    return true;
  }

  const message = 'message' in error ? String(error.message).toLowerCase() : '';

  return message.includes('database connection is closing') || message.includes('indexeddb');
}

/**
 * Sign in through somebody else, popup first and redirect after.
 * Resolves to the credential when the popup carried it, and to null
 * when the browser is being sent away instead — the page is on its
 * way out at that point, and what comes back arrives through the auth
 * listener rather than through here
 */
async function signInWithProvider(provider: AuthProvider): Promise<UserCredential | null> {
  const auth = getFirebaseAuth();

  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    if (!isPopupProblem(error)) {
      throw error;
    }
    await signInWithRedirect(auth, provider);
    return null;
  }
}

export async function signInWithGoogle(): Promise<UserCredential | null> {
  return signInWithProvider(new GoogleAuthProvider());
}

export async function signInWithGithub(): Promise<UserCredential | null> {
  return signInWithProvider(new GithubAuthProvider());
}

/**
 * The other half of the redirect: what a page that has just been
 * sent back from Google is holding. The signed-in state arrives on
 * its own through the auth listener — this is only how the **error**
 * gets somewhere it can be shown, since a failed redirect otherwise
 * lands on a page with nothing to say for itself.
 *
 * Resolves to null when this load is not the return leg of one
 */
export async function takeRedirectResult(): Promise<UserCredential | null> {
  return getRedirectResult(getFirebaseAuth());
}

/**
 * The two below are the development sign-in: an address and a
 * password, with no other site in the loop. They are what the browser
 * tests use and what a local run with nothing configured falls back
 * on, and the form that reaches them is drawn on a development build
 * alone — a live account belongs to whoever the player already signs
 * in as elsewhere
 */
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function registerWithEmail(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function signOut(): Promise<void> {
  return firebaseSignOut(getFirebaseAuth());
}
