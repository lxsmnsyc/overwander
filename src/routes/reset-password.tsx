import { A, useSearchParams } from '@solidjs/router';
import { type JSX, Show, createSignal } from 'solid-js';
import { Title } from '@solidjs/meta';
import { choosePassword } from '../auth/actions';
import { Button, Card, Note, Status, TextField } from '../components/styled';
import describeFailure from '../i18n/refusals';
import { m } from '../i18n/paraglide/messages.js';

/**
 * Where a password link from staff lands: the player chooses a password
 * for their account, then signs in with its email and that password
 */
export default function ResetPasswordPage(): JSX.Element {
  const [params] = useSearchParams();
  const [password, setPassword] = createSignal('');
  const [again, setAgain] = createSignal('');
  const [busy, setBusy] = createSignal(false);
  const [done, setDone] = createSignal(false);
  const [wrong, setWrong] = createSignal<string | null>(null);

  const token = (): string => {
    const value = params.token;

    return typeof value === 'string' ? value : '';
  };

  const submit = (): void => {
    if (password() !== again()) {
      setWrong(m.reset_mismatch());
      return;
    }
    setWrong(null);
    setBusy(true);
    choosePassword(token(), password())
      .then(() => {
        setDone(true);
      })
      .catch((caught: unknown) => {
        setWrong(describeFailure(caught));
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <main class="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-16">
      <Title>{m.reset_page_title()}</Title>
      <Card title={m.reset_title()}>
        <Show
          when={token() !== ''}
          fallback={<Note>{m.reset_no_token()}</Note>}
        >
          <Show
            when={!done()}
            fallback={
              <Note>
                {m.reset_done_before()}
                <A href="/">{m.login_sign_in()}</A>
                {m.reset_done_after()}
              </Note>
            }
          >
            <form
              class="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <TextField
                label={m.login_new_password()}
                kind="password"
                value={password()}
                autocomplete="new-password"
                hint={m.login_password_hint({ count: 8 })}
                disabled={busy()}
                onChange={(value) => {
                  setPassword(value);
                }}
              />
              <TextField
                label={m.reset_again()}
                kind="password"
                value={again()}
                autocomplete="new-password"
                disabled={busy()}
                onChange={(value) => {
                  setAgain(value);
                }}
              />
              <Button type="submit" tone="primary" class="justify-center" disabled={busy()}>
                {m.reset_submit()}
              </Button>
            </form>
          </Show>
        </Show>
        <Status message={wrong()} tone="alert" />
      </Card>
    </main>
  );
}
