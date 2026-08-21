import { type Accessor, type JSX, Show, createMemo, createSignal } from 'solid-js';
import { type CaughtPokemon, findDuplicates } from '../../auth/caught';
import matchesCatch, { orderCatches } from '../../auth/catch-search';
import CatchBox, { BOX_SIZE, type BoxEntry } from './CatchBox';
import { Note, Row, Search, createPager } from '../styled';

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
  entries: CatchGridEntry[];
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
}

export default function CatchGrid(props: CatchGridProps): JSX.Element {
  const [typed, setTyped] = createSignal('');
  const query = (): string => props.search ?? typed();

  /** Every species the grid holds more than one of, for `is:duplicate` */
  const duplicates = createMemo(() => findDuplicates(props.entries.map((entry) => entry.caught)));

  // The query is applied here even when the caller fetched against it,
  // because the store only answers half of a search
  const matched = (): BoxEntry[] =>
    orderCatches(
      props.entries.filter((entry) =>
        matchesCatch(entry.caught, query(), { id: entry.square.id, duplicates: duplicates() }),
      ),
      query(),
      (entry) => entry.caught,
    ).map((entry) => entry.square);

  const shelf = createPager(matched, BOX_SIZE, 'Box');

  return (
    <div class="flex w-full flex-col gap-3">
      {/* Always drawn, however short the box is: a search that hides
          itself under a handful of pokemon takes its own box away when
          it narrows far enough */}
      <Show when={props.bare !== true}>
        <Row>
          <Search
            placeholder="Name, or type:fire is:shiny"
            value={query()}
            onChange={(value) => {
              if (props.onSearch == null) {
                setTyped(value);
              } else {
                props.onSearch(value);
              }
            }}
          />
        </Row>
      </Show>

      <Show
        when={matched().length > 0}
        fallback={
          <Note>
            {query().length === 0
              ? (props.empty ?? 'Nothing here yet.')
              : (props.noMatch ?? 'None of them match that.')}
          </Note>
        }
      >
        <CatchBox
          entries={shelf.shown()}
          onOpen={props.onOpen}
          cardOnly={props.cardOnly}
          cell={props.cell}
        />
        {shelf.controls()}
      </Show>
    </div>
  );
}
