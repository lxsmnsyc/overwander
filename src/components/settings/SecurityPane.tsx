import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createResource,
  createSignal,
} from 'solid-js';
import { renderSVG } from 'uqr';
import {
  type PasskeyRow,
  type SecurityState,
  type TotpSetup,
  addPasskey,
  confirmTotp,
  disableTotp,
  getSecurity,
  listPasskeys,
  removePasskey,
  renewBackupCodes,
  startTotp,
  unlockSecurity,
} from '../../auth/security';
import {
  Badge,
  Button,
  Card,
  List,
  ListRow,
  Meta,
  Note,
  Panel,
  Row,
  Status,
  TextField,
} from '../styled';
import createClientSignal from '../app/client-signal';

/**
 * Two-factor and passkeys. Nothing here is shown until the password is
 * typed again, and the server refuses the changes without it too.
 */

type Act = (action: () => Promise<unknown>) => void;

/** One busy flag and one complaint for a card's buttons */
function createAct(): { busy: () => boolean; wrong: () => string | null; act: Act } {
  const [busy, setBusy] = createSignal(false);
  const [wrong, setWrong] = createSignal<string | null>(null);

  const act: Act = (action) => {
    setWrong(null);
    setBusy(true);
    action()
      .catch((caught: unknown) => {
        setWrong(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        setBusy(false);
      });
  };
  return { busy, wrong, act };
}

/** The key an authenticator app can be given by hand, out of the QR code's address */
function secretOf(uri: string): string {
  try {
    return new URL(uri).searchParams.get('secret') ?? '';
  } catch {
    return '';
  }
}

function BackupCodes(props: { codes: string[] }): JSX.Element {
  return (
    <div class="flex flex-col gap-2">
      <Note>Keep these somewhere safe. Each one signs you in once if the app is lost.</Note>
      <div class="grid grid-cols-2 gap-1 font-mono text-sm">
        <For each={props.codes}>{(code) => <span>{code}</span>}</For>
      </div>
    </div>
  );
}

function TwoFactorCard(props: {
  password: string;
  enabled: boolean;
  onChanged: () => void;
}): JSX.Element {
  const { busy, wrong, act } = createAct();
  const [setup, setSetup] = createSignal<TotpSetup | null>(null);
  const [code, setCode] = createSignal('');
  const [codes, setCodes] = createSignal<string[] | null>(null);

  return (
    <Card title="Authenticator app">
      <Show
        when={!props.enabled}
        fallback={
          <>
            <Row>
              <Badge tone="leaf">on</Badge>
              <Meta>Signing in with a password also asks for the app's code.</Meta>
            </Row>
            <Show when={codes()}>{(fresh) => <BackupCodes codes={fresh()} />}</Show>
            <Row>
              <Button
                disabled={busy()}
                onClick={() => {
                  act(async () => {
                    setCodes(await renewBackupCodes(props.password));
                  });
                }}
              >
                New backup codes
              </Button>
              <Button
                tone="danger"
                disabled={busy()}
                onClick={() => {
                  act(async () => {
                    await disableTotp(props.password);
                    setCodes(null);
                    props.onChanged();
                  });
                }}
              >
                Turn off
              </Button>
            </Row>
          </>
        }
      >
        <Show
          when={setup()}
          fallback={
            <>
              <Note>
                Ask for a code from an authenticator app whenever you sign in with a password.
              </Note>
              <Row>
                <Button
                  tone="primary"
                  disabled={busy()}
                  onClick={() => {
                    act(async () => {
                      setSetup(await startTotp(props.password));
                    });
                  }}
                >
                  Set up
                </Button>
              </Row>
            </>
          }
        >
          {(started) => (
            <>
              <Note>
                Scan this with the app, or type the key into it, then enter the code it shows.
              </Note>
              {/* uqr draws the QR code as SVG markup from the address alone */}
              <div class="w-44 self-center bg-white p-2" innerHTML={renderSVG(started().uri)} />
              <Meta class="font-mono break-all">{secretOf(started().uri)}</Meta>
              <BackupCodes codes={started().backupCodes} />
              <Row class="items-end">
                <TextField
                  label="Code"
                  class="grow"
                  value={code()}
                  autocomplete="one-time-code"
                  disabled={busy()}
                  onChange={(value) => {
                    setCode(value);
                  }}
                />
                <Button
                  tone="primary"
                  disabled={busy()}
                  onClick={() => {
                    act(async () => {
                      await confirmTotp(code().trim());
                      setSetup(null);
                      setCode('');
                      props.onChanged();
                    });
                  }}
                >
                  Turn on
                </Button>
              </Row>
            </>
          )}
        </Show>
      </Show>
      <Status message={wrong()} tone="alert" />
    </Card>
  );
}

function PasskeyList(props: {
  passkeys: Resource<PasskeyRow[]>;
  act: Act;
  busy: boolean;
  onChanged: () => void;
}): JSX.Element {
  return (
    <Show when={(props.passkeys() ?? []).length > 0} fallback={<Note>No passkeys yet.</Note>}>
      <List>
        <For each={props.passkeys()}>
          {(one) => (
            <ListRow>
              <span class="grow">{one.name === '' ? 'Passkey' : one.name}</span>
              <Meta>added {new Date(one.createdAt).toLocaleDateString()}</Meta>
              <Button
                tone="danger"
                disabled={props.busy}
                onClick={() => {
                  props.act(async () => {
                    await removePasskey(one.id);
                    props.onChanged();
                  });
                }}
              >
                Remove
              </Button>
            </ListRow>
          )}
        </For>
      </List>
    </Show>
  );
}

function PasskeysCard(): JSX.Element {
  const { busy, wrong, act } = createAct();
  const [passkeys, { refetch }] = createResource(listPasskeys);
  const [name, setName] = createSignal('');

  const changed = (): void => {
    Promise.resolve(refetch()).catch(() => undefined);
  };

  return (
    <Card title="Passkeys">
      <Note>
        Sign in with this device's fingerprint, face or PIN, or a security key, with no password.
      </Note>
      <Suspense fallback={<Note>Reading your passkeys…</Note>}>
        <PasskeyList passkeys={passkeys} act={act} busy={busy()} onChanged={changed} />
      </Suspense>
      <Row class="items-end">
        <TextField
          label="Name"
          class="grow"
          value={name()}
          placeholder="Which device it is"
          disabled={busy()}
          onChange={(value) => {
            setName(value);
          }}
        />
        <Button
          tone="primary"
          disabled={busy()}
          onClick={() => {
            act(async () => {
              await addPasskey(name().trim());
              setName('');
              changed();
            });
          }}
        >
          Add a passkey
        </Button>
      </Row>
      <Status message={wrong()} tone="alert" />
    </Card>
  );
}

function Unlocked(props: {
  password: string;
  security: Resource<SecurityState>;
  onChanged: () => void;
}): JSX.Element {
  return (
    <Show when={props.security()}>
      {(state) => (
        <>
          <TwoFactorCard
            password={props.password}
            enabled={state().twoFactor}
            onChanged={props.onChanged}
          />
          <PasskeysCard />
        </>
      )}
    </Show>
  );
}

function Unlock(props: { onUnlocked: (password: string) => void }): JSX.Element {
  const { busy, wrong, act } = createAct();
  const [password, setPassword] = createSignal('');
  const [none, setNone] = createSignal(false);

  const submit = (): void => {
    act(async () => {
      const result = await unlockSecurity(password());

      if (result === 'wrong') {
        throw new Error('That password is not right.');
      }
      if (result === 'no-password') {
        setNone(true);
        return;
      }
      props.onUnlocked(password());
    });
  };

  return (
    <Card title="Confirm your password">
      <Show
        when={!none()}
        fallback={<Note>This account has no password yet. Ask staff for a password link.</Note>}
      >
        <Note>Type your password to change how this account signs in.</Note>
        <Row class="items-end">
          <TextField
            label="Password"
            kind="password"
            class="grow"
            value={password()}
            autocomplete="current-password"
            disabled={busy()}
            onChange={(value) => {
              setPassword(value);
            }}
            onEnter={submit}
          />
          <Button tone="primary" disabled={busy()} onClick={submit}>
            Continue
          </Button>
        </Row>
      </Show>
      <Status message={wrong()} tone="alert" />
    </Card>
  );
}

export default function SecurityPane(): JSX.Element {
  const client = createClientSignal();
  // Kept only while the pane is open, since the two-factor routes ask for it again
  const [password, setPassword] = createSignal<string | null>(null);
  const [security, { refetch }] = createResource(
    () => client() && password() != null,
    async () => getSecurity(),
  );

  return (
    <Panel>
      <Show
        when={password()}
        fallback={
          <Unlock
            onUnlocked={(value) => {
              setPassword(value);
            }}
          />
        }
      >
        {(typed) => (
          <Suspense fallback={<Note>Reading your account…</Note>}>
            <Unlocked
              password={typed()}
              security={security}
              onChanged={() => {
                Promise.resolve(refetch()).catch(() => undefined);
              }}
            />
          </Suspense>
        )}
      </Show>
    </Panel>
  );
}
