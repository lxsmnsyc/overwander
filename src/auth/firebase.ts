import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import { type Firestore, connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

/**
 * Where the local emulators are listening, when they are the ones
 * being talked to. Both ports are the Firebase defaults and match
 * `firebase.json`; the host is a name rather than a URL because that
 * is the shape the two connect helpers take
 */
const EMULATOR_HOST = 'localhost';
const AUTH_EMULATOR_PORT = 9099;
const FIRESTORE_EMULATOR_PORT = 8080;

/**
 * The project the emulators keep their store under. A `demo-` prefix
 * is what makes them run offline, and it has to be the same id the
 * server side uses — see `FIREBASE_PROJECT_ID` in `.env.example`
 */
const EMULATOR_PROJECT = 'demo-poketerra';

/**
 * What an emulated field is filled in with. The emulators check none
 * of it: an API key is verified by Google's servers, and there are
 * none in the loop. It only has to be *there*, since the SDK refuses
 * to build an Auth instance around a blank one — `auth/invalid-api-key`
 */
const EMULATOR_PLACEHOLDER = 'emulator';

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string | undefined;
  projectId: string;
  appId: string | undefined;
}

/**
 * The environment this config is read out of. Narrower than Vite's
 * own type so the resolution can be tested without one
 */
export interface FirebaseWebEnv {
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
  VITE_FIREBASE_EMULATOR?: string;
}

/**
 * What counts as asking for the emulators. Read liberally — trimmed,
 * case-insensitively, and `1` as well as `true` — because every one
 * of these fails **silently** otherwise: the app quietly talks to a
 * project that is not there, and the error it eventually gives is
 * about a missing key rather than about a capital T
 */
const EMULATOR_YES = new Set(['true', '1', 'yes', 'on']);

/**
 * Whether this build talks to the emulators instead of a project.
 *
 * It is an explicit flag rather than a hostname check on purpose: a
 * page served from localhost against the real project is an ordinary
 * thing to want — reproducing something a player reported — and
 * guessing from the hostname would take that away
 */
export function usesEmulator(env: FirebaseWebEnv): boolean {
  return EMULATOR_YES.has((env.VITE_FIREBASE_EMULATOR ?? '').trim().toLowerCase());
}

/**
 * The Firebase web config is public by design; the values come from
 * the Vite environment so deployments can point at different projects
 * (see .env.example).
 *
 * **An emulated run fills in its own blanks.** Setting the flag is
 * meant to be the whole of what it takes, and a developer who has no
 * project has nothing to copy a key out of — so the fields the
 * emulators do not check are given something to be. Anything actually
 * set is still honoured, since pointing the emulators at a real
 * project's id is how you work against a copy of its data
 */
export function resolveFirebaseConfig(env: FirebaseWebEnv): FirebaseWebConfig {
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
    appId: env.VITE_FIREBASE_APP_ID,
  };

  if (!usesEmulator(env)) {
    return config;
  }
  return {
    ...config,
    apiKey: config.apiKey === '' ? EMULATOR_PLACEHOLDER : config.apiKey,
    projectId: config.projectId === '' ? EMULATOR_PROJECT : config.projectId,
    appId: config.appId == null || config.appId === '' ? EMULATOR_PLACEHOLDER : config.appId,
  };
}

const USES_EMULATOR = usesEmulator(import.meta.env);

/**
 * What to say when there is no config to start with.
 *
 * Firebase's own answer is `auth/invalid-api-key`, thrown from the
 * first call that asks for an Auth instance rather than from the
 * empty variable that caused it — which reads as a broken app rather
 * than an unfilled `.env`, and names neither the file nor the fix
 */
function describeMissingConfig(env: FirebaseWebEnv): string {
  // What was actually read, since the whole difficulty of this
  // failure is that it looks the same however the variable went
  // missing — never written, written after the server started,
  // written somewhere the server was not looking, or written as
  // something other than a yes
  const flag = env.VITE_FIREBASE_EMULATOR;
  const seen = flag == null || flag === '' ? 'unset' : `"${flag}"`;

  return (
    'Firebase is not configured: VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID are empty, ' +
    `and VITE_FIREBASE_EMULATOR is ${seen}. Fill the web config in from the Firebase console ` +
    '(see .env.example), or set VITE_FIREBASE_EMULATOR=true in .env at the repository root to ' +
    'run against the local emulators. Either way the value is read when the server starts, so ' +
    'restart `pnpm dev` after editing .env — and rebuild if this is a built app, since a build ' +
    'bakes the config into the bundle.'
  );
}

/**
 * The config, or the reason there isn't one. Kept apart from the app
 * it configures so the check can be made without a Firebase registry
 * to make it against
 */
export function requireFirebaseConfig(env: FirebaseWebEnv): FirebaseWebConfig {
  const config = resolveFirebaseConfig(env);

  if (config.apiKey === '' || config.projectId === '') {
    throw new Error(describeMissingConfig(env));
  }
  return config;
}

/**
 * The name Firebase gives an app initialized without one. Asked for
 * by name rather than through `getApp()`, since "some app exists"
 * and "the default app exists" are not the same question — anything
 * else holding a named app would send the second one down a path
 * that throws `app/no-app`
 */
const DEFAULT_APP = '[DEFAULT]';

/**
 * Lazily initialize the shared Firebase app; repeated calls reuse it
 */
function getFirebaseApp(): FirebaseApp {
  const existing = getApps().find((app) => app.name === DEFAULT_APP);

  if (existing != null) {
    return existing;
  }

  const config = requireFirebaseConfig(import.meta.env);

  // Said once, where a developer is already looking when something
  // is wrong: which Firebase this page is talking to is the first
  // thing in question and the hardest thing to see. It is the only
  // console line in the game, and it earns its place — the emulator
  // being silently off is exactly the failure it exists to name
  if (USES_EMULATOR) {
    // oxlint-disable-next-line no-console
    console.info(`Firebase: local emulators, project "${config.projectId}"`);
  }
  return initializeApp(config);
}

/**
 * The emulators are connected to once each, on the first call that
 * wants them. Both SDKs refuse a second connect on a client that has
 * already been used, so the flags are what keep a second call — a
 * second component asking for auth — from throwing
 */
let authConnected = false;
let firestoreConnected = false;

export default function getFirebaseAuth(): Auth {
  const auth = getAuth(getFirebaseApp());

  if (USES_EMULATOR && !authConnected) {
    authConnected = true;
    // The warning banner is the emulator telling the developer their
    // credentials are not real, which is the whole point of it
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`);
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore {
  const firestore = getFirestore(getFirebaseApp());

  if (USES_EMULATOR && !firestoreConnected) {
    firestoreConnected = true;
    connectFirestoreEmulator(firestore, EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
  }
  return firestore;
}
