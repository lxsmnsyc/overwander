import { A, useSearchParams } from '@solidjs/router';
import { type JSX, Show, createSignal } from 'solid-js';
import { Title } from '@solidjs/meta';
import { choosePassword } from '../auth/actions';
import { Button, Card, Note, Status, TextField } from '../components/styled';

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
      setWrong('The two passwords are not the same.');
      return;
    }
    setWrong(null);
    setBusy(true);
    choosePassword(token(), password())
      .then(() => {
        setDone(true);
      })
      .catch((caught: unknown) => {
        setWrong(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <main class="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-16">
      <Title>Choose a password · Overwander</Title>
      <Card title="Choose a password">
        <Show
          when={token() !== ''}
          fallback={<Note>This link is missing its token. Ask staff for a new one.</Note>}
        >
          <Show
            when={!done()}
            fallback={
              <Note>
                Your password is set. <A href="/">Sign in</A> with your account's email and this
                password.
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
                label="New password"
                kind="password"
                value={password()}
                autocomplete="new-password"
                hint="At least 8 characters."
                disabled={busy()}
                onChange={(value) => {
                  setPassword(value);
                }}
              />
              <TextField
                label="The same again"
                kind="password"
                value={again()}
                autocomplete="new-password"
                disabled={busy()}
                onChange={(value) => {
                  setAgain(value);
                }}
              />
              <Button type="submit" tone="primary" class="justify-center" disabled={busy()}>
                Set password
              </Button>
            </form>
          </Show>
        </Show>
        <Status message={wrong()} tone="alert" />
      </Card>
    </main>
  );
}
