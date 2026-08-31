import {
  type JSX,
  type Resource,
  Show,
  Suspense,
  createEffect,
  createResource,
  createSignal,
  untrack,
} from 'solid-js';
import { useAuth } from '../../auth/context';
import { type InventoryEntry, getInventory } from '../../auth/inventory';
import type { Items } from '../../data/ids/items';
import { describeItem } from '../details';
import ItemGrid, { type ItemCell } from './ItemGrid';
import ItemSprite from './ItemSprite';
import { Button, Dialog, DialogActions, Note, Row, Status } from '../styled';

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

/** How big the picture beside the count under the tray is drawn */
const COUNT_ICON = 24;

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
   * What the player should know before pressing again, or null when
   * there is nothing to say.
   *
   * It rides the second press rather than the row: a warning on
   * thirty squares is wallpaper, and the one square being spent is
   * where it is read
   */
  warn?: (entry: InventoryEntry) => string | null;
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
   * More about one row, under what the item itself says. The corner
   * badge holds a number and nothing else, so a price that needs
   * saying in words — what it costs, what he pays for it — is said
   * here instead
   */
  card?: (entry: InventoryEntry) => JSX.Element;
  /**
   * How many of it the player is carrying, where the stack being shown
   * is not theirs — a vendor's crate, whose counts are his
   */
  carried?: (entry: InventoryEntry) => number;
  /**
   * Whether a square does nothing and its card is the only way to act.
   * A crate spends gold on a press, and a stray click on a picture
   * should not be a purchase
   */
  cardOnly?: boolean;
  /**
   * Whether the sentence under the title is for the screen reader
   * alone — a window whose squares already say what they are
   */
  terse?: boolean;
  /**
   * Something to stand under the tray, off to the right — the purse,
   * for a window that spends it
   */
  below?: JSX.Element;
  /**
   * The most of one thing that may be taken at once. Given one, the
   * picker asks **how many** before it hands anything back: a square
   * pressed opens a count under the tray rather than answering at
   * once. Left out, a press is one of it, the way it always was
   */
  most?: (entry: InventoryEntry) => number;
  /**
   * What the count comes to, over the button that settles it — the
   * total, and what it leaves behind
   */
  sum?: (item: Items, amount: number) => JSX.Element;
  /**
   * Why this many cannot be taken: more gold than the purse holds. It
   * is a sentence rather than a flag, since it is shown as well as
   * gating the button
   */
  refuse?: (item: Items, amount: number) => string | null;
  /**
   * Whether the list stays up after a pick. A crate being bought from
   * is opened once and traded with several times, and a window that
   * shut on every purchase would be opened again for the next one
   */
  keepOpen?: boolean;
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
        /**
         * What was picked, and how many of it. The count is one
         * unless the picker was given `most` and asked for a number
         */
        onPick: (item: Items | null, amount: number) => void;
      }
    | {
        multiple: true;
        value: ItemAmount[];
        onPick: (items: ItemAmount[]) => void;
      }
  );

/**
 * The tray itself, which is where the bag is read.
 *
 * A resource read in the body that declared it throws past every
 * `Suspense` written there, so the reading half is a component of its
 * own with the boundary above it
 */
function PickerList(
  props: InventoryPickerProps & {
    bag: Resource<InventoryEntry[]>;
    showing: boolean;
    onDone: () => void;
  },
): JSX.Element {
  const [pending, setPending] = createSignal<Items | null>(null);
  /** How many of the pending square are being taken */
  const [taking, setTaking] = createSignal(1);
  const [confirming, setConfirming] = createSignal(false);
  const [draft, setDraft] = createSignal<ItemAmount[]>([]);

  /**
   * What the caller will accept, before the player narrows it further.
   * The two filters are kept apart on purpose: the caller's decides
   * what could be picked at all, and the category only decides what is
   * being looked at — so the shelves offered are the ones this list
   * actually has something on
   */
  const offered = (): InventoryEntry[] =>
    (props.entries ?? props.bag() ?? []).filter((entry) => props.filter?.(entry) ?? true);

  const chosen = (): ItemAmount[] => (props.multiple === true ? props.value : []);

  // The draft is the caller's value until the picker is done with it,
  // so opening the list again starts from what is actually picked
  createEffect(() => {
    if (props.showing) {
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
      card: () => props.card?.(entry),
      carried: props.carried?.(entry) ?? entry.amount,
    }));

  const close = (): void => {
    setPending(null);
    setConfirming(false);
    props.onDone();
  };

  const pickOne = (item: Items | null, amount = 1): void => {
    if (props.multiple === true) {
      return;
    }
    props.onPick(item, amount);
    if (props.keepOpen === true) {
      setPending(null);
      setTaking(1);
      return;
    }
    close();
  };

  const pickMany = (): void => {
    if (props.multiple !== true) {
      return;
    }
    props.onPick(draft());
    close();
  };

  /** The most of this one that may be taken at once */
  const room = (entry: InventoryEntry): number => Math.max(1, props.most?.(entry) ?? 1);

  /** Why this many cannot be taken, if it cannot */
  const refused = (item: Items): string | null => props.refuse?.(item, taking()) ?? null;

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
    // A caller that deals in amounts is asked how many before
    // anything is spent, and the count under the tray is the answer
    if (props.most != null && pending() !== entry.item) {
      setPending(entry.item);
      setTaking(Math.min(1, props.most(entry)));
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

  return (
    <div class="flex flex-col gap-3">
      {/* Searching and the shelves belong to the tray, which lays them
          out the same way wherever the bag is opened */}
      <Show
        when={offered().length}
        fallback={<Note>{props.empty ?? 'Nothing in the bag for this.'}</Note>}
      >
        <ItemGrid
          entries={cells()}
          verb={props.verb}
          disabled={props.disabled}
          cardOnly={props.cardOnly}
          // A list that stays up is traded with square after square,
          // so the card being pressed from stays up with it
          keepCards={props.keepOpen}
          onPress={(item) => {
            const entry = offered().find((one) => one.item === item);

            if (entry != null) {
              press(entry);
            }
          }}
        />

        {/* What the pressed square costs and how many of it are being
              taken. There is no room for either under a picture, so
              both stand below the tray: the count first, then the
              button that spends on it */}
        <Show when={offered().find((entry) => entry.item === pending())} keyed>
          {(asked) => (
            <div class="flex flex-col gap-2 rounded-panel border-2 border-line bg-paper p-2">
              <Row class="flex-nowrap items-center gap-2">
                <ItemSprite item={asked.item} size={COUNT_ICON} label="" />
                <span class="min-w-0 grow truncate text-sm font-semibold">
                  {describeItem(asked.item)}
                </span>
                <Show when={props.most != null}>
                  <Row class="flex-nowrap items-center gap-1">
                    <Button
                      label="One less"
                      disabled={props.disabled === true || taking() <= 1}
                      onClick={() => {
                        setTaking(taking() - 1);
                      }}
                    >
                      −
                    </Button>
                    {/* Typed as well as stepped: fifty of something is
                        not fifty presses of an arrow */}
                    <input
                      type="number"
                      class="w-16 text-center"
                      min={1}
                      max={room(asked)}
                      value={taking()}
                      disabled={props.disabled}
                      aria-label={`How many ${describeItem(asked.item)}`}
                      onInput={(event) => {
                        const wanted = Math.floor(Number(event.currentTarget.value));

                        setTaking(Math.min(room(asked), Math.max(1, wanted || 1)));
                      }}
                    />
                    <Button
                      label="One more"
                      disabled={props.disabled === true || taking() >= room(asked)}
                      onClick={() => {
                        setTaking(taking() + 1);
                      }}
                    >
                      +
                    </Button>
                    <Button
                      label="As many as you can"
                      disabled={props.disabled === true || taking() >= room(asked)}
                      onClick={() => {
                        setTaking(room(asked));
                      }}
                    >
                      Max
                    </Button>
                  </Row>
                </Show>
              </Row>

              <Show when={props.sum != null}>
                <Row class="justify-center">{props.sum?.(asked.item, taking())}</Row>
              </Show>
              <Show when={refused(asked.item)}>{(why) => <Note>{why()}</Note>}</Show>
              {/* What the second press is really agreeing to, where
                  the pressing happens */}
              <Status message={props.warn?.(asked) ?? null} tone="alert" />

              <Row class="justify-center">
                <Button
                  tone="primary"
                  disabled={props.disabled === true || refused(asked.item) != null}
                  onClick={() => {
                    pickOne(asked.item, taking());
                  }}
                >
                  {props.most == null
                    ? `${props.verb ?? 'Pick'} ${describeItem(asked.item)}?`
                    : `${props.verb ?? 'Take'} ${taking()}`}
                </Button>
                <Button
                  onClick={() => {
                    setPending(null);
                  }}
                >
                  Cancel
                </Button>
              </Row>
            </div>
          )}
        </Show>
      </Show>

      {/* What the tray is answered with: whatever the caller keeps
          under it (the purse, where the tray spends it) over the
          button that spends it. One column down the middle, the way
          every other bar in the game is read */}
      <Show when={props.below != null || props.multiple === true}>
        <div class="flex flex-col items-center gap-2">
          <Show when={props.below}>{(extra) => extra()}</Show>

          <Show when={props.multiple === true}>
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
          </Show>
        </div>
      </Show>
    </div>
  );
}

/**
 * Picking something out of the bag: the button that opens it, the
 * dialog it opens into, and the tray inside that.
 *
 * The bag is read one component down, under the boundary this puts
 * around the tray — so a bag still arriving replaces the tray rather
 * than the dialog holding it
 */
export default function InventoryPicker(props: InventoryPickerProps): JSX.Element {
  const auth = useAuth();
  const [opened, setOpened] = createSignal(false);

  const owner = (): string => props.player ?? auth.user()?.uid ?? '';

  /**
   * Whether the list is being shown at all: always, when it is inline
   */
  const showing = (): boolean => props.inline === true || (props.open ?? opened());

  const [bag] = createResource(
    () => (showing() && props.entries == null ? ([owner(), props.revision] as const) : null),
    async ([player]) => getInventory(player),
  );

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
    setOpened(false);
    props.onClose?.();
  };

  const tray = (): JSX.Element => (
    <Suspense fallback={<Note>Looking through the bag…</Note>}>
      <PickerList {...props} bag={bag} showing={showing()} onDone={close} />
    </Suspense>
  );

  return (
    <Show when={props.inline !== true} fallback={tray()}>
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
        terse={props.terse}
      >
        {tray()}
        <DialogActions>
          {/* A single pick can also be no pick: the caller asked for an
              item, and "none" is an answer to that */}
          <Show when={props.multiple !== true && props.value != null}>
            <Button
              onClick={() => {
                if (props.multiple !== true) {
                  props.onPick(null, 0);
                }
                close();
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
