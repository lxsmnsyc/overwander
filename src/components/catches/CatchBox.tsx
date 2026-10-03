import { type Accessor, Index, type JSX, Show, createSignal } from 'solid-js';
import type { AuraKind } from '../../canvas/auras';
import { Species } from '../../data/ids/species';
import { LockIcon, MoonIcon, SparklesIcon, StarIcon, SunIcon } from '../icons';
import createLongPress, { type LongPress } from '../styled/long-press';
import AnimatedSprite from '../sprites/AnimatedSprite';

/**
 * A box of pokemon, drawn the way the games draw one.
 *
 * A list of names is a list: it says what somebody has and nothing about
 * what they have. A box says it at a glance — thirty of them standing in
 * their squares, the shiny one obvious, the eggs obvious, and the one
 * being looked for found by looking rather than by reading.
 *
 * It is the bag's tray with pokemon in it: a square is a button, the
 * pokemon in it is a picture the browser animates, and everything a
 * square has to carry — a border, a mark, an egg's progress, a card
 * anchored to it — is a box of the document rather than something drawn
 * and then hit-tested.
 *
 * What it knows is what it is given. Which pokemon are in the box, what
 * order they are in and what happens when one is pressed are all the
 * caller's.
 */

/**
 * How big a box is. Six across and five down is thirty, which is the
 * number a mainline box holds and about as many as can be told apart on
 * a screen at once
 */
export const BOX_COLUMNS = 6;
export const BOX_ROWS = 5;
export const BOX_SIZE = BOX_COLUMNS * BOX_ROWS;

/**
 * The widths a player may set the box to. Five and eight are the same
 * five rows drawn narrower or wider, so a box stays one screenful
 * either way
 */
export type BoxWidth = 5 | 6 | 8;

/** How many a box of a given width holds, which is what a page of them is */
export function boxSizeOf(columns: BoxWidth): number {
  return columns * BOX_ROWS;
}

/**
 * How fast an egg's idle plays, by how far along it is. A fresh egg
 * barely stirs and one about to open is shaking: it is the only thing an
 * egg has to say, so it says it with the only thing it has
 */
const EGG_SPEED = [0.6, 2.4] as const;

/**
 * The squares, as something to iterate: what stands in each is read off
 * the entries by index. Kept per width rather than rebuilt, so the
 * `Index` above it is handed the same array every render
 */
const SQUARES = new Map<number, null[]>();

function squaresOf(count: number): null[] {
  const known = SQUARES.get(count);

  if (known != null) {
    return known;
  }

  const made: null[] = [];

  for (let square = 0; square < count; square++) {
    made.push(null);
  }

  SQUARES.set(count, made);
  return made;
}

/**
 * One square of the box: what stands in it, and what the caller needs
 * back when it is pressed
 */
export interface BoxEntry {
  id: string;
  species: Species;
  shiny: boolean;
  /**
   * An egg is drawn as an egg — what is inside is not the owner's to see
   * — with how far along its walk is
   */
  egg: boolean;
  progress: number;
  fainted: boolean;
  /**
   * The light it stands in, where it stands in one: a shadow's haze or
   * a purified one's glow. The square is too small for the aura the
   * portrait paints, so it says the same thing with a mark
   */
  aura?: AuraKind;
  /**
   * The two marks a player puts on one themselves: put away, and kept.
   * Left out by a caller drawing something that is nobody's yet — a
   * gift on the shelf, a lot on the block
   */
  locked?: boolean;
  favorite?: boolean;
  /**
   * Whether the caller has taken this one, or refuses to. A picked
   * square is lit and carries a tick; a refused one is greyed and
   * carries a cross
   */
  mark?: 'picked' | 'refused';
  /**
   * Why a refused square is refused, said on the square where its
   * level would be: "in a raid", "fainted", "locked"
   */
  reason?: string;
  /**
   * Its level and the share of its HP it has left, drawn as a badge
   * and a bar along the bottom. Left out for an egg, and by a caller
   * drawing something that is nobody's yet
   */
  level?: number;
  health?: number;
  /**
   * The box it is filed in, for a square shown among other boxes'
   * squares: a search across every box says where each one lives
   */
  place?: { name: string; tone: string };
  /**
   * Its square in a box that keeps gaps, so something dropped on it
   * knows where it landed
   */
  slot?: number;
  /**
   * What a screen reader is told about this square
   */
  label: string;
}

/**
 * An empty square of a box that keeps gaps, standing where a pokemon
 * could be filed
 */
export interface BoxGap {
  gap: number;
}

/** What a square of the box holds: a pokemon, or a gap kept for one */
export type BoxSquare = BoxEntry | BoxGap;

/** Whether a square is a gap rather than a pokemon */
export function isGap(square: BoxSquare): square is BoxGap {
  return 'gap' in square;
}

export interface CatchBoxProps {
  entries: BoxSquare[];
  /**
   * What a press on a square does. A card-only box has none — the
   * buttons are in the card that comes up over it
   */
  onOpen?: (id: string, press: SquarePress) => void;
  /**
   * A finger held on a pokemon's square. Given, the hold is the
   * caller's: the Boxes screen starts picking from it
   */
  onHold?: (id: string) => void;
  /**
   * Whether each empty square says which slot it is, for a box laid
   * out in squares: a dex box reads its gaps by number
   */
  numbered?: boolean;
  /**
   * Whether it is a team rather than a box: a plain row of squares with
   * no frame round it, each pokemon filling its square, and the level
   * left to the card. A team is read at a glance beside something
   * else, where the box's badges covered all of a small sprite
   */
  compact?: boolean;
  /**
   * Whether the box takes the whole width it is given, its squares
   * wider than they are tall, for the screen that is nothing but the
   * box: thirty squares that size fit a laptop without scrolling
   */
  fill?: boolean;
  /**
   * What stands over an occupied square: a hover card, usually. It is
   * laid over the square rather than beside the sprite, so whatever is
   * anchored to it covers the whole of it
   */
  cell?: (entry: Accessor<BoxEntry>) => JSX.Element;
  /**
   * Whether a square itself does nothing and whatever stands over it is
   * the only way to act. A press on a square is a press on a picture;
   * the card over it has the button that says what it does
   */
  cardOnly?: boolean;
  /**
   * How wide the box is, in squares. Six is the box the game keeps
   * pokemon in and what the player's own setting starts at; three is
   * for a line-up that is three long, where the full width would leave
   * half a box of nothing beside it
   */
  columns?: 3 | BoxWidth;
  /**
   * How many squares the box draws, for a box that is not the box: a
   * team preview is one row of six, not thirty squares five of which
   * mean anything
   */
  capacity?: number;
  /**
   * Picking a pokemon up to file it somewhere else. Given, every
   * pokemon's square can be dragged
   */
  onDragStart?: (id: string, event: DragEvent) => void;
  /**
   * Something dropped on a square of a box that keeps gaps, by the
   * square's slot. Given, gaps and slotted pokemon both take a drop
   */
  onDropOn?: (slot: number) => void;
}

/** What came with a press, beyond which square it was */
export interface SquarePress {
  /** Shift held, which picks the run from the last press to this one */
  shift: boolean;
}

/** A slot's number as a dex writes it */
function slotNumber(slot: number): string {
  return `#${String(slot + 1).padStart(3, '0')}`;
}

/**
 * How a square reads: taken, refused, hurt, or none of the three
 */
function toneOf(entry: BoxEntry): string {
  if (entry.mark === 'refused') {
    return 'border-line bg-paper opacity-45 grayscale';
  }
  if (entry.mark === 'picked') {
    return 'border-leaf bg-leaf-soft';
  }
  // One that cannot fight is washed rather than left out: it is still in
  // the box, and a player counting their six should see why it is not
  // one of them
  return entry.fainted ? 'border-line bg-ember-soft' : 'border-line bg-paper hover:bg-line-soft';
}

/** What a square needs to take a drop */
interface DropHandlers {
  onDragOver?: (event: DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (event: DragEvent) => void;
}

/** What a pokemon's square needs to be picked up */
interface DragHandlers {
  draggable?: boolean;
  onDragStart?: (event: DragEvent) => void;
  onDragEnd?: () => void;
}

/** The bar's colour, by how much is left, the way a battle draws it */
function healthTone(health: number): string {
  if (health > 0.5) {
    return 'bg-leaf';
  }
  return health > 0.2 ? 'bg-gold' : 'bg-ember';
}

/**
 * The frame of a square, whether or not it is one that can be pressed
 */
const SQUARE = 'relative w-full rounded-lg border-2 transition-colors';

/** The columns alone, for a box that takes the whole width */
const COLUMNS: Record<3 | BoxWidth, string> = {
  3: 'grid-cols-3',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  8: 'grid-cols-8',
};

/**
 * How wide the grid is laid out, and how wide it is allowed to grow.
 * The two travel together: a square is a share of the box, so the
 * width is what keeps a three-square box drawing squares the size of
 * a six-square one
 */
const SHAPE: Record<3 | BoxWidth, string> = {
  3: 'max-w-64 grid-cols-3',
  5: 'max-w-md grid-cols-5',
  6: 'max-w-lg grid-cols-6',
  8: 'max-w-2xl grid-cols-8',
};

export default function CatchBox(props: CatchBoxProps): JSX.Element {
  /** The shape of one square: square, or wide in a box that fills */
  const aspect = (): string => (props.fill === true ? 'aspect-[7/4]' : 'aspect-square');

  /**
   * What is standing in a square, if anything. The last box of a
   * collection is a part-full one, so most of these answers are
   * "nothing"
   */
  const entryAt = (index: number): BoxEntry | undefined => {
    const square = props.entries.at(index);

    return square == null || isGap(square) ? undefined : square;
  };

  /** The slot a square stands for, where the box keeps gaps */
  const slotAt = (index: number): number | undefined => {
    const square = props.entries.at(index);

    if (square == null) {
      return undefined;
    }
    return isGap(square) ? square.gap : square.slot;
  };

  /** Which square something is being dragged over, to light it as the drop */
  const [hovered, setHovered] = createSignal<number | null>(null);

  /**
   * What makes a square take a drop. Only a box that keeps gaps takes
   * one: anywhere else the order is a sort, and a pokemon dropped into
   * a sorted list would not stay where it was put
   */
  const dropProps = (index: number): DropHandlers => {
    const slot = slotAt(index);
    const onDropOn = props.onDropOn;

    if (slot == null || onDropOn == null) {
      return {};
    }
    return {
      onDragOver: (event: DragEvent) => {
        event.preventDefault();
        setHovered(index);
      },
      onDragLeave: () => {
        setHovered((at) => (at === index ? null : at));
      },
      onDrop: (event: DragEvent) => {
        event.preventDefault();
        setHovered(null);
        onDropOn(slot);
      },
    };
  };

  /** The lit edge of the square under a drag */
  const lit = (index: number): string =>
    hovered() === index ? 'border-dashed !border-leaf !bg-leaf-soft' : '';

  /** Whatever the caller needs to start a drag from a pokemon's square */
  const dragProps = (entry: Accessor<BoxEntry>): DragHandlers => {
    const onDragStart = props.onDragStart;

    if (onDragStart == null) {
      return {};
    }
    return {
      draggable: true,
      onDragStart: (event: DragEvent) => {
        event.dataTransfer?.setData('text/plain', entry().id);
        onDragStart(entry().id, event);
      },
      onDragEnd: () => {
        setHovered(null);
      },
    };
  };

  /** What makes a finger held on a pokemon's square the caller's */
  const holdProps = (entry: Accessor<BoxEntry>): Partial<LongPress> => {
    const onHold = props.onHold;

    if (onHold == null) {
      return {};
    }
    return createLongPress(() => {
      onHold(entry().id);
    });
  };

  /**
   * What is in a square: the pokemon, what its walk has come to, whether
   * the caller has taken it, and whatever the caller stands over it. The
   * square itself is what names the pokemon, so nothing in here is read
   * out
   */
  const inside = (entry: Accessor<BoxEntry>): JSX.Element => (
    <>
      {/* Square and inset by the same margin on every side, so the
          pokemon is fitted to a square whichever way round its cell is
          the longer */}
      <span
        class={`pointer-events-none absolute flex items-center justify-center ${
          props.compact === true ? 'inset-0.5' : 'inset-1.5'
        }`}
      >
        {/* Square, centred and as tall as the cell, so a wide cell does not stretch it */}
        <span class="absolute inset-y-0 left-1/2 aspect-square h-full max-w-full -translate-x-1/2">
          <AnimatedSprite
            species={entry().egg ? Species.Egg : entry().species}
            shiny={entry().shiny}
            direction="DownLeft"
            // An egg's clock runs at the speed of its own walk; everything
            // else breathes at the speed it was drawn at
            speed={
              entry().egg ? EGG_SPEED[0] + (EGG_SPEED[1] - EGG_SPEED[0]) * entry().progress : 1
            }
            fill
            shadow
          />
        </span>
      </span>

      {/* What is left of an egg's walk, under it. An egg has no species
          to recognise, so how far along it is is the only thing that
          tells one from another */}
      <Show when={entry().egg}>
        <span
          class="pointer-events-none absolute inset-x-2 bottom-1 h-0.75 overflow-hidden
            rounded-full bg-line-soft"
        >
          <span
            class="block h-full bg-leaf"
            style={{ width: `${Math.min(1, Math.max(0, entry().progress)) * 100}%` }}
          />
        </span>
      </Show>

      {/* Its level and its HP along the bottom, or, on a square the
          caller refuses, why: a player counting their party wants the
          reason more than the level */}
      <Show
        when={entry().reason}
        fallback={
          <>
            <Show when={props.compact !== true && entry().level}>
              {(level) => (
                <span
                  class="pointer-events-none absolute bottom-2 left-1 rounded-md bg-ink px-1
                    text-[10px] leading-[15px] font-black text-paper tabular-nums"
                >
                  {level()}
                </span>
              )}
            </Show>
            {/* Not keyed on the number: a fainted one has none left,
                and an empty bar is still the bar */}
            <Show when={entry().health !== undefined}>
              <span
                class={`pointer-events-none absolute overflow-hidden rounded-full bg-line-soft ${
                  props.compact === true
                    ? 'inset-x-1 bottom-0.5 h-0.5'
                    : 'inset-x-1.5 bottom-1 h-0.75'
                }`}
              >
                <span
                  class={`block h-full ${healthTone(entry().health ?? 0)}`}
                  style={{ width: `${Math.min(1, Math.max(0, entry().health ?? 0)) * 100}%` }}
                />
              </span>
            </Show>
          </>
        }
      >
        {(reason) => (
          <span
            class="pointer-events-none absolute inset-x-1 bottom-1 truncate rounded-md border
              border-ember bg-ember-soft text-center text-[10px] leading-[15px] font-black
              text-ember-dark"
          >
            {reason()}
          </span>
        )}
      </Show>

      {/* Which box it lives in, on a search across all of them */}
      <Show when={entry().place}>
        {(place) => (
          <span
            class="pointer-events-none absolute inset-x-0.5 top-0.5 z-10 flex items-center
              justify-center gap-1 truncate rounded-md bg-paper/85 px-0.5 text-[10px] leading-tight
              font-black text-ink"
          >
            <span class="size-2 shrink-0 rounded-sm" style={{ background: place().tone }} />
            <span class="truncate">{place().name}</span>
          </span>
        )}
      </Show>

      {/* What the player has said about it, in the corner away from
          everything the game says. Both are quiet marks: neither
          changes what the square does, and both are worth seeing
          before pressing something irreversible */}
      <span class="pointer-events-none absolute top-0.5 left-0.5 flex flex-col items-start gap-0.5">
        <Show when={entry().locked === true}>
          <LockIcon aria-hidden="true" class="size-3.5 text-tide" />
        </Show>
        <Show when={entry().favorite === true}>
          <StarIcon aria-hidden="true" class="size-3.5 text-gold" />
        </Show>
      </span>

      {/* A shiny says so on the square as well as in the sprite: the
          recolour is the whole of the difference, and two of a species
          a player has never seen side by side are not obviously one
          rare and one not. The line the square is named by already
          carries the mark, so this is for the eye only */}
      <span class="pointer-events-none absolute top-0.5 right-0.5 flex flex-col items-end gap-0.5">
        <Show when={entry().shiny}>
          <SparklesIcon aria-hidden="true" class="size-3.5 text-gold" />
        </Show>
        {/* And what it stands in, which the square cannot paint: a
            shadow is worth knowing before it is fielded, and a
            purified one is worth knowing it was put right */}
        <Show when={entry().aura === 'shadow'}>
          <MoonIcon aria-hidden="true" class="size-3.5 text-arcane" />
        </Show>
        <Show when={entry().aura === 'purified'}>
          <SunIcon aria-hidden="true" class="size-3.5 text-gold" />
        </Show>
      </span>

      {/* Whether the caller has it, in the corner the bag puts its
          counts in */}
      <Show when={entry().reason == null && entry().mark} keyed>
        {(mark) => (
          <span
            class={`pointer-events-none absolute right-0.5 bottom-0.5 rounded-full border bg-paper
              px-1 text-[10px] leading-tight font-bold ${
                mark === 'picked' ? 'border-leaf text-leaf-dark' : 'border-ember text-ember-dark'
              }`}
          >
            {mark === 'picked' ? '✓' : '✕'}
          </span>
        )}
      </Show>

      <Show when={props.cell}>
        {(over) => <span class="absolute inset-0 block">{over()(entry)}</span>}
      </Show>
    </>
  );

  /**
   * How wide a full box is here. A three-wide line-up is always given a
   * capacity, so it never falls through to this
   */
  const width = (): BoxWidth =>
    props.columns == null || props.columns === 3 ? BOX_COLUMNS : props.columns;

  const squares = (): null[] => squaresOf(props.capacity ?? boxSizeOf(width()));

  const filled = (): number => {
    let count = 0;

    for (const square of props.entries) {
      if (!isGap(square)) {
        count += 1;
      }
    }
    return count;
  };

  return (
    // Narrower than the panel it sits in, with air around it: a box
    // stretched across a wide dialog is thirty large squares to sweep
    // the eye over rather than one thing to look at
    <div
      role="group"
      aria-label={`Box of pokemon, ${filled()} of ${squares().length} squares filled.`}
      class={`grid w-full ${
        props.compact === true
          ? `gap-1 ${COLUMNS[props.columns ?? 6]}`
          : `mx-auto my-2 gap-1.5 rounded-xl border-4 border-tide bg-parchment p-1.5 shadow-pop ${
              props.fill === true ? COLUMNS[props.columns ?? 6] : SHAPE[props.columns ?? 6]
            }`
      }`}
    >
      <Index each={squares()}>
        {(_, index) => (
          <Show
            when={entryAt(index)}
            fallback={
              // The rest of the box, drawn empty rather than left out: a
              // half-built grid reads as a broken one
              <span
                aria-hidden="true"
                class={`flex ${aspect()} w-full flex-col items-center justify-center rounded-lg
                  border-2 bg-paper/40 text-[10px] font-black text-muted ${
                    props.numbered === true ? 'border-dashed border-line' : 'border-line-soft'
                  } ${lit(index)}`}
                {...dropProps(index)}
              >
                <Show when={hovered() === index}>
                  <span class="text-leaf-dark">Drop here</span>
                </Show>
                <Show
                  when={hovered() !== index && props.numbered === true && slotAt(index) != null}
                >
                  {slotNumber(slotAt(index) ?? index)}
                </Show>
              </span>
            }
          >
            {(entry) => (
              // A square that acts is a button. One whose card holds the
              // only button is not: a press on it would do nothing, and
              // a keyboard offered thirty stops that lead nowhere has to
              // walk past all of them to reach the card
              <Show
                when={props.cardOnly !== true}
                fallback={
                  <span
                    role="img"
                    aria-label={entry().label}
                    class={`${SQUARE} ${aspect()} ${toneOf(entry())} ${lit(index)}`}
                    {...dropProps(index)}
                  >
                    {inside(entry)}
                  </span>
                }
              >
                <button
                  type="button"
                  aria-label={entry().label}
                  aria-pressed={entry().mark === 'picked'}
                  class={`${SQUARE} ${aspect()} cursor-pointer ${toneOf(entry())} ${lit(index)}`}
                  {...dragProps(entry)}
                  {...dropProps(index)}
                  onClick={(event) => {
                    // The hover card is portaled out of this button but
                    // its clicks still bubble here through the component
                    // tree; only a press on the square itself counts,
                    // or pressing Add on the card would also toggle the
                    // square straight back off
                    if (!event.currentTarget.contains(event.target)) {
                      return;
                    }
                    props.onOpen?.(entry().id, { shift: event.shiftKey });
                  }}
                  {...holdProps(entry)}
                >
                  {inside(entry)}
                </button>
              </Show>
            )}
          </Show>
        )}
      </Index>
    </div>
  );
}
