import {
  REALTIME_SUBSCRIBE_STATES,
  type SupabaseClient,
  createClient,
} from '@supabase/supabase-js';

/**
 * The browser's one Supabase client: auth session, reads under RLS,
 * and the realtime socket all hang off it.
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
    client = createClient(config.url, config.key);
  }
  return client;
}

/**
 * The two watch helpers every live view rides on.
 *
 * Firestore's onSnapshot fired at once with current state and again
 * on every change; postgres_changes only streams the changes. Each
 * helper therefore does the initial read itself, re-reads whenever
 * the channel (re)subscribes so a dropped socket cannot leave a stale
 * screen, and hands every result through the same callback.
 */

/** What a subscription hands back, shaped like the old Unsubscribe */
export type Unwatch = () => void;

/**
 * Follow one row. `read` is the initial and recovery fetch; `filter`
 * is the change stream's own condition, e.g. `id=eq.abc`
 */
export function watchRow<T>(
  table: string,
  filter: string,
  read: () => Promise<T>,
  onChange: (value: T) => void,
): Unwatch {
  const supabase = getSupabase();
  const refetch = (): void => {
    read()
      .then(onChange)
      .catch(() => {
        // A read that failed mid-watch is a blink, not a sign-out;
        // the next change or reconnect tries again
      });
  };
  const channel = supabase
    .channel(`row:${table}:${filter}:${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter }, refetch)
    .subscribe((status) => {
      if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
        refetch();
      }
    });

  // The first paint cannot wait for the socket
  refetch();

  return () => {
    supabase.removeChannel(channel).catch(() => {
      // A channel that cannot be removed is already gone
    });
  };
}

/**
 * Follow a set of rows. The subscription is deliberately wider than
 * the read (often unfiltered), because a row *leaving* the set is an
 * UPDATE the set's own filter would not match; every ping simply
 * re-runs the read
 */
export function watchTable<T>(
  table: string,
  filters: (string | undefined)[],
  read: () => Promise<T>,
  onChange: (value: T) => void,
): Unwatch {
  const supabase = getSupabase();
  const refetch = (): void => {
    read()
      .then(onChange)
      .catch(() => {
        // Same forgiveness as watchRow: transient failures retry on
        // the next ping
      });
  };
  let channel = supabase.channel(`table:${table}:${Math.random().toString(36).slice(2)}`);

  for (const filter of filters.length > 0 ? filters : [undefined]) {
    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table, ...(filter == null ? {} : { filter }) },
      refetch,
    );
  }
  channel.subscribe((status) => {
    if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
      refetch();
    }
  });

  refetch();

  return () => {
    supabase.removeChannel(channel).catch(() => {
      // A channel that cannot be removed is already gone
    });
  };
}
