import { For, type JSX, Show, createMemo, createSignal } from 'solid-js';
import { BOX_LIMIT } from '../../../model/box-record';
import { ClockIcon, GripIcon, PlusIcon, SearchIcon } from '../../icons';
import { RAIL, RailCount, railRow } from '../../styled';
import BoxForm from './box-form';
import { m } from '../../../i18n/paraglide/messages.js';

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
  /**
   * How many squares the box spans, for the meter under a made box: the
   * whole rows it fills, and never less than one box's worth
   */
  size?: number;
  /** How many it holds whatever a search is counting, for that meter */
  filled?: number;
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

  /**
   * The player's boxes with `carried` put down where `onto` stands:
   * before it when carried up the list, after it when carried down, so
   * a box can reach the end. Handed the box rather than reading it from
   * the drag, which is over by the time this is asked
   */
  const reordered = (carried: string, onto: string): string[] => {
    const order: string[] = [];
    let passed = false;

    for (const box of props.boxes) {
      if (box.id == null) {
        continue;
      }
      if (box.id === carried) {
        passed = true;
        continue;
      }
      if (box.id === onto && !passed) {
        order.push(carried);
      }
      order.push(box.id);
      if (box.id === onto && passed) {
        order.push(carried);
      }
    }
    return order;
  };

  /** How a row is drawn: lit as a drop, current, or at rest */
  const look = (box: RailBox): string => {
    if ((props.dragging || moving() != null) && over() === box.id) {
      return `${railRow(false)} !border-dashed !border-leaf !bg-leaf-soft`;
    }
    if (props.current === box.id) {
      return railRow(true);
    }
    return props.dragging ? `${railRow(false)} md:!border-dashed md:!border-line` : railRow(false);
  };

  /** How full a made box is, as a share of its squares */
  const fill = (box: RailBox): number =>
    box.size == null || box.size <= 0 ? 0 : Math.min(1, (box.filled ?? box.count) / box.size);

  /** What the hint at the foot of the rail says */
  const hint = (): string | null => {
    if (props.counting) {
      return m.catch_rail_counting();
    }
    if (props.picked > 0) {
      return m.catch_rail_drag_picked({ count: props.picked });
    }
    return m.catch_rail_drag();
  };

  return (
    <nav aria-label={m.panel_boxes()} class={`${RAIL} md:w-[14.75rem]`}>
      {/* Above Default, so a long list is found by name rather than scrolled */}
      <label
        class="mb-1.5 hidden h-10 shrink-0 items-center gap-2 rounded-button border-2 border-line
          bg-paper px-2.5 transition-colors hover:border-tide md:flex"
      >
        <SearchIcon class="size-4 shrink-0 text-muted" aria-hidden="true" />
        <span class="sr-only">{m.catch_rail_find()}</span>
        <input
          type="text"
          placeholder={m.catch_rail_find()}
          value={find()}
          onInput={(event) => {
            setFind(event.currentTarget.value);
          }}
          class="min-w-0 grow border-0 bg-transparent text-sm outline-none"
        />
      </label>

      <For each={shown()}>
        {(box) => (
          <div class="flex shrink-0 flex-col md:shrink">
            <button
              type="button"
              aria-current={props.current === box.id ? 'page' : undefined}
              class={look(box)}
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
                    props.onArrange(reordered(carried, box.id));
                  }
                  return;
                }
                props.onDrop(box.id);
              }}
            >
              {/* The grip, on the boxes that can be moved, and its room kept on Default */}
              <span class="hidden w-3 shrink-0 text-line md:block">
                <Show when={box.id != null}>
                  <GripIcon
                    class="size-3.5 cursor-grab group-hover:text-muted"
                    aria-hidden="true"
                  />
                </Show>
              </span>
              <span class="size-3.5 shrink-0 rounded-[5px]" style={{ background: box.tone }} />
              <span class="min-w-0 truncate">{box.name}</span>
              <RailCount lit={props.counting && box.count > 0}>{box.count}</RailCount>
            </button>
            {/* How full a made box is, in its own colour. Default keeps
                no squares, so it has nothing to fill */}
            <Show when={box.id != null && box.size != null}>
              <span
                aria-hidden="true"
                class="mx-2.5 mt-0.5 mb-1.5 ml-[2.125rem] hidden h-1 overflow-hidden rounded-full
                  bg-line-soft md:block"
              >
                <span
                  class="block h-full rounded-full transition-[width] duration-(--motion-move)
                    ease-settle"
                  style={{ width: `${fill(box) * 100}%`, background: box.tone }}
                />
              </span>
            </Show>
          </div>
        )}
      </For>

      {/* On a phone the header has no room for New box, so it ends the chips */}
      <button
        type="button"
        aria-label={m.catch_box_new()}
        class="flex shrink-0 cursor-pointer items-center justify-center rounded-full border-2
          border-dashed border-line bg-paper px-3 text-tide-dark md:hidden"
        onClick={props.onStartMake}
      >
        <PlusIcon class="size-4" aria-hidden="true" />
      </button>

      <Show when={props.making}>
        <div class="flex w-64 shrink-0 flex-col gap-1 md:mt-1 md:w-auto">
          <BoxForm
            heading={
              props.makingWith > 0
                ? m.catch_rail_new_with({ count: props.makingWith })
                : m.catch_box_new()
            }
            verb={m.catch_box_make_it()}
            busy={props.busy}
            onSubmit={props.onMake}
            onCancel={props.onCancelMake}
          />
        </div>
      </Show>

      <Show when={props.letGo > 0}>
        <button
          type="button"
          aria-current={props.showingLetGo ? 'page' : undefined}
          class={`${railRow(props.showingLetGo)} ${props.showingLetGo ? '' : 'text-muted'} md:mt-1`}
          onClick={props.onLetGo}
        >
          <span class="hidden w-3 shrink-0 md:block" />
          <ClockIcon class="size-3.5 shrink-0" aria-hidden="true" />
          <span class="truncate">{m.catch_let_go_title()}</span>
          <RailCount>{props.letGo}</RailCount>
        </button>
      </Show>

      <div class="mt-auto hidden flex-col gap-1 px-1 pt-3 md:flex">
        <Show when={hint()}>
          {(said) => (
            <span class={`text-xs ${props.picked > 0 ? 'text-leaf-dark' : 'text-muted'}`}>
              {said()}
            </span>
          )}
        </Show>
        <span class="text-[10px] font-extrabold tracking-[0.12em] text-muted uppercase">
          {m.catch_rail_used({ count: made(), max: BOX_LIMIT })}
        </span>
      </div>
    </nav>
  );
}
