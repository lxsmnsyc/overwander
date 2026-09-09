import { For, Index, type JSX, Show, createEffect, createSignal } from 'solid-js';
import type { Items } from '../../data/ids/items';
import { describeItem, detailItem } from '../details';
import { ArrowLeftIcon, ArrowRightIcon } from '../icons';
import ItemCard from './ItemCard';
import ItemSprite from './ItemSprite';
import matchesItem, { ITEM_VOCABULARY, orderItems } from '../../data/items/search';
import { Button, Detail, HoverCard, Meta, Note, Row, Search, TooltipHost } from '../styled';

/**
 * The bag as a tray of pictures rather than a column of names.
 *
 * It is the pokemon box, for items: six across and five down, a page
 * at a time, with what a square holds said by the picture and how many
 * by the number in its corner. A name is what the pointer brings up
 * over the square, since the bag is looked at far more often than it
 * is read and thirty lines of text is reading.
 *
 * A square says what it is in a **tooltip**, and gets a **hover card**
 * only where it offers more than one thing to do. One action is the
 * square's own press and wants no window; a choice between two has to
 * be pressed, and a card is what can hold buttons.
 *
 * The tray carries its own furniture, a search over it and the pages
 * under it, so the bag is laid out the same way wherever it is opened:
 * the inventory tab, a vendor's crate, the picker a catch sheet puts
 * up. Narrowing to one kind of thing is `type:berry` in the search
 * rather than a control of its own.
 */

export const GRID_COLUMNS = 6;
export const GRID_ROWS = 5;
export const GRID_SIZE = GRID_COLUMNS * GRID_ROWS;

/**
 * Re-exported from where the battle card reads them too: a tray of
 * items and a pokemon's held item are named the same way
 */

/**
 * One thing a square offers beyond being pressed. A square with one of
 * these does it when pressed; a square with several needs somewhere to
 * put the buttons
 */
export interface ItemAction {
  label: string;
  onPress: () => void;
  tone?: 'primary';
  disabled?: boolean;
  /** Why it cannot be pressed, where it cannot */
  title?: string;
}

/**
 * One square: what is in it, how many, and what the caller thinks of
 * it
 */
export interface ItemCell {
  item: Items;
  /**
   * How many, in the corner. Left out where the number would say
   * nothing — a vendor's crate is bottomless, so a count on it is a
   * number that never moves
   */
  amount?: number;
  /**
   * Whether the caller has taken this one. A taken square is drawn as
   * taken, since picking several is done by looking at what is already
   * picked
   */
  selected?: boolean;
  /**
   * Why this one cannot be pressed, or nothing when it can. The square
   * stays on the tray either way — a vendor's crate lists what he
   * stocks whether or not the purse stretches to it
   */
  blocked?: string | null;
  /**
   * A word about this square from whoever is asking — a price, most of
   * the time
   */
  note?: string | null;
  /**
   * How many of it the bag holds, for the card. A crate's squares are
   * not the player's, so the two counts are different questions
   */
  carried?: number;
  /**
   * What pressing this square itself does, where one square's press is
   * not the tray's — a gift tray claims the gift behind the square,
   * not the item on it. It wins over the tray-wide `onPress`
   */
  onPress?: () => void;
  /**
   * More about this square, under what the item itself says. It is for
   * a tray whose squares are not simply things — a lot on the auction
   * board is an item *and* whose it is and what it stands at.
   *
   * A function rather than the markup itself: the tray narrows its
   * squares inside an effect, so markup handed over ready-made is
   * built while that effect is tracking and subscribes the effect to
   * everything the card reads
   */
  card?: () => JSX.Element;
  /**
   * What a reader is told about this square, instead of the sentence the
   * tray writes from the item and the count. A board of lots needs whose
   * it is in there: two sellers with a Poke Ball up are two squares that
   * would otherwise be announced identically
   */
  said?: string;
  /**
   * What can be done with this square, where the tray's own press is
   * not the whole of it. One of them is the square's press and the
   * square is read in a tooltip; more than one is drawn as buttons in
   * a hover card, since a tooltip has nowhere to put them
   */
  actions?: ItemAction[];
}

export interface ItemGridProps {
  entries: ItemCell[];
  /**
   * What pressing a square does — "Use", "Sell". A picture cannot
   * carry the word, so it is said to whoever is listening rather than
   * drawn
   */
  verb?: string;
  /**
   * The whole tray is showing but taking nothing: a bag opened during
   * a battle, say
   */
  disabled?: boolean;
  /**
   * Whether a square itself does nothing, for a tray that is read
   * rather than acted from. A square with actions of its own is
   * pressable whatever this says
   */
  cardOnly?: boolean;
  /**
   * Whether the caller narrows the tray itself, so it draws no search
   * of its own. A screen with one search over two trays would
   * otherwise have three of them
   */
  bare?: boolean;
  onPress?: (item: Items) => void;
}

export default function ItemGrid(props: ItemGridProps): JSX.Element {
  const [page, setPage] = createSignal(0);
  const [query, setQuery] = createSignal('');

  // A `sort:` is applied last, over whatever the search left
  const narrowed = (): ItemCell[] =>
    orderItems(
      props.entries.filter((cell) =>
        matchesItem(cell.item, query(), { amount: cell.amount ?? cell.carried }),
      ),
      query(),
      (cell) => ({ item: cell.item, holding: { amount: cell.amount ?? cell.carried } }),
    );

  const pages = (): number => Math.max(1, Math.ceil(narrowed().length / GRID_SIZE));

  // Spending a stack or narrowing a search can empty the page being
  // looked at, and a player left staring at an empty tray reads it as
  // an empty bag
  createEffect(() => {
    setPage((at) => Math.min(at, pages() - 1));
  });

  const shown = (): ItemCell[] => narrowed().slice(page() * GRID_SIZE, (page() + 1) * GRID_SIZE);

  /**
   * How many squares the tray draws, filled or not. A bag that runs to
   * more than one page keeps its full height so paging does not move
   * the buttons under it; a smaller one only fills out the row it is on
   */
  const squares = (): number =>
    pages() > 1
      ? GRID_SIZE
      : Math.max(GRID_COLUMNS, Math.ceil(shown().length / GRID_COLUMNS) * GRID_COLUMNS);

  const empties = (): number[] => Array.from({ length: squares() - shown().length }, (_, at) => at);

  /**
   * Whether this square's own buttons need a window to stand in. One
   * action is the square's press, so the square only has to say what
   * it is; two or three are a choice, and a choice needs pressing
   */
  const carded = (cell: ItemCell): boolean => (cell.actions?.length ?? 0) > 1;

  /** The one action a square does when pressed, where it has exactly one */
  const only = (cell: ItemCell): ItemAction | undefined =>
    cell.actions?.length === 1 ? cell.actions[0] : undefined;

  /** Whether pressing this square does anything at all */
  const pressable = (cell: ItemCell): boolean => {
    // A caller that listed its actions has said what the square does,
    // so the tray's own press is not offered on top of them
    if (cell.actions != null) {
      const action = only(cell);

      return action != null && action.disabled !== true;
    }
    return props.cardOnly !== true;
  };

  /**
   * How a square reads to the pointer. One that is refused is greyed
   * rather than marked — a square he will not part with is still worth
   * seeing, and a red edge reads as something having gone wrong
   */
  const handOf = (cell: ItemCell): string => {
    if (cell.blocked != null) {
      return 'border-line-soft opacity-45 grayscale';
    }
    return pressable(cell) ? 'cursor-pointer' : 'cursor-default';
  };

  const press = (cell: ItemCell): void => {
    if (props.disabled === true || cell.blocked != null || !pressable(cell)) {
      return;
    }

    const action = only(cell);

    if (action != null) {
      action.onPress();
      return;
    }
    if (cell.onPress != null) {
      cell.onPress();
      return;
    }
    props.onPress?.(cell.item);
  };

  /**
   * What the tooltip says under the item's own line: how many the bag
   * holds, which a crate's square cannot say by itself, and whatever
   * the caller had to add
   */
  const aside = (cell: ItemCell): JSX.Element => (
    <>
      <Show when={cell.carried ?? cell.amount}>
        {(held) => <Detail label="Amount in bag">{held()}</Detail>}
      </Show>
      {cell.card?.()}
    </>
  );

  /**
   * One square of the tray, drawn the same whether a hover card or a
   * tooltip is standing over it
   */
  const square = (cell: ItemCell): JSX.Element => (
    <button
      type="button"
      disabled={props.disabled === true || cell.blocked != null}
      aria-label={
        cell.said ??
        `${props.verb == null ? '' : `${props.verb} `}${describeItem(cell.item)}${
          cell.amount == null ? '' : `, ${cell.amount} carried`
        }${cell.blocked == null ? '' : ` — ${cell.blocked}`}`
      }
      aria-pressed={cell.selected === true}
      onClick={() => {
        press(cell);
      }}
      class={`relative flex aspect-square w-full items-center justify-center rounded-lg border-2
        p-1 transition-colors disabled:cursor-not-allowed ${
          cell.selected === true
            ? 'border-leaf bg-leaf-soft'
            : 'border-line bg-paper hover:bg-line-soft'
        } ${handOf(cell)}`}
    >
      {/* Laid over the square rather than inside it: the picture is a
          fixed number of pixels and the square is a sixth of whatever
          the tray was given, so an icon in the flow would stretch a
          narrow square taller than it is wide */}
      <span class="pointer-events-none absolute inset-1.5 flex items-center justify-center">
        <ItemSprite item={cell.item} fill label="" />
      </span>
      {/* How many, in the corner the games put it in */}
      <Show when={cell.amount != null}>
        <span
          class="pointer-events-none absolute right-0.5 bottom-0.5 rounded-full border border-line
            bg-paper px-1 text-[10px] leading-tight font-bold text-ink"
        >
          {cell.amount}
        </span>
      </Show>
      {/* And the asking price, where there is one */}
      <Show when={cell.note} keyed>
        {(note) => (
          <span
            class="pointer-events-none absolute top-0.5 left-0.5 max-w-full truncate rounded-full
              border border-gold bg-gold-soft px-1 text-[10px] leading-tight font-bold text-gold"
          >
            {note}
          </span>
        )}
      </Show>
    </button>
  );

  return (
    <div class="mx-auto flex w-full max-w-lg flex-col gap-2">
      {/* What narrows the tray stands above it, and is drawn whatever
          the tray holds — a bag that grew a search box once it passed
          eight things was a screen that changed shape as the player
          filled it */}
      <Show when={props.bare !== true}>
        <Row class="flex-nowrap items-start gap-2">
          <Search
            vocabulary={ITEM_VOCABULARY}
            example="type:berry"
            placeholder="Name, or type:berry is:usable"
            value={query()}
            onChange={(typed) => {
              setQuery(typed);
            }}
          />
        </Row>
      </Show>

      {/* Narrowed to nothing is the tray's own news to break: what the
          caller says when the bag is empty is a different sentence */}
      <Show when={narrowed().length === 0 && props.entries.length > 0}>
        <Note class="text-center">Nothing here matches.</Note>
      </Show>

      <div
        class="grid w-full grid-cols-6 gap-1.5 rounded-xl border-4 border-tide bg-parchment p-1.5
          shadow-pop"
      >
        {/* `Index`, not `For`: callers rebuild the cell objects every
            time a purse or a bag moves, and a reference-keyed loop
            would tear every square down mid-hover. Keyed by slot, the
            DOM stays put and only the numbers on it change */}
        <Index each={shown()}>
          {(cell) => (
            <Show
              when={carded(cell())}
              fallback={
                <TooltipHost
                  class="block w-full"
                  {...detailItem(cell().item)}
                  extra={() => aside(cell())}
                >
                  {square(cell())}
                </TooltipHost>
              }
            >
              {/* A window rather than a label, because a square with a
                  choice on it needs the choice pressing: bid, collect,
                  take it back */}
              <HoverCard
                class="block w-full"
                title="Info"
                footer={
                  <For each={cell().actions}>
                    {(action) => (
                      <Button
                        tone={action.tone}
                        disabled={action.disabled}
                        title={action.title}
                        onClick={action.onPress}
                      >
                        {action.label}
                      </Button>
                    )}
                  </For>
                }
                trigger={square(cell())}
              >
                <ItemCard item={cell().item} carried={cell().carried ?? cell().amount} />
                {cell().card?.()}
              </HoverCard>
            </Show>
          )}
        </Index>
        {/* The rest of the tray, drawn empty rather than left out: a
            half-built grid reads as a broken one */}
        <For each={empties()}>
          {() => (
            <span
              aria-hidden="true"
              class="aspect-square w-full rounded-lg border-2 border-line-soft bg-paper/40"
            />
          )}
        </For>
      </div>

      <Show when={pages() > 1}>
        <Row class="justify-center">
          <Button
            label="Previous page"
            disabled={page() === 0}
            onClick={() => {
              setPage((at) => Math.max(0, at - 1));
            }}
          >
            <ArrowLeftIcon class="size-4" aria-hidden="true" />
          </Button>
          <Meta>
            Page {page() + 1} of {pages()}
          </Meta>
          <Button
            label="Next page"
            disabled={page() >= pages() - 1}
            onClick={() => {
              setPage((at) => Math.min(pages() - 1, at + 1));
            }}
          >
            <ArrowRightIcon class="size-4" aria-hidden="true" />
          </Button>
        </Row>
      </Show>
    </div>
  );
}
