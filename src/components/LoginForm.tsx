import { type JSX, Show, createSignal } from 'solid-js';
import { registerWithEmail, signInWithEmail, signInWithGoogle } from '../auth/actions';

/**
 * Email and Google sign-in. Registration shares the email form —
 * the same pair of fields either signs in or creates the account
 */
export default function LoginForm(): JSX.Element {
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
    <>
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
        <button type="button" onClick={run(async () => registerWithEmail(email(), password()))}>
          Register
        </button>
      </form>
      <button type="button" onClick={run(signInWithGoogle)}>
        Sign in with Google
      </button>
      <Show when={error()}>{(message) => <p role="alert">{message()}</p>}</Show>
    </>
  );
}
