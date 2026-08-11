import { For, type JSX, Show, createEffect, createResource, createSignal, untrack } from 'solid-js';
import { useAuth } from '../auth/context';
import { type InventoryEntry, getInventory } from '../auth/inventory';
import type { Items } from '../data/ids/items';
import { getItemData } from '../data/items';
import { Dialog, DialogActions, DialogButton, DialogTitle } from './styled';

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

  const stacks = (): InventoryEntry[] =>
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
    <>
      <Show when={!loading()} fallback={<p>Looking through the bag…</p>}>
        <Show
          when={stacks().length}
          fallback={<p>{props.empty ?? 'Nothing in the bag for this.'}</p>}
        >
          <ul>
            <For each={stacks()}>
              {(entry) => (
                <li>
                  <button
                    type="button"
                    aria-pressed={
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
                    {describeItem(entry.item)} × {entry.amount}
                  </button>
                  {/* How many of the stack, once the row is in: a
                      caller asking for items usually wants a count as
                      well as a name */}
                  <Show when={props.multiple === true && amountOf(entry.item) > 0}>
                    {' '}
                    <input
                      type="number"
                      min={1}
                      max={entry.amount}
                      value={amountOf(entry.item)}
                      onInput={(event) => {
                        setAmount(entry.item, Number(event.currentTarget.value), entry.amount);
                      }}
                    />
                  </Show>
                  {/* Asked once more, since picking it is what spends
                      it */}
                  <Show when={pending() === entry.item}>
                    {' '}
                    <button
                      type="button"
                      onClick={() => {
                        pickOne(entry.item);
                      }}
                    >
                      {props.verb ?? 'Pick'} {describeItem(entry.item)}?
                    </button>{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setPending(null);
                      }}
                    >
                      Cancel
                    </button>
                  </Show>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </Show>

      <Show when={props.multiple === true}>
        <p>
          <button
            type="button"
            disabled={props.disabled === true || draft().length === 0}
            onClick={finish}
          >
            {confirming() ? 'Sure?' : `${props.verb ?? 'Take'} ${draft().length} of them`}
          </button>
        </p>
      </Show>
    </>
  );

  return (
    <Show when={props.inline !== true} fallback={list()}>
      <button
        type="button"
        onClick={() => {
          setOpened(true);
        }}
      >
        {props.label ?? props.title ?? 'Pick an item'}
      </button>
      <Dialog isOpen={showing()} onClose={close}>
        <DialogTitle>{props.title ?? 'The bag'}</DialogTitle>
        {list()}
        <DialogActions>
          {/* A single pick can also be no pick: the caller asked for an
              item, and "none" is an answer to that */}
          <Show when={props.multiple !== true && props.value != null}>
            <DialogButton
              onClick={() => {
                pickOne(null);
              }}
            >
              Pick none
            </DialogButton>
          </Show>
          <DialogButton onClick={close}>Close</DialogButton>
        </DialogActions>
      </Dialog>
    </Show>
  );
}
