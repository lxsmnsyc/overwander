import 'server-only';
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

function getAdminApp(): App {
  if (getApps().some((app) => app.name === ADMIN_APP)) {
    return getApp(ADMIN_APP);
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
 * The caller is whoever their Firebase ID token says they are, never
 * whoever the request claims. Every privileged write starts here:
 * the token is verified against the project's signing keys, and a
 * missing, expired or forged one is refused rather than defaulted.
 *
 * Resolves the caller's uid
 */
export async function requireUid(token: string): Promise<string> {
  if (token === '') {
    throw new Error('Not signed in');
  }
  return (await getAdminAuth().verifyIdToken(token)).uid;
}
