import { For, type JSX, Show, createEffect, createResource, createSignal, untrack } from 'solid-js';
import { useAuth } from '../auth/context';
import { type InventoryEntry, getInventory } from '../auth/inventory';
import type { ItemTypes, Items } from '../data/ids/items';
import { ITEM_TYPE_NAMES, ITEM_TYPE_ORDER, getItemData } from '../data/items';
import matches from '../core/search';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  Field,
  Filter,
  type FilterOption,
  List,
  ListRow,
  Meta,
  Note,
  Row,
  RowButton,
  SEARCH_FROM,
  Search,
} from './styled';

/**
 * Picking something out of the bag.
 *
 * Every part of the game that asks a player for an item was asking it
 * its own way: a list of buttons in the catch dialog, another in the
 * auction tab, each with its own idea of what to show and what to
 * leave out. This is that list, once — what the player is carrying,
 * filtered to what the caller can accept, handed back as an id.
 *
 * It is a dialog by default. `inline` renders the list on its own for
 * callers that are already inside a dialog of their own, since a
 * dialog opened over a dialog fights it for the click that closes it.
 */

/**
 * An item and how many of it: what a multiple pick hands back, since
 * "three Potions" is a different answer from "a Potion"
 */
export type ItemAmount = [item: Items, amount: number];

/**
 * An item the registry does not know shows as its id rather than a
 * guess
 */
export function describeItem(item: Items): string {
  try {
    return getItemData(item).name;
  } catch {
    return `Item #${item}`;
  }
}

/**
 * The bag unfiltered. A category filter always offers this first,
 * because a player who has narrowed the bag down needs the way back
 */
export const EVERY_CATEGORY = 'all';

/**
 * What the bag can be narrowed to: one kind of item, or all of them
 */
export type ItemCategory = ItemTypes | typeof EVERY_CATEGORY;

/**
 * Which shelf an item belongs on, or nothing for an item the registry
 * does not know — an unknown item is shown under `All` and nowhere
 * else, which is the honest place for it
 */
function categoryOf(item: Items): ItemTypes | null {
  try {
    return getItemData(item).type;
  } catch {
    return null;
  }
}

export function isInCategory(item: Items, category: ItemCategory): boolean {
  return category === EVERY_CATEGORY || categoryOf(item) === category;
}

/**
 * The categories worth offering: the ones the player is actually
 * carrying something from. A filter listing eight empty shelves is a
 * filter that makes the bag harder to read rather than easier
 */
export function listCategories(items: Items[]): FilterOption<ItemCategory>[] {
  const carried = new Set(items.map(categoryOf));

  return [
    { value: EVERY_CATEGORY, label: 'All' },
    ...ITEM_TYPE_ORDER.filter((type) => carried.has(type)).map((type) => ({
      value: type,
      label: ITEM_TYPE_NAMES[type],
    })),
  ];
}

interface InventoryPickerCommonProps {
  /**
   * Whose bag. Defaults to the signed-in player, which is whose bag it
   * is everywhere but a debugging screen
   */
  player?: string;
  /**
   * What the dialog is called, and what the button that opens it says
   */
  title?: string;
  /**
   * What the caller is asking for, in a sentence. The picker says
   * something sensible about how many it wants if the caller does not
   */
  description?: string;
  label?: string;
  /**
   * What a row's button says it will do — "Give", "Use". The name of
   * the item follows it
   */
  verb?: string;
  /**
   * What to say when nothing in the bag passes the filter
   */
  empty?: string;
  /**
   * Ask once more before handing the pick back. Worth it wherever the
   * pick spends the item
   */
  confirm?: boolean;
  /**
   * Whether the list is showing but not taking picks — a catch in a
   * live battle, say, where every row is refused for the same reason
   */
  disabled?: boolean;
  /**
   * Render the list on its own, with no dialog and no button to open
   * one. For callers that are already in a dialog
   */
  inline?: boolean;
  /**
   * Whether the dialog is open. Leave it out and the picker opens and
   * shuts itself from its own button
   */
  open?: boolean;
  onClose?: () => void;
  /**
   * Which stacks the caller can accept. Everything else is left out
   * rather than shown and refused
   */
  filter?: (entry: InventoryEntry) => boolean;
  /**
   * A word about the row from whoever is asking — a price, most of the
   * time. It sits beside the count, since it is something about this
   * stack rather than something about the item
   */
  note?: (entry: InventoryEntry) => string | null;
  /**
   * The bag, already in hand. A caller showing two pickers over one
   * inventory reads it once and passes it to both rather than paying
   * for the same query twice
   */
  entries?: InventoryEntry[];
  /**
   * Changing this re-reads the bag: a caller that spends what it picked
   * bumps it so the list catches up
   */
  revision?: unknown;
}

export type InventoryPickerProps = InventoryPickerCommonProps &
  (
    | {
        multiple?: false;
        /**
         * What is picked now, or null. The picker draws it as picked
         * but never decides it — the caller owns the value
         */
        value: Items | null;
        onPick: (item: Items | null) => void;
      }
    | {
        multiple: true;
        value: ItemAmount[];
        onPick: (items: ItemAmount[]) => void;
      }
  );

export default function InventoryPicker(props: InventoryPickerProps): JSX.Element {
  const auth = useAuth();
  const [opened, setOpened] = createSignal(false);
  const [pending, setPending] = createSignal<Items | null>(null);
  const [confirming, setConfirming] = createSignal(false);
  const [draft, setDraft] = createSignal<ItemAmount[]>([]);

  const owner = (): string => props.player ?? auth.user()?.uid ?? '';

  /**
   * Whether the list is being shown at all: always, when it is inline
   */
  const showing = (): boolean => props.inline === true || (props.open ?? opened());

  const [bag] = createResource(
    () => (showing() && props.entries == null ? ([owner(), props.revision] as const) : null),
    async ([player]) => getInventory(player),
  );

  const loading = (): boolean => props.entries == null && bag.loading;

  /**
   * What the caller will accept, before the player narrows it further.
   * The two filters are kept apart on purpose: the caller's decides
   * what could be picked at all, and the category only decides what is
   * being looked at — so the shelves offered are the ones this list
   * actually has something on
   */
  const offered = (): InventoryEntry[] =>
    (props.entries ?? bag() ?? []).filter((entry) => props.filter?.(entry) ?? true);

  const [category, setCategory] = createSignal<ItemCategory>(EVERY_CATEGORY);

  const categories = (): FilterOption<ItemCategory>[] =>
    listCategories(offered().map((entry) => entry.item));

  /**
   * The shelf being looked at, if it is still a shelf this list has.
   * What the caller accepts can change under the picker — a held item
   * given away, a stack spent — and a filter left pointing at an empty
   * shelf would read as an empty bag
   */
  const shelf = (): ItemCategory =>
    categories().some((option) => option.value === category()) ? category() : EVERY_CATEGORY;

  const [query, setQuery] = createSignal('');

  const stacks = (): InventoryEntry[] =>
    offered().filter(
      (entry) => isInCategory(entry.item, shelf()) && matches(describeItem(entry.item), query()),
    );

  const chosen = (): ItemAmount[] => (props.multiple === true ? props.value : []);

  // The draft is the caller's value until the picker is done with it,
  // so opening the list again starts from what is actually picked
  createEffect(() => {
    if (showing()) {
      setDraft(untrack(chosen));
    }
  });

  const amountOf = (item: Items): number => draft().find(([picked]) => picked === item)?.[1] ?? 0;

  /**
   * What the picker is asking for. A caller with something more
   * specific to say says it; otherwise it is one item or several, and
   * several come with a count each
   */
  const purpose = (): string => {
    if (props.description != null) {
      return props.description;
    }
    return props.multiple === true
      ? 'Choose what to take out of the bag, and how many of each.'
      : 'Choose one thing out of the bag.';
  };

  const close = (): void => {
    setPending(null);
    setConfirming(false);
    setOpened(false);
    props.onClose?.();
  };

  const pickOne = (item: Items | null): void => {
    if (props.multiple === true) {
      return;
    }
    props.onPick(item);
    close();
  };

  const pickMany = (): void => {
    if (props.multiple !== true) {
      return;
    }
    props.onPick(draft());
    close();
  };

  /**
   * One row pressed. A single pick is the answer itself; a pick out of
   * many only marks the row, and the caller hears about it when the
   * list is done
   */
  const press = (item: Items): void => {
    if (props.multiple === true) {
      setDraft(
        amountOf(item) > 0
          ? draft().filter(([picked]) => picked !== item)
          : [...draft(), [item, 1]],
      );
      return;
    }
    if (props.confirm === true && pending() !== item) {
      setPending(item);
      return;
    }
    pickOne(item);
  };

  const setAmount = (item: Items, amount: number, stock: number): void => {
    const kept = Math.max(1, Math.min(stock, Math.floor(amount)));

    setDraft(draft().map((entry) => (entry[0] === item ? [item, kept] : entry)));
  };

  const finish = (): void => {
    if (props.confirm === true && !confirming()) {
      setConfirming(true);
      return;
    }
    pickMany();
  };

  const list = (): JSX.Element => (
    <div class="flex flex-col gap-3">
      {/* A shelf to choose between, or a bag too long to read down:
          either is worth a way of narrowing it, and neither is worth
          the room over a handful of rows */}
      <Show when={categories().length > 2 || offered().length > SEARCH_FROM}>
        <Row>
          <Show when={offered().length > SEARCH_FROM}>
            <Search
              placeholder="Search the bag"
              value={query()}
              onChange={(typed) => {
                setQuery(typed);
              }}
            />
          </Show>
          <Show when={categories().length > 2}>
            <Filter
              label="Category"
              value={shelf()}
              options={categories()}
              onChange={(picked) => {
                setCategory(picked);
              }}
            />
          </Show>
        </Row>
      </Show>

      <Show when={!loading()} fallback={<Note>Looking through the bag…</Note>}>
        <Show
          when={stacks().length}
          fallback={
            <Note>
              {shelf() === EVERY_CATEGORY && query().length === 0
                ? (props.empty ?? 'Nothing in the bag for this.')
                : 'Nothing here matches.'}
            </Note>
          }
        >
          <List>
            <For each={stacks()}>
              {(entry) => (
                <ListRow
                  selected={
                    props.multiple === true ? amountOf(entry.item) > 0 : props.value === entry.item
                  }
                  class="flex-col items-stretch"
                >
                  <div class="flex flex-wrap items-center gap-2">
                    <RowButton
                      pressed={
                        props.multiple === true
                          ? amountOf(entry.item) > 0
                          : props.value === entry.item
                      }
                      disabled={props.disabled}
                      onClick={() => {
                        press(entry.item);
                      }}
                    >
                      {amountOf(entry.item) > 0 ? '✓ ' : ''}
                      {props.verb == null ? '' : `${props.verb} `}
                      {describeItem(entry.item)}
                    </RowButton>
                    <Badge>× {entry.amount}</Badge>
                    <Show when={props.note?.(entry) ?? undefined} keyed>
                      {(note) => <Meta>{note}</Meta>}
                    </Show>
                    {/* How many of the stack, once the row is in: a
                        caller asking for items usually wants a count as
                        well as a name */}
                    <Show when={props.multiple === true && amountOf(entry.item) > 0}>
                      <Field label="Take">
                        <input
                          type="number"
                          min={1}
                          max={entry.amount}
                          value={amountOf(entry.item)}
                          onInput={(event) => {
                            setAmount(entry.item, Number(event.currentTarget.value), entry.amount);
                          }}
                        />
                      </Field>
                    </Show>
                  </div>
                  {/* Asked once more, since picking it is what spends
                      it */}
                  <Show when={pending() === entry.item}>
                    <Row>
                      <Button
                        tone="primary"
                        onClick={() => {
                          pickOne(entry.item);
                        }}
                      >
                        {props.verb ?? 'Pick'} {describeItem(entry.item)}?
                      </Button>
                      <Button
                        onClick={() => {
                          setPending(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </Row>
                  </Show>
                </ListRow>
              )}
            </For>
          </List>
        </Show>
      </Show>

      <Show when={props.multiple === true}>
        <Row>
          <Button
            tone="primary"
            disabled={props.disabled === true || draft().length === 0}
            onClick={finish}
          >
            {confirming() ? 'Sure?' : `${props.verb ?? 'Take'} ${draft().length} of them`}
          </Button>
        </Row>
      </Show>
    </div>
  );

  return (
    <Show when={props.inline !== true} fallback={list()}>
      <Button
        onClick={() => {
          setOpened(true);
        }}
      >
        {props.label ?? props.title ?? 'Pick an item'}
      </Button>
      <Dialog
        isOpen={showing()}
        onClose={close}
        title={props.title ?? 'The bag'}
        description={purpose()}
      >
        {list()}
        <DialogActions>
          {/* A single pick can also be no pick: the caller asked for an
              item, and "none" is an answer to that */}
          <Show when={props.multiple !== true && props.value != null}>
            <Button
              onClick={() => {
                pickOne(null);
              }}
            >
              Pick none
            </Button>
          </Show>
          <Button onClick={close}>Close</Button>
        </DialogActions>
      </Dialog>
    </Show>
  );
}
