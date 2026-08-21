/// <reference types="@solidjs/start/env" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /**
   * `'true'` to talk to the local emulators instead of a project.
   * Anything else — including it being unset — is a real project.
   * The web config above may be left blank when it is set; see
   * [`supabase.ts`](./auth/supabase.ts)
   */
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
