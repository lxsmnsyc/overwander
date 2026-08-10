import { Title } from '@solidjs/meta';
import { type JSX, Show, createSignal } from 'solid-js';
import { signOut } from '../auth/actions';
import { useAuth } from '../auth/context';
import LoginForm from '../components/LoginForm';

export default function Login(): JSX.Element {
  const auth = useAuth();
  const [error, setError] = createSignal<string | null>(null);

  const leave = (): void => {
    setError(null);
    signOut().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : String(caught));
    });
  };

  return (
    <main>
      <Title>Sign in - Poketerra</Title>
      <h1>Sign in</h1>
      <Show
        when={auth.user()}
        fallback={
          <Show when={!auth.loading()} fallback={<p>Loading session…</p>}>
            <LoginForm />
          </Show>
        }
      >
        {(user) => (
          <>
            <p>Signed in as {user().email ?? user().uid}</p>
            <button type="button" onClick={leave}>
              Sign out
            </button>
          </>
        )}
      </Show>
      <Show when={error()}>{(message) => <p role="alert">{message()}</p>}</Show>
    </main>
  );
}
