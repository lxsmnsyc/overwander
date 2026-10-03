import { type Accessor, type JSX, Show, children, createMemo, createSignal } from 'solid-js';
import { type CaughtPokemon, findDuplicates } from '../../auth/caught';
import matchesCatch, { CATCH_VOCABULARY, orderCatches } from '../../auth/catch-search';
import CatchBox, { type BoxEntry, type BoxGap, type BoxSquare, boxSizeOf, isGap } from './CatchBox';
import settings from '../app/settings';
import { Meta, Note, Row, Search, createPager } from '../styled';

/**
 * A box of squares with its furniture — the search over it, the pages
 * under it, and what to say when it is empty. It is `ItemGrid`, for
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
  onOpen?: (id: string) => void;
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

  // A box the player has set eight wide holds forty, so the page has
  // to be the box rather than a constant beside it
  const shelf = createPager(matched, () => boxSizeOf(settings().boxColumns), 'Box');

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
      </Show>

      <Show
        when={showing()}
        fallback={
          <Note>
            {query().length === 0
              ? (props.empty ?? 'Nothing here yet.')
              : (props.noMatch ?? 'None of them match that.')}
          </Note>
        }
      >
        {/* Above the box: five rows of squares fill a laptop screen, and
            paging under them is paging a player has to scroll to */}
        {shelf.controls({ range: true })}
        <CatchBox
          entries={shelf.shown()}
          columns={settings().boxColumns}
          onOpen={props.onOpen}
          cardOnly={props.cardOnly}
          cell={props.cell}
          onDragStart={props.onDragStart}
          // Only while the gaps are drawn: a searched list is packed,
          // and a square in it is not the slot it stands in
          onDropOn={query().trim() === '' ? props.onDropOn : undefined}
        />
      </Show>
    </div>
  );
}
