import { Title } from '@solidjs/meta';
import { type JSX, Show, createSignal } from 'solid-js';
import { registerWithEmail, signInWithEmail, signInWithGoogle, signOut } from '../auth/actions';
import { useAuth } from '../auth/context';

export default function Login(): JSX.Element {
  const auth = useAuth();
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);

  // Auth calls run fire-and-forget so DOM handlers stay void;
  // failures land in the error signal
  const run = (action: () => Promise<unknown>) => (): void => {
    setError(null);
    action().catch((caught: unknown) => {
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
            <form
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <input
                type="email"
                placeholder="Email"
                value={email()}
                onInput={(event) => {
                  setEmail(event.currentTarget.value);
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password()}
                onInput={(event) => {
                  setPassword(event.currentTarget.value);
                }}
              />
              <button type="submit" onClick={run(async () => signInWithEmail(email(), password()))}>
                Sign in
              </button>
              <button
                type="button"
                onClick={run(async () => registerWithEmail(email(), password()))}
              >
                Register
              </button>
            </form>
            <button type="button" onClick={run(signInWithGoogle)}>
              Sign in with Google
            </button>
          </Show>
        }
      >
        {(user) => (
          <>
            <p>Signed in as {user().email ?? user().uid}</p>
            <button type="button" onClick={run(signOut)}>
              Sign out
            </button>
          </>
        )}
      </Show>
      <Show when={error()}>{(message) => <p role="alert">{message()}</p>}</Show>
    </main>
  );
}
