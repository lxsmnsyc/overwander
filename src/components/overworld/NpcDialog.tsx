import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createMemo,
  createResource,
  createSignal,
} from 'solid-js';
import { isLockLive } from '../../auth/battle-lock';
import { type CaughtPokemon, isGuarded, listCaught } from '../../auth/caught';
import { syncServerClock } from '../../auth/clock';
import { isShadow } from '../../auth/caught-record';
import { boostedSteps, isEgg, stepsRemaining } from '../../auth/egg';
import { describeFriendship, groomedFriendship } from '../../data/constants/friendship';
import { type InventoryEntry, getInventory } from '../../auth/inventory';
import { getProfile } from '../../auth/profile';
import {
  boostEgg,
  breed,
  buyFossil,
  buyFromVendor,
  groomCatch,
  remindMove,
  reviveFossil,
  sellToVendor,
  visitNurse,
} from '../../auth/npcs';
import { Items } from '../../data/ids/items';
import type { Moves } from '../../data/ids/moves';
import { FOSSIL_SPECIES, getItemData, isFossil } from '../../data/items';
import { getHeldPowerStat } from '../../data/items/power-items';
import { FOSSIL_REVIVE_LEVEL, getFossilPrice } from '../../data/overworld/fossil';
import { getSpeciesData } from '../../data/species';
import Npc, {
  BREEDING_FEE,
  DAYCARE_FEE,
  GROOMING_FEE,
  NPC_NAMES,
  REMINDER_FEE,
  getRecallableMoves,
} from '../../data/overworld/npc';
import { VENDOR_TRADE_LIMIT } from '../../data/overworld/vendor';
import { type BreedingParent, canBreed } from '../../overworld/breeding';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import CatchPicker, { type CatchOption } from '../catches/CatchPicker';
import InventoryPicker, { type ItemAmount, describeItem } from '../items/InventoryPicker';
import ItemSprite from '../items/ItemSprite';
import TeachMoveDialog, { MoveLine } from '../catches/TeachMoveDialog';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogSection,
  List,
  ListRow,
  Meta,
  Note,
  Row,
  RowButton,
  Status,
} from '../styled';

/**
 * What the person standing there actually says.
 *
 * Each of them is one offer, and the sentence explaining it used to be
 * the dialog's own description — the same line of small grey text
 * every screen in the game has, which is the game explaining rather
 * than somebody talking. Said in their own words and set under them,
 * it reads as the person the player has walked up to, and it says the
 * one thing the row of controls beneath cannot: what this is for.
 *
 * They are quotes, so they are written as quotes
 */
export const NPC_QUOTES: Record<Npc, string> = {
  [Npc.Breeder]:
    'Leave me two that get along and I will see what comes of it. The egg is yours — you do the walking.',
  [Npc.DaycareLady]:
    'Give me that egg a while. I cannot hurry it much, but half of what is left is half you need not walk.',
  [Npc.NurseJoy]:
    'Hand them over, all of them. Nothing to pay — I am only here until the day turns over.',
  [Npc.Groomer]:
    'Brushed, fussed over and handed straight back thinking the world of you. Works best on one that barely knows you — and not at all on a shadow.',
  [Npc.Vendor]:
    'Crate is open. I will sell you what is in it and buy near enough anything you are carrying — as often as your purse holds out.',
  [Npc.MoveReminder]:
    'It has not forgotten a thing, you know. One Heart Scale and I will remind it.',
  // The grunt never opens this dialog — walking up to one puts the
  // challenge in `RocketStopDialog`, which says this line instead —
  // but they are one of the people a wandering cell draws, so their
  // words live with the rest
  [Npc.RocketGrunt]: 'Three of mine against however many of yours.',
  [Npc.FossilManiac]:
    'Dug these out myself. Two is all I am carrying, and one is all I am parting with today — the rest of the world stopped making them.',
  [Npc.FossilScientist]:
    'Hand me the rock and give me a moment. Whatever is in there has been waiting rather a long while — bring me another when you find one.',
};

/**
 * A catch as the breeding rules read one
 */
function asParent(caught: CaughtPokemon): BreedingParent {
  const held = new Set(caught.items);

  return {
    species: caught.species,
    gender: caught.gender,
    ivs: caught.ivs,
    moves: caught.moves,
    shadow: isShadow(caught),
    nature: caught.nature,
    ability: caught.abilities[0],
    ball: caught.ball,
    everstone: held.has(Items.Everstone),
    destinyKnot: held.has(Items.DestinyKnot),
    powerStat: getHeldPowerStat(caught.items),
    egg: isEgg(caught),
  };
}

/**
 * How every one of these sections is laid out.
 *
 * Down the middle, all of them. The dialog is one person making one
 * offer — a picture of them, a line of what they say, and the thing
 * they want picked — and a column of left-aligned lists under a
 * centred portrait read as two screens stuck together
 */
const CENTRED = 'items-center text-center';

/**
 * What is inside a fossil, said in the one word a player is actually
 * deciding on. It is no secret — the rock names the species — and a
 * fossil bought or opened without being told which one it is would be
 * a decision made blind
 */
function fossilHolds(item: Items): string {
  const species = FOSSIL_SPECIES.get(item);

  return species == null ? '' : getSpeciesData(species).name;
}

/**
 * What one of these costs, from whichever side of the counter it is
 * being looked at. He charges `buy` and pays `sell`, and `sell` is
 * half of `buy` everywhere
 */
function priceOf(item: Items, buying: boolean): number {
  const data = getItemData(item);

  return buying ? data.buy : data.sell;
}

export interface NpcDialogProps {
  player: string;
  /**
   * The chunk the player is standing in, and the cell they walked
   * up to — the server re-derives who is standing there from both
   */
  snapshot: ChunkSnapshot | null;
  /**
   * Who is standing there, or null when the dialog is closed
   */
  standing: [cell: number, npc: Npc] | null;
  onClose: () => void;
  /**
   * Fired when something landed — an egg was made, an egg moved on —
   * so the list behind the dialog can catch up
   */
  onChange?: () => void;
}

/**
 * The person a player has walked up to. A breeder wants two pokemon
 * and a fee; a daycare lady wants an egg and a fee; Nurse Joy wants
 * nothing at all, and gives a party back whole once a window. Any of
 * them can be walked away from
 */
/**
 * What the person has to offer, which is where the box, the purse and
 * the bag are all read.
 *
 * Any of them read in the body that declared it would throw past every
 * `Suspense` written there and land on the boundary around the whole
 * page, taking the world down while somebody was being served
 */
function NpcCounter(
  props: NpcDialogProps & {
    catches: Resource<CatchOption[]>;
    gold: Resource<number>;
    bag: Resource<InventoryEntry[]>;
    onServed: () => void;
    onTraded: () => void;
  },
): JSX.Element {
  const [status, setStatus] = createSignal<string | null>(null);
  const [chosen, setChosen] = createSignal<string[]>([]);
  const [busy, setBusy] = createSignal(false);
  // Which side of the counter is being looked at, or null while the
  // player has only been offered the two words
  const [counter, setCounter] = createSignal<'buy' | 'sell' | null>(null);
  // What the Move Reminder has been told so far: which pokemon, and
  // which of the moves it has lost. `reminding` is the two of them
  // agreed to, and while it is set this dialog is closed — the
  // teaching is a dialog of its own, and one modal over another
  // fights it for the closing click
  const [remindee, setRemindee] = createSignal<string | null>(null);
  const [recall, setRecall] = createSignal<Moves | null>(null);
  const [reminding, setReminding] = createSignal<[catchId: string, move: Moves] | null>(null);
  // Which of the two the maniac is carrying has been pointed at, and
  // which of the ones in the bag has been put on the scientist's
  // bench. Neither is spent until the button on the bar is pressed
  const [buying, setBuying] = createSignal<Items | null>(null);
  const [opening, setOpening] = createSignal<Items | null>(null);

  /**
   * The purse and the bag. Both are re-read after every trade, since a
   * sale moves one and a purchase moves both
   */

  /**
   * What the vendor is carrying. It is derived from the window the
   * same way he is, so the crate needs no read of its own — and the
   * server derives it again before it takes a coin
   */
  const stock = (): Items[] => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    return snapshot == null || standing == null ? [] : snapshot.getVendorStock(standing[0]);
  };

  /**
   * The crate as a list the picker can read: the same shape a bag has,
   * so buying and selling are the same list asked in two directions.
   *
   * What stands in for a stack's count is **how many he will part with
   * at once** — he has as many potions as anyone wants, and the limit
   * is the trade's rather than the crate's.
   *
   * It used to be how many the purse could cover, which put an item
   * the player could not afford in the list at "× 0" wearing a badge
   * saying so. That is the same refusal three times over: the count,
   * the badge, and the total at the bottom that will not let the trade
   * through. The price beside the row is what a player is deciding
   * with, and the total is where a purse that will not stretch says so
   */
  const crate = (): InventoryEntry[] =>
    stock().map((item) => ({
      user: props.player,
      item,
      amount: VENDOR_TRADE_LIMIT,
    }));

  /**
   * The player's pokemon as every picker in this dialog reads them.
   *
   * `latest`, not the resource. Every one of these people writes and
   * then re-reads the list, and a read that suspends throws to the
   * nearest Suspense boundary — which, from inside a dialog, is the
   * root of the whole app. Handing a party to Nurse Joy took the
   * entire page down for the length of the round trip and brought it
   * back with the dialog shut
   */
  const offers = (): CatchOption[] => props.catches() ?? [];

  const pair = (): [CatchOption, CatchOption] | null => {
    const picked = chosen();

    if (picked.length !== 2) {
      return null;
    }

    const found = picked.map((id) => offers().find((entry) => entry.id === id));

    return found[0] == null || found[1] == null ? null : [found[0], found[1]];
  };

  const compatible = (): boolean => {
    const chosenPair = pair();

    return (
      chosenPair != null && canBreed(asParent(chosenPair[0].caught), asParent(chosenPair[1].caught))
    );
  };

  /**
   * Who the dialog is about, held past the moment they are dismissed.
   *
   * A dialog is on screen for the length of its fade after it closes,
   * and `standing` is null for all of it — so a panel read straight off
   * the prop empties as it leaves and shows a nameless dialog belonging
   * to nobody. The hold is for **showing** only: anything that acts on
   * the person still reads `props.standing`, which is what makes the
   * buttons dead the moment they are gone
   */
  const showing = createMemo<[cell: number, npc: Npc] | null>(
    (held) => props.standing ?? held ?? null,
    null,
  );

  /**
   * Who is standing there. The dialog is named after them, and it is
   * named whether or not somebody has been walked up to yet
   */
  const who = (): string => {
    const npc = showing()?.[1];

    return npc == null ? 'Somebody' : NPC_NAMES[npc];
  };

  /**
   * How many Heart Scales are in the bag. It is the reminder's whole
   * price, and it is read off the same bag the vendor's picker reads
   */
  const scales = (): number =>
    (props.bag() ?? []).find((entry) => entry.item === REMINDER_FEE)?.amount ?? 0;

  /**
   * Which pokemon has been picked out for the reminder
   */
  const remembering = (): CatchOption | null =>
    offers().find((option) => option.id === remindee()) ?? null;

  /**
   * What he could give this one back: everything its species learns by
   * levelling up to its level, minus the moves it still knows. It is
   * derived, so the client works it out for the list and the server
   * works it out again from the stored record before taking the scale
   */
  const forgotten = (): Moves[] => {
    const option = remembering();

    return option == null
      ? []
      : getRecallableMoves(option.caught.species, option.caught.level, option.caught.moves);
  };

  const forget = (): void => {
    setRemindee(null);
    setRecall(null);
  };

  /**
   * The two the maniac is carrying. Derived from the window he was,
   * so it needs no read of its own — and the server derives the pair
   * again before it takes a coin
   */
  const offer = (): Items[] => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    return snapshot == null || standing == null ? [] : snapshot.getFossilOffer(standing[0]);
  };

  /**
   * What is in the bag that the scientist can open
   */
  const fossils = (): InventoryEntry[] =>
    (props.bag() ?? []).filter((entry) => isFossil(entry.item) && entry.amount > 0);

  const close = (): void => {
    setStatus(null);
    setChosen([]);
    setCounter(null);
    forget();
    setReminding(null);
    setBuying(null);
    setOpening(null);
    props.onClose();
  };

  const submitPair = (): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;
    const chosenPair = pair();

    if (snapshot == null || standing == null || chosenPair == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    breed(snapshot, standing[0], [chosenPair[0].id, chosenPair[1].id])
      .then((egg) => {
        setBusy(false);

        if (egg == null) {
          setStatus(
            'The breeder handed them back — that pair, that price, or you have already left a pair with him this while.',
          );
          return;
        }
        setChosen([]);
        setStatus(`An egg. It is yours — carry it as your buddy and walk. (−${BREEDING_FEE} gold)`);
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const tendParty = (picked: string[]): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null || picked.length === 0) {
      return;
    }
    setStatus(null);
    setBusy(true);
    visitNurse(snapshot, standing[0], picked)
      .then((tended) => {
        setBusy(false);
        setStatus(
          tended == null
            ? 'She looked it over and handed it straight back — there was nothing to do, or she has already seen you this while.'
            : 'She looked after it. Right as rain.',
        );
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const pushEgg = (id: string): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    boostEgg(snapshot, standing[0], id)
      .then((steps) => {
        setBusy(false);
        setStatus(
          steps == null
            ? 'She would not take it — it may be ready already, or she has already warmed one for you this while.'
            : `She warmed it along to ${steps} steps. (−${DAYCARE_FEE} gold)`,
        );
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const groom = (id: string): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    groomCatch(snapshot, standing[0], id)
      .then((friendship) => {
        setBusy(false);
        setStatus(
          friendship == null
            ? 'He would not take it — it may be a shadow, it may think as well of you as it can already, or he has already seen you this while.'
            : `Brushed, fussed over and handed back ${describeFriendship(friendship)}. (−${GROOMING_FEE} gold)`,
        );
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * How many of it the player is carrying. It is what the crate cannot
   * say — his counts are his — and what a player buying a third potion
   * is actually deciding with
   */
  const carrying = (item: Items): number =>
    (props.bag() ?? []).find((entry) => entry.item === item)?.amount ?? 0;

  /**
   * Trade one of something, either way across the counter.
   *
   * One press, one item, one transaction. It was a basket filled and
   * then checked over, which is two screens and three presses for the
   * thing a player does most: buying a potion. The price is on the
   * square and what it leaves the purse at is the badge above the
   * crate, so the card's button is the whole of the decision
   */
  const trade = (item: Items, buyingIt: boolean): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return;
    }

    const picks: ItemAmount[] = [[item, 1]];

    setStatus(null);
    setBusy(true);
    (buyingIt
      ? buyFromVendor(snapshot, standing[0], picks)
      : sellToVendor(snapshot, standing[0], picks)
    )
      .then((done) => {
        setBusy(false);

        if (done == null) {
          setStatus(
            buyingIt
              ? 'He would not sell you that — it is not in his crate, or your purse will not cover it.'
              : 'He would not take that — it is worth nothing to him, or you have not got it.',
          );
          return;
        }

        const moved = priceOf(item, buyingIt);

        setStatus(
          buyingIt
            ? `He handed over a ${describeItem(item)} and counted your gold. (−${moved} gold)`
            : `He looked your ${describeItem(item)} over and paid up. (+${moved} gold)`,
        );
        props.onTraded();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * Buy the fossil that has been pointed at. He sells one while he is
   * standing here, so the refusal covers both a purse that will not
   * stretch and a player he has already dealt with
   */
  const buyRock = (): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;
    const item = buying();

    if (snapshot == null || standing == null || item == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    buyFossil(snapshot, standing[0], item)
      .then((done) => {
        setBusy(false);

        if (done == null) {
          setStatus(
            'He would not part with it — your purse will not cover it, or he has already sold you one this while.',
          );
          return;
        }
        setBuying(null);
        setStatus(`He wrapped it up and counted your gold. (−${getFossilPrice(item)} gold)`);
        props.onTraded();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * Put the fossil on the bench. What comes out is the fossil's
   * rather than anybody's choice, and the rock is gone either way —
   * which is why it is a button on the bar rather than a press on the
   * row
   */
  const openRock = (): void => {
    const snapshot = props.snapshot;
    const standing = props.standing;
    const item = opening();

    if (snapshot == null || standing == null || item == null) {
      return;
    }
    setStatus(null);
    setBusy(true);
    reviveFossil(snapshot, standing[0], item)
      .then((revived) => {
        setBusy(false);

        if (revived == null) {
          setStatus('Nothing came of it — you may not be carrying that any more.');
          return;
        }
        setOpening(null);
        setStatus(
          `The rock came apart and left a ${getSpeciesData(revived.species).name} behind, level ${
            revived.level
          }.${revived.shiny ? ' It sparkles.' : ''}`,
        );
        props.onTraded();
        props.onServed();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setBusy(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * Hand the scale over and take the move back.
   *
   * It is the teaching dialog's `teach`, so what a player agreed to
   * there is what is asked for here — and the scale leaves the bag in
   * the same transaction the move list is written in, which is what
   * makes a refusal cost nothing
   */
  const remind = async (
    catchId: string,
    move: Moves,
    replaces: number,
  ): Promise<Moves[] | null> => {
    const snapshot = props.snapshot;
    const standing = props.standing;

    if (snapshot == null || standing == null) {
      return null;
    }
    return remindMove(snapshot, standing[0], catchId, move, replaces);
  };

  /**
   * What each of them offers, as the one or two buttons that do it.
   *
   * They live on the dialog's bottom bar rather than in the section
   * they belong to, so every one of these dialogs is answered in the
   * same place — and the vendor, whose offer is three screens deep,
   * says what pressing on means at each of them
   */
  const npcActions = (npc: Npc): JSX.Element => {
    if (npc === Npc.Breeder) {
      return (
        <Button tone="primary" disabled={busy() || !compatible()} onClick={submitPair}>
          Breed ({BREEDING_FEE} gold)
        </Button>
      );
    }
    if (npc === Npc.MoveReminder) {
      return (
        <Button
          tone="primary"
          disabled={busy() || scales() < 1 || remindee() == null || recall() == null}
          onClick={() => {
            const id = remindee();
            const move = recall();

            if (id != null && move != null) {
              setReminding([id, move]);
            }
          }}
        >
          Remind it (1 Heart Scale)
        </Button>
      );
    }
    if (npc === Npc.FossilManiac) {
      const item = buying();

      return (
        <Button
          tone="primary"
          disabled={busy() || item == null || getFossilPrice(item) > (props.gold() ?? 0)}
          onClick={buyRock}
        >
          {item == null ? 'Buy' : `Buy (${getFossilPrice(item)} gold)`}
        </Button>
      );
    }
    if (npc === Npc.FossilScientist) {
      return (
        <Button tone="primary" disabled={busy() || opening() == null} onClick={openRock}>
          Revive it
        </Button>
      );
    }
    if (npc !== Npc.Vendor) {
      // The daycare lady and the groomer take one pokemon and act on
      // it the moment it is pressed, so there is nothing left to agree
      // to — a button here would only ask the same question twice
      return null;
    }

    // Both open a window of their own, and what is picked in it is
    // agreed to in another — so the bar itself only ever offers the two
    // words
    return (
      <>
        <Button
          tone="primary"
          disabled={busy()}
          onClick={() => {
            setStatus(null);
            setCounter('buy');
          }}
        >
          Buy
        </Button>
        <Button
          disabled={busy()}
          onClick={() => {
            setStatus(null);
            setCounter('sell');
          }}
        >
          Sell
        </Button>
      </>
    );
  };

  /**
   * The scale is gone and the move is back. The bag is re-read the way
   * a trade re-reads it, since that is where the scale went from
   */
  const remembered = (): void => {
    forget();
    setStatus('He hummed, tapped its head, and it remembered. (−1 Heart Scale)');
    props.onTraded();
    props.onServed();
    props.onChange?.();
  };

  return (
    <>
      <Dialog
        isOpen={props.standing != null && reminding() == null}
        onClose={close}
        title={who()}
        terse
        description="Somebody standing out here with an offer. They will be gone when the window
        turns over, and each of them takes you up on it once while they are here — the vendor
        as often as your purse allows."
      >
        <Show when={showing()}>
          {(standing) => (
            <>
              {/* Where they will stand once there is somebody drawn.
                  The room is held now rather than added later, so the
                  dialog does not change shape under a player who
                  already knows it — the same room the grunt's stop
                  keeps.

                  What they say goes under them rather than in the
                  dialog's description, where it was the game's voice
                  rather than theirs */}
              <div class="flex flex-col items-center gap-2 pt-1 text-center">
                <div
                  class="flex h-24 w-24 items-end justify-center rounded-panel border border-dashed
                    border-line bg-line-soft/60 text-xs text-muted"
                >
                  <span class="pb-2">{who()}</span>
                </div>
                <blockquote class="m-0 max-w-prose text-sm text-muted italic">
                  “{NPC_QUOTES[standing()[1]]}”
                </blockquote>
              </div>

              <Show when={standing()[1] === Npc.Breeder}>
                <DialogSection class={CENTRED}>
                  {/* The pair is picked with the same list every other
                    part of the game picks a pokemon with; what makes
                    it a breeding pair is the two, and the rule about
                    what can be one.

                    Live, so the picker draws no confirm of its own:
                    "Leave 2/2" and "Leave them" were two buttons for
                    one press, and the second was the only one that
                    did anything */}
                  <CatchPicker
                    inline
                    multiple
                    live
                    max={2}
                    options={offers()}
                    value={chosen()}
                    verb="Breed"
                    empty="You have nothing to breed."
                    filter={(option) => !isEgg(option.caught) && !option.fighting}
                    note={(option) => (isShadow(option.caught) ? 'shadow' : null)}
                    onPick={(picked) => {
                      setStatus(null);
                      setChosen(picked);
                    }}
                  />
                  {/* The pairing is checked here only so the button can
                    say so first; the refusal itself is the server's */}
                  <Status
                    message={
                      chosen().length === 2 && !compatible()
                        ? 'Those two will have nothing to do with each other.'
                        : null
                    }
                  />
                </DialogSection>
              </Show>

              <Show when={standing()[1] === Npc.NurseJoy}>
                <DialogSection class={CENTRED}>
                  {/* One press, one pokemon seen to. She is free, so
                    there is nothing to weigh up before handing one over
                    — and a counter that took a party first and a button
                    second was two presses for a decision nobody makes.
                    What keeps her from being a tap is the window: one
                    visit per player while she is standing here */}
                  <CatchPicker
                    inline
                    options={offers()}
                    value={null}
                    verb="Heal"
                    empty="You have nothing for her to look at."
                    filter={(option) => !isEgg(option.caught) && !option.fighting}
                    reason={(option) => (isGuarded(option.caught) ? 'locked' : null)}
                    note={(option) =>
                      isShadow(option.caught) ? 'shadow — she would purify it' : null
                    }
                    onPick={(id) => {
                      if (id != null) {
                        tendParty([id]);
                      }
                    }}
                  />
                </DialogSection>
              </Show>

              <Show when={standing()[1] === Npc.DaycareLady}>
                {/* Centred, like everything else she is standing in
                    the middle of: one egg, one price, and the box the
                    egg is picked out of */}
                <DialogSection class={CENTRED}>
                  {/* The note on each row is what the fee actually buys
                    that egg: half of a long walk is further than half
                    of a short one */}
                  <CatchPicker
                    inline
                    options={offers()}
                    value={null}
                    verb="Warm"
                    empty="You have no egg for her."
                    filter={(option) =>
                      isEgg(option.caught) && !option.fighting && stepsRemaining(option.caught) > 0
                    }
                    note={(option) => `${option.caught.steps} → ${boostedSteps(option.caught)}`}
                    onPick={(id) => {
                      if (id != null) {
                        pushEgg(id);
                      }
                    }}
                  />
                </DialogSection>
              </Show>

              <Show when={standing()[1] === Npc.Groomer}>
                <DialogSection class={CENTRED}>
                  {/* The note is what the fee actually buys this
                    pokemon: half of what it has left to give, which is
                    a great deal to one just out of its ball and next
                    to nothing to one that already adores its owner */}
                  <CatchPicker
                    inline
                    options={offers()}
                    value={null}
                    verb="Groom"
                    empty="You have nothing for him to see to."
                    filter={(option) =>
                      !isEgg(option.caught) &&
                      !option.fighting &&
                      !isShadow(option.caught) &&
                      groomedFriendship(option.caught.friendship) > option.caught.friendship
                    }
                    note={(option) =>
                      `${option.caught.friendship} → ${groomedFriendship(option.caught.friendship)}`
                    }
                    onPick={(id) => {
                      if (id != null) {
                        groom(id);
                      }
                    }}
                  />
                  {/* What it costs. The rest of what he is for is
                      said in his own words under him */}
                  <Meta class="block">{GROOMING_FEE} gold, once while he is here.</Meta>
                </DialogSection>
              </Show>

              <Show when={standing()[1] === Npc.MoveReminder}>
                <DialogSection class={CENTRED}>
                  {/* The scale itself rather than the words for it.
                      It is the whole price of what he does, and a
                      player who has one in the bag knows it by the
                      picture — the bag draws it the same way */}
                  <Row>
                    <Badge tone={scales() > 0 ? 'leaf' : 'ember'}>
                      <ItemSprite item={REMINDER_FEE} size={20} label="" />
                      {scales()} Heart {scales() === 1 ? 'Scale' : 'Scales'}
                    </Badge>
                  </Row>

                  {/* Both inputs are on the counter the moment he is
                    walked up to: the pokemon, and what that pokemon
                    has lost. There is nothing to agree to first — what
                    he offers *is* the two of them — so the button is
                    the only step, and it stays dead until they are
                    both filled in and a scale is in the bag.

                    The pickers are inline rather than dialogs of their
                    own, since this is already one */}
                  <CatchPicker
                    inline
                    options={offers()}
                    value={remindee()}
                    verb="Remind"
                    empty="You have nothing that has forgotten anything."
                    filter={(option) =>
                      !isEgg(option.caught) &&
                      !option.fighting &&
                      getRecallableMoves(
                        option.caught.species,
                        option.caught.level,
                        option.caught.moves,
                      ).length > 0
                    }
                    reason={(option) => (isGuarded(option.caught) ? 'locked' : null)}
                    note={(option) =>
                      `${
                        getRecallableMoves(
                          option.caught.species,
                          option.caught.level,
                          option.caught.moves,
                        ).length
                      } forgotten`
                    }
                    onPick={(id) => {
                      setStatus(null);
                      setRecall(null);
                      setRemindee(id);
                    }}
                  />

                  {/* The second input only means anything once the
                      first is answered: what has been forgotten is a
                      question about a particular pokemon */}
                  <Show when={remembering()} fallback={<Note>Choose one of yours first.</Note>}>
                    <Meta>What it has learned and lost:</Meta>
                    <List>
                      <For each={forgotten()}>
                        {(move) => (
                          <ListRow selected={recall() === move}>
                            <RowButton
                              pressed={recall() === move}
                              disabled={busy()}
                              onClick={() => {
                                setRecall(move);
                              }}
                            >
                              <MoveLine move={move} />
                            </RowButton>
                          </ListRow>
                        )}
                      </For>
                    </List>
                  </Show>
                </DialogSection>
              </Show>

              <Show when={standing()[1] === Npc.FossilManiac}>
                <DialogSection class={CENTRED}>
                  <Row class="justify-center">
                    <Badge tone="gold">{props.gold() ?? 0} gold</Badge>
                  </Row>

                  {/* Two rocks, and what is in each of them. It is no
                    secret which species a fossil holds, and buying one
                    for the price of a nugget without being told would
                    be a decision made blind */}
                  <Show
                    when={offer().length > 0}
                    fallback={<Note>He has nothing on him just now.</Note>}
                  >
                    <List>
                      <For each={offer()}>
                        {(item) => (
                          <ListRow selected={buying() === item}>
                            <RowButton
                              pressed={buying() === item}
                              disabled={busy()}
                              onClick={() => {
                                setStatus(null);
                                setBuying(item);
                              }}
                            >
                              <ItemSprite item={item} size={24} label="" />
                              <span class="grow text-left">
                                {describeItem(item)}
                                <Meta class="block">{fossilHolds(item)}</Meta>
                              </span>
                              <Meta>{getFossilPrice(item)} gold</Meta>
                            </RowButton>
                          </ListRow>
                        )}
                      </For>
                    </List>
                  </Show>
                </DialogSection>
              </Show>

              <Show when={standing()[1] === Npc.FossilScientist}>
                <DialogSection class={CENTRED}>
                  {/* What he takes is in the bag rather than in a
                    crate, so the list is the player's own fossils. He
                    charges nothing else, and he will do it as often as
                    there are rocks to open */}
                  <Show
                    when={fossils().length > 0}
                    fallback={<Note>You are carrying nothing he can open.</Note>}
                  >
                    <List>
                      <For each={fossils()}>
                        {(entry) => (
                          <ListRow selected={opening() === entry.item}>
                            <RowButton
                              pressed={opening() === entry.item}
                              disabled={busy()}
                              onClick={() => {
                                setStatus(null);
                                setOpening(entry.item);
                              }}
                            >
                              <ItemSprite item={entry.item} size={24} label="" />
                              <span class="grow text-left">
                                {describeItem(entry.item)}
                                <Meta class="block">{fossilHolds(entry.item)}</Meta>
                              </span>
                              <Meta>× {entry.amount}</Meta>
                            </RowButton>
                          </ListRow>
                        )}
                      </For>
                    </List>
                    {/* The one thing about the outcome that is not
                        said by the rock itself */}
                    <Meta class="block">
                      Whatever is in there comes out at level {FOSSIL_REVIVE_LEVEL}.
                    </Meta>
                  </Show>
                </DialogSection>
              </Show>

              <Show when={standing()[1] === Npc.Vendor}>
                <DialogSection title="Trading" class={CENTRED}>
                  <Row class="justify-center">
                    <Badge tone="gold">{props.gold() ?? 0} gold</Badge>
                  </Row>

                  {/* His crate and the player's bag are windows of
                      their own, opened from the bar below */}
                  <Note>Buy from him, or sell to him.</Note>
                </DialogSection>
              </Show>

              <Status message={status()} />
            </>
          )}
        </Show>

        {/* Everything that acts, on the bar with the way out.

            They were scattered down the panel — under a picker, under a
            list, under a summary — so a player who had chosen what they
            wanted had to look for the button that did it, and in the
            reminder's case scroll past a list of moves to find it. The
            bar is where a dialog is answered */}
        <DialogActions center>
          {/* Keyed on the pair rather than on the npc: `Npc.Breeder`
              is 0, and a `Show` asked about it is a `Show` asked about
              a falsy value — the breeder's own button was the one
              thing this row never drew */}
          <Show when={showing()} keyed>
            {(standing) => npcActions(standing[1])}
          </Show>
          <Button onClick={close}>Walk on</Button>
        </DialogActions>
      </Dialog>

      {/* His crate, or the player's bag, as a window of its own.

          It stands beside the counter rather than inside it: a tray of
          thirty squares unfolded into the dialog pushed everything
          under it — the total, the buttons — off the screen */}
      <InventoryPicker
        open={counter() != null}
        keepOpen
        onClose={() => {
          setCounter(null);
        }}
        player={props.player}
        title={counter() === 'sell' ? 'Sell' : 'Buy'}
        // The squares say what he has and what it costs, so the
        // sentence is kept for the screen reader and off the screen
        terse
        cardOnly
        // What is in the purse, under the crate it is spent on: it is
        // the number every press on this window changes, and it was
        // one screen behind on the counter
        below={<Badge tone="gold">{props.gold() ?? 0} gold</Badge>}
        description={
          counter() === 'sell'
            ? 'One at a time, off the card over whatever he can have.'
            : 'One at a time, off the card over whatever you want.'
        }
        verb={counter() === 'sell' ? 'Sell' : 'Buy'}
        entries={counter() === 'sell' ? props.bag() : crate()}
        disabled={busy()}
        value={null}
        carried={(entry) => carrying(entry.item)}
        // He has as many of anything as a player wants, so a count on
        // his crate is a number that never moves
        counts={counter() === 'sell'}
        empty={
          counter() === 'sell'
            ? 'Nothing in your bag is worth anything to him.'
            : 'His crate is empty.'
        }
        filter={(entry) => counter() !== 'sell' || priceOf(entry.item, false) > 0}
        // What the purse will not stretch to is greyed where it stands,
        // rather than left out: what he stocks is the same crate
        // whatever a player is carrying
        blocked={(entry) =>
          counter() !== 'sell' && priceOf(entry.item, true) > (props.gold() ?? 0)
            ? 'More than you hold'
            : null
        }
        // Short enough to sit in the corner of a square: the tray has no
        // room for a sentence, and the number is the news
        note={(entry) => `${priceOf(entry.item, counter() !== 'sell')}g`}
        onPick={(item) => {
          if (item != null) {
            trade(item, counter() !== 'sell');
          }
        }}
      />

      {/* The last step of the reminder is the teaching itself, which is
        the same question a machine asks — whether there is room, and
        which move goes if there is not. It is that dialog, paid for
        with a scale, rather than a second one shaped like it */}
      <TeachMoveDialog
        catchId={reminding()?.[0] ?? null}
        move={reminding()?.[1] ?? null}
        cost="The Heart Scale"
        teach={remind}
        onClose={() => {
          setReminding(null);
        }}
        onTaught={remembered}
      />
    </>
  );
}

/**
 * Somebody standing out in the world with an offer.
 *
 * The box, the purse and the bag are read one component down, under
 * this boundary: read here they would throw to the page and take the
 * world with them in the middle of a trade
 */
export default function NpcDialog(props: NpcDialogProps): JSX.Element {
  // Bumped after every trade, so the purse and the bag catch up with
  // what was just bought or sold
  const [traded, setTraded] = createSignal(0);

  // Both lists are drawn from this one read: the pair the breeder
  // wants and the egg the daycare lady wants are the same records,
  // asked two different questions
  const [catches, { refetch }] = createResource(
    () => (props.standing == null ? null : props.player),
    async (player): Promise<CatchOption[]> => {
      const [owned, now] = await Promise.all([listCaught(player), syncServerClock()]);

      return owned.map(([id, caught]) => ({ id, caught, fighting: isLockLive(caught, now) }));
    },
  );

  const [gold] = createResource(
    () => (props.standing == null ? null : ([props.player, traded()] as const)),
    async ([player]) => (await getProfile(player))?.gold ?? 0,
  );

  const [bag] = createResource(
    () => (props.standing == null ? null : ([props.player, traded()] as const)),
    async ([player]) => getInventory(player),
  );

  return (
    <Suspense>
      <NpcCounter
        {...props}
        catches={catches}
        gold={gold}
        bag={bag}
        onServed={() => {
          Promise.resolve(refetch()).catch(() => undefined);
        }}
        onTraded={() => {
          setTraded((count) => count + 1);
        }}
      />
    </Suspense>
  );
}
