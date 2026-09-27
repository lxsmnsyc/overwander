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
import { Button, Checkbox, Note, Status, TabBar, TabButton, TabGroup, TextField } from '../styled';
import { KeyIcon } from '../icons';
import createClientSignal from './client-signal';

/**
 * The way in: an address and a password, a passkey, and Google or
 * GitHub where the server has credentials for them. An account with
 * two-factor on asks for a code after its password.
 */

type Run = (action: () => Promise<unknown>) => () => void;

const PROVIDERS: Record<SignInProvider, { label: string; signIn: () => Promise<void> }> = {
  google: { label: 'Google', signIn: signInWithGoogle },
  github: { label: 'GitHub', signIn: signInWithGithub },
};

/** The two things a visitor comes to do, one tab each */
const enum Mode {
  SignIn = 0,
  Create = 1,
}

/** The shortest password an account takes, Better Auth's own default */
const PASSWORD_MIN = 8;

function PasswordStep(props: {
  run: Run;
  error: string | null;
  mode: Mode;
  onMode: (mode: Mode) => void;
  onSecondFactor: () => void;
}): JSX.Element {
  const mode = (): Mode => props.mode;
  const setMode = (value: Mode): void => {
    props.onMode(value);
  };
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const creating = (): boolean => mode() === Mode.Create;

  return (
    <form
      class="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <TabGroup
        horizontal
        value={mode()}
        onChange={(value) => {
          setMode(value);
        }}
      >
        <TabBar class="w-full">
          <TabButton value={Mode.SignIn} class="flex-1 justify-center">
            Sign in
          </TabButton>
          <TabButton value={Mode.Create} class="flex-1 justify-center">
            Create account
          </TabButton>
        </TabBar>
      </TabGroup>
      <TextField
        label="Email"
        kind="email"
        placeholder="you@example.com"
        autocomplete="username webauthn"
        value={email()}
        onChange={(typed) => {
          setEmail(typed);
        }}
      />
      <TextField
        label={creating() ? 'New password' : 'Password'}
        kind="password"
        hint={creating() ? `At least ${PASSWORD_MIN} characters.` : undefined}
        autocomplete={creating() ? 'new-password' : 'current-password'}
        value={password()}
        onChange={(typed) => {
          setPassword(typed);
        }}
      />
      {/* Above the button it answers, where the eye already is */}
      <Status message={props.error} tone="alert" />
      <Button
        type="submit"
        tone="primary"
        class="justify-center"
        onClick={props.run(async () => {
          if (creating()) {
            await registerWithEmail(email(), password());
            return;
          }
          if (await signInWithEmail(email(), password())) {
            props.onSecondFactor();
          }
        })}
      >
        {creating() ? 'Create account' : 'Sign in'}
      </Button>
    </form>
  );
}

function CodeStep(props: { run: Run; error: string | null; onBack: () => void }): JSX.Element {
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
      <Note>
        One more step: {backup() ? 'a backup code.' : 'the code from your authenticator app.'}
      </Note>
      <TextField
        label={backup() ? 'Backup code' : 'Code'}
        placeholder={backup() ? 'xxxxx-xxxxx' : '123 456'}
        autocomplete="one-time-code"
        value={code()}
        onChange={(typed) => {
          setCode(typed);
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
      <Status message={props.error} tone="alert" />
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
      <div class="grid grid-cols-2 gap-2">
        <Button
          class="justify-center"
          onClick={() => {
            setBackup(!backup());
            setCode('');
          }}
        >
          {backup() ? 'Use the app' : 'Use a backup code'}
        </Button>
        <Button class="justify-center" onClick={props.onBack}>
          Back
        </Button>
      </div>
    </form>
  );
}

function ProviderButtons(props: { run: Run; providers: Resource<SignInProvider[]> }): JSX.Element {
  return (
    <For each={props.providers() ?? []}>
      {(provider) => (
        <Button
          class="justify-center"
          label={`Sign in with ${PROVIDERS[provider].label}`}
          onClick={props.run(PROVIDERS[provider].signIn)}
        >
          {PROVIDERS[provider].label}
        </Button>
      )}
    </For>
  );
}

/**
 * The other ways in, under the form they stand in for. A passkey only
 * opens an account that already has one (it is added in the security
 * settings), so it is offered on the Sign in tab alone, and the section
 * goes when nothing is left to offer
 */
function OtherWays(props: {
  run: Run;
  mode: Mode;
  providers: Resource<SignInProvider[]>;
}): JSX.Element {
  const passkey = (): boolean => props.mode === Mode.SignIn;

  return (
    <Show when={passkey() || (props.providers()?.length ?? 0) > 0}>
      <div
        class="flex items-center gap-2 text-xs font-extrabold tracking-wide text-muted uppercase
          before:h-0.5 before:flex-1 before:bg-line-soft after:h-0.5 after:flex-1
          after:bg-line-soft"
      >
        or
      </div>
      <div class="grid grid-cols-2 gap-2">
        <Show when={passkey()}>
          <Button
            class="justify-center"
            label="Sign in with a passkey"
            onClick={props.run(signInWithPasskey)}
          >
            <KeyIcon class="size-4" aria-hidden="true" />
            Passkey
          </Button>
        </Show>
        <ProviderButtons run={props.run} providers={props.providers} />
      </div>
    </Show>
  );
}

export default function LoginForm(): JSX.Element {
  const client = createClientSignal();
  const [providers] = createResource(client, async () => listSignInProviders());
  const [secondFactor, setSecondFactor] = createSignal(false);
  const [mode, setMode] = createSignal(Mode.SignIn);
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
              error={error()}
              mode={mode()}
              onMode={(value) => {
                setError(null);
                setMode(value);
              }}
              onSecondFactor={() => {
                setError(null);
                setSecondFactor(true);
              }}
            />
            <Suspense>
              <OtherWays run={run} mode={mode()} providers={providers} />
            </Suspense>
          </>
        }
      >
        <CodeStep
          run={run}
          error={error()}
          onBack={() => {
            setSecondFactor(false);
            setError(null);
          }}
        />
      </Show>
    </div>
  );
}
