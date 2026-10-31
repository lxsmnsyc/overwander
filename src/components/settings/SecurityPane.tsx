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
import { formatDate } from '../../i18n/format';
import describeFailure from '../../i18n/refusals';
import { m } from '../../i18n/paraglide/messages.js';

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
        setWrong(describeFailure(caught));
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
      <Note>{m.security_backup_note()}</Note>
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
    <Card title={m.security_totp_title()}>
      <Show
        when={!props.enabled}
        fallback={
          <>
            <Row>
              <Badge tone="leaf">{m.security_on()}</Badge>
              <Meta>{m.security_totp_on()}</Meta>
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
                {m.security_new_codes()}
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
                {m.security_turn_off()}
              </Button>
            </Row>
          </>
        }
      >
        <Show
          when={setup()}
          fallback={
            <>
              <Note>{m.security_totp_offer()}</Note>
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
                  {m.security_set_up()}
                </Button>
              </Row>
            </>
          }
        >
          {(started) => (
            <>
              <Note>{m.security_totp_scan()}</Note>
              {/* uqr draws the QR code as SVG markup from the address alone */}
              <div class="w-44 self-center bg-white p-2" innerHTML={renderSVG(started().uri)} />
              <Meta class="font-mono break-all">{secretOf(started().uri)}</Meta>
              <BackupCodes codes={started().backupCodes} />
              <Row class="items-end">
                <TextField
                  label={m.login_code()}
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
                  {m.security_turn_on()}
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
    <Show when={(props.passkeys() ?? []).length > 0} fallback={<Note>{m.security_no_passkeys()}</Note>}>
      <List>
        <For each={props.passkeys()}>
          {(one) => (
            <ListRow>
              <span class="grow">{one.name === '' ? m.login_passkey() : one.name}</span>
              <Meta>{m.security_added({ date: formatDate(one.createdAt) })}</Meta>
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
                {m.ui_remove_action()}
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
    <Card title={m.security_passkeys_title()}>
      <Note>{m.security_passkeys_note()}</Note>
      <Suspense fallback={<Note>{m.security_passkeys_loading()}</Note>}>
        <PasskeyList passkeys={passkeys} act={act} busy={busy()} onChanged={changed} />
      </Suspense>
      <Row class="items-end">
        <TextField
          label={m.security_passkey_name()}
          class="grow"
          value={name()}
          placeholder={m.security_passkey_name_placeholder()}
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
          {m.security_add_passkey()}
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
        throw new Error(m.security_wrong_password());
      }
      if (result === 'no-password') {
        setNone(true);
        return;
      }
      props.onUnlocked(password());
    });
  };

  return (
    <Card title={m.security_confirm_title()}>
      <Show
        when={!none()}
        fallback={<Note>{m.security_no_password()}</Note>}
      >
        <Note>{m.security_confirm_note()}</Note>
        <Row class="items-end">
          <TextField
            label={m.login_password()}
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
            {m.login_continue()}
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
          <Suspense fallback={<Note>{m.security_loading()}</Note>}>
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
