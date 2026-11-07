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
import { ClockIcon } from '../../icons';
import AnimatedSprite from '../../sprites/AnimatedSprite';
import { Button, LIST_PAGE, Note, createPager, useToast } from '../../styled';
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

/** The list itself, standing where a box would, a page at a time */
export default function ReleasedList(props: { released: Released }): JSX.Element {
  // A bulk release can let thirty go at once, so the list pages
  const paged = createPager(() => props.released.letGo(), LIST_PAGE);

  return (
    <section class="flex flex-col gap-3">
      <div class="flex min-h-10 flex-wrap items-center gap-x-2.5 gap-y-1">
        <ClockIcon class="size-[18px] shrink-0 text-muted" aria-hidden="true" />
        <h3 class="m-0 font-display text-xl leading-tight font-semibold">
          {m.catch_let_go_title()}
        </h3>
        <span class="min-w-0 text-[13px] text-muted">{m.catch_let_go_note()}</span>
      </div>
      <Show
        when={props.released.letGo().length > 0}
        fallback={<Note>{m.catch_let_go_none()}</Note>}
      >
        <ul class="m-0 grid list-none gap-1.5 p-0 sm:grid-cols-2">
          <For each={paged.shown()}>
            {(released) => {
              const name = getCatchName(released);

              return (
                <li
                  class="motion-crossfade flex items-center gap-2.5 rounded-button border-2
                    border-line bg-paper py-1.5 pr-2 pl-1.5
                    animate-[rise-in_var(--motion-base)_var(--ease-settle)_backwards]"
                >
                  <span class="relative size-10 shrink-0">
                    <AnimatedSprite
                      species={released.species}
                      shiny={released.shiny}
                      direction="DownLeft"
                      still
                      fill
                    />
                  </span>
                  <span class="flex min-w-0 grow flex-col">
                    <span class="truncate font-display text-base leading-tight font-semibold">
                      {name}
                    </span>
                    <span class="font-display text-xs text-muted">
                      {m.catch_level({ level: released.level })}
                    </span>
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
                </li>
              );
            }}
          </For>
        </ul>
        {paged.controls()}
      </Show>
    </section>
  );
}
