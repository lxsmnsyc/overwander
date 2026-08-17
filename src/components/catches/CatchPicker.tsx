import { type JSX, Show, createEffect, createResource, createSignal, untrack } from 'solid-js';
import { isLockLive } from '../../auth/battle-lock';
import { type CaughtPokemon, giveItem, listCaught, takeItem } from '../../auth/caught';
import { syncServerClock } from '../../auth/clock';
import { useAuth } from '../../auth/context';
import { ItemFlags, type Items } from '../../data/ids/items';
import { getItemData } from '../../data/items';
import InventoryPicker from '../items/InventoryPicker';
import CatchBoxCanvas, { BOX_SIZE, type BoxEntry } from './CatchBoxCanvas';
import CatchCard from './CatchCard';
import { asBoxEntry, describeCatch } from './catch-summary';
import matches from '../../core/search';
import {
  Button,
  Dialog,
  DialogActions,
  HoverCard,
  Meta,
  Note,
  Row,
  SEARCH_FROM,
  Search,
} from '../styled';

/**
 * Picking one of the player's pokemon.
 *
 * A raid party, a breeding pair, a lot to auction, an egg to hand to
 * the daycare lady — every one of them is the same question with a
 * different rule about what counts as an answer, and each used to ask
 * it with its own list. This is the list; the rule is `filter` for what
 * to leave out and `reason` for what to show but refuse.
 *
 * It is a dialog by default. `inline` renders the list on its own for
 * callers that are already inside a dialog of their own, since a
 * dialog opened over a dialog fights it for the click that closes it.
 */


/**
 * Whether a pokemon is allowed to hold it at all. An item the registry
 * has never heard of has no flags to read, so it is left out rather
 * than assumed holdable
 */
function isHoldable(item: Items): boolean {
  try {
    return (getItemData(item).flags & ItemFlags.Holdable) !== 0;
  } catch {
    return false;
  }
}

/**
 * One of the player's pokemon, with the one thing a caller cannot read
 * off the record itself: whether it is in a battle right now. That
 * needs the server's clock, which the picker reads once for the whole
 * list rather than making every caller do it
 */
export interface CatchOption {
  id: string;
  caught: CaughtPokemon;
  fighting: boolean;
}

interface CatchPickerCommonProps {
  /**
   * Whose pokemon. Defaults to the signed-in player
   */
  player?: string;
  title?: string;
  /**
   * What the caller is asking for, in a sentence. The picker says
   * something sensible about how many it wants if the caller does not
   */
  description?: string;
  label?: string;
  /**
   * What a row's button says it will do. The pokemon follows it
   */
  verb?: string;
  empty?: string;
  /**
   * Ask once more before handing the pick back
   */
  confirm?: boolean;
  /**
   * Whether the list is showing but not taking picks — a catch in a
   * live battle, say, where every row is refused for the same reason
   */
  disabled?: boolean;
  /**
   * Whether the box belongs to somebody else.
   *
   * It is not `disabled`: the squares still answer a press, because
   * looking at one of a stranger's pokemon is the whole reason their
   * box is on screen. What goes is everything that would *take* one —
   * the confirm, the "Pick none", the second press that asks whether
   * you meant it — since none of them is a question about a
   * collection that is not yours
   */
  viewOnly?: boolean;
  /**
   * Render the list on its own, with no dialog and no button to open
   * one
   */
  inline?: boolean;
  open?: boolean;
  onClose?: () => void;
  /**
   * Which pokemon the caller can accept at all. Anything else is left
   * out of the list
   */
  filter?: (option: CatchOption) => boolean;
  /**
   * Why a pokemon that *is* in the list cannot be picked — "in a
   * raid", "fainted". A row with a reason is shown, said, and
   * disabled, so a player counting their party knows where one went
   * instead of finding it missing
   */
  reason?: (option: CatchOption) => string | null;
  /**
   * Something worth saying about a row that does not stop it being
   * picked — what a fee would buy this particular egg, say
   */
  note?: (option: CatchOption) => string | null;
  /**
   * The records, already in hand. A caller showing two pickers over
   * one set of catches reads them once and passes them to both
   */
  options?: CatchOption[];
  /**
   * Changing this re-reads the records
   */
  revision?: unknown;
}

export type CatchPickerProps = CatchPickerCommonProps &
  (
    | {
        multiple?: false;
        value: string | null;
        onPick: (caught: string | null) => void;
        max?: undefined;
      }
    | {
        multiple: true;
        value: string[];
        onPick: (caught: string[]) => void;
        /**
         * How many may be picked at once — a party of six, a pair of
         * parents. Rows stop taking picks once it is reached
         */
        max?: number;
        /**
         * Report every press rather than waiting to be confirmed, and
         * draw no confirm button.
         *
         * It is for a caller that already has a button of its own —
         * the breeder's "Breed", the nurse's "Hand over" — where the
         * picker's own confirm was a second button next to it saying
         * very nearly the same thing. The caller holds the picks and
         * decides what they are worth
         */
        live?: boolean;
      }
  );

export default function CatchPicker(props: CatchPickerProps): JSX.Element {
  const auth = useAuth();
  const [opened, setOpened] = createSignal(false);
  const [pending, setPending] = createSignal<string | null>(null);
  const [confirming, setConfirming] = createSignal(false);
  const [draft, setDraft] = createSignal<string[]>([]);

  const owner = (): string => props.player ?? auth.user()?.uid ?? '';

  /**
   * Which pokemon the bag is open for, while something is being picked
   * to give it
   */
  const [giving, setGiving] = createSignal<string | null>(null);
  /** Bumped by a give or a take, so the records are read again */
  const [handled, setHandled] = createSignal(0);


  const showing = (): boolean => props.inline === true || (props.open ?? opened());

  const [owned] = createResource(
    () =>
      showing() && props.options == null
        ? ([owner(), props.revision, handled()] as const)
        : null,
    async ([player]): Promise<CatchOption[]> => {
      // The clock is the server's, so a lock that has timed out reads
      // as free rather than as whatever this device believes
      const [records, now] = await Promise.all([listCaught(player), syncServerClock()]);

      return records.map(([id, caught]) => ({ id, caught, fighting: isLockLive(caught, now) }));
    },
  );

  /**
   * Whether there is nothing to show yet — as opposed to a list on
   * screen being read again, which keeps what it has
   */
  const loading = (): boolean => props.options == null && owned.latest == null && owned.loading;

  /**
   * What the caller will accept, before the player narrows it further.
   *
   * Newest first, everywhere. A player comes back to what they just
   * caught far more often than to what they caught in March, and the
   * box in the profile has always been ordered this way — a picker
   * that showed the same collection in a different order was the same
   * box twice with the pokemon in different squares.
   *
   * Read through `latest` rather than the resource: reading one that
   * is loading throws to the nearest Suspense boundary, and the
   * nearest one to a picker inside a dialog is the root of the whole
   * app. Nurse Joy re-reads this list every time she hands a party
   * back, so a plain read took the page down for the length of the
   * round trip
   */
  const offered = (): CatchOption[] =>
    (props.options ?? owned.latest ?? [])
      .filter((option) => props.filter?.(option) ?? true)
      .sort((one, other) => other.caught.caughtAt.localeCompare(one.caught.caughtAt));

  const [query, setQuery] = createSignal('');
  /**
   * Whether these are the reader's own pokemon. Somebody else's box is
   * read and nothing else: there is nothing of theirs to hand an item
   * to and nothing of theirs to take one from
   */
  const mine = (): boolean => props.viewOnly !== true && owner() === auth.user()?.uid;

  /**
   * Hand something over, or take it back. Both are the server's — the
   * bag and the record move together — and both leave the list to be
   * read again so the card shows what the pokemon is holding now
   */
  const settle = (done: Promise<boolean>): void => {
    done
      .then(() => {
        setHandled((count) => count + 1);
      })
      .catch(() => {
        // A refusal leaves the record as it was, which the card is
        // already showing
      });
  };

  const give = (catchId: string, item: Items): void => {
    setGiving(null);
    settle(giveItem(catchId, item));
  };

  const take = (catchId: string, item: Items): void => {
    settle(takeItem(catchId, item));
  };

  /**
   * A search hides rows rather than refusing them: a pokemon already
   * drafted stays drafted while it is out of sight, so typing to find
   * the sixth party member cannot quietly drop the other five
   */
  const options = (): CatchOption[] =>
    offered().filter((option) => matches(describeCatch(option.caught), query()));

  const chosen = (): string[] => (props.multiple === true ? props.value : []);

  const limit = (): number =>
    props.multiple === true ? (props.max ?? Number.POSITIVE_INFINITY) : 1;

  createEffect(() => {
    if (!showing()) {
      return;
    }
    // A live picker has no picks of its own: it reports every press
    // and the caller decides what they are worth, so what the caller
    // holds is what the squares show. Nurse Joy handing a party back
    // hands back an empty list, and the box has to let go of them —
    // otherwise the six she just returned are still lit, under a
    // button still offering to hand them over.
    //
    // Every other picker keeps its draft to itself until it is
    // confirmed, so the caller's value is read once and untracked
    setDraft(props.multiple === true && props.live === true ? chosen() : untrack(chosen));
  });

  const isDrafted = (id: string): boolean => new Set(draft()).has(id);

  /**
   * What the picker is asking for. A caller with something more
   * specific to say says it; otherwise the question is how many, which
   * the picker already knows
   */
  const purpose = (): string => {
    if (props.description != null) {
      return props.description;
    }
    if (props.viewOnly === true) {
      return 'What this trainer has caught.';
    }
    if (props.multiple !== true) {
      return 'Choose one of your pokemon.';
    }
    return limit() === Number.POSITIVE_INFINITY
      ? 'Choose from your pokemon.'
      : `Choose from your pokemon — up to ${limit()} of them.`;
  };

  const close = (): void => {
    setPending(null);
    setConfirming(false);
    setOpened(false);
    props.onClose?.();
  };

  const pickOne = (id: string | null): void => {
    if (props.multiple === true) {
      return;
    }
    props.onPick(id);
    close();
  };

  const pickMany = (): void => {
    if (props.multiple !== true) {
      return;
    }
    props.onPick(draft());
    close();
    // Back to whatever the caller holds now that it has been told.
    //
    // A dialog gets this for nothing — it is shut, and opening it
    // again reads `value` afresh — but an inline list stays on screen
    // with the picks still lit and the button still counting them. A
    // player who handed six pokemon to Nurse Joy saw the same six
    // still selected and the same button still offering to hand them
    // over, which reads as a press that did nothing
    if (props.inline === true) {
      setDraft(untrack(chosen));
    }
  };

  const press = (option: CatchOption): void => {
    if (props.reason?.(option) != null) {
      return;
    }
    // Somebody else's box: a press is a look at the record rather than
    // a pick, so it is reported at once and asked about no further
    if (props.viewOnly === true) {
      pickOne(option.id);
      return;
    }
    if (props.multiple === true) {
      if (isDrafted(option.id)) {
        setDraft(draft().filter((id) => id !== option.id));
      } else if (draft().length < limit()) {
        setDraft([...draft(), option.id]);
      }
      // A live picker has no confirm of its own: the caller's button
      // is the confirm, so the caller is told on every press
      if (props.live === true) {
        props.onPick(draft());
      }
      return;
    }
    if (props.confirm === true && pending() !== option.id) {
      setPending(option.id);
      return;
    }
    pickOne(option.id);
  };

  const finish = (): void => {
    if (props.confirm === true && !confirming()) {
      setConfirming(true);
      return;
    }
    pickMany();
  };

  const [box, setBox] = createSignal(0);

  const boxes = (): number => Math.max(1, Math.ceil(options().length / BOX_SIZE));

  // A search that empties the last box would leave the player looking
  // at nothing; whatever they type, they end up somewhere with pokemon
  createEffect(() => {
    setBox((at) => Math.min(at, boxes() - 1));
  });

  /**
   * The squares of the box being looked at, each carrying whether the
   * caller has taken it or refuses it. A refusal is drawn rather than
   * hidden: a player hunting for a pokemon that is not in their party
   * wants to be told it is fighting somewhere else, not left to
   * wonder where it went
   */
  const page = (): BoxEntry[] =>
    options()
      .slice(box() * BOX_SIZE, (box() + 1) * BOX_SIZE)
      .map((option) => {
        const refused = props.reason?.(option) ?? null;
        const taken = props.multiple === true ? isDrafted(option.id) : props.value === option.id;
        const square = asBoxEntry([option.id, option.caught]);

        if (refused != null) {
          return { ...square, mark: 'refused' as const, label: `${square.label} — ${refused}` };
        }
        return taken ? { ...square, mark: 'picked' as const } : square;
      });

  /**
   * What the button on a card says it will do. A box being browsed
   * opens the record; a box being picked from takes one, and a pokemon
   * already taken is handed back rather than taken twice
   */
  const verb = (option: CatchOption): string => {
    if (props.viewOnly === true) {
      return 'Open';
    }
    if (props.multiple === true) {
      return isDrafted(option.id) ? 'Remove' : 'Add';
    }
    return props.verb ?? 'Pick';
  };

  const pressById = (id: string): void => {
    const option = options().find((entry) => entry.id === id);

    if (option != null && props.disabled !== true) {
      press(option);
    }
  };

  /**
   * The button that takes the picks.
   *
   * It belongs beside the way out rather than in the middle of the
   * panel: "Join with 3/6" and "Close" are the two things a player
   * does with this screen, and one of them was floating above a list
   * while the other sat in the corner
   */
  const confirm = (): JSX.Element => (
    <Button
      tone="primary"
      disabled={props.disabled === true || draft().length === 0}
      onClick={finish}
    >
      {confirming()
        ? 'Sure?'
        : `${props.verb ?? 'Take'} ${draft().length}${
            limit() === Number.POSITIVE_INFINITY ? '' : `/${limit()}`
          }`}
    </Button>
  );

  const list = (): JSX.Element => (
    <div class="flex flex-col gap-3">
      <Show when={offered().length > SEARCH_FROM}>
        <Row>
          <Search
            placeholder={props.viewOnly === true ? 'Search their pokemon' : 'Search your pokemon'}
            value={query()}
            onChange={(typed) => {
              setQuery(typed);
            }}
          />
        </Row>
      </Show>

      <Show when={!loading()} fallback={<Note>Looking them over…</Note>}>
        <Show
          when={options().length}
          fallback={
            <Note>
              {query().length === 0
                ? (props.empty ?? 'You have nothing for this.')
                : `None of ${props.viewOnly === true ? 'theirs' : 'yours'} match that.`}
            </Note>
          }
        >
          {/* The same box the player keeps their collection in. Picking
              a party out of a hundred pokemon is looking rather than
              reading, and a list of a hundred lines was reading.

              Every square carries a card: what is in it, and the button
              that takes it. The bar is titled "Info" because the card
              under it already names the pokemon on its first line */}
          <CatchBoxCanvas
            entries={page()}
            onOpen={pressById}
            cardOnly
            cell={(entry) => (
              <Show when={options().find((option) => option.id === entry().id)}>
                {(option) => (
                  <HoverCard
                    class="block size-full"
                    trigger={<span class="block size-full" />}
                    title="Info"
                    footer={
                      <>
                        <Meta>{props.reason?.(option()) ?? props.note?.(option()) ?? ''}</Meta>
                        <Button
                          tone="primary"
                          disabled={props.disabled === true || props.reason?.(option()) != null}
                          onClick={() => {
                            pressById(option().id);
                          }}
                        >
                          {verb(option())}
                        </Button>
                      </>
                    }
                  >
                    <CatchCard
                      caught={option().caught}
                      owned={mine()}
                      onGive={() => {
                        setGiving(option().id);
                      }}
                      onTake={(item) => {
                        take(option().id, item);
                      }}
                    />
                  </HoverCard>
                )}
              </Show>
            )}
          />

          <Show when={boxes() > 1}>
            <Row class="justify-center">
              <Button
                disabled={box() === 0}
                onClick={() => {
                  setBox((at) => Math.max(0, at - 1));
                }}
              >
                ‹
              </Button>
              <Meta>
                Box {box() + 1} of {boxes()}
              </Meta>
              <Button
                disabled={box() >= boxes() - 1}
                onClick={() => {
                  setBox((at) => Math.min(boxes() - 1, at + 1));
                }}
              >
                ›
              </Button>
            </Row>
          </Show>
        </Show>
      </Show>

      {/* A single pick that asks twice does it here rather than in the
          square: there is no room under a sprite for a question */}
      <Show when={options().find((one) => one.id === pending())}>
        {(asked) => (
          <Row class="justify-center">
            <Button
              tone="primary"
              onClick={() => {
                pickOne(asked().id);
              }}
            >
              {props.verb ?? 'Pick'} {describeCatch(asked().caught)}?
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

      {/* Inline, the confirm sits under the list: there is no dialog
          row for it to stand on. A live picker draws none at all —
          the caller has its own, and two buttons saying nearly the
          same thing is the thing being fixed */}
      <Show
        when={
          props.multiple === true &&
          props.inline === true &&
          props.live !== true &&
          props.viewOnly !== true
        }
      >
        <Row class="justify-center">{confirm()}</Row>
      </Show>

      {/* The bag, opened from an empty slot on a pokemon's card. It is
          a window of its own for the reason every other tray is: a
          list of thirty squares unfolded into this one would push the
          box it was opened from off the screen */}
      <InventoryPicker
        open={giving() != null}
        onClose={() => {
          setGiving(null);
        }}
        player={owner()}
        title="Give an item"
        description="Choose what it should carry."
        verb="Give"
        value={null}
        filter={(entry) => isHoldable(entry.item)}
        empty="Nothing in the bag can be held."
        onPick={(item) => {
          const catchId = giving();

          setGiving(null);
          if (catchId != null && item != null) {
            give(catchId, item);
          }
        }}
      />
    </div>
  );

  return (
    <Show when={props.inline !== true} fallback={list()}>
      {/* The button that opens it, for a caller that has not said
          when it opens. One that passes `open` has a trigger of its
          own — a grunt's challenge, a lair — and this one turned up
          beside it saying the same thing twice, or, where the caller
          was a dialog, loose on the page behind it */}
      <Show when={props.open === undefined}>
        <Button
          onClick={() => {
            setOpened(true);
          }}
        >
          {props.label ?? props.title ?? 'Pick a pokemon'}
        </Button>
      </Show>
      <Dialog
        isOpen={showing()}
        onClose={close}
        title={props.title ?? (props.viewOnly === true ? 'Their pokemon' : 'Your pokemon')}
        description={purpose()}
      >
        {list()}
        <DialogActions>
          <Show when={props.multiple !== true && props.value != null && props.viewOnly !== true}>
            <Button
              onClick={() => {
                pickOne(null);
              }}
            >
              Pick none
            </Button>
          </Show>
          <Show when={props.multiple === true && props.viewOnly !== true}>{confirm()}</Show>
          <Button onClick={close}>Close</Button>
        </DialogActions>
      </Dialog>
    </Show>
  );
}
