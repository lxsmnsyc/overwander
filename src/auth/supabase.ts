import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import measuredFetch from './traffic';

/**
 * The browser's one Supabase client, which is only the sign-in session
 * now: reads go through the server and changes through `./live`.
 *
 * Local development needs no flag: `supabase start` prints the URL
 * and key, and the local defaults in `.env.example` point here.
 */

/**
 * The env as this module reads it, narrowed so config resolution is
 * testable without Vite standing behind it
 */
export interface SupabaseWebEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

/**
 * The pair a client needs, or the names of what is missing, so the
 * thrown error can say which line of .env to fill in rather than
 * letting a connection error surface
 */
export function resolveSupabaseConfig(
  env: SupabaseWebEnv,
): { url: string; key: string } | { missing: string[] } {
  const url = env.VITE_SUPABASE_URL?.trim() ?? '';
  const key = env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';
  const missing = [
    ...(url === '' ? ['VITE_SUPABASE_URL'] : []),
    ...(key === '' ? ['VITE_SUPABASE_ANON_KEY'] : []),
  ];

  return missing.length > 0 ? { missing } : { url, key };
}

let client: SupabaseClient | null = null;

export default function getSupabase(): SupabaseClient {
  if (client == null) {
    const config = resolveSupabaseConfig(import.meta.env);

    if ('missing' in config) {
      throw new Error(
        `Supabase is not configured: ${config.missing.join(', ')} unset. ` +
          'Copy .env.example to .env; `supabase start` prints the local values. ' +
          'Vite reads .env at startup, so restart `pnpm dev` after editing it.',
      );
    }
    // Development measures what every read downloads; see ./traffic
    client = createClient(
      config.url,
      config.key,
      import.meta.env.DEV ? { global: { fetch: measuredFetch() } } : {},
    );
  }
  return client;
}
