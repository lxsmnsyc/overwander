import { describe, expect, it } from 'vitest';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  requireFirebaseConfig,
  resolveFirebaseConfig,
  usesEmulator,
} from '../../src/auth/firebase';

/**
 * The web config an emulated run gets. It is worth a test of its own
 * because the failure is not a wrong value but a **blank** one, and
 * the SDK does not complain about a blank field until something asks
 * it for an Auth instance — at which point the whole page is a
 * `auth/invalid-api-key` and nothing says which variable was empty
 */
describe('firebase web config', () => {
  it('fills in what an emulated run has nowhere to get', () => {
    const config = resolveFirebaseConfig({ VITE_FIREBASE_EMULATOR: 'true' });

    expect(config.apiKey).not.toBe('');
    expect(config.projectId).toBe('demo-poketerra');

    // The real complaint, reproduced: the SDK builds an app around a
    // blank key happily and refuses only when Auth is asked for
    const blank = initializeApp({ apiKey: '', projectId: 'demo-poketerra' }, 'blank-key');

    expect(() => getAuth(blank)).toThrow(/invalid-api-key/);

    const filled = initializeApp(config, 'filled-key');

    expect(() => getAuth(filled)).not.toThrow();
  });

  it('honours what is set, emulated or not', () => {
    const env = {
      VITE_FIREBASE_API_KEY: 'real-key',
      VITE_FIREBASE_PROJECT_ID: 'real-project',
      VITE_FIREBASE_EMULATOR: 'true',
    };

    // Pointing the emulators at a real project's id is how you work
    // against a copy of its data, so nothing set is overwritten
    expect(resolveFirebaseConfig(env).apiKey).toBe('real-key');
    expect(resolveFirebaseConfig(env).projectId).toBe('real-project');
  });

  it('reads the flag the way it is likely to be written', () => {
    // Each of these fails silently if the check is an exact match,
    // and the failure looks like a missing API key rather than like
    // a capital T
    for (const written of ['true', 'TRUE', 'True', ' true ', '1', 'yes', 'on']) {
      expect(usesEmulator({ VITE_FIREBASE_EMULATOR: written })).toBe(true);
    }
    for (const written of ['', 'false', 'no', '0', 'demo']) {
      expect(usesEmulator({ VITE_FIREBASE_EMULATOR: written })).toBe(false);
    }
  });

  it('reports what it read for the flag, not only that it is unhappy', () => {
    // The one thing that tells the four ways of getting here apart
    expect(() => requireFirebaseConfig({})).toThrow(/is unset/);
    expect(() => requireFirebaseConfig({ VITE_FIREBASE_EMULATOR: 'True!' })).toThrow(/is "True!"/);
  });

  it('says what is missing rather than what the SDK noticed', () => {
    // Every plausible way to arrive here: an unfilled .env, and one
    // filled in after the dev server was already running
    expect(() => requireFirebaseConfig({})).toThrow(/VITE_FIREBASE_EMULATOR/);
    expect(() => requireFirebaseConfig({})).toThrow(/restart/);
    expect(() => requireFirebaseConfig({ VITE_FIREBASE_API_KEY: 'real-key' })).toThrow(
      /not configured/,
    );
    expect(() => requireFirebaseConfig({ VITE_FIREBASE_EMULATOR: 'true' })).not.toThrow();
  });

  it('fills in nothing when it is talking to a project', () => {
    // A deployment missing its config should fail loudly rather than
    // quietly talking to a project called demo-poketerra
    const config = resolveFirebaseConfig({});

    expect(config.apiKey).toBe('');
    expect(config.projectId).toBe('');
    expect(usesEmulator({})).toBe(false);
  });
});
