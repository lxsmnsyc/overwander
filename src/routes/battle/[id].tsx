import { Title } from '@solidjs/meta';
import { useParams } from '@solidjs/router';
import { clientOnly } from '@solidjs/start';
import { type JSX, Show } from 'solid-js';
import { useAuth } from '../../auth/context';
import LoginForm from '../../components/app/LoginForm';
import { Note } from '../../components/styled';

/** The engine and its canvas only run in a browser, like the game's own fights */
const WatchBattle = clientOnly(async () => import('../../components/battle/WatchBattle'));

/** A battle anyone signed in can watch, from a link to its id */
export default function BattlePage(): JSX.Element {
  const params = useParams();
  const auth = useAuth();

  return (
    <main class="fixed inset-0 overflow-hidden">
      <Title>Battle · Overwander</Title>
      <Show
        when={auth.user()}
        fallback={
          <div class="flex h-full items-center justify-center px-4">
            <Show when={!auth.loading()} fallback={<Note>Loading session…</Note>}>
              <div class="flex w-full max-w-sm flex-col gap-3 text-center">
                <Note>Sign in to watch this battle.</Note>
                <LoginForm />
              </div>
            </Show>
          </div>
        }
      >
        <WatchBattle id={params.id ?? ''} />
      </Show>
    </main>
  );
}
