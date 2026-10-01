import { useLocation } from '@solidjs/router';
import { asRecord } from './__normalize';
import {
  type Accessor,
  type JSX,
  type ParentProps,
  createContext,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from 'solid-js';
import type { PlayerIdentity } from './user';

export interface AuthState {
  /**
   * The signed-in user; null while loading or signed out
   */
  user: Accessor<PlayerIdentity | null>;
  /**
   * True until the first auth state resolves on the client
   */
  loading: Accessor<boolean>;
}

const AuthContext = createContext<AuthState>();

export function useAuth(): AuthState {
  const state = useContext(AuthContext);

  if (state == null) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return state;
}

/**
 * The pages that are not the game.
 *
 * `/demo/*` stages a battle out of a seed and reads nothing and
 * writes nothing: there is no player, so there is no session to
 * open. Naming them here rather than giving every page a prop keeps
 * the root layout one shape, and the list is short because the game
 * is the default
 */
const SESSIONLESS = '/demo';

/**
 * Tracks the session for the whole app. The subscription lives in
 * onMount, which never runs during SSR, so the server renders the
 * signed-out shell and the client hydrates the session.
 *
 * The auth client is brought in **on demand**: a page with no player
 * on it should not fetch the auth machinery, and loading it inside
 * `onMount` keeps it in a chunk of its own
 */
export default function AuthProvider(props: ParentProps): JSX.Element {
  const [user, setUser] = createSignal<PlayerIdentity | null>(null);
  const [loading, setLoading] = createSignal(true);
  const location = useLocation();

  onMount(() => {
    // No session here, and none coming: the shell settles as
    // signed-out rather than sitting on "loading" for ever
    if (location.pathname.startsWith(SESSIONLESS)) {
      setLoading(false);
      return;
    }

    const session = { unsubscribe: null as (() => void) | null, dropped: false };

    Promise.all([import('./auth-client'), import('./user'), import('./session')])
      .then(([{ default: authClient }, { asPlayerIdentity }, { forgetIdToken }]) => {
        // Unmounted while the client was in the air: nothing to subscribe
        // to any more, and nothing to leave running
        if (session.dropped) {
          return;
        }

        let previous: string | null = null;

        session.unsubscribe = authClient.$store.atoms.session.subscribe((state) => {
          const held = asRecord(state);

          if (held.isPending === true) {
            return;
          }

          const next = asPlayerIdentity(held.data);

          if (next?.uid !== previous) {
            forgetIdToken();
          }
          // The boxes kept for the last player are not the next one's business
          if (previous != null && next == null) {
            import('./box')
              .then(({ forgetBoxes }) => {
                forgetBoxes();
              })
              .catch(() => {
                // Nothing kept, so nothing to forget
              });
          }
          previous = next?.uid ?? null;
          setUser(next);
          setLoading(false);
        });
      })
      .catch(() => {
        // Nothing to fall back to: a session that cannot be read is a
        // signed-out one, and the shell says so rather than hanging
        setLoading(false);
      });

    onCleanup(() => {
      session.dropped = true;
      session.unsubscribe?.();
    });
  });

  return <AuthContext.Provider value={{ user, loading }}>{props.children}</AuthContext.Provider>;
}
