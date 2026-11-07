import {
  type Accessor,
  Index,
  type JSX,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
} from 'solid-js';
import createLongPress, { type LongPress } from '../styled/long-press';
import SquareFace, { type BoxEntry } from './box-square';
import { m } from '../../i18n/paraglide/messages.js';

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

export type { BoxEntry };

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
  /**
   * Putting the picked pokemon in an empty square, by its slot. Given,
   * every gap is a button: a finger cannot drag, and dragging is the
   * only other way to say where in a box something goes
   */
  onPlace?: (slot: number) => void;
  /** What a gap that places says to a screen reader */
  placeLabel?: (slot: number) => string;
  /**
   * Whether a box longer than five rows scrolls inside its frame
   * rather than standing as tall as it is. Only the rows in sight are
   * drawn, so a box of a thousand costs what a box of thirty does
   */
  scroll?: boolean;
  /**
   * Changed to send a scrolling box back to its first row: another box
   * opened, or a new search. A key rather than anything richer, so it
   * is only "changed" when its value is
   */
  rewind?: string;
  /** Which squares a scrolling box has in sight, as it scrolls */
  onView?: (spot: BoxView) => void;
}

/** Which squares are in sight, counted from 1 */
export interface BoxView {
  from: number;
  to: number;
  total: number;
  /** Whether there is more than fits, so the box scrolls at all */
  scrolls: boolean;
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
function pickSquareTone(entry: BoxEntry): string {
  if (entry.mark === 'refused') {
    return 'border-line bg-paper opacity-45 grayscale';
  }
  if (entry.mark === 'picked') {
    return 'border-leaf bg-leaf-soft';
  }
  // One that cannot fight is washed rather than left out: it is still in
  // the box, and a player counting their six should see why it is not
  // one of them
  return entry.fainted ? 'border-line bg-ember-soft' : 'border-line bg-paper';
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

/**
 * The frame of a square, whether or not it is one that can be pressed
 */
const SQUARE =
  'relative w-full rounded-button border-2' +
  ' transition-[translate,border-color,background-color] duration-(--motion-quick) ease-spring';

/** A square that can be pressed lifts under the pointer and edges in tide */
const PRESSABLE = 'cursor-pointer hover:-translate-y-0.5 hover:border-tide';

/** The columns alone, for a box that takes the whole width */
const COLUMNS: Record<3 | BoxWidth, string> = {
  3: 'grid-cols-3',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  8: 'grid-cols-8',
};

/**
 * How wide the box is allowed to grow. A square is a share of the box,
 * so the width is what keeps a three-square box drawing squares the
 * size of a six-square one
 */
const WIDTH: Record<3 | BoxWidth, string> = {
  3: 'max-w-64',
  5: 'max-w-md',
  6: 'max-w-lg',
  8: 'max-w-2xl',
};

/**
 * The frame's padding and border and the gap between squares, in
 * pixels, matching `p-2`, `border-4` and `gap-1.5`: a scrolling box
 * works out how tall a row is from them
 */
const PAD = 8;
const BORDER = 4;
const GAP = 6;

/** Rows drawn past each edge, so a quick flick never shows a blank one */
const OVERSCAN = 2;

/**
 * How near the top or bottom a drag has to be to scroll the box, and
 * how far it scrolls each time the browser says the drag moved, at the
 * very edge
 */
const EDGE = 56;
const EDGE_STEP = 18;

export default function CatchBox(props: CatchBoxProps): JSX.Element {
  /** The shape of one square: square, or wide in a box that fills */
  // Square on a phone, where a wide square leaves the sprite too small
  // to tell under its badges
  const aspect = (): string =>
    props.fill === true ? 'aspect-square sm:aspect-[7/4]' : 'aspect-square';

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
  const dropProps = (index: Accessor<number>): DropHandlers => {
    // Asked as the drag happens rather than when the square is drawn:
    // a scrolling box hands the same square a new slot as it scrolls
    const slot = (): number | undefined => (props.onDropOn == null ? undefined : slotAt(index()));

    return {
      onDragOver: (event: DragEvent) => {
        if (slot() == null) {
          return;
        }
        event.preventDefault();
        setHovered(index());
      },
      onDragLeave: () => {
        setHovered((at) => (at === index() ? null : at));
      },
      onDrop: (event: DragEvent) => {
        const landed = slot();

        if (landed == null) {
          return;
        }
        event.preventDefault();
        setHovered(null);
        props.onDropOn?.(landed);
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

  /** What is in a pokemon's square */
  const inside = (entry: Accessor<BoxEntry>): JSX.Element => (
    <SquareFace entry={entry} compact={props.compact === true} cell={props.cell} />
  );

  /**
   * How wide a full box is here. A three-wide line-up is always given a
   * capacity, so it never falls through to this
   */
  const width = (): BoxWidth =>
    props.columns == null || props.columns === 3 ? BOX_COLUMNS : props.columns;

  const columns = (): 3 | BoxWidth => props.columns ?? BOX_COLUMNS;

  /**
   * How many squares are drawn: what the caller asked for, or at least
   * a box's worth and then whole rows for however many it was given
   */
  const count = (): number =>
    props.capacity ??
    Math.max(boxSizeOf(width()), Math.ceil(props.entries.length / columns()) * columns());

  const rows = (): number => Math.ceil(count() / columns());

  /** Whether the box scrolls inside its frame rather than standing full height */
  const scrolls = (): boolean =>
    props.scroll === true && props.compact !== true && rows() > BOX_ROWS;

  const [frame, setFrame] = createSignal<HTMLElement>();
  /** The frame's width inside its border, once it has been laid out */
  const [across, setAcross] = createSignal(0);
  /** Whether the screen is wide enough for a filling box's wide squares */
  const [wide, setWide] = createSignal(false);
  const [top, setTop] = createSignal(0);

  onMount(() => {
    const element = frame();

    if (element == null || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => {
      setAcross(element.clientWidth);
      setWide(globalThis.matchMedia('(min-width: 640px)').matches);
    });

    observer.observe(element);
    onCleanup(() => {
      observer.disconnect();
    });
  });

  // Compared by value: a caller rebuilding its props on every pick
  // asks for this again with the same answer, and that is no change
  const rewound = createMemo(() => props.rewind ?? '');

  createEffect(
    on(
      rewound,
      () => {
        const element = frame();

        if (element != null) {
          element.scrollTop = 0;
        }
        setTop(0);
      },
      { defer: true },
    ),
  );

  /** How tall one row is with the gap under it, or 0 before the box is laid out */
  const stride = (): number => {
    const inner = across() - 2 * PAD;

    if (inner <= 0) {
      return 0;
    }
    const square = (inner - (columns() - 1) * GAP) / columns();

    return square * (props.fill === true && wide() ? 4 / 7 : 1) + GAP;
  };

  /** The first row in sight, whole or not */
  const firstRow = (): number => (stride() === 0 ? 0 : Math.floor(top() / stride()));

  /**
   * The squares drawn, by index: the rows in sight and a couple either
   * side. Before the box is measured, its first box's worth
   */
  const windowed = createMemo<number[]>(() => {
    const first = Math.max(0, firstRow() - OVERSCAN);
    const last = Math.min(rows(), firstRow() + BOX_ROWS + 1 + OVERSCAN);
    const drawn: number[] = [];

    for (let index = first * columns(); index < Math.min(count(), last * columns()); index++) {
      drawn.push(index);
    }
    return drawn;
  });

  createEffect(() => {
    const start = Math.min(rows() - 1, Math.round(top() / Math.max(1, stride())));
    const from = scrolls() ? Math.max(0, start) * columns() : 0;

    // Counted against what was given, so the empty row a box ends on
    // is not counted as pokemon
    const total = props.entries.length;

    props.onView?.({
      from: Math.min(total, from + 1),
      to: Math.min(total, from + boxSizeOf(width())),
      total,
      scrolls: scrolls(),
    });
  });

  /**
   * A drag held near the top or bottom scrolls the box, so a pokemon
   * can be carried to a row out of sight. The browser says the drag
   * moved several times a second even while it is held still
   */
  const edge = (event: DragEvent & { currentTarget: HTMLElement }): void => {
    const box = event.currentTarget.getBoundingClientRect();
    const above = event.clientY - box.top;
    const below = box.bottom - event.clientY;

    if (above < EDGE) {
      event.currentTarget.scrollTop -= EDGE_STEP * (1 - Math.max(0, above) / EDGE);
    } else if (below < EDGE) {
      event.currentTarget.scrollTop += EDGE_STEP * (1 - Math.max(0, below) / EDGE);
    }
  };

  const filled = (): number => {
    let found = 0;

    for (const square of props.entries) {
      if (!isGap(square)) {
        found += 1;
      }
    }
    return found;
  };

  /** One square of the box, whichever index it is drawing now */
  const square = (index: Accessor<number>): JSX.Element => (
    <Show
      when={entryAt(index())}
      fallback={
        // The rest of the box, drawn empty rather than left out: a
        // half-built grid reads as a broken one
        <Show
          when={props.onPlace != null && slotAt(index()) != null}
          fallback={
            <span
              aria-hidden="true"
              class={`flex ${aspect()} w-full flex-col items-center justify-center rounded-button
                border-2 border-dashed font-display text-[11px] font-semibold text-muted ${
                  props.numbered === true ? 'border-line' : 'border-line-soft'
                } ${lit(index())}`}
              {...dropProps(index)}
            >
              <Show when={hovered() === index()}>
                <span class="text-leaf-dark">{m.catch_box_drop_here()}</span>
              </Show>
              <Show
                when={hovered() !== index() && props.numbered === true && slotAt(index()) != null}
              >
                {slotNumber(slotAt(index()) ?? index())}
              </Show>
            </span>
          }
        >
          {/* A gap the picked ones can be put in, said so on its face */}
          <button
            type="button"
            aria-label={
              props.placeLabel?.(slotAt(index()) ?? 0) ??
              m.catch_box_put_in_slot({ slot: (slotAt(index()) ?? 0) + 1 })
            }
            class={`flex ${aspect()} w-full cursor-pointer flex-col items-center justify-center
              rounded-button border-2 border-dashed border-leaf bg-leaf-soft/40 text-[11px]
              font-black text-leaf-dark transition-colors hover:bg-leaf-soft ${lit(index())}`}
            {...dropProps(index)}
            onClick={() => {
              const slot = slotAt(index());

              if (slot != null) {
                props.onPlace?.(slot);
              }
            }}
          >
            <span aria-hidden="true">{m.catch_box_put_here()}</span>
            <Show when={props.numbered === true}>
              <span aria-hidden="true" class="text-muted">
                {slotNumber(slotAt(index()) ?? 0)}
              </span>
            </Show>
          </button>
        </Show>
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
              class={`${SQUARE} ${aspect()} ${pickSquareTone(entry())} ${lit(index())}`}
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
            class={`${SQUARE} ${aspect()} ${PRESSABLE} ${pickSquareTone(entry())} ${lit(index())}`}
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
  );

  /** The frame round the squares, without the grid that lays them out */
  const framed = (): string =>
    props.compact === true
      ? 'w-full'
      : `mx-auto my-1 w-full rounded-card border-4 border-tide bg-parchment p-2 shadow-pop ${
          props.fill === true ? '' : WIDTH[columns()]
        }`;

  const grid = (): string =>
    `grid ${props.compact === true ? 'gap-1' : 'gap-1.5'} ${COLUMNS[columns()]}`;

  return (
    // Narrower than the panel it sits in, with air around it: a box
    // stretched across a wide dialog is thirty large squares to sweep
    // the eye over rather than one thing to look at
    <div
      ref={(element) => {
        setFrame(element);
      }}
      role="group"
      aria-label={m.catch_box_label({ filled: filled(), count: count() })}
      class={
        scrolls()
          ? `${framed()} overflow-y-auto overscroll-contain [scrollbar-gutter:stable]`
          : `${framed()} ${grid()}`
      }
      // Five rows tall, the size a box has always been, and the rest
      // scrolled to
      style={
        scrolls() && stride() > 0
          ? { height: `${BOX_ROWS * stride() - GAP + 2 * (PAD + BORDER)}px` }
          : undefined
      }
      onScroll={(event) => {
        setTop(event.currentTarget.scrollTop);
      }}
      onDragOver={(event) => {
        if (scrolls()) {
          edge(event);
        }
      }}
    >
      <Show
        when={scrolls()}
        fallback={<Index each={squaresOf(count())}>{(_, index) => square(() => index)}</Index>}
      >
        <div
          class="relative"
          style={stride() > 0 ? { height: `${rows() * stride() - GAP}px` } : undefined}
        >
          <div
            class={`${stride() > 0 ? 'absolute inset-x-0' : ''} ${grid()}`}
            style={
              stride() > 0
                ? { top: `${Math.max(0, firstRow() - OVERSCAN) * stride()}px` }
                : undefined
            }
          >
            {/* By position, so a square scrolled to is the same button
                given a new pokemon rather than a new button */}
            <Index each={windowed()}>{(index) => square(index)}</Index>
          </div>
        </div>
      </Show>
    </div>
  );
}
