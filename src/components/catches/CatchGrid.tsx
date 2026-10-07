import { type Accessor, type JSX, Show, children, createMemo, createSignal } from 'solid-js';
import { type CaughtPokemon, findDuplicates } from '../../auth/caught';
import matchesCatch, { CATCH_VOCABULARY, orderCatches } from '../../auth/catch-search';
import CatchBox, {
  type BoxEntry,
  type BoxGap,
  type BoxSquare,
  type BoxView,
  type SquarePress,
  isGap,
} from './CatchBox';
import settings from '../app/settings';
import { Meta, Note, Row, Search } from '../styled';

/**
 * A box of squares with its furniture — the search over it, where in
 * the box the player is, and what to say when it is empty. It is `ItemGrid`, for
 * catches: `CatchBox` stays the dumb grid, and every screen that shows
 * pokemon as squares wraps it in this instead of hand-rolling the same
 * search and pager beside it.
 */
export interface CatchGridEntry {
  /** What the square draws */
  square: BoxEntry;
  /** What the search reads */
  caught: CaughtPokemon;
}

export interface CatchGridProps {
  /**
   * The squares, in order. Gaps are kept only while nothing is
   * searched for: a search lists what it found, packed
   */
  entries: (CatchGridEntry | BoxGap)[];
  /**
   * A caller with a search of its own draws none here — the auction
   * board narrows both of its trays with one box
   */
  bare?: boolean;
  cardOnly?: boolean;
  onOpen?: (id: string, press: SquarePress) => void;
  /** A finger held on a pokemon's square, passed to the box */
  onHold?: (id: string) => void;
  /** Whether empty squares say which slot they are, passed to the box */
  numbered?: boolean;
  /** Whether the box takes the whole width, passed to the box */
  fill?: boolean;
  /**
   * How the squares in sight are said, over a box long enough to
   * scroll. One box scrolled rather than paged, so a pokemon can be
   * carried from its first row to its last
   */
  say?: (view: BoxView) => string;
  /** Changed to send the box back to its first row, passed to the box with the search */
  rewind?: string;
  /** Putting the picked ones in an empty square, passed to the box */
  onPlace?: (slot: number) => void;
  placeLabel?: (slot: number) => string;
  /** A line under the search about what it found */
  results?: JSX.Element;
  /**
   * What stands over a box with nothing in it yet but its squares: a
   * box the player made is drawn empty, slots and all, with this on
   * top saying how to fill it
   */
  emptyCard?: JSX.Element;
  cell?: (entry: Accessor<BoxEntry>) => JSX.Element;
  /** Said when there is nothing at all, before any search */
  empty?: string;
  /** Said when the search matches none of them */
  noMatch?: string;
  /**
   * The query, for a caller whose search does more than narrow this
   * grid: the picker's also decides which records are fetched. Pass
   * both `search` and `onSearch`, or neither
   */
  search?: string;
  onSearch?: (typed: string) => void;
  /**
   * What stands beside the search: the button that turns picking on,
   * and whatever else acts on the box as a whole.
   *
   * A function rather than the markup itself, since it is drawn from a
   * caller that rebuilds its own props as the box changes under it
   */
  aside?: () => JSX.Element;
  /** What stands before the search: which box it is searching */
  lead?: () => JSX.Element;
  /** What the search says it searches, while nothing is typed */
  placeholder?: string;
  /** A line under the search, about the box as a whole */
  note?: string;
  /** Picking a pokemon up to file it, passed to the box */
  onDragStart?: (id: string, event: DragEvent) => void;
  /** Something dropped on a square of a box that keeps gaps, by its slot */
  onDropOn?: (slot: number) => void;
}

export default function CatchGrid(props: CatchGridProps): JSX.Element {
  const [typed, setTyped] = createSignal('');
  const query = (): string => props.search ?? typed();

  /** Every pokemon the grid holds, gaps left out */
  const pokemon = createMemo<CatchGridEntry[]>(() => {
    const found: CatchGridEntry[] = [];

    for (const entry of props.entries) {
      if (!('gap' in entry)) {
        found.push(entry);
      }
    }
    return found;
  });

  /** Every species the grid holds more than one of, for `is:duplicate` */
  const duplicates = createMemo(() => {
    const box: CaughtPokemon[] = [];

    for (const entry of pokemon()) {
      box.push(entry.caught);
    }
    return findDuplicates(box);
  });

  // The query is applied here even when the caller fetched against it,
  // because the store only answers half of a search
  const matched = createMemo<BoxSquare[]>(() => {
    // Nothing asked: the squares as the caller laid them out, gaps and all
    if (query().trim() === '') {
      const squares: BoxSquare[] = [];

      for (const entry of props.entries) {
        squares.push('gap' in entry ? entry : entry.square);
      }
      return squares;
    }

    const kept: CatchGridEntry[] = [];

    for (const entry of pokemon()) {
      if (matchesCatch(entry.caught, query(), { id: entry.square.id, duplicates: duplicates() })) {
        kept.push(entry);
      }
    }

    const squares: BoxSquare[] = [];

    for (const entry of orderCatches(kept, query(), (one) => one.caught)) {
      squares.push(entry.square);
    }
    return squares;
  });

  /** Whether any pokemon is showing, which an empty box of gaps is not */
  const showing = (): boolean => {
    for (const square of matched()) {
      if (!isGap(square)) {
        return true;
      }
    }
    return false;
  };

  const [view, setView] = createSignal<BoxView | null>(null);

  /** Where in the box the player is, while it scrolls */
  const where = (): string | null => {
    const spot = view();

    if (spot == null || !spot.scrolls) {
      return null;
    }
    return props.say?.(spot) ?? `${spot.from} to ${spot.to} of ${spot.total}`;
  };

  // Resolved once: a prop holding markup is a getter, and reading it
  // twice builds what it describes twice
  const aside = children(() => props.aside?.());
  const lead = children(() => props.lead?.());

  return (
    <div class="flex w-full flex-col gap-3">
      {/* Always drawn, however short the box is: a search that hides
          itself under a handful of pokemon takes its own box away when
          it narrows far enough */}
      <Show when={props.bare !== true}>
        {/* On a phone the controls beside it drop under the search rather than squeezing it */}
        <Row class="items-center gap-2 sm:flex-nowrap">
          {lead()}
          <div class="min-w-48 grow basis-full sm:basis-0">
            <Search
              vocabulary={CATCH_VOCABULARY}
              example="type:fire"
              placeholder={props.placeholder ?? 'Name, or type:fire is:shiny'}
              value={query()}
              onChange={(value) => {
                if (props.onSearch == null) {
                  setTyped(value);
                } else {
                  props.onSearch(value);
                }
              }}
            />
          </div>
          {/* Whatever the caller keeps beside the search: the button
              that turns picking on, most of the time. It belongs to the
              box rather than to the panel around it, since what it
              changes is what a square does */}
          {aside()}
        </Row>
        <Show when={props.note}>{(note) => <Meta>{note()}</Meta>}</Show>
        {props.results}
      </Show>

      <Show
        when={showing() || (props.emptyCard != null && query().trim() === '')}
        fallback={
          <Note>
            {query().length === 0
              ? (props.empty ?? 'Nothing here yet.')
              : (props.noMatch ?? 'None of them match that.')}
          </Note>
        }
      >
        {/* Above the box: five rows of squares fill a laptop screen,
            and a line under them is a line a player has to scroll to */}
        <Show when={where()}>
          {(said) => <Meta class="font-extrabold tabular-nums">{said()}</Meta>}
        </Show>
        <div class="relative">
          <CatchBox
            entries={matched()}
            scroll
            rewind={`${props.rewind ?? ''}|${query()}`}
            onView={(spot) => {
              setView(spot);
            }}
            columns={settings().boxColumns}
            onOpen={props.onOpen}
            onHold={props.onHold}
            numbered={props.numbered}
            fill={props.fill}
            cardOnly={props.cardOnly}
            cell={props.cell}
            onDragStart={props.onDragStart}
            // Only while the gaps are drawn: a searched list is packed,
            // and a square in it is not the slot it stands in
            onDropOn={query().trim() === '' ? props.onDropOn : undefined}
            onPlace={query().trim() === '' ? props.onPlace : undefined}
            placeLabel={props.placeLabel}
          />
          <Show when={!showing() && props.emptyCard}>
            {(card) => (
              <div class="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
                <div
                  class="pointer-events-auto flex max-w-sm flex-col gap-1.5 rounded-2xl border-2
                  border-line bg-paper px-6 py-5 text-center shadow-pop"
                >
                  {card()}
                </div>
              </div>
            )}
          </Show>
        </div>
      </Show>
    </div>
  );
}
