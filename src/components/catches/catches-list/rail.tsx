import { For, type JSX, Show, createMemo, createSignal } from 'solid-js';
import { BOX_LIMIT } from '../../../auth/box-record';
import { SearchIcon } from '../../icons';
import { Meta } from '../../styled';
import BoxForm from './box-form';

/**
 * The boxes down the side: Default first, then the player's own in
 * their order, each with how many it holds. It is the switcher, and
 * while a pokemon is being dragged every box in it is somewhere to
 * drop it.
 *
 * On a phone it is a row of chips across the top instead, scrolled
 * sideways, since a column beside the box leaves the box no room.
 */

/** One box as the rail lists it */
export interface RailBox {
  /** Its id, or null for Default */
  id: string | null;
  name: string;
  tone: string;
  count: number;
}

export interface BoxRailProps {
  boxes: RailBox[];
  /** The box showing, or undefined while every box is */
  current: string | null | undefined;
  onChoose: (box: string | null) => void;
  /** Whether a pokemon is being dragged, so every box lights as a drop */
  dragging: boolean;
  onDrop: (box: string | null) => void;
  /** Whether the new box form is open */
  making: boolean;
  busy: boolean;
  onMake: (name: string, colour: number) => void;
  onCancelMake: () => void;
}

export default function BoxRail(props: BoxRailProps): JSX.Element {
  const [find, setFind] = createSignal('');
  /** Which box the dragged pokemon is over, lit as the drop */
  const [over, setOver] = createSignal<string | null | undefined>(undefined);

  const shown = createMemo<RailBox[]>(() => {
    const wanted = find().trim().toLowerCase();
    const kept: RailBox[] = [];

    for (const box of props.boxes) {
      if (wanted === '' || box.name.toLowerCase().includes(wanted)) {
        kept.push(box);
      }
    }
    return kept;
  });

  /** Boxes the player made, which is what the limit counts */
  const made = (): number => props.boxes.length - 1;

  const look = (box: RailBox): string => {
    if (props.dragging && over() === box.id) {
      return 'border-dashed border-leaf bg-leaf-soft';
    }
    if (props.current === box.id) {
      return 'border-tide bg-tide-soft shadow-pop-sm';
    }
    return props.dragging ? 'border-dashed border-line' : 'border-transparent hover:bg-line-soft';
  };

  return (
    <nav
      aria-label="Boxes"
      class="flex shrink-0 gap-1.5 overflow-x-auto pb-1 sm:w-56 sm:flex-col sm:overflow-x-visible
        sm:pb-0"
    >
      {/* Above Default, so a long list is found by name rather than scrolled */}
      <label
        class="mb-1 hidden items-center gap-1.5 rounded-xl border-2 border-line bg-paper px-2.5
          py-1 sm:flex"
      >
        <SearchIcon class="size-4 shrink-0 text-muted" aria-hidden="true" />
        <span class="sr-only">Find a box</span>
        <input
          type="text"
          placeholder="Find a box"
          value={find()}
          onInput={(event) => {
            setFind(event.currentTarget.value);
          }}
          class="min-w-0 grow border-0 bg-transparent text-sm font-bold outline-none"
        />
      </label>

      <For each={shown()}>
        {(box) => (
          <button
            type="button"
            aria-current={props.current === box.id ? 'page' : undefined}
            class={`flex shrink-0 cursor-pointer items-center justify-between gap-2 rounded-xl
              border-2 px-3 py-1.5 text-left text-sm font-bold text-ink transition-colors
              sm:shrink ${look(box)}`}
            onClick={() => {
              props.onChoose(box.id);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setOver(box.id);
            }}
            onDragLeave={() => {
              setOver((at) => (at === box.id ? undefined : at));
            }}
            onDrop={(event) => {
              event.preventDefault();
              setOver(undefined);
              props.onDrop(box.id);
            }}
          >
            <span class="flex min-w-0 items-center gap-2">
              <span class="size-3 shrink-0 rounded-sm" style={{ background: box.tone }} />
              <span class="truncate">{box.name}</span>
            </span>
            <span class="text-xs font-black text-muted tabular-nums">{box.count}</span>
          </button>
        )}
      </For>

      <Show when={props.making}>
        <div class="w-64 shrink-0 sm:w-auto">
          <BoxForm
            verb="Make it"
            busy={props.busy}
            onSubmit={props.onMake}
            onCancel={props.onCancelMake}
          />
        </div>
      </Show>

      <Meta class="hidden px-3 sm:block">
        {made()} of {BOX_LIMIT} boxes made
      </Meta>
    </nav>
  );
}
