import type { JSX } from '@solidjs/web';
import { type Accessor, Loading, Show, createMemo } from 'solid-js';
import { type CaughtPokemon, getCaughtBatched } from '../../auth/caught';
import { NATURE_NAMES } from '../../data/ids/text';
import { isEgg } from '../../model/egg';
import { CatchFace } from '../auctions/LotFace';
import { GENDER_LABELS, describeCatch } from '../catches/catch-summary';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * One side of a trade's pick: the pokemon in a 44px square, its name
 * over its gender and nature, and what the side does with it (Pick,
 * Change) at the right. Empty, it is a dashed box that says so.
 */
export interface PickBoxProps {
  /** The catch picked, or null while nothing is */
  id: string | null;
  /** What the dashed box says while nothing is picked */
  empty: string;
  /** The line under the name where the record has none, such as who's box it is */
  note?: string;
  children?: JSX.Element;
}

/** The words beside the picture, read one component down under a `Loading` */
function PickedWords(props: {
  caught: Accessor<CaughtPokemon | null>;
  note?: string;
}): JSX.Element {
  return (
    <div class="flex min-w-0 grow flex-col">
      <span class="truncate text-sm font-extrabold">
        <Show when={props.caught()} fallback={m.trade_a_pokemon()}>
          {(loaded) => describeCatch(loaded())}
        </Show>
      </span>
      <span class="truncate text-xs text-muted">
        <Show when={props.caught()}>
          {(loaded) => (
            <Show when={!isEgg(loaded())} fallback={props.note}>
              {GENDER_LABELS[loaded().gender]()} · {NATURE_NAMES[loaded().nature]}
              <Show when={props.note}>{` · ${props.note ?? ''}`}</Show>
            </Show>
          )}
        </Show>
      </span>
    </div>
  );
}

function PickedLines(props: { id: string; note?: string }): JSX.Element {
  const caught = createMemo(async () => getCaughtBatched(props.id));

  return (
    <>
      <span
        class="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-line-soft/60"
        aria-hidden="true"
      >
        <Loading>
          <CatchFace catchId={props.id} />
        </Loading>
      </span>
      <Loading fallback={<span class="grow text-sm">{m.trade_a_pokemon()}</span>}>
        <PickedWords caught={caught} note={props.note} />
      </Loading>
    </>
  );
}

export default function PickBox(props: PickBoxProps): JSX.Element {
  return (
    <div
      class={`flex min-h-[76px] items-center gap-3 rounded-[14px] border-2 bg-paper p-2.5 ${
        props.id == null ? 'border-dashed border-line' : 'border-line'
      }`}
    >
      <Show
        when={props.id}
        fallback={<span class="grow text-center text-sm font-bold text-muted">{props.empty}</span>}
      >
        {(id) => <PickedLines id={id()} note={props.note} />}
      </Show>
      {props.children}
    </div>
  );
}
