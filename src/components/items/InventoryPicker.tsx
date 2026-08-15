import { type JSX, Show, createEffect, createResource, createSignal, untrack } from 'solid-js';
import { useAuth } from '../../auth/context';
import { type InventoryEntry, getInventory } from '../../auth/inventory';
import type { Items } from '../../data/ids/items';
import ItemGrid, { type ItemCell, describeItem } from './ItemGrid';
import { Button, Dialog, DialogActions, Note, Row } from '../styled';

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

export { describeItem };

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
   * pick spends the item — but only where the item is worth the
   * second press, which is why a caller may answer per row instead of
   * for the whole list: a Potion asked about twice is a click for
   * nothing, and a Golden Bottle Cap is not
   */
  confirm?: boolean | ((entry: InventoryEntry) => boolean);
  /**
   * Whether the list is showing but not taking picks — a catch in a
   * live battle, say, where every row is refused for the same reason
   */
  disabled?: boolean;
  /**
   * Whether a square says how many there are. A vendor's crate is
   * bottomless, so the number on it would never move
   */
  counts?: boolean;
  /**
   * Why one particular row cannot be picked, or null when it can.
   *
   * It is a **reason** rather than a flag because the row stays on
   * screen: a vendor's crate lists what he stocks whether or not the
   * player can afford it today, and "not enough gold" is the whole
   * point of showing the row at all. Hiding it instead would make the
   * crate change shape with the purse
   */
  blocked?: (entry: InventoryEntry) => string | null;
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
   * The tray, square by square: what is in the bag, what the caller
   * has taken and what it refuses
   */
  const cells = (): ItemCell[] =>
    offered().map((entry) => ({
      item: entry.item,
      amount: props.counts === false ? undefined : entry.amount,
      selected: props.multiple === true ? amountOf(entry.item) > 0 : props.value === entry.item,
      blocked: props.blocked?.(entry) ?? null,
      note: props.note?.(entry) ?? null,
    }));

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
   * Whether this row is one the caller wants asked about twice. A
   * caller that said `confirm` outright means every row; one that
   * passed a rule means the rows the rule picks out
   */
  const asksTwice = (entry: InventoryEntry): boolean =>
    typeof props.confirm === 'function' ? props.confirm(entry) : props.confirm === true;

  /**
   * One row pressed. A single pick is the answer itself; a pick out of
   * many only marks the row, and the caller hears about it when the
   * list is done
   */
  const press = (entry: InventoryEntry): void => {
    if (props.multiple === true) {
      setDraft(
        amountOf(entry.item) > 0
          ? draft().filter(([picked]) => picked !== entry.item)
          : [...draft(), [entry.item, 1]],
      );
      return;
    }
    if (asksTwice(entry) && pending() !== entry.item) {
      setPending(entry.item);
      return;
    }
    pickOne(entry.item);
  };

  /**
   * A basket is asked about twice when anything in it is: the
   * question is about the trade, and one thing worth a second look
   * makes the whole of it worth one
   */
  const finish = (): void => {
    const drafted = draft().map(([item]) => item);
    const asked = offered()
      .filter((entry) => new Set(drafted).has(entry.item))
      .some(asksTwice);

    if (asked && !confirming()) {
      setConfirming(true);
      return;
    }
    pickMany();
  };

  const list = (): JSX.Element => (
    <div class="flex flex-col gap-3">
      {/* Searching and the shelves belong to the tray, which lays them
          out the same way wherever the bag is opened */}
      <Show when={!loading()} fallback={<Note>Looking through the bag…</Note>}>
        <Show
          when={offered().length}
          fallback={<Note>{props.empty ?? 'Nothing in the bag for this.'}</Note>}
        >
          <ItemGrid
            entries={cells()}
            verb={props.verb}
            disabled={props.disabled}
            onPress={(item) => {
              const entry = offered().find((one) => one.item === item);

              if (entry != null) {
                press(entry);
              }
            }}
          />

          {/* Asked once more, since picking it is what spends it.
              There is no room for a question under a picture, so it is
              asked below the tray */}
          <Show when={offered().find((entry) => entry.item === pending())} keyed>
            {(asked) => (
              <Row class="justify-center">
                <Button
                  tone="primary"
                  onClick={() => {
                    pickOne(asked.item);
                  }}
                >
                  {props.verb ?? 'Pick'} {describeItem(asked.item)}?
                </Button>
                <Button
                  onClick={() => {
                    setPending(null);
                  }}
                >
                  Cancel
                </Button>
              </Row>
            )}
          </Show>
        </Show>
      </Show>

      <Show when={props.multiple === true}>
        <Row>
          <Button
            tone="primary"
            disabled={props.disabled === true || draft().length === 0}
            onClick={finish}
          >
            {/* The verb alone. "Buy 3 of them" counted the *rows* in
                the basket rather than the items in it, which for a
                basket holding five of one thing was a number that
                answered nothing — and what is in it is listed above
                the button either way */}
            {confirming() ? 'Sure?' : (props.verb ?? 'Take')}
          </Button>
        </Row>
      </Show>
    </div>
  );

  return (
    <Show when={props.inline !== true} fallback={list()}>
      {/* A caller that says whether the bag is open has its own way of
          opening it, and a second button beside that one is a button
          nobody presses */}
      <Show when={props.open == null}>
        <Button
          onClick={() => {
            setOpened(true);
          }}
        >
          {props.label ?? props.title ?? 'Pick an item'}
        </Button>
      </Show>
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
