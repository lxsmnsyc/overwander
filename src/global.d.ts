/// <reference types="@solidjs/start/env" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  /**
   * `'true'` to talk to the local emulators instead of a project.
   * Anything else — including it being unset — is a real project.
   * The web config above may be left blank when it is set; see
   * [`firebase.ts`](./auth/firebase.ts)
   */
  readonly VITE_FIREBASE_EMULATOR: string;
  /**
   * The overworld's seed; defaults to 'overworld' when unset
   */
  readonly VITE_WORLD_SEED: string;
}

interface Window {
  /**
   * Dev-only: paint the hover cards' safe wedges, so a card that
   * closes while the pointer is on its way to it shows why. Set by
   * [`hover-card.tsx`](./components/styled/hover-card.tsx) and absent
   * from a production build
   */
  hoverCardSafeAreas?: (on?: boolean) => void;
}
