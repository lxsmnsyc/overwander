/// <reference types="@solidjs/start/env" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  /**
   * The overworld's seed; defaults to 'overworld' when unset
   */
  readonly VITE_WORLD_SEED: string;
}
