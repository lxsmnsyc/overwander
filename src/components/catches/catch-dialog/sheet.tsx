import { HISTORY_BALL, HISTORY_BALL_INSET, describeHistory, isHoldable } from './describe';
import BattleData from '../../app/battle-data';
import CandySprite from '../../sprites/CandySprite';
import BattleSection from './sections/BattleSection';
import EvolutionSection from './sections/EvolutionSection';
import HistorySection from './sections/HistorySection';
import PortraitSection from './sections/PortraitSection';
import StatsSection from './sections/StatsSection';
import { isAuctionableCatch } from '../../../auth/auctions';
import { setBuddy } from '../../../auth/buddy';
import { getCandyCost, getReleaseCandy, useCandy } from '../../../auth/candy';
import {
  type CatchOrder,
  type CaughtPokemon,
  arrangeCatch,
  giveItem,
  isFavorite,
  isGuarded,
  releaseCatch,
  setFavorite,
  setGuarded,
  setNickname,
  takeItem,
} from '../../../auth/caught';
import { getCatchName, isNicknameLocked, isShadow, isShiny } from '../../../auth/caught-record';
import { NICKNAME_LIMIT, asNickname } from '../../../auth/nickname';
import { useAuth } from '../../../auth/context';
import { answered } from '../../app/resource-reads';

import { canHatch, isEgg } from '../../../auth/egg';
import { hatchEgg } from '../../../auth/eggs';
import { deriveSize } from '../../../overworld/encounter';
import { type EvolutionOption, evolveCatch } from '../../../auth/evolution';
import { fuseCatch, unfuseCatch } from '../../../auth/fusion';
import type { InventoryEntry } from '../../../auth/inventory';
import { learnLevelUpMove } from '../../../auth/moves';
import playEffect, { Effect } from '../../app/sound';
import type { PokedexView } from '../../../auth/pokedex';
import { trainEfforts } from '../../../auth/training';

import { MAX_LEVEL } from '../../../data/constants/levels';

import type { Stats } from '../../../data/constants/stats';
import { BALL_ITEMS, type Items, getMachineMove, isMachineItem } from '../../../data/ids/items';
import { MAX_FRIENDSHIP, describeFriendship } from '../../../data/constants/friendship';
import ItemSprite from '../../items/ItemSprite';
import type { Moves } from '../../../data/ids/moves';
import type { Species } from '../../../data/ids/species';

import { isPPItem } from '../../../data/items/vitamins';
import { isPreciousItem } from '../../../data/overworld/item-pool';
import { isAbilityPatch } from '../../../data/items/ability-items';
import { isPurifyingGem } from '../../../data/items/purifying-gem';
import { getFamilyName, getSpeciesData } from '../../../data/species';
import { getFusionPartner, isFusedSpecies } from '../../../data/species/fusion';

import { ActionsIcon, HeartIcon, LockIcon, SparklesIcon, StarIcon } from '../../icons';
import TypeBadge from '../../sprites/TypeBadge';
import { GENDER_LABELS, GENDER_MARKS } from '../catch-summary';
import InventoryPicker from '../../items/InventoryPicker';

import { describeItem } from '../../details';
import spentToast from '../../items/spent-toast';
import spendItemOn, {
  getLevelMovesBetween,
  isUsableOn,
  nextOfferLevel,
} from '../../items/use-item';

import {
  Badge,
  Button,
  CloseButton,
  Dialog,
  DialogActions,
  Divider,
  Field,
  Menu,
  type MenuAction,
  Meta,
  Note,
  Row,
  type ToastTone,
  TooltipHost,
  useToast,
} from '../../styled';
import AbilityPatchDialog from '../AbilityPatchDialog';
import CatchPicker from '../catch-picker';
import IncreasePPDialog from '../IncreasePPDialog';
import TeachMoveDialog from '../TeachMoveDialog';

import {
  For,
  type JSX,
  type Resource,
  Show,
  batch,
  createEffect,
  createSignal,
  onCleanup,
} from 'solid-js';

/**
 * Re-exported from where the battle card reads them too: an ability on
 * a sheet and one on a card are named the same way
 */

export interface CatchDialogProps {
  /**
   * The player the catch is being viewed under; a catch owned by
   * anyone else is treated as absent
   */
  player: string;
  /**
   * The catch to show, or null when the dialog is closed
   */
  catchId: string | null;
  onClose: () => void;
  /**
   * Fired when the catch changed (an evolution landed), so the list
   * behind the dialog can refresh
   */
  onChange?: () => void;
  /**
   * Open the listing dialog for this pokemon. The menu's Auction entry
   * is left out entirely when nobody is listening, since a sheet with
   * a dead button on it is worse than one without the button
   */
  onAuction?: (catchId: string) => void;
  /**
   * Open somebody's profile, from the ownership history.
   *
   * A pokemon that has passed through other hands is the one place in
   * the game where a player meets a trainer they have never traded a
   * word with, and the answer to "who had this before me" is the
   * profile they already have. Absent where there is nowhere to open
   * one, which leaves the names as plain text
   */
  onTrainer?: (uid: string) => void;
  /**
   * Open the dex entry for its species. The menu's entry is left out
   * where nobody is listening
   */
  onDex?: (species: Species) => void;
  /**
   * Show the record and offer nothing.
   *
   * It is for looking at a pokemon that is not the reader's: an
   * auction lot, and a trade when there is one. Two things change.
   * The owner check is dropped — a lot in escrow is owned by nobody,
   * so requiring a match would show an empty dialog — and every
   * section that writes is left out, which is the same switch the
   * dialog already throws for a catch belonging to somebody else.
   *
   * Nothing here is a permission: the server refuses all of it anyway.
   * This is so the buttons are not offered in the first place
   */
  readOnly?: boolean;
}

/**
 * How long the sheet waits after the last candy press before sending
 * them. Long enough to gather a run of presses, short enough that a
 * player who pressed once and looked away is not left wondering
 */
const CANDY_SETTLE = 500;

/**
 * A candy's art is a 16px picture centred in a 32px cell, so the margin
 * is pulled in to keep a badge as tight as its text
 */
const CANDY_BADGE = '-m-2';

/** How large a candy is drawn on the toast that says a release paid it */
const CANDY_ART = 24;

function describeItems(items: readonly Items[]): string {
  const names: string[] = [];

  for (const item of items) {
    names.push(describeItem(item));
  }
  return names.join(', ');
}

/**
 * One catch in full, shown over the list it was opened from
 */
/**
 * The sheet itself, which is where every one of these is read.
 *
 * A read in the body that declared it lands on the boundary around
 * the page rather than on the dialog panel's own, so all ten of them
 * are read here, one component below where they are asked for
 */
export function CatchSheetBody(
  props: CatchDialogProps & {
    detail: Resource<{ id: string; caught: CaughtPokemon | null }>;
    owners: Resource<Map<string, string>>;
    dex: Resource<PokedexView>;
    evolutions: Resource<EvolutionOption[]>;
    fighting: Resource<boolean>;
    onlyOne: Resource<boolean>;
    selling: Resource<boolean>;
    candies: Resource<number>;
    bag: Resource<InventoryEntry[]>;
    buddy: Resource<string | null>;
    onRecordChanged: () => void;
    onBagChanged: () => void;
    onBuddyChanged: () => void;
    onCandiesChanged: () => void;
    onEvolutionsChanged: () => void;
  },
): JSX.Element {
  const auth = useAuth();
  const toast = useToast();

  /**
   * What an action has to say for itself. It is said in the corner
   * rather than at the foot of the sheet: the sheet is a long column,
   * and a line under the bottom of it is a line nobody scrolled to
   */
  const say = (message: string, tone: ToastTone = 'neutral'): void => {
    toast.push({ message, tone });
  };

  /**
   * The record for one particular catch, or null once the sheet is
   * looking at another. Everything that was started for a pokemon
   * reads this rather than `view`: a run of candy and the question it
   * raised belong to the pokemon they were begun on, whatever the
   * player clicked on in the meantime
   */
  const recordOf = (catchId: string): CaughtPokemon | null => {
    // `latest` rather than the resource itself: everything on this
    // sheet that writes re-reads the record afterwards, and a read
    // that suspends unmounts the panel, and through the boundary the
    // page is under, the page behind it. Keeping the last record on
    // screen while the next one arrives is what makes a favorite land
    // without the screen blinking
    const held = props.detail.latest;
    const loaded = held?.id === catchId ? held.caught : null;

    if (loaded == null) {
      return null;
    }
    // A catch belongs to exactly one player; one opened under someone
    // else's list is a wrong address, not a peek. Looking at one on
    // the block is the exception: it is owned by nobody while it is
    // there, and being able to look is the point of a board
    return props.readOnly === true || loaded.owner === props.player ? loaded : null;
  };

  /** The record the sheet is showing, whichever pokemon that is now */
  const view = (): CaughtPokemon | null => (props.catchId == null ? null : recordOf(props.catchId));

  /**
   * Evolutions are only offered to the owner: they depend on what
   * the signed-in player carries, and only they can act on them
   */
  const owned = (): string | null => {
    const user = auth.user();

    if (props.readOnly === true) {
      return null;
    }
    return user != null && user.uid === props.player ? user.uid : null;
  };

  /**
   * Who an entry names. The player reading it is "you" rather than
   * their own nickname, and a trainer whose profile has gone is still
   * somebody — an owner is a fact about the pokemon, so a missing
   * profile must not take the entry off the list
   */
  const describeOwner = (entry: { owner: string; name?: string }): string => {
    if (entry.owner === auth.user()?.uid) {
      return 'You';
    }
    // A distributed pokemon names the trainer it came from, who has no
    // account to look up — so what the record says is what it is called
    return props.owners.latest?.get(entry.owner) ?? entry.name ?? 'A trainer';
  };

  /**
   * Whether the reader has met this species at all, whether they have
   * owned one, and whether one of those sparkled. A dex that has not
   * arrived yet answers "no" to all three, which draws the shadow: a
   * sheet that flashed the full picture and then hid it would be worse
   * than one that fills in.
   *
   * Owning one counts as having met it, the way `hasSeenSpecies` has
   * it: a gift arrives without a meeting, so a species can be kept
   * without ever having been encountered, and calling that one unmet
   * would hide a pokemon standing in the reader's own party.
   *
   * The sparkling count is its own answer because a shiny is its own
   * half of an entry. Owning a Pidgeotto says nothing about whether
   * the reader has ever held a shiny one
   */
  const dexKnows = (species: Species): { met: boolean; owned: boolean; shiny: boolean } => {
    // Read without waiting: the answer above is what an unarrived dex
    // gives, and it is the right one. A sheet held up for it, or one
    // that flashed the full picture and then hid it, would both be
    // worse than one that fills in
    const entry = answered(props.dex);
    let kept: NonNullable<typeof entry>['caught'][number] | undefined;
    let seen = false;

    for (const tally of entry?.caught ?? []) {
      if (tally.species === species) {
        kept = tally;
        break;
      }
    }
    for (const tally of entry?.seen ?? []) {
      if (tally.species === species) {
        seen = true;
        break;
      }
    }

    return {
      met: seen || kept != null,
      owned: kept != null,
      shiny: (kept?.shiny ?? 0) > 0,
    };
  };

  /**
   * Whether the record is being held as it is, for either of the two
   * reasons there are: a live battle is running on a copy of it, or
   * the player has locked it themselves. Everything that would rewrite
   * the sheet asks this. What the lock leaves alone — walking with it,
   * grooming it, the two keeping buttons themselves — asks only
   * whether it is fighting
   */
  const frozen = (): boolean => {
    const loaded = view();

    return props.fighting.latest === true || (loaded != null && isGuarded(loaded));
  };

  /**
   * A move about to be learned, and where it came from. The dialog it
   * opens decides whether anything is forgotten for it; what differs
   * between a machine and a level is only what it costs.
   *
   * `rest` is the queue behind it. A level can offer more than one
   * move at once — plenty of species learn two at level 1 — and each
   * is its own question, asked one after the other
   */
  interface Teaching {
    /**
     * Whose question it is. The sheet closes while the dialog is up,
     * which leaves the grid behind it live: a press that lands there
     * moves the sheet on, and a question that read the sheet's catch
     * would then be asked of whoever was clicked
     */
    catchId: string;
    move: Moves;
    rest: Moves[];
    /**
     * Grown into rather than taught: the candy already paid for it
     */
    levelled: boolean;
  }

  const [teaching, setTeaching] = createSignal<Teaching | null>(null);
  /**
   * The PP Up or PP Max waiting on a move to be spent on. Like a
   * machine, the bottle is picked in the bag and asked about here —
   * and unlike everything else in the bag, it is not spent until the
   * question is answered
   */
  const [bottle, setBottle] = createSignal<{ item: Items; catchId: string } | null>(null);

  /** Whoever is having its signature written, while the patch asks what gives way */
  const [patching, setPatching] = createSignal<string | null>(null);

  /**
   * Whoever is waiting for the last question to be answered.
   *
   * A run of candy presses cannot go on until the level it is
   * standing on is settled: the store teaches a levelled move only
   * while the pokemon is on the level that offers it, so the next
   * candy would take the offer away before it was answered
   */
  let answering: (() => void) | null = null;

  /** Resolves once nothing is being asked */
  const awaitTeaching = async (): Promise<void> => {
    if (teaching() == null) {
      return;
    }
    return new Promise<void>((resolve) => {
      answering = resolve;
    });
  };

  /**
   * Move on to the next thing the level offered, or close the dialog
   * when that was the last of them
   */
  const nextTeaching = (): void => {
    const current = teaching();
    const queued = current?.rest ?? [];
    const done = current == null || queued.length === 0;

    setTeaching(done ? null : { ...current, move: queued[0], rest: queued.slice(1) });
    if (done) {
      const waiting = answering;

      answering = null;
      waiting?.();
    }
  };

  /**
   * Ask about whatever the level it just reached has to offer.
   *
   * It is the species' list for **that level exactly** — a move from
   * any earlier one is the Move Reminder's trade and costs a Heart
   * Scale — minus anything it knows already, since a candy spent
   * bringing a pokemon back to a level it has been at before should
   * not offer the same move twice.
   *
   * Saying no is allowed and costs nothing. It is only final once the
   * next candy takes the pokemon past the level
   */
  const offerLevelMoves = (
    catchId: string,
    caught: CaughtPokemon | null,
    from: number,
    to: number = from,
  ): void => {
    if (caught == null) {
      return;
    }
    const learning = getLevelMovesBetween(caught, from, to);

    if (learning.length === 0) {
      return;
    }
    // Queued behind whatever is already being asked rather than over
    // it: a second handful of candy landing while the player is still
    // answering the first would otherwise throw the rest of that queue
    // away, and those levels are paid for. Only behind a question
    // about the same pokemon: two of them cannot be asked at once
    setTeaching((asked) =>
      asked == null || asked.catchId !== catchId
        ? { catchId, move: learning[0], rest: learning.slice(1), levelled: true }
        : { ...asked, rest: [...asked.rest, ...learning] },
    );
  };

  /**
   * Levels pressed for but not yet sent, and the level the server last
   * said it reached.
   *
   * A candy is pressed several times in a row, and one call a press
   * meant a round trip between each of them: the number crawled up
   * behind the finger. The presses are counted here instead, shown at
   * once, and sent as one call when the player stops. `reached` holds
   * the answer until the record catches up with it, so the level does
   * not fall back for the moment between the two
   */
  const [queued, setQueued] = createSignal(0);
  const [reached, setReached] = createSignal(0);
  let feeding: ReturnType<typeof setTimeout> | null = null;

  /**
   * The pile as it was when the last handover went out, and what it
   * should come to now that it has landed.
   *
   * `reached` does this for the level; the pile needs it for the same
   * reason. The presses are shown by taking them off what the bag last
   * said, so the moment the presses are counted as spent the number
   * jumps back up to the old pile and only falls again when the re-read
   * lands: five presses on twenty candies read 15, then 20, then 15.
   * Holding what it should be until the bag says something new is what
   * keeps it still
   */
  const [settling, setSettling] = createSignal<{ was: number; now: number } | null>(null);

  /**
   * Whose presses are being counted. A press is made on the pokemon
   * on the sheet at the time, and the candy has to go to that one
   * however long the player waits before letting go
   */
  let feedingFor: string | null = null;

  // A different pokemon on the sheet is a different pile of presses
  createEffect(() => {
    props.catchId;
    setQueued(0);
    setReached(0);
    setSettling(null);
  });

  // The re-read landed, so the bag is the truth again
  createEffect(() => {
    const settled = settling();

    if (settled != null && (props.candies.latest ?? 0) !== settled.was) {
      setSettling(null);
    }
  });

  /** The level as the sheet is showing it, presses and all */
  const shownLevel = (): number => Math.max(view()?.level ?? 0, reached()) + queued();

  /**
   * What the pile is worth right now: the bag's own number, or what
   * the last handover left it at while the bag is still being re-read
   */
  const heldCandies = (): number => {
    const held = props.candies.latest ?? 0;
    const settled = settling();

    return settled?.was === held ? settled.now : held;
  };

  /** The pile as the sheet is showing it, with what the presses would spend taken off */
  const shownCandies = (): number =>
    Math.max(0, heldCandies() - queued() * getCandyCost(view() ?? { shadow: false }));

  /**
   * Hand the presses over, stopping on every level that has a move to
   * offer and waiting there until it is answered.
   *
   * The store teaches a levelled move only while the pokemon is
   * standing on the level that offers it, so a run has to land on
   * each of those levels and settle it before going further: a call
   * that crossed five offers could teach the fifth and nothing else.
   * Everything between two offers goes over in one call, since a
   * stretch that asks nothing has nothing to lose — which for most
   * feedings is the whole run.
   *
   * The presses are still counted and shown at once, so the number
   * does not crawl up behind the finger
   */
  const feedRun = async (catchId: string, levels: number): Promise<number | null> => {
    // Held rather than read every time round: a press on the grid
    // behind the sheet moves the record on, and the run still owes
    // this pokemon the levels it was paid for
    let known = recordOf(catchId);
    let at = Math.max(known?.level ?? 0, reached());
    let left = levels;
    let last: number | null = null;

    while (left > 0) {
      const caught = recordOf(catchId) ?? known;

      known = caught;

      const asks = caught == null ? null : nextOfferLevel(caught, at);
      // Land exactly on the next level with a move in it, or take the
      // rest of the run in one go when nothing above asks anything
      const step = asks == null ? left : Math.min(left, asks - at);
      const grown = await useCandy(catchId, step);

      // The pile ran out, or it is already at the cap. What has landed
      // so far stands
      if (grown == null) {
        break;
      }
      left -= grown - at;
      at = grown;
      last = grown;
      if (props.catchId === catchId) {
        setReached(grown);
      }
      offerLevelMoves(catchId, caught, grown);
      await awaitTeaching();
    }
    return last;
  };

  /** Whether a run is already out, so a second does not overlap it */
  let running = false;
  /** Whether the sheet is gone, so nothing schedules itself after it */
  let closed = false;

  /**
   * Hand over every press. The server grows as far as the pile
   * actually stretches and answers with the level it reached, so a
   * sheet that counted further than the bag goes back to the truth
   */
  const flushCandy = (): void => {
    const catchId = feedingFor;
    const levels = queued();

    feeding = null;
    if (catchId == null || levels < 1 || running) {
      return;
    }
    // What the sheet already knows it has reached, not only what the
    // record says: a second handover sent before the first was read
    // back would otherwise start its range at a level already grown
    // through, and offer those moves a second time
    const from = Math.max(recordOf(catchId)?.level ?? 0, reached());
    /**
     * Whether the sheet is still on the pokemon the run was made for.
     * The level and the pile it shows are that pokemon's, so a run
     * that lands after the player has clicked on another must not
     * write its numbers over theirs
     */
    const showing = (): boolean => props.catchId === catchId;

    running = true;
    feedRun(catchId, levels)
      .then((level) => {
        // Once for the run rather than once a level: a pile handed
        // over in one press is one growing, however far it reached
        if (level != null && level > from) {
          playEffect(Effect.LevelUp);
        }
        if (!showing()) {
          say(level == null ? 'That candy could not be used.' : `Grew to level ${level}.`);
          props.onRecordChanged();
          props.onCandiesChanged();
          props.onEvolutionsChanged();
          props.onChange?.();
          return;
        }
        setQueued((waiting) => Math.max(0, waiting - levels));
        setReached(level ?? 0);
        // What it actually cost: the levels the pile stretched to
        // rather than the presses, since a pile that ran out grows
        // fewer than were asked for. Taken off what the sheet already
        // believes, so a second handover sent before the first was
        // read back does not spend the same candies twice
        const grown = Math.max(0, (level ?? from) - from);

        setSettling({
          was: props.candies.latest ?? 0,
          now: Math.max(0, heldCandies() - grown * getCandyCost(view() ?? { shadow: false })),
        });
        say(level == null ? 'That candy could not be used.' : `Grew to level ${level}.`);
        props.onRecordChanged();
        props.onCandiesChanged();
        props.onEvolutionsChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        if (showing()) {
          setQueued((waiting) => Math.max(0, waiting - levels));
        }
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
        props.onRecordChanged();
        props.onCandiesChanged();
      })
      .finally(() => {
        running = false;
        // Presses made while the run was out, or while a question was
        // up, are still owed
        if (!closed && queued() > 0) {
          feeding = setTimeout(flushCandy, 0);
        }
      });
  };

  // Whatever is still counted when the sheet goes is still owed
  onCleanup(() => {
    closed = true;
    // A run parked on a question the player will never see now: let
    // it finish rather than leaving it holding the promise
    const waiting = answering;

    answering = null;
    waiting?.();
    if (feeding != null) {
      clearTimeout(feeding);
      flushCandy();
    }
  });

  const feedCandy = (): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    feedingFor = catchId;
    setQueued((waiting) => waiting + 1);
    if (feeding != null) {
      clearTimeout(feeding);
      feeding = null;
    }

    const caught = view();
    const at = Math.max(caught?.level ?? 0, reached());
    const asks = caught == null ? null : nextOfferLevel(caught, at);

    // A press that reaches a level with a move in it goes at once.
    // Settling first only delays the question, and the question is
    // the thing the player pressed for
    if (asks != null && at + queued() >= asks) {
      flushCandy();
      return;
    }
    feeding = setTimeout(flushCandy, CANDY_SETTLE);
  };

  /**
   * What the dialog is called: what its owner calls it, which is the
   * species' own name until somebody names it otherwise.
   *
   * An egg gives away nothing about what is inside it — not the
   * species, not the name, not even whether it sparkles — and a record
   * still being read gives away nothing at all, but the dialog is
   * named either way rather than opening unnamed.
   *
   * The name alone: a shiny is said with the same mark the box and the
   * cards use, drawn beside the heading rather than glued to the front
   * of the name where it would be read out as part of it
   */
  const named = (): string => {
    const loaded = view();

    if (loaded == null) {
      return 'Catch';
    }
    if (isEgg(loaded)) {
      return 'Egg';
    }
    return getCatchName(loaded);
  };

  /**
   * What in the bag could be handed over. The button that opens the
   * bag asks this rather than opening onto an empty list
   */
  const holdables = (): InventoryEntry[] => {
    const found: InventoryEntry[] = [];

    for (const entry of props.bag.latest ?? []) {
      if (isHoldable(entry.item)) {
        found.push(entry);
      }
    }
    return found;
  };

  const moveItem = (item: Items, give: boolean): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    (give ? giveItem(catchId, item) : takeItem(catchId, item))
      .then((moved) => {
        say(
          moved
            ? `${describeItem(item)} ${give ? 'handed over' : 'taken back'}.`
            : `${describeItem(item)} could not be ${give ? 'handed over' : 'taken back'}.`,
        );
        props.onRecordChanged();
        props.onBagChanged();
        props.onEvolutionsChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /**
   * Save the order its moves, abilities and items are laid out in.
   *
   * One call for whichever of the three moved, the way a spread of
   * effort is one call: dragging is cheap and the round trip is not,
   * so nothing is asked of the server until the player saves
   */
  const arrange = (order: CatchOrder): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    arrangeCatch(catchId, order)
      .then((laid) => {
        if (!laid) {
          say('That order could not be saved.', 'ember');
        }
        props.onRecordChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /**
   * Spend effort, a whole spread at once. The server decides it
   * against the stored record and the sheet re-reads rather than
   * trusting its own arithmetic.
   *
   * One call rather than one per press: the pane holds what has been
   * laid out and hands it over when the player saves, so filling six
   * stats costs one round trip instead of thirty
   */
  const train = (spread: Partial<Record<Stats, number>>): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    trainEfforts(catchId, spread)
      .then((result) => {
        if (result == null) {
          say('Those points could not be moved.', 'ember');
        }
        props.onRecordChanged();
        props.onBagChanged();
        props.onChange?.();
      })
      .catch((thrown: unknown) => {
        say(thrown instanceof Error ? thrown.message : String(thrown), 'ember');
      });
  };

  const takeAlong = (): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    setBuddy(uid, catchId)
      .then((set) => {
        say(set ? 'Walking with you now.' : 'That one cannot come along.');
        props.onBuddyChanged();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  const hatch = (): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    hatchEgg(catchId)
      .then((species) => {
        say(
          species == null
            ? 'It is not ready yet.'
            : `It hatched into ${getSpeciesData(species).name}!`,
        );
        props.onRecordChanged();
        props.onCandiesChanged();
        props.onEvolutionsChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /** The shape a picked dragon would be folded into, while it is being picked */
  const [folding, setFolding] = createSignal<Species | null>(null);

  /** The dragon that shape asks for */
  const dragonWanted = (): Species | null => {
    const into = folding();

    return into == null ? null : getFusionPartner(into);
  };

  /** What to call it while the picker is up */
  const dragonName = (): string => {
    const dragon = dragonWanted();

    return dragon == null ? 'dragon' : getSpeciesData(dragon).name;
  };

  /**
   * Say what came of a fusion, and re-read everything a change of
   * shape touches. Both halves change hands' worth of state, so the
   * box is re-read as well as the sheet
   */
  const settleFusion = (species: Species | null, said: string): void => {
    if (species == null) {
      say('That is no longer possible.');
    } else {
      playEffect(Effect.PokemonGet);
      say(said, 'leaf');
    }
    props.onRecordChanged();
    props.onEvolutionsChanged();
    props.onChange?.();
  };

  const evolve = (into: Species): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    const shape = view();

    // A fusion is two pokemon rather than one, so it leaves the
    // evolution road here: folding in asks which dragon, and taking
    // apart hands one back
    if (getFusionPartner(into) != null) {
      setFolding(into);
      return;
    }
    if (shape != null && isFusedSpecies(shape.species)) {
      unfuseCatch(catchId)
        .then((species) => {
          settleFusion(species, 'They came apart.');
        })
        .catch((caught: unknown) => {
          say(caught instanceof Error ? caught.message : String(caught), 'ember');
        });
      return;
    }

    // Read before the write, off what the server checks the husk against: its level and the bag
    const before = view();
    const carried = new Set<Items>();
    let husk: string | null = null;

    for (const entry of props.bag.latest ?? []) {
      if (entry.amount > 0) {
        carried.add(entry.item);
      }
    }
    for (const entry of before == null ? [] : (getSpeciesData(before.species).evolvesInto ?? [])) {
      if (
        entry.shed === true &&
        before != null &&
        before.level >= (entry.level ?? 0) &&
        (entry.item == null || carried.has(entry.item))
      ) {
        husk = getSpeciesData(entry.species).name;
      }
    }

    evolveCatch(catchId, into)
      .then((species) => {
        if (species != null) {
          playEffect(Effect.PokemonGet);
        }
        if (species == null) {
          say('That evolution is no longer available.');
        } else {
          say(
            husk == null ? 'Evolution complete.' : `Evolution complete. A ${husk} was left behind.`,
          );
        }
        props.onRecordChanged();
        props.onEvolutionsChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /**
   * Mark it as one to keep, or put it away. Both are one field on the
   * record and both are the player's own doing, so they are settled
   * the same way: write, re-read, say what happened
   */
  const mark = (setting: Promise<boolean | null>, said: string, refused: string): void => {
    setting
      .then((marked) => {
        say(marked == null ? refused : said);
        props.onRecordChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /**
   * The name being typed, or null while nothing is being named. It is
   * a draft rather than the record: a player half-way through a name
   * has not renamed anything yet
   */
  const [naming, setNaming] = createSignal<string | null>(null);
  const [renaming, setRenaming] = createSignal(false);

  /**
   * What the draft will actually be stored as. The field is left
   * alone while it is being typed — cleaning every keystroke makes a
   * space impossible to type, since the trim eats it before the next
   * letter arrives — so the cleaned name is shown under it instead
   */
  const drafted = (): string => asNickname(naming() ?? '');

  /**
   * What the box will have done, said before it does it: the cleaned
   * name, or the species it goes back to when the box is left empty
   */
  const describeDraft = (): string => {
    const loaded = view();

    if (drafted() !== '') {
      return `It will be called ${drafted()}.`;
    }
    return loaded == null
      ? 'It will go back to being called by its species.'
      : `It will go back to being called ${getSpeciesData(loaded.species).name}.`;
  };

  const rename = (): void => {
    const catchId = props.catchId;
    const draft = naming();

    if (owned() == null || catchId == null || draft == null) {
      return;
    }
    setRenaming(true);
    setNickname(catchId, draft)
      .then((given) => {
        setRenaming(false);

        if (given == null) {
          say('That name could not be given.', 'ember');
          return;
        }
        setNaming(null);
        say(given === '' ? 'Its name is its own again.' : `It answers to ${given} now.`);
        props.onRecordChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setRenaming(false);
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  const favorite = (on: boolean): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    mark(
      setFavorite(catchId, on),
      on ? 'Kept — it cannot be released, auctioned or traded.' : 'No longer a favorite.',
      'That could not be changed.',
    );
  };

  const guard = (on: boolean): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    mark(
      setGuarded(catchId, on),
      on ? 'Locked — it will be left alone.' : 'Unlocked.',
      'That could not be changed.',
    );
  };

  /**
   * Whether the release button has been pressed once. Letting a
   * pokemon go cannot be undone, so it takes two presses and the
   * second one says what it is doing
   */
  const [releasing, setReleasing] = createSignal(false);
  /** Whether the full ownership history is open over the sheet */
  const [tracing, setTracing] = createSignal(false);

  const release = (): void => {
    const catchId = props.catchId;
    const going = view();

    if (owned() == null || catchId == null || going == null) {
      return;
    }
    // Read before the record goes: once the release lands there is
    // nothing left to ask what it was
    const { family, name } = getSpeciesData(going.species);
    const paid = getReleaseCandy(going);
    // A released pokemon hands back whatever it was carrying, which is
    // easy to forget and impossible to undo
    const held = going.items.length;

    if (!releasing()) {
      setReleasing(true);
      return;
    }
    releaseCatch(catchId)
      .then((released) => {
        if (!released) {
          setReleasing(false);
          say('It could not be released.', 'ember');
          return;
        }
        // Said in passing rather than on the sheet, because the sheet
        // is about to close: what a player gets for letting a pokemon
        // go should still be somewhere they can read it afterwards.
        // The family is named — candy is held per family, so "1 candy"
        // on its own does not say which pile grew
        toast.push({
          title: `${paid} ${getFamilyName(family)} candy`,
          message: `${name} was let go.${held > 0 ? ' What it was holding is back in the bag.' : ''}`,
          art: () => <CandySprite family={family} size={CANDY_ART} label="" />,
          tone: 'leaf',
        });
        // The record is gone, so there is nothing left for this
        // dialog to show
        props.onChange?.();
        // Together, or the sheet reopens for a frame between the
        // confirmation closing and the sheet being told to
        batch(() => {
          setReleasing(false);
          props.onClose();
        });
      })
      .catch((caught: unknown) => {
        setReleasing(false);
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /** Why this pokemon cannot be released right now, if it cannot */
  const blockedRelease = (loaded: CaughtPokemon): string | null => {
    if (props.fighting.latest === true) {
      return 'It is in a raid, so it cannot be released.';
    }
    if (props.onlyOne() === true) {
      // A player with no pokemon has no way back into the game
      return 'The only pokemon you have cannot be released.';
    }
    if (isFavorite(loaded)) {
      return 'A favorite cannot be released. Unfavorite it first.';
    }
    if (isGuarded(loaded)) {
      return 'A locked pokemon cannot be released. Unlock it first.';
    }
    return null;
  };

  /**
   * Which bag is open, if either. They are panels rather than sections
   * because neither is part of reading the sheet: a player opens one,
   * hands something over or spends it, and is back to looking at the
   * pokemon
   */
  const [panel, setPanel] = createSignal<'items' | 'give' | null>(null);

  /**
   * Whether the item is one this pokemon could be given right now.
   * The rule is the bag's own, so the panel here and the picker there
   * offer exactly the same pokemon for exactly the same item
   */
  const isUsable = (item: Items): boolean => {
    const caught = view();

    return caught != null && isUsableOn(item, caught);
  };

  /**
   * Whether the bag holds anything at all this pokemon would gain
   * from. It is the same question the picker's filter asks, asked
   * once over the whole bag, so the menu entry that opens the picker
   * knows whether there would be a list in it
   */
  const hasUsableItem = (): boolean => {
    for (const entry of props.bag.latest ?? []) {
      if (entry.amount > 0 && isUsable(entry.item)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Spend it, whatever it is.
   *
   * The two that ask a question back are the sheet's own business: a
   * machine asks which move is given up for it, and a bottle which
   * move the points land on. Everything else is one call, and the
   * sentence it comes back with is the bag's to write
   */
  const useOn = (item: Items): void => {
    const catchId = props.catchId;

    setPanel(null);
    if (owned() == null || catchId == null) {
      return;
    }

    const move = isMachineItem(item) ? getMachineMove(item) : null;

    if (move != null) {
      setTeaching({ catchId, move, rest: [], levelled: false });
      return;
    }
    if (isPPItem(item)) {
      setBottle({ item, catchId });
      return;
    }
    // A signature takes the place of something on a full pokemon, and
    // which ability that is has to be asked before the patch is spent
    if (isAbilityPatch(item)) {
      setPatching(catchId);
      return;
    }

    spendItemOn(catchId, item)
      .then((result) => {
        toast.push(spentToast(item, result));
        props.onRecordChanged();
        props.onBagChanged();
        props.onEvolutionsChanged();
        props.onChange?.();

        if (result.level != null) {
          offerLevelMoves(catchId, recordOf(catchId), result.level);
        }
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /**
   * What the menu offers. Everything in it is occasional — the things
   * a player does to a pokemon now and then rather than every time
   * they open its sheet — and every one of them is refused while it is
   * fighting
   */
  /**
   * What the naming entry says: what it would do to *this* pokemon,
   * or who the name belongs to where it is not this player's to
   * change
   */
  const nameLabel = (loaded: CaughtPokemon, locked: boolean): string => {
    if (locked) {
      return 'Named by its first trainer';
    }
    return loaded.nickname === '' ? 'Set nickname' : 'Change nickname';
  };

  const actions = (loaded: CaughtPokemon): MenuAction[] => {
    // A name given before the pokemon changed hands stays its first
    // trainer's to change
    const nameLocked = isNicknameLocked(loaded, owned() ?? '');

    return [
      {
        label: isFavorite(loaded) ? 'Unfavorite' : 'Favorite',
        disabled: props.fighting.latest === true,
        onSelect: () => {
          favorite(!isFavorite(loaded));
        },
      },
      {
        label: isGuarded(loaded) ? 'Unlock' : 'Lock',
        disabled: props.fighting.latest === true,
        onSelect: () => {
          guard(!isGuarded(loaded));
        },
      },
      {
        label: 'Use item',
        // Dead where there is nothing to spend. The panel it opens says
        // "Nothing in the bag would do it any good" — which is an
        // answer, but it appeared at the *top* of the sheet, a screen
        // away from the menu that was pressed, so the press read as
        // having done nothing at all. A menu entry that cannot lead
        // anywhere should say so where the finger already is
        disabled: frozen() || isEgg(loaded) || !hasUsableItem(),
        onSelect: () => {
          setPanel((open) => (open === 'items' ? null : 'items'));
        },
      },
      {
        label: 'Auction',
        // A favorite is not to be parted with, and a lot cannot be taken
        // back off the block once it is on it. Nobody listening for the
        // listing is the same as nowhere to list it.
        //
        // `isAuctionableCatch` is the other half: the block takes one
        // listing a day off a player, so it is for perfect values, a
        // shiny or a legendary — anything else a bidder could walk out
        // and catch. The server asks the same of the stored record
        // ...and one lot at a time: while the player's own auction is
        // still taking bids, the block has no room for another
        disabled:
          props.onAuction == null ||
          props.fighting.latest === true ||
          props.selling() === true ||
          isFavorite(loaded) ||
          isEgg(loaded) ||
          !isAuctionableCatch(loaded),
        onSelect: () => {
          const catchId = props.catchId;

          if (catchId == null) {
            return;
          }
          // The listing dialog is the parent's to open: this one is
          // already a dialog, and the pokemon is about to leave the
          // records this sheet is reading
          props.onClose();
          props.onAuction?.(catchId);
        },
      },
      {
        label: nameLabel(loaded, nameLocked),
        // An egg is not named: what is in it has not been met, and a
        // name given to a shell is a name given to nobody
        disabled: props.fighting.latest === true || isEgg(loaded) || nameLocked,
        onSelect: () => {
          // Opened on the name it already has rather than on an empty
          // box: renaming is far commoner than naming, and a player
          // fixing one letter should not have to type the other eleven
          setNaming(loaded.nickname);
        },
      },
      {
        label: props.buddy.latest === props.catchId ? 'Walking with you' : 'Set buddy',
        disabled: props.buddy.latest === props.catchId,
        onSelect: takeAlong,
      },
    ];
  };

  /**
   * The menu's entries as the bar reads them: nothing at all until the
   * record is in hand, since every one of them acts on it
   */
  const menuActions = (): MenuAction[] => {
    const loaded = view();

    if (loaded == null) {
      return [];
    }
    const lookup: MenuAction[] =
      props.onDex == null
        ? []
        : [
            {
              label: 'View in Pokedex',
              // What is inside a shell has not been met yet
              disabled: isEgg(loaded),
              onSelect: () => {
                props.onDex?.(loaded.species);
              },
            },
          ];

    if (owned() == null) {
      return lookup;
    }
    return [
      ...actions(loaded),
      ...lookup,
      {
        label: 'Release',
        tone: 'danger',
        separated: true,
        // Opened even when refused, so the dialog can say why
        disabled: props.fighting.latest === true,
        onSelect: () => {
          setReleasing(true);
        },
      },
    ];
  };

  return (
    <>
      <Dialog
        width="broad"
        layout="sheet"
        // The sheet steps aside while the teaching dialog is up rather
        // than sitting open behind it: two modals at once fight for the
        // click that closes them, and the sheet is what the player comes
        // back to afterwards
        isOpen={
          props.catchId != null &&
          teaching() == null &&
          bottle() == null &&
          naming() == null &&
          !releasing() &&
          panel() !== 'items'
        }
        onClose={() => {
          // A release half-confirmed is a release declined
          setReleasing(false);
          setTracing(false);
          setPanel(null);
          props.onClose();
        }}
        // Announced by what it is; the pokemon's own name heads the
        // top row, where the mockup's title bar would have been
        title="Pokemon Info"
        quiet
        bar={
          // The menu stands from the first frame rather than hanging off
          // the record: every re-read of the record would rebuild it,
          // which closes it under the player's finger
          <>
            <Show when={view()}>
              {(record) => (
                <span class="mr-auto flex min-w-0 flex-wrap items-center gap-2 text-left">
                  <h3 class="truncate">{named()}</h3>
                  {/* The species only where a nickname took its place */}
                  <Show when={!isEgg(record()) && record().nickname !== ''}>
                    <Meta>
                      (<span>{getSpeciesData(record().species).name}</span>)
                    </Meta>
                  </Show>
                  <Show when={!isEgg(record()) && GENDER_MARKS[record().gender] !== ''}>
                    <span
                      class="text-lg leading-none"
                      title={GENDER_LABELS[record().gender]}
                      aria-label={GENDER_LABELS[record().gender]}
                    >
                      {GENDER_MARKS[record().gender]}
                    </span>
                  </Show>
                  <Show when={isFavorite(record())}>
                    <Badge tone="gold">
                      <StarIcon class="size-3.5" aria-hidden="true" />
                      Favorite
                    </Badge>
                  </Show>
                  <Show when={isGuarded(record())}>
                    <Badge tone="tide">
                      <LockIcon class="size-3.5" aria-hidden="true" />
                      Locked
                    </Badge>
                  </Show>
                  <Show when={!isEgg(record()) && isShiny(record())}>
                    <Badge tone="gold">
                      <SparklesIcon class="size-3.5" aria-hidden="true" />
                      Shiny
                    </Badge>
                  </Show>
                  <Show when={isShadow(record())}>
                    <Badge>Shadow</Badge>
                  </Show>
                  <Show when={props.buddy.latest === props.catchId}>
                    <Badge tone="leaf">Buddy</Badge>
                  </Show>
                  <Show when={owned() != null && props.fighting.latest === true}>
                    <Badge tone="ember">In a raid</Badge>
                  </Show>
                </span>
              )}
            </Show>
            <Show when={owned() != null || props.onDex != null}>
              <Menu label="Actions" icon={ActionsIcon} actions={menuActions()} />
            </Show>
            <CloseButton
              onPress={() => {
                setReleasing(false);
                setTracing(false);
                setPanel(null);
                props.onClose();
              }}
            />
          </>
        }
        description={
          props.readOnly === true
            ? 'One pokemon in full, as it stands. Nothing here can be changed, since it is not yours.'
            : 'One pokemon in full: what it is, what it is carrying, and what can be done to it.'
        }
      >
        {/* The record is read through `latest`, so a write that re-reads
            it keeps showing the old record instead of suspending, which
            would tear the panel and the page down. The sheet also waits
            for the move, item and ability registries */}
        <BattleData fallback={<Note>Loading catch…</Note>}>
          <Show
            when={view()}
            fallback={
              <Note>{props.detail.latest == null ? 'Loading catch…' : 'No such catch.'}</Note>
            }
          >
            {(loaded) => (
              <>
                {/* An egg is one thing and one question: how far along it
                    is, and whether it is ready. It has no stats, no
                    moves and nothing to evolve into yet, and what
                    family it belongs to is exactly what hatching it
                    tells you, so the columns and the candy stay away
                    until there is a pokemon to put in them */}
                <Show
                  when={!isEgg(loaded())}
                  fallback={
                    <div
                      class="flex flex-col items-center justify-center gap-4 border-y-2
                        border-line-soft py-4 text-center md:min-h-0 md:flex-1"
                    >
                      {/* Fitted to a square of its own: an egg drawn to
                          whatever width the panel has is a very large
                          egg */}
                      <div class="flex w-40 max-w-full flex-col items-center gap-2">
                        <PortraitSection caught={loaded()} named={named()} />
                      </div>

                      <section class="flex w-full max-w-sm flex-col gap-2">
                        <h3>Hatching</h3>
                        <div class="h-2 overflow-hidden rounded-full bg-line-soft">
                          <div
                            class="h-full rounded-full bg-leaf transition-[width]"
                            style={{
                              width: `${Math.min(100, (loaded().steps / Math.max(1, loaded().hatchSteps)) * 100)}%`,
                            }}
                          />
                        </div>
                        <Note>
                          {loaded().steps} / {loaded().hatchSteps} steps
                          {props.buddy.latest === props.catchId
                            ? '.'
                            : '. It only moves while it is the one being carried.'}
                        </Note>
                        <Show when={owned()}>
                          <Row class="justify-center">
                            <Button tone="primary" disabled={!canHatch(loaded())} onClick={hatch}>
                              Hatch it
                            </Button>
                          </Row>
                        </Show>
                      </section>
                    </div>
                  }
                >
                  {/* Fitted to one screen: who it is and what it becomes on
                      the left, what it fights with and what it is made of on
                      the right. The columns size apart, so a tall block on
                      one side never pushes the other. One scrolling column
                      on a phone, portrait, moves, evolutions, then stats */}
                  <div
                    class="flex flex-col gap-3 border-y-2 border-line-soft md:grid md:min-h-0
                      md:flex-1 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-0"
                  >
                    <div
                      class="contents md:flex md:min-h-0 md:flex-col md:border-r-2
                        md:border-line-soft md:pr-4"
                    >
                      <div class="flex flex-col items-center gap-2 py-3 text-center md:flex-1">
                        <PortraitSection caught={loaded()} named={named()} />

                        <div class="flex flex-wrap items-center justify-center gap-1.5">
                          <Badge tone="gold">
                            <CandySprite
                              family={getSpeciesData(loaded().species).family}
                              label=""
                              class={CANDY_BADGE}
                            />
                            <span class="tabular-nums">{shownCandies()}</span>
                          </Badge>
                          {/* The level and what raises it are one control:
                            where it stands and what the next step costs */}
                          <Show
                            when={owned() != null}
                            fallback={<Badge tone="leaf">Lv. {loaded().level}</Badge>}
                          >
                            {/* Presses are gathered and sent together once they stop */}
                            <Button
                              tone="primary"
                              disabled={
                                shownCandies() < getCandyCost(loaded()) ||
                                shownLevel() >= MAX_LEVEL ||
                                // A level already paid for is waiting on an
                                // answer, and pressing past it would take the
                                // offer away
                                teaching()?.levelled === true ||
                                frozen()
                              }
                              onClick={feedCandy}
                            >
                              {/* The cost in candy, drawn, as a badge on the button */}
                              {shownLevel() >= MAX_LEVEL ? (
                                `Lv. ${shownLevel()}`
                              ) : (
                                <>
                                  Level Up
                                  <Badge tone="gold">
                                    <CandySprite
                                      family={getSpeciesData(loaded().species).family}
                                      label="Candy"
                                      class={CANDY_BADGE}
                                    />
                                    x {getCandyCost(loaded())}
                                  </Badge>
                                </>
                              )}
                            </Button>
                          </Show>
                        </div>

                        <div class="flex flex-wrap items-center justify-center gap-1.5">
                          <span class="text-sm font-medium">
                            {getSpeciesData(loaded().species).category}
                          </span>
                          <Divider />
                          <For each={getSpeciesData(loaded().species).types}>
                            {(type) => <TypeBadge type={type} />}
                          </For>
                        </div>
                        {/* This individual's own size, rolled from its trait
                          value against the species as it stands now */}
                        <div class="flex flex-wrap items-center justify-center gap-1.5">
                          <Badge>
                            {deriveSize(loaded().species, loaded().traitValue).height.toFixed(2)} m
                          </Badge>
                          <Badge>
                            {deriveSize(loaded().species, loaded().traitValue).weight.toFixed(1)} kg
                          </Badge>
                        </div>
                        {/* What walking with it has earned: how close it is,
                          which friendship evolutions and Return read, and
                          how far it has gone as a buddy */}
                        <div class="flex flex-wrap items-center justify-center gap-1.5">
                          <TooltipHost
                            name="Friendship"
                            description={`${loaded().friendship} of ${MAX_FRIENDSHIP}`}
                          >
                            <Badge tone="leaf">
                              <HeartIcon class="size-3.5" aria-hidden="true" />
                              {describeFriendship(loaded().friendship)}
                            </Badge>
                          </TooltipHost>
                          <Badge>
                            {loaded().walked} {loaded().walked === 1 ? 'step' : 'steps'}
                          </Badge>
                        </div>
                      </div>

                      <div
                        class="order-3 flex min-h-0 flex-col border-t-2 border-line-soft py-3 md:order-none
                        md:h-48 md:shrink-0"
                      >
                        <EvolutionSection
                          options={props.evolutions.latest}
                          owned={owned() != null}
                          frozen={frozen()}
                          shiny={isShiny(loaded())}
                          dexKnows={dexKnows}
                          onEvolve={evolve}
                        />
                      </div>
                    </div>

                    <div class="contents md:flex md:min-h-0 md:flex-col md:pl-4">
                      {/* Stats lead the column: they are what a player
                          opens a catch to read */}
                      <div class="order-2 py-3 md:order-none md:shrink-0">
                        <StatsSection
                          caught={loaded()}
                          owned={owned() != null}
                          frozen={frozen()}
                          onTrain={train}
                        />
                      </div>

                      <div
                        class="order-4 min-h-0 border-t-2 border-line-soft py-3 md:order-none
                        md:flex-1 md:overflow-y-auto"
                      >
                        {/* An egg has nothing to fight with yet, so its side
                          holds the way out of the shell */}
                        <BattleSection
                          caught={loaded()}
                          owned={owned() != null}
                          frozen={frozen()}
                          holdables={holdables()}
                          bag={props.bag.latest}
                          giving={panel() === 'give'}
                          onGiving={(open) => {
                            setPanel(open ? 'give' : null);
                          }}
                          onGive={(item) => {
                            moveItem(item, true);
                          }}
                          onTake={(item) => {
                            moveItem(item, false);
                          }}
                          onArrange={arrange}
                        />
                      </div>
                    </div>
                  </div>
                </Show>

                {/* Where it came from in one line. The full chain opens in
                    its own dialog, since a traded pokemon's can run long */}
                <div class="flex items-center gap-2">
                  <ItemSprite
                    item={BALL_ITEMS[loaded().ball]}
                    size={HISTORY_BALL}
                    class={HISTORY_BALL_INSET}
                    label={describeItem(BALL_ITEMS[loaded().ball])}
                  />
                  <Meta class="grow truncate text-left">{describeHistory(loaded())}</Meta>
                  <Show when={loaded().history.length > 0}>
                    <Button
                      onClick={() => {
                        setTracing(true);
                      }}
                    >
                      History ({loaded().history.length})
                    </Button>
                  </Show>
                </div>
              </>
            )}
          </Show>
        </BattleData>

        {/* Opened over the sheet from inside it, so the sheet stays
            where it is underneath */}
        <Dialog
          width="wide"
          isOpen={props.catchId != null && tracing()}
          onClose={() => {
            setTracing(false);
          }}
          title="History"
          description="Everyone who has owned this pokemon, oldest first."
          terse
        >
          <Show when={view()}>
            {(loaded) => (
              <HistorySection
                caught={loaded()}
                player={auth.user()?.uid ?? ''}
                nameOf={describeOwner}
                onTrainer={(uid) => {
                  setTracing(false);
                  props.onTrainer?.(uid);
                }}
              />
            )}
          </Show>
          <DialogActions>
            <Button
              onClick={() => {
                setTracing(false);
              }}
            >
              Back
            </Button>
          </DialogActions>
        </Dialog>
      </Dialog>

      {/* There is no undoing it, so it asks first and names what
          letting it go pays, held items included */}
      <Dialog
        isOpen={props.catchId != null && releasing()}
        onClose={() => {
          setReleasing(false);
        }}
        title="Release it?"
        description="Letting a pokemon go cannot be undone."
        terse
      >
        <Show when={view()}>
          {(loaded) => (
            <>
              <Show
                when={blockedRelease(loaded())}
                fallback={
                  <Note>
                    {named()} will be let go for {getReleaseCandy(loaded())} candy.
                    <Show when={loaded().items.length > 0}>
                      {' '}
                      What it is holding comes back to the bag: {describeItems(loaded().items)}.
                    </Show>
                  </Note>
                }
              >
                {(reason) => <Note>{reason()}</Note>}
              </Show>
              <DialogActions>
                <Button tone="danger" disabled={blockedRelease(loaded()) != null} onClick={release}>
                  Release
                </Button>
                <Button
                  onClick={() => {
                    setReleasing(false);
                  }}
                >
                  Keep it
                </Button>
              </DialogActions>
            </>
          )}
        </Show>
      </Dialog>

      {/* Learning is its own dialog because what it costs is a
          question — which move is given up — and one used on a pokemon
          with room asks nothing at all. A machine and a level ask the
          same question, so they share it; only the price differs, and
          a level has none.

          Closing steps to whatever else the level offered rather than
          straight back to the sheet, since a level can hand over two
          moves at once and each is its own decision */}
      <TeachMoveDialog
        catchId={teaching()?.catchId ?? null}
        move={teaching()?.move ?? null}
        cost={teaching()?.levelled === true ? 'Nothing' : undefined}
        teach={teaching()?.levelled === true ? learnLevelUpMove : undefined}
        onClose={nextTeaching}
        onTaught={() => {
          say(teaching()?.levelled === true ? 'Learned.' : 'Taught.', 'leaf');
          props.onRecordChanged();
          props.onBagChanged();
          props.onChange?.();
        }}
      />

      {/* Naming, on a dialog of its own for the same reason teaching
          is: the sheet is long and the field would be somewhere down
          it, while this is one box and one button.

          The box is filled the moment it opens rather than after a
          "do you want to rename it?" step, and the button is dead
          until the name in it is actually different — the question a
          player came here to answer is what to call it, not whether
          they meant to */}
      <Dialog
        isOpen={naming() != null}
        onClose={() => {
          setNaming(null);
        }}
        title="Change nickname?"
        // The sentence is for the screen reader alone: the box under
        // the heading is labelled, and the line below it already says
        // what an empty box does. A dialog this small should not
        // explain itself twice
        terse
        description="What you call it. Left empty, it goes back to being called by its species."
      >
        <Field label="Name" stacked>
          <input
            type="text"
            value={naming() ?? ''}
            maxLength={NICKNAME_LIMIT}
            onInput={(event) => {
              setNaming(event.currentTarget.value);
            }}
          />
        </Field>

        {/* What it will actually be called: the name cleaned the way
            the server will clean it, or the species' own name for a
            box left empty. A player should not have to send it to
            find out what it did */}
        <Meta>{describeDraft()}</Meta>

        <DialogActions>
          <Button
            disabled={renaming()}
            onClick={() => {
              setNaming(null);
            }}
          >
            Never mind
          </Button>
          <Button
            tone="primary"
            // Nothing to do where the name has not changed: the same
            // name written again is a write for the sake of one
            disabled={renaming() || drafted() === (view()?.nickname ?? '')}
            onClick={rename}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* The bag, on a dialog of its own for the same reason the rest
          are: what is being spent is chosen from a list, and a list
          drawn into the top of a long sheet pushes the pokemon it is
          being spent on off the screen.

          Anything the bag can be spent on this pokemon is in it: a
          remedy, a cap, a gem for a shadow, a wing, a bitter berry.
          One list rather than five, since "what would this do for it"
          is the same question every time */}
      <InventoryPicker
        open={panel() === 'items'}
        onClose={() => {
          setPanel(null);
        }}
        title="Use item"
        description={`Choose what to spend on ${named()}.`}
        entries={props.bag.latest}
        disabled={frozen()}
        // Only the prized and special bands ask twice. Everything a
        // player heals with — a Potion, a Full Restore, a wing — is
        // spent over and over, and asking about each is a click for
        // nothing; a cap or a Purifying Gem changes the pokemon for
        // good, and the wrong pokemon is the wrong pokemon for good
        // with it
        confirm={(entry) => isPreciousItem(entry.item)}
        // The gem is the one item whose second press is a decision
        // rather than a formality: what it takes off cannot be put
        // back, and the reason for keeping a shadow is the shadow
        warn={(entry) => {
          const loaded = view();

          if (isAbilityPatch(entry.item)) {
            return 'A signature cannot be taken back off, and neither can the ability it replaces.';
          }
          return isPurifyingGem(entry.item) && loaded != null && isShadow(loaded)
            ? 'Purifying cannot be undone. The Shadow ability goes for good, and it stops being a shadow.'
            : null;
        }}
        value={null}
        verb="Use"
        empty="Nothing in the bag would do it any good."
        filter={(entry) => isUsable(entry.item)}
        onPick={(item) => {
          if (item != null) {
            useOn(item);
          }
        }}
      />

      {/* And the same shape for a bottle: a PP Up is spent on one move
          and nothing takes the points back, so it asks which before it
          leaves the bag */}
      {/* Folding a dragon in asks which one, the way a machine asks
          which move: the splicers are not spent and the dragon is not
          gone, but it goes out of sight until the pair comes apart, so
          the choice is the player's rather than a roll */}
      <CatchPicker
        open={folding() != null}
        value={null}
        title={`Fold in a ${dragonName()}?`}
        description="It goes inside the Kyurem until you take the two apart again."
        verb="Fold in"
        empty="You have none of that dragon."
        filter={(option) =>
          option.caught.species === dragonWanted() &&
          !option.fighting &&
          !isEgg(option.caught) &&
          !isGuarded(option.caught)
        }
        onClose={() => {
          setFolding(null);
        }}
        onPick={(partnerId) => {
          const into = folding();
          const catchId = props.catchId;

          setFolding(null);
          if (partnerId == null || into == null || catchId == null) {
            return;
          }
          fuseCatch(catchId, partnerId, into)
            .then((species) => {
              settleFusion(species, 'The two are one.');
            })
            .catch((caught: unknown) => {
              say(caught instanceof Error ? caught.message : String(caught), 'ember');
            });
        }}
      />

      {/* And the same shape again for a patch, which asks what gives
          way before the signature is written over it */}
      <AbilityPatchDialog
        catchId={patching()}
        onClose={() => {
          setPatching(null);
        }}
        onUsed={(said) => {
          say(said, 'leaf');
          props.onRecordChanged();
          props.onBagChanged();
          props.onChange?.();
        }}
      />

      <IncreasePPDialog
        catchId={bottle()?.catchId ?? null}
        item={bottle()?.item ?? null}
        onClose={() => {
          setBottle(null);
        }}
        onUsed={(said) => {
          say(said);
          props.onRecordChanged();
          props.onBagChanged();
          props.onChange?.();
        }}
      />
    </>
  );
}
