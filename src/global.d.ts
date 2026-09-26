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
  /**
   * `'2'` to read the world with the second generation; anything else
   * is the first. Only ever set for a new seed, never an existing one
   */
  readonly VITE_WORLD_GENERATION?: string;
  /**
   * The build this bundle came from, the same on the client and the
   * server. Set by `vite.config.ts` rather than by the environment
   */
  readonly VITE_BUILD_ID: string;
  /**
   * Where the sprite files are served from, with no trailing slash.
   * Unset means this origin, which is what development wants
   */
  readonly VITE_SPRITE_ORIGIN?: string;
  /**
   * `'true'` or `'1'` to run the time of day on the local clock. Anything
   * else, including unset, is the game clock
   */
  readonly VITE_REAL_TIME_OF_DAY?: string;
  /**
   * How many minutes each period of the day lasts on the game clock.
   * Unset means 90, which makes a whole day 6 hours
   */
  readonly VITE_TIME_OF_DAY_MINUTES?: string;
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
