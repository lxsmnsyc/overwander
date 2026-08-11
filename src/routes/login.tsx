import { Title } from '@solidjs/meta';
import { type JSX, Show, createSignal } from 'solid-js';
import { signOut } from '../auth/actions';
import { useAuth } from '../auth/context';
import LoginForm from '../components/LoginForm';
import { Button, Card, Note, Row, Status } from '../components/styled';

export default function Login(): JSX.Element {
  const auth = useAuth();
  const [error, setError] = createSignal<string | null>(null);

  const leave = (): void => {
    setError(null);
    signOut().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : String(caught));
    });
  };

  return (
    <main class="mx-auto flex w-full max-w-sm flex-col gap-4 px-4 py-6">
      <Title>Sign in - Poketerra</Title>
      <h1>Sign in</h1>
      <Card>
        <Show
          when={auth.user()}
          fallback={
            <Show when={!auth.loading()} fallback={<Note>Loading session…</Note>}>
              <LoginForm />
            </Show>
          }
        >
          {(user) => (
            <>
              <Note>Signed in as {user().email ?? user().uid}</Note>
              <Row>
                <Button onClick={leave}>Sign out</Button>
              </Row>
            </>
          )}
        </Show>
        <Status message={error()} tone="alert" />
      </Card>
    </main>
  );
}
