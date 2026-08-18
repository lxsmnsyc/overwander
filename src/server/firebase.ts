import 'server-only';
import { PROFILE_COLLECTION } from '../auth/collections';
import './timezone';
import { type App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { asRecord, asString } from '../auth/__normalize';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';

/**
 * The privileged side of the game. Everything here runs on the server
 * only — it is imported exclusively from `'use server'` functions, and
 * the admin credentials it holds must never reach a browser bundle.
 *
 * Admin writes bypass the security rules, which is the point: the
 * rules can enforce "only the owner writes this document", but they
 * cannot enforce "this pokemon is the one the overworld actually
 * staged" or "this gold was earned". Those invariants span documents
 * and derive from world state, so they are checked here instead, and
 * the rules leave the affected collections read-only to clients.
 */

const ADMIN_APP = 'poketerra-admin';

/**
 * The service account, as a JSON string. Absent it, the SDK falls
 * back to application default credentials, which is how it is meant
 * to run on Google infrastructure
 */
const SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

/**
 * Whether the emulators are what this process is talking to.
 *
 * Nothing here has to route the calls: the admin SDK reads these two
 * variables itself and points at the local ports. What it will not do
 * is invent a project to point at — so an emulated run supplies one
 * and skips the credentials, which the emulators do not check and a
 * developer machine has no reason to hold
 */
const EMULATED =
  process.env.FIRESTORE_EMULATOR_HOST != null || process.env.FIREBASE_AUTH_EMULATOR_HOST != null;

/**
 * The project the emulators keep their store under when neither side
 * names one. It matches the browser's default in
 * [`src/auth/firebase.ts`](../auth/firebase.ts) — leaving both unset
 * is meant to work
 */
const EMULATOR_PROJECT = 'demo-poketerra';

/**
 * Refuse to run against a different project to the browser's.
 *
 * The emulators keep **one store per project id**, and the two sides
 * of the game name theirs separately: the browser reads
 * `VITE_FIREBASE_PROJECT_ID` and the admin SDK here reads
 * `FIREBASE_PROJECT_ID`. Let them disagree and everything appears to
 * work — both halves talk to a real emulator, both writes succeed —
 * while the player is looking at a store nothing the server writes
 * ever reaches. Their catches, their bag, their gold and their
 * profile are all in the other one. Nothing errors, nothing is
 * denied, and every panel is simply empty for ever.
 *
 * So it is refused here, where both values are visible, rather than
 * left to be discovered as an empty game
 */
function requireOneProject(project: string): void {
  const browser = process.env.VITE_FIREBASE_PROJECT_ID;

  if (browser == null || browser === '' || browser === project) {
    return;
  }
  throw new Error(
    `Firebase project mismatch: the browser is configured for "${browser}" ` +
      `(VITE_FIREBASE_PROJECT_ID) and the server for "${project}" (FIREBASE_PROJECT_ID). ` +
      'The emulators keep one store per project, so the two would be playing different ' +
      `games. Set both to the same id in .env — or leave both unset, which is "${EMULATOR_PROJECT}" ` +
      'on either side — and restart the dev server.',
  );
}

function getAdminApp(): App {
  if (getApps().some((app) => app.name === ADMIN_APP)) {
    return getApp(ADMIN_APP);
  }

  if (EMULATED) {
    // The same project id the browser is configured with, since the
    // emulators keep one store per project and the two sides have to
    // be looking at the same one
    const project = process.env.FIREBASE_PROJECT_ID ?? EMULATOR_PROJECT;

    requireOneProject(project);
    return initializeApp({ projectId: project }, ADMIN_APP);
  }

  if (SERVICE_ACCOUNT == null || SERVICE_ACCOUNT === '') {
    // Application default credentials: set GOOGLE_APPLICATION_CREDENTIALS,
    // or run somewhere that supplies them
    return initializeApp({}, ADMIN_APP);
  }
  // Read field by field rather than asserting the parsed JSON into a
  // service account: a malformed secret should fail on the first
  // request, not shape-check silently
  const account = asRecord(JSON.parse(SERVICE_ACCOUNT));

  return initializeApp(
    {
      credential: cert({
        projectId: asString(account.project_id),
        clientEmail: asString(account.client_email),
        privateKey: asString(account.private_key),
      }),
    },
    ADMIN_APP,
  );
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}

/**
 * What a banned account is told, wherever it tries to act
 */
export const BANNED_MESSAGE = 'This account is banned.';

/**
 * The caller is whoever their Firebase ID token says they are, never
 * whoever the request claims. Every privileged write starts here:
 * the token is verified against the project's signing keys, and a
 * missing, expired or forged one is refused rather than defaulted.
 *
 * A **banned** account is refused here too, which is what makes a ban
 * a ban: every call that writes anything passes through this line, so
 * one check shuts all of them rather than each remembering to ask.
 *
 * Resolves the caller's uid
 */
export async function requireUid(token: string): Promise<string> {
  if (token === '') {
    throw new Error('Not signed in');
  }

  const { uid } = await getAdminAuth().verifyIdToken(token);
  const stored = await getAdminFirestore().collection(PROFILE_COLLECTION).doc(uid).get();

  if (stored.data()?.banned === true) {
    throw new Error(BANNED_MESSAGE);
  }
  return uid;
}
