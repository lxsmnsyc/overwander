import { For, type JSX, Show, createMemo, createSignal } from 'solid-js';
import { BOX_LIMIT } from '../../../auth/box-record';
import { ClockIcon, GripIcon, PlusIcon, SearchIcon } from '../../icons';
import { Meta } from '../../styled';
import BoxForm from './box-form';

/**
 * The boxes down the side: Default first, then the player's own in
 * their order, each with how many it holds. It is the switcher, and
 * while a pokemon is being dragged every box in it is somewhere to
 * drop it. The player's own boxes are dragged by their grip to put
 * them in another order.
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
  /** The box showing, or undefined while every box is or the let-go list is */
  current: string | null | undefined;
  onChoose: (box: string | null) => void;
  /** Whether a pokemon is being dragged, so every box lights as a drop */
  dragging: boolean;
  onDrop: (box: string | null) => void;
  /** The player's own boxes in a new order */
  onArrange: (order: string[]) => void;
  /** Whether the new box form is open */
  making: boolean;
  /** How many pokemon the new box will be made with, if any */
  makingWith: number;
  busy: boolean;
  onMake: (name: string, colour: number) => void;
  onCancelMake: () => void;
  /** Open the new box form, from the chip a phone has in place of the header's button */
  onStartMake: () => void;
  /** Whether each count is how many match a search across every box */
  counting: boolean;
  /** How many pokemon are picked, for the hint about dragging them */
  picked: number;
  /** How many were let go today and can still come back */
  letGo: number;
  /** Whether that list is the one showing */
  showingLetGo: boolean;
  onLetGo: () => void;
}

/** What a box being dragged to a new place carries, told apart from a pokemon */
const BOX_DRAG = 'application/x-overwander-box';

export default function BoxRail(props: BoxRailProps): JSX.Element {
  const [find, setFind] = createSignal('');
  /** Which box the dragged pokemon is over, lit as the drop */
  const [over, setOver] = createSignal<string | null | undefined>(undefined);
  /** Which of the player's boxes is being moved along the list */
  const [moving, setMoving] = createSignal<string | null>(null);

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

  /** The player's boxes with the one being moved put down before `before` */
  const reordered = (before: string): string[] => {
    const order: string[] = [];

    for (const box of props.boxes) {
      if (box.id == null || box.id === moving()) {
        continue;
      }
      if (box.id === before) {
        order.push(moving() ?? '');
      }
      order.push(box.id);
    }
    return order;
  };

  const look = (box: RailBox): string => {
    if ((props.dragging || moving() != null) && over() === box.id) {
      return 'border-dashed border-leaf bg-leaf-soft';
    }
    if (props.current === box.id) {
      return 'border-tide bg-tide-soft shadow-pop-sm';
    }
    return props.dragging ? 'border-dashed border-line' : 'border-transparent hover:bg-line-soft';
  };

  /** What the hint at the foot of the rail says */
  const hint = (): string | null => {
    if (props.counting) {
      return 'While searching all boxes, each count is how many match there.';
    }
    if (props.picked > 0) {
      return `Or drag the ${props.picked} onto a box.`;
    }
    return 'Drag a pokemon onto a box to file it.';
  };

  return (
    <nav
      aria-label="Boxes"
      class="flex shrink-0 gap-1.5 overflow-x-auto pb-1 sm:w-60 sm:flex-col sm:self-stretch
        sm:overflow-x-visible sm:rounded-2xl sm:bg-line-soft/60 sm:p-3"
    >
      {/* Above Default, so a long list is found by name rather than scrolled */}
      <label
        class="mb-1 hidden items-center gap-1.5 rounded-xl border-2 border-line bg-paper px-2.5
          py-1.5 sm:flex"
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
            class={`group flex shrink-0 cursor-pointer items-center justify-between gap-2
              rounded-full border-2 px-3 py-1.5 text-left text-sm font-extrabold text-ink
              transition-colors sm:min-h-11 sm:shrink sm:rounded-xl sm:pl-1.5 ${look(box)}`}
            // Only the player's own boxes move: Default is always first
            draggable={box.id != null}
            onDragStart={(event) => {
              if (box.id == null) {
                return;
              }
              event.dataTransfer?.setData(BOX_DRAG, box.id);
              setMoving(box.id);
            }}
            onDragEnd={() => {
              setMoving(null);
              setOver(undefined);
            }}
            onClick={() => {
              props.onChoose(box.id);
            }}
            onDragOver={(event) => {
              // A box is put down only among the player's own
              if (moving() != null && box.id == null) {
                return;
              }
              event.preventDefault();
              setOver(box.id);
            }}
            onDragLeave={() => {
              setOver((at) => (at === box.id ? undefined : at));
            }}
            onDrop={(event) => {
              event.preventDefault();
              setOver(undefined);
              const carried = moving();

              if (carried != null) {
                setMoving(null);
                if (box.id != null && box.id !== carried) {
                  props.onArrange(reordered(box.id));
                }
                return;
              }
              props.onDrop(box.id);
            }}
          >
            <span class="flex min-w-0 items-center gap-2">
              {/* The grip, on the boxes that can be moved, and its room kept on Default */}
              <span class="hidden w-4 shrink-0 text-line sm:block">
                <Show when={box.id != null}>
                  <GripIcon class="size-4 cursor-grab group-hover:text-muted" aria-hidden="true" />
                </Show>
              </span>
              <span class="size-3 shrink-0 rounded-[4px]" style={{ background: box.tone }} />
              <span class="truncate">{box.name}</span>
            </span>
            <span
              class={`shrink-0 rounded-full border-2 px-2 text-xs font-black tabular-nums ${
                props.counting && box.count > 0
                  ? 'border-line bg-tide-soft text-tide-dark'
                  : 'border-line-soft bg-paper text-muted'
              }`}
            >
              {box.count}
            </span>
          </button>
        )}
      </For>

      {/* On a phone the header has no room for New box, so it ends the chips */}
      <button
        type="button"
        aria-label="New box"
        class="flex shrink-0 cursor-pointer items-center justify-center rounded-full border-2
          border-dashed border-line bg-paper px-3 text-tide-dark sm:hidden"
        onClick={props.onStartMake}
      >
        <PlusIcon class="size-4" aria-hidden="true" />
      </button>

      <Show when={props.making}>
        <div class="flex w-64 shrink-0 flex-col gap-1 sm:w-auto">
          <BoxForm
            heading={props.makingWith > 0 ? `New box with these ${props.makingWith}` : 'New box'}
            verb="Make it"
            busy={props.busy}
            onSubmit={props.onMake}
            onCancel={props.onCancelMake}
          />
        </div>
      </Show>

      <div class="hidden grow sm:block" />

      <Show when={props.letGo > 0}>
        <button
          type="button"
          aria-current={props.showingLetGo ? 'page' : undefined}
          class={`flex shrink-0 cursor-pointer items-center justify-between gap-2 rounded-xl
            border-2 px-3 py-1.5 text-sm font-extrabold text-muted sm:min-h-11 ${
              props.showingLetGo
                ? 'border-tide bg-tide-soft text-ink'
                : 'border-transparent hover:bg-line-soft'
            }`}
          onClick={props.onLetGo}
        >
          <span class="flex items-center gap-2">
            <ClockIcon class="size-4" aria-hidden="true" />
            Let go today
          </span>
          <span class="tabular-nums">{props.letGo}</span>
        </button>
      </Show>

      <Show when={hint()}>
        {(said) => (
          <Meta class={`hidden px-3 sm:block ${props.picked > 0 ? 'text-leaf-dark' : ''}`}>
            {said()}
          </Meta>
        )}
      </Show>
      <Meta class="hidden px-3 sm:block">
        {made()} of {BOX_LIMIT} boxes used
      </Meta>
    </nav>
  );
}
