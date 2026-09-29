import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import {
  type ReleaseGrace,
  getCatchName,
  getReleaseGrace,
  takeBackCatch,
} from '../../../auth/caught';
import createClientSignal from '../../app/client-signal';
import { useGame } from '../../app/game-context';
import { answered } from '../../app/resource-reads';
import { Button, List, ListRow, useToast } from '../../styled';

/** What a refused take-back says, by why */
const REFUSED: Record<string, string> = {
  gone: 'That one has already gone for good.',
  'no-candy': 'The candy it paid has been spent, so it cannot come back.',
};

/**
 * What the player let go today, while it can still be taken back. It
 * is only drawn on a server that holds releases for a day, and only
 * while there is something to take back
 */
export default function ReleasedList(): JSX.Element {
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
  // Read with `answered`, since this body declares it: the list is
  // simply absent until it is known, rather than holding the box
  const letGo = (): ReleaseGrace['released'] => {
    const known = answered(grace);

    return known?.grace === true ? known.released : [];
  };

  const takeBack = (catchId: string, name: string): void => {
    setBusy(true);
    takeBackCatch(catchId)
      .then((outcome) => {
        if (outcome === 'done') {
          toast.push({ message: `${name} is back.`, tone: 'leaf' });
        } else {
          toast.push({ message: REFUSED[outcome], tone: 'ember' });
        }
        game.touchRecords();
      })
      .catch((caught: unknown) => {
        toast.push({
          message: caught instanceof Error ? caught.message : String(caught),
          tone: 'ember',
        });
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <Show when={letGo().length > 0}>
      <section class="flex flex-col gap-2">
        <h3 class="m-0 text-sm font-bold text-muted">Let go today, and can still come back</h3>
        <List>
          <For each={letGo()}>
            {(released) => {
              const name = getCatchName(released);

              return (
                <ListRow class="flex items-center justify-between gap-2">
                  <span class="min-w-0 truncate font-bold">
                    {name} <span class="text-muted">Lv. {released.level}</span>
                  </span>
                  <Button
                    class="shrink-0"
                    disabled={busy()}
                    onClick={() => {
                      takeBack(released.id, name);
                    }}
                  >
                    Take back for {released.candy} candy
                  </Button>
                </ListRow>
              );
            }}
          </For>
        </List>
      </section>
    </Show>
  );
}
