import { type JSX, createSignal, onMount } from 'solid-js';
import {
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  takeRedirectResult,
} from '../auth/actions';
import { Button, Row, Status } from './styled';

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

  // A sign-in that went the redirect way comes back here. Landing
  // signed in needs nothing from this — the auth listener has it —
  // but one that failed on the way would otherwise come back to a
  // form with nothing to say about why
  onMount(() => {
    takeRedirectResult().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : String(caught));
    });
  });

  return (
    <div class="flex flex-col gap-3 text-left">
      <form
        class="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <input
          type="email"
          placeholder="Email"
          autocomplete="email"
          value={email()}
          onInput={(event) => {
            setEmail(event.currentTarget.value);
          }}
        />
        <input
          type="password"
          placeholder="Password"
          autocomplete="current-password"
          value={password()}
          onInput={(event) => {
            setPassword(event.currentTarget.value);
          }}
        />
        <Row>
          <Button
            type="submit"
            tone="primary"
            class="grow justify-center"
            onClick={run(async () => signInWithEmail(email(), password()))}
          >
            Sign in
          </Button>
          <Button
            class="grow justify-center"
            onClick={run(async () => registerWithEmail(email(), password()))}
          >
            Register
          </Button>
        </Row>
      </form>
      <Button class="justify-center" onClick={run(signInWithGoogle)}>
        Sign in with Google
      </Button>
      <Status message={error()} tone="alert" />
    </div>
  );
}
