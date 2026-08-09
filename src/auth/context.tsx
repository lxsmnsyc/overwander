import { type User, onAuthStateChanged } from 'firebase/auth';
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
import getFirebaseAuth from './firebase';

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
 * Tracks the Firebase session for the whole app. The subscription
 * lives in onMount, which never runs during SSR, so the server
 * renders the signed-out shell and the client hydrates the session
 */
export default function AuthProvider(props: ParentProps): JSX.Element {
  const [user, setUser] = createSignal<User | null>(null);
  const [loading, setLoading] = createSignal(true);

  onMount(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (next) => {
      setUser(next);
      setLoading(false);
    });

    onCleanup(unsubscribe);
  });

  return <AuthContext.Provider value={{ user, loading }}>{props.children}</AuthContext.Provider>;
}
