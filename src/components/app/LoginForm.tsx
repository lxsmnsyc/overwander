import { type JSX, Show, createSignal, onMount } from 'solid-js';
import {
  registerWithEmail,
  signInWithEmail,
  signInWithGithub,
  signInWithGoogle,
  takeRedirectResult,
} from '../../auth/actions';
import { Button, Row, Status } from '../styled';

/**
 * The way in: Google or GitHub, and — on a development build alone —
 * an address and a password.
 *
 * The email pair is kept for local work and for the browser tests,
 * which need an account they can make and throw away without another
 * site in the loop. A player meets the two buttons and nothing
 * else: an account the game holds a password for is an account the
 * game has to keep one safe for
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
      {/* Not drawn in a build: the pair of fields is here for a
          local run and for the browser tests, which make and
          throw away accounts of their own */}
      <Show when={import.meta.env.DEV}>
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
      </Show>
      <Button class="justify-center" onClick={run(signInWithGoogle)}>
        Sign in with Google
      </Button>
      <Button class="justify-center" onClick={run(signInWithGithub)}>
        Sign in with GitHub
      </Button>
      <Status message={error()} tone="alert" />
    </div>
  );
}
