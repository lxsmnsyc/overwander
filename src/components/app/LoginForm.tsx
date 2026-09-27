import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createResource,
  createSignal,
} from 'solid-js';
import {
  registerWithEmail,
  signInWithEmail,
  signInWithGithub,
  signInWithGoogle,
  signInWithPasskey,
  verifyBackupCode,
  verifySignInCode,
} from '../../auth/actions';
import listSignInProviders, { type SignInProvider } from '../../auth/sign-in-options';
import { Button, Checkbox, Row, Status } from '../styled';
import createClientSignal from './client-signal';

/**
 * The way in: an address and a password, a passkey, and Google or
 * GitHub where the server has credentials for them. An account with
 * two-factor on asks for a code after its password.
 */

type Run = (action: () => Promise<unknown>) => () => void;

const PROVIDERS: Record<SignInProvider, { label: string; signIn: () => Promise<void> }> = {
  google: { label: 'Sign in with Google', signIn: signInWithGoogle },
  github: { label: 'Sign in with GitHub', signIn: signInWithGithub },
};

function PasswordStep(props: { run: Run; onSecondFactor: () => void }): JSX.Element {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');

  return (
    <form
      class="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <input
        type="email"
        placeholder="Email"
        autocomplete="username webauthn"
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
          onClick={props.run(async () => {
            if (await signInWithEmail(email(), password())) {
              props.onSecondFactor();
            }
          })}
        >
          Sign in
        </Button>
        <Button
          class="grow justify-center"
          onClick={props.run(async () => registerWithEmail(email(), password()))}
        >
          Register
        </Button>
      </Row>
    </form>
  );
}

/** The second step, for an account with two-factor on */
function CodeStep(props: { run: Run; onBack: () => void }): JSX.Element {
  const [code, setCode] = createSignal('');
  const [backup, setBackup] = createSignal(false);
  const [trust, setTrust] = createSignal(false);

  return (
    <form
      class="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <input
        type="text"
        inputmode={backup() ? 'text' : 'numeric'}
        placeholder={backup() ? 'Backup code' : 'Code from your authenticator app'}
        autocomplete="one-time-code"
        value={code()}
        onInput={(event) => {
          setCode(event.currentTarget.value);
        }}
      />
      <Show when={!backup()}>
        <Checkbox
          label="Trust this device for 30 days"
          checked={trust()}
          onChange={(value) => {
            setTrust(value);
          }}
        />
      </Show>
      <Button
        type="submit"
        tone="primary"
        class="justify-center"
        onClick={props.run(async () =>
          backup() ? verifyBackupCode(code().trim()) : verifySignInCode(code().trim(), trust()),
        )}
      >
        Continue
      </Button>
      <Row>
        <Button
          class="grow justify-center"
          onClick={() => {
            setBackup(!backup());
            setCode('');
          }}
        >
          {backup() ? 'Use the app instead' : 'Use a backup code'}
        </Button>
        <Button class="grow justify-center" onClick={props.onBack}>
          Back
        </Button>
      </Row>
    </form>
  );
}

function ProviderButtons(props: { run: Run; providers: Resource<SignInProvider[]> }): JSX.Element {
  return (
    <For each={props.providers() ?? []}>
      {(provider) => (
        <Button class="justify-center" onClick={props.run(PROVIDERS[provider].signIn)}>
          {PROVIDERS[provider].label}
        </Button>
      )}
    </For>
  );
}

export default function LoginForm(): JSX.Element {
  const client = createClientSignal();
  const [providers] = createResource(client, async () => listSignInProviders());
  const [secondFactor, setSecondFactor] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Auth calls run fire-and-forget so DOM handlers stay void;
  // failures land in the error signal
  const run: Run = (action) => (): void => {
    setError(null);
    action().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : String(caught));
    });
  };

  return (
    <div class="flex flex-col gap-3 text-left">
      <Show
        when={secondFactor()}
        fallback={
          <>
            <PasswordStep
              run={run}
              onSecondFactor={() => {
                setSecondFactor(true);
              }}
            />
            <Button class="justify-center" onClick={run(signInWithPasskey)}>
              Sign in with a passkey
            </Button>
            <Suspense>
              <ProviderButtons run={run} providers={providers} />
            </Suspense>
          </>
        }
      >
        <CodeStep
          run={run}
          onBack={() => {
            setSecondFactor(false);
            setError(null);
          }}
        />
      </Show>
      <Status message={error()} tone="alert" />
    </div>
  );
}
