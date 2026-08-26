import matchesCatch, { type CatchContext, orderCatches } from '../../../auth/catch-search';
import { findDuplicates, giveItem, takeItem } from '../../../auth/caught';
import { useAuth } from '../../../auth/context';
import { ItemFlags, type Items } from '../../../data/ids/items';
import { getItemData } from '../../../data/items';
import InventoryPicker from '../../items/InventoryPicker';
import { Button, HoverCard, Row } from '../../styled';
import CatchCard from '../CatchCard';
import CatchGrid, { type CatchGridEntry } from '../CatchGrid';
import { asBoxEntry, describeCatch } from '../catch-summary';
import { type JSX, type Resource, Show, createEffect, createMemo, createSignal, untrack } from 'solid-js';
import type { CatchOption, CatchPickerProps } from './options';

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
 * The box itself, which is where the records are read.
 *
 * A list read in the body that declared it throws past every
 * `Suspense` written there and lands on the boundary around the whole
 * page, so the reading half is a component of its own
 */
export default function PickerBox(
  props: CatchPickerProps & {
    owned: Resource<CatchOption[]>;
    /**
     * The handful of facts a record does not carry — the buddy, the
     * lots on the block, the drafted party — which `is:buddy` and its
     * two neighbours are answered from
     */
    around: Resource<CatchContext>;
    showing: boolean;
    /**
     * What is being searched for. It belongs to whoever owns the
     * read: the store answers part of a search, so the query decides
     * which records are fetched as well as which of them are shown
     */
    search: string;
    onSearch: (value: string) => void;
    onHandled: () => void;
    onDone: () => void;
  },
): JSX.Element {
  const auth = useAuth();
  const [pending, setPending] = createSignal<string | null>(null);
  const [confirming, setConfirming] = createSignal(false);
  const [draft, setDraft] = createSignal<string[]>([]);

  const owner = (): string => props.player ?? auth.user()?.uid ?? '';

  /**
   * Which pokemon the bag is open for, while something is being picked
   * to give it
   */
  const [giving, setGiving] = createSignal<string | null>(null);

  const showing = (): boolean => props.showing;

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
    (props.options ?? props.owned.latest ?? [])
      .filter((option) => props.filter?.(option) ?? true)
      .sort((one, other) => other.caught.caughtAt.localeCompare(one.caught.caughtAt));

  const query = (): string => props.search;
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
        props.onHandled();
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
  /**
   * What the whole box says about itself, which no single record
   * knows: every species there is more than one of. Read off what was
   * offered rather than the page being shown, so narrowing the search
   * cannot change what counts as a duplicate
   */
  const duplicates = createMemo(() => findDuplicates(offered().map((option) => option.caught)));

  /**
   * A search hides rows rather than refusing them: a pokemon already
   * drafted stays drafted while it is out of sight, so typing to find
   * the sixth party member cannot quietly drop the other five.
   *
   * A `sort:` is applied last, over what is left, and overrides the
   * newest-first order the box arrives in
   */
  const options = (): CatchOption[] =>
    orderCatches(
      offered().filter((option) =>
        matchesCatch(option.caught, query(), {
          ...props.around.latest,
          id: option.id,
          duplicates: duplicates(),
        }),
      ),
      query(),
      (option) => option.caught,
    );

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

  const close = (): void => {
    setPending(null);
    setConfirming(false);
    props.onDone();
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

  /**
   * Every square the caller will accept, each carrying whether the
   * player has taken it or refuses it. A refusal is drawn rather than
   * hidden: a player hunting for a pokemon that is not in their party
   * wants to be told it is fighting somewhere else, not left to
   * wonder where it went
   */
  const entries = (): CatchGridEntry[] =>
    offered().map((option) => {
      const refused = props.reason?.(option) ?? null;
      const taken = props.multiple === true ? isDrafted(option.id) : props.value === option.id;
      const square = asBoxEntry([option.id, option.caught]);

      if (refused != null) {
        return {
          square: { ...square, mark: 'refused' as const, label: `${square.label} — ${refused}` },
          caught: option.caught,
        };
      }
      return {
        square: taken ? { ...square, mark: 'picked' as const } : square,
        caught: option.caught,
      };
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
  const confirmButton = (): JSX.Element => (
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

  return (
    // As wide as it is given, said out loud: a caller that centres what
    // it holds — Nurse Joy's counter, the daycare's — sizes its children
    // by their content, and a box of squares asked how wide it would
    // like to be answers with the width of thirty sprites
    <div class="flex w-full flex-col gap-3">
      {/* The same box the player keeps their collection in. Picking a
          party out of a hundred pokemon is looking rather than
          reading, and a list of a hundred lines was reading.

          The search is controlled from above because it does more
          than narrow the grid: the query also decides which records
          the store is asked for.

          Every square carries a card: what is in it, and the button
          that takes it. The bar is titled "Info" because the card
          under it already names the pokemon on its first line */}
      <CatchGrid
        entries={entries()}
        search={query()}
        onSearch={(typed) => {
          props.onSearch(typed);
        }}
        // The square is the button everywhere the card carries one
        // action: the card's own button stays for whoever hovered
        // first, and anything that costs something confirms on its
        // own terms — a listing opens its dialog, a double pick asks
        // "Sure?"
        onOpen={pressById}
        empty={props.empty ?? 'You have nothing for this.'}
        noMatch={`None of ${props.viewOnly === true ? 'theirs' : 'yours'} match that.`}
        cell={(entry) => (
          <Show when={options().find((option) => option.id === entry().id)}>
            {(option) => (
              <HoverCard
                class="block size-full"
                trigger={<span class="block size-full" />}
                title="Info"
                footer={
                  <>
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

      {/* The confirm sits under the list in both shapes: the dialog's
          own action row belongs to the outer component, which does not
          hold the draft. A live picker draws none at all — the caller
          has its own, and two buttons saying nearly the same thing is
          the thing being fixed */}
      <Show when={props.multiple === true && props.live !== true && props.viewOnly !== true}>
        <Row class="justify-center">{confirmButton()}</Row>
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
}
