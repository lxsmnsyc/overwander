import { For, type JSX, createResource, createSignal } from 'solid-js';
import {
  type ReleaseGrace,
  getCatchName,
  getReleaseGrace,
  takeBackCatch,
} from '../../../auth/caught';
import createClientSignal from '../../app/client-signal';
import { useGame } from '../../app/game-context';
import { answered } from '../../app/resource-reads';
import { Button, List, ListRow, Meta, useToast } from '../../styled';
import describeFailure from '../../../i18n/refusals';
import { m } from '../../../i18n/paraglide/messages.js';

/** What a refused take-back says, by why */
const REFUSED: Record<string, () => string> = {
  gone: m.catch_take_back_gone,
  'no-candy': m.catch_take_back_no_candy,
};

/** What was let go today, and the way to take one back */
export interface Released {
  letGo: () => ReleaseGrace['released'];
  busy: () => boolean;
  takeBack: (catchId: string, name: string) => void;
}

/**
 * What the player let go today, while it can still be taken back. Only
 * a server that holds releases for a day has any, and the rail counts
 * them as well as the list showing them, so both read this once
 */
export function createReleased(): Released {
  const game = useGame();
  const toast = useToast();
  const [busy, setBusy] = createSignal(false);
  const client = createClientSignal();
  // Read again whenever the box is, since a release is what moves it.
  // The browser's alone, so the server render never waits on it
  const [grace] = createResource(
    // The revision starts at 0, which a source would read as "not yet"
    () => (client() ? { revision: game.records() } : false),
    async (): Promise<ReleaseGrace> => getReleaseGrace(),
  );

  const letGo = (): ReleaseGrace['released'] => {
    const known = answered(grace);

    return known?.grace === true ? known.released : [];
  };

  const takeBack = (catchId: string, name: string): void => {
    setBusy(true);
    takeBackCatch(catchId)
      .then((outcome) => {
        if (outcome === 'done') {
          toast.push({ message: m.catch_take_back_done({ name }), tone: 'leaf' });
        } else {
          toast.push({ message: REFUSED[outcome](), tone: 'ember' });
        }
        game.touchRecords();
      })
      .catch((caught: unknown) => {
        toast.push({
          message: describeFailure(caught),
          tone: 'ember',
        });
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return { letGo, busy, takeBack };
}

/** The list itself, standing where a box would */
export default function ReleasedList(props: { released: Released }): JSX.Element {
  return (
    <section class="flex flex-col gap-3">
      <div class="flex flex-col gap-0.5">
        <h3 class="m-0 text-2xl font-black">{m.catch_let_go_title()}</h3>
        <Meta>{m.catch_let_go_note()}</Meta>
      </div>
      <List>
        <For each={props.released.letGo()} fallback={<Meta>{m.catch_let_go_none()}</Meta>}>
          {(released) => {
            const name = getCatchName(released);

            return (
              <ListRow class="flex items-center justify-between gap-2">
                <span class="min-w-0 truncate font-bold">
                  {name} <span class="text-muted">{m.catch_level({ level: released.level })}</span>
                </span>
                <Button
                  class="shrink-0"
                  disabled={props.released.busy()}
                  onClick={() => {
                    props.released.takeBack(released.id, name);
                  }}
                >
                  {m.catch_take_back({ candy: released.candy })}
                </Button>
              </ListRow>
            );
          }}
        </For>
      </List>
    </section>
  );
}
