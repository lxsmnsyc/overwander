import type { User } from 'firebase/auth';
import { useLocation } from '@solidjs/router';
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

export interface AuthState {
  /**
   * The signed-in user; null while loading or signed out
   */
  user: Accessor<User | null>;
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
 * writes nothing — there is no player, so there is no session to
 * open. Naming them here rather than giving every page a prop keeps
 * the root layout one shape, and the list is short because the game
 * is the default
 */
const SESSIONLESS = '/demo';

/**
 * Tracks the Firebase session for the whole app. The subscription
 * lives in onMount, which never runs during SSR, so the server
 * renders the signed-out shell and the client hydrates the session.
 *
 * Firebase is brought in **on demand** rather than imported at the
 * top. It is by a long way the heaviest thing the browser downloads,
 * and a page with no player on it should neither fetch it nor call
 * `initializeApp`: a demo battle that opened an auth listener would
 * be a demo battle talking to a project. Loading it inside `onMount`
 * puts the whole SDK in a chunk of its own, asked for by the pages
 * that actually have a session
 */
export default function AuthProvider(props: ParentProps): JSX.Element {
  const [user, setUser] = createSignal<User | null>(null);
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

    Promise.all([import('firebase/auth'), import('./firebase')])
      .then(([{ onAuthStateChanged }, { default: getFirebaseAuth }]) => {
        // Unmounted while the SDK was in the air: nothing to subscribe
        // to any more, and nothing to leave running
        if (session.dropped) {
          return;
        }
        session.unsubscribe = onAuthStateChanged(getFirebaseAuth(), (next) => {
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
