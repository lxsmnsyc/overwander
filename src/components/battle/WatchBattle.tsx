import { useNavigate } from '@solidjs/router';
import { type JSX, type Resource, Show, Suspense, createResource } from 'solid-js';
import { type BattleRecord, getBattle } from '../../auth/battles';
import BattleData from '../app/battle-data';
import BattleView from './battle-view';
import { Button, Note } from '../styled';

/** The fight itself, once its record is known to exist */
function Watched(props: { id: string; record: Resource<BattleRecord | null> }): JSX.Element {
  const navigate = useNavigate();
  const home = (): void => {
    navigate('/');
  };

  return (
    <Show
      when={props.record()}
      fallback={
        <div class="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
          <Note>There is no battle at this link.</Note>
          <Button onClick={home}>Back to the game</Button>
        </div>
      }
    >
      {(found) => (
        <BattleData>
          <BattleView
            // Always a replay: watching from a link settles nothing,
            // even for someone who fought in it
            active={{ id: props.id, replay: true, raid: found().raid || undefined }}
            onLeave={home}
            onReward={() => undefined}
          />
        </BattleData>
      )}
    </Show>
  );
}

/** Any battle, played from its record for whoever opens the link */
export default function WatchBattle(props: { id: string }): JSX.Element {
  const [record] = createResource(() => props.id, getBattle);

  return (
    <Suspense
      fallback={
        <div class="flex h-full items-center justify-center">
          <Note>Loading the battle…</Note>
        </div>
      }
    >
      <Watched id={props.id} record={record} />
    </Suspense>
  );
}
