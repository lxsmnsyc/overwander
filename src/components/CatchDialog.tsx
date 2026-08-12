import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import { isLockLive } from '../auth/battle-lock';
import { getBuddy, setBuddy } from '../auth/buddy';
import { syncServerClock } from '../auth/clock';
import { canHatch, isEgg } from '../auth/egg';
import { hatchEgg } from '../auth/eggs';
import {
  type CaughtPokemon,
  countCaught,
  getCaught,
  giveItem,
  isFavorite,
  isGuarded,
  releaseCatch,
  setFavorite,
  setGuarded,
  takeItem,
} from '../auth/caught';
import useHealingItem from '../auth/healing';
import { ACQUISITION_NAMES, getCatchSlots, isShadow, isShiny } from '../auth/caught-record';
import { Slots } from '../data/constants/slots';
import { getProfile } from '../auth/profile';
import {
  type HealthState,
  STATUS_NAMES,
  getMaxHealth,
  healedByItem,
  isFainted,
} from '../auth/health';
import useBottleCap from '../auth/bottle-caps';
import usePurifyingGem from '../auth/purify';
import { type InventoryEntry, getInventory } from '../auth/inventory';
import { isAuctionableCatch } from '../auth/auctions';
import { getCandyCost, getCandyCount, useCandy } from '../auth/candy';
import { learnLevelUpMove } from '../auth/moves';
import { useAuth } from '../auth/context';
import { type EvolutionOption, evolveCatch, listEvolutionOptions } from '../auth/evolution';
import { assignableEffort, unusedEffort } from '../auth/effort';
import { type TrainingResult, feedEffortBerry, trainEffort, useWing } from '../auth/training';
import { getAbilityData } from '../data/abilities';
import { MAX_LEVEL } from '../data/constants/levels';
import {
  MAX_EFFORT_PER_STAT,
  MAX_IV,
  STAT_ORDER,
  Stats,
  getIV,
  getOtherStat,
} from '../data/constants/stats';
import getSigil from '../data/constants/sigil';

import { BERRY_EFFORT_DROPS } from '../data/items/berries';
import { isWing } from '../data/items/wings';
import type Abilities from '../data/ids/abilities';
import { NATURE_NAMES, getNatureFactor } from '../data/ids/natures';
import { ItemFlags, type Items, getMachineMove, isMachineItem } from '../data/ids/items';
import { EvolutionMethod, Genders, Species } from '../data/ids/species';
import { getItemData } from '../data/items';
import { isBottleCap, isPerfectIVs } from '../data/items/bottle-caps';
import { isHerbal } from '../data/items/medicine';
import { isPurifyingGem } from '../data/items/purifying-gem';
import { unpackStatuses } from '../data/ids/status';
import { getMoveData } from '../data/moves';
import { MOVE_CATEGORY_COLORS, MOVE_CATEGORY_NAMES, type Moves } from '../data/ids/moves';
import {
  SUPPORTED_METHODS,
  getConsumedItem,
  getMovesLearnedAt,
  getSpeciesData,
} from '../data/species';
import { BIOME_NAMES } from '../data/biome';
import Biome from '../data/ids/biome';
import { isPreciousItem } from '../data/overworld/item-pool';
import { getLairTitle } from '../data/overworld/lair';
import describeDate from '../core/dates';
import {
  ENCOUNTER_TYPE_NAMES,
  EncounterType,
  isFatefulEncounter,
  isRaidEncounter,
} from '../overworld/encounter';
import InventoryPicker, { describeItem } from './InventoryPicker';
import SpriteDisplay from './SpriteDisplay';
import TeachMoveDialog from './TeachMoveDialog';
import TypeBadge from './TypeBadge';
import { TabGroup, TabPanel } from 'terracotta';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogSection,
  Divider,
  List,
  ListRow,
  Menu,
  type MenuAction,
  Meta,
  Note,
  Row,
  Status,
  TabBar,
  TabButton,
} from './styled';

/**
 * The three readings of one set of six numbers: what the pokemon has
 * now, what it was born with, and what has been trained into it
 */
const enum StatView {
  Total = 0,
  IV = 1,
  EV = 2,
}

/**
 * How much training one press moves. Four points buy one point of the
 * stat itself, so anything smaller would be a button that sometimes
 * does nothing visible
 */
const EFFORT_STEP = 4;

/**
 * What a nature does to a stat, as a colour. A nature raises one and
 * lowers another and leaves the rest alone, which is three cases; they
 * are indexed by the sign of what the nature multiplies by, shifted so
 * that a drop is 0, no change is 1 and a boost is 2.
 *
 * Red for the raised one and blue for the lowered one, the way the
 * games have always marked them. Nothing rests on the colour alone —
 * the same bar is longer or shorter for the same reason
 */
const NATURE_BARS = ['bg-tide', 'bg-leaf', 'bg-ember'] as const;
const NATURE_NUMBERS = ['text-tide', '', 'text-ember-dark'] as const;

const STAT_LABELS: Record<Stats, string> = {
  [Stats.HP]: 'HP',
  [Stats.Attack]: 'Attack',
  [Stats.Defense]: 'Defense',
  [Stats.SpecialAttack]: 'Sp. Attack',
  [Stats.SpecialDefense]: 'Sp. Defense',
  [Stats.Speed]: 'Speed',
};

const GENDER_LABELS: Record<Genders, string> = {
  [Genders.Genderless]: 'Genderless',
  [Genders.Male]: 'Male',
  [Genders.Female]: 'Female',
};

/**
 * The sign a gender is shown by, beside the types rather than in a
 * line of its own. Something genderless shows nothing: the mark for it
 * would be one more symbol to learn for a fact that changes nothing
 */
const GENDER_MARKS: Record<Genders, string> = {
  [Genders.Genderless]: '',
  [Genders.Male]: '♂',
  [Genders.Female]: '♀',
};

/**
 * The six values as a dex prints them, used in the record, in what a
 * bottle cap reports back, and on an auction lot — a bidder is buying
 * these more than they are buying the species
 */
export function describeIVs(ivs: number): string {
  return STAT_ORDER.map((stat) => `${STAT_LABELS[stat]} ${getIV(ivs, stat)}`).join(' · ');
}

/**
 * Where it came from, for the ones that came from somewhere.
 *
 * A fateful meeting happened nowhere: a gift, an event pokemon and a
 * mythical called out of a relic were never standing in a chunk, and
 * the one they are stamped with is only where their owner happened to
 * be at the time. Naming it would invite somebody to walk back there
 * and look, so it is left unsaid — and the record says `Beyond`,
 * which is the world's own word for nowhere
 */
function describeOrigin(caught: CaughtPokemon): string | null {
  const { biome, x, y } = caught.origin;

  // A mythical says `Beyond` and a gift says it too; a legendary or a
  // shadow raid was fought somewhere real, and says where
  if (biome === Biome.Beyond || isFatefulEncounter(caught.type)) {
    return null;
  }
  // The same shape the map writes in its own corner, so a player
  // reading a record and a player looking at the ground are reading
  // the same thing
  return `${BIOME_NAMES[biome]} (${x}, ${y})`;
}

/**
 * Where it was met.
 *
 * A raid prize is named after the place it was fought in — **Caught
 * at Seafoam Islands**, **Caught at Faraway Island** — because that
 * is what the lobby was called and what the player travelled to. All
 * three kinds of raid read that way; a shadow of a place is still
 * that place, with a word in front of it.
 *
 * None of this says how it came to be **theirs** — caught, hatched,
 * won at auction, given. That is the ownership history, which is its
 * own line further up
 */
function describeMet(caught: CaughtPokemon): string {
  if (isRaidEncounter(caught.type)) {
    return `Caught at ${getLairTitle(
      caught.lair,
      caught.origin.biome,
      caught.type === EncounterType.ShadowRaid,
    )}`;
  }
  return ENCOUNTER_TYPE_NAMES[caught.type];
}

/**
 * The line under the ownership history: where this pokemon came from,
 * when, and what it is in.
 *
 * A gift and an event pokemon get a sentence instead of a list. There
 * is no place, the ball is a formality, and the date is already on
 * the line above — what is left worth saying is that it was never met
 * anywhere, so that is all it says
 */
function describeHistory(caught: CaughtPokemon): string {
  if (caught.type === EncounterType.Fateful) {
    return 'Met in a fateful encounter.';
  }
  // The ball is left out. It is on the record and it decides nothing
  // afterwards — what a pokemon was caught in says less about it than
  // where and when, and the line is what those two are for
  return [
    isEgg(caught) ? 'Found' : describeMet(caught),
    describeDate(caught.caughtAt),
    describeOrigin(caught),
  ]
    .filter((part) => part != null)
    .join(' · ');
}

/**
 * What an evolution is waiting for, in the fewest words that answer
 * "why is that button dead".
 *
 * One that can be taken says only what it costs, since the button
 * beside it already says it is available. One that cannot says what is
 * missing — a level, a stone, something to hold — and one whose
 * condition the game has no way to measure says so plainly rather than
 * naming a requirement a player could chase forever
 */
function describeEvolutionNeed(option: EvolutionOption): string | null {
  const { evolution } = option;
  const { method, item } = evolution;

  if (option.available) {
    const spent = getConsumedItem(evolution);

    return spent == null ? null : `uses ${describeItem(spent)}`;
  }
  if (method === 0 || (method & ~SUPPORTED_METHODS) !== 0) {
    return 'not possible here';
  }

  const missing: string[] = [];

  if ((method & EvolutionMethod.Level) !== 0 && evolution.level != null) {
    missing.push(`Lv. ${evolution.level}`);
  }
  if ((method & EvolutionMethod.UsedItem) !== 0 && item != null) {
    missing.push(describeItem(item));
  }
  if ((method & EvolutionMethod.HeldItem) !== 0 && item != null) {
    missing.push(`${describeItem(item)} in hand`);
  }
  return missing.length === 0 ? 'not yet' : `needs ${missing.join(' · ')}`;
}

/**
 * A catch is one document — abilities, held items and ownership
 * history included — so the dialog opens on a single read.
 *
 * What came back is handed over with the id it was asked for. The
 * sheet reads the resource's last value rather than suspending on it,
 * and a last value is only worth showing while it is still about the
 * pokemon on screen: without the id, opening a second catch would show
 * the first one for as long as the read took
 */
async function loadDetail(catchId: string): Promise<{ id: string; caught: CaughtPokemon | null }> {
  return { id: catchId, caught: await getCaught(catchId) };
}

/**
 * An ability with no registered data shows as its id rather than a
 * guess; every Gen 1 ability is registered
 */
export function describeAbility(ability: Abilities): string {
  try {
    return getAbilityData(ability).name;
  } catch {
    return `Ability #${ability}`;
  }
}

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
 * One catch in full, shown over the list it was opened from
 */
export default function CatchDialog(props: CatchDialogProps): JSX.Element {
  const auth = useAuth();
  const [detail, { refetch }] = createResource(() => props.catchId, loadDetail);
  const [status, setStatus] = createSignal<string | null>(null);

  const view = (): CaughtPokemon | null => {
    // `latest` rather than the resource itself: everything on this
    // sheet that writes re-reads the record afterwards, and a read that
    // suspends unmounts the panel — and, through the boundary the page
    // is under, the page behind it. Keeping the last record on screen
    // while the next one arrives is what makes a favorite land without
    // the screen blinking. It is only kept while it is about the
    // pokemon being looked at
    const held = detail.latest;
    const loaded = held?.id === props.catchId ? held.caught : null;

    if (loaded == null) {
      return null;
    }
    // A catch belongs to exactly one player; one opened under
    // someone else's list is a wrong address, not a peek. Looking at
    // one on the block is the exception: it is owned by nobody while
    // it is there, and being able to look is the point of a board
    return props.readOnly === true || loaded.owner === props.player ? loaded : null;
  };

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
   * What everyone who has owned it is called. Profiles are readable by
   * every signed-in player — that is what nicknames are for — and the
   * chain is short, so they are read once for the whole of it and
   * looked up by uid as the rows draw
   */
  const [owners] = createResource(
    () => [...new Set(view()?.history.map((entry) => entry.owner) ?? [])].sort().join(','),
    async (key): Promise<Map<string, string>> => {
      const named = new Map<string, string>();

      await Promise.all(
        key
          .split(',')
          .filter(Boolean)
          .map(async (uid) => {
            const profile = await getProfile(uid);

            if (profile != null) {
              named.set(uid, profile.nickname);
            }
          }),
      );
      return named;
    },
  );

  /**
   * Who an entry names. The player reading it is "you" rather than
   * their own nickname, and a trainer whose profile has gone is still
   * somebody — an owner is a fact about the pokemon, so a missing
   * profile must not take the entry off the list
   */
  const describeOwner = (uid: string): string => {
    if (uid === auth.user()?.uid) {
      return 'You';
    }
    return owners.latest?.get(uid) ?? 'A trainer';
  };

  const [evolutions, { refetch: refetchEvolutions }] = createResource(
    () => {
      const uid = owned();
      const catchId = props.catchId;

      return uid == null || catchId == null ? null : ([uid, catchId, view()?.species] as const);
    },
    async ([uid, catchId]) => listEvolutionOptions(uid, catchId),
  );

  /**
   * Whether this pokemon is fighting right now. A battle runs on a
   * frozen snapshot of the party, so the record it was copied from
   * holds still until the fight ends — the server refuses the writes
   * either way; this is only so the buttons say so first
   */
  const [fighting] = createResource(
    () => view(),
    async (caught) => isLockLive(caught, await syncServerClock()),
  );

  /**
   * Whether this is the only pokemon they have. The server refuses to
   * release it either way; this is so the button says so before it is
   * pressed twice
   */
  const [onlyOne] = createResource(
    () => owned(),
    async (uid) => (await countCaught(uid)) <= 1,
  );

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

    return fighting.latest === true || (loaded != null && isGuarded(loaded));
  };

  /**
   * The candies behind this catch: the stack is keyed by family, so
   * every stage of the line spends the same pile
   */
  const [candies, { refetch: refetchCandies }] = createResource(
    () => {
      const species = view()?.species;

      return species == null ? null : ([props.player, getSpeciesData(species).family] as const);
    },
    async ([player, family]) => getCandyCount(player, family),
  );

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
    move: Moves;
    rest: Moves[];
    /**
     * Grown into rather than taught: the candy already paid for it
     */
    levelled: boolean;
  }

  const [teaching, setTeaching] = createSignal<Teaching | null>(null);

  /**
   * Move on to the next thing the level offered, or close the dialog
   * when that was the last of them
   */
  const nextTeaching = (): void => {
    const current = teaching();
    const queued = current?.rest ?? [];

    setTeaching(
      current == null || queued.length === 0
        ? null
        : { ...current, move: queued[0], rest: queued.slice(1) },
    );
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
  const offerLevelMoves = (level: number): void => {
    const caught = view();

    if (caught == null || isEgg(caught)) {
      return;
    }

    const knows = new Set(caught.moves);
    const learning = getMovesLearnedAt(caught.species, level).filter(
      (learned) => !knows.has(learned),
    );

    if (learning.length > 0) {
      setTeaching({ move: learning[0], rest: learning.slice(1), levelled: true });
    }
  };

  const feedCandy = (): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    setStatus(null);
    useCandy(catchId)
      .then(async (level) => {
        setStatus(level == null ? 'That candy could not be used.' : `Grew to level ${level}.`);
        await refetch();
        await refetchCandies();
        await refetchEvolutions();
        props.onChange?.();

        if (level != null) {
          offerLevelMoves(level);
        }
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * What the dialog is called. An egg gives away nothing about what is
   * inside it — not the species, not even whether it sparkles — and a
   * record still being read gives away nothing at all, but the dialog
   * is named either way rather than opening unnamed
   */
  const named = (): string => {
    const loaded = view();

    if (loaded == null) {
      return 'Catch';
    }
    if (isEgg(loaded)) {
      return 'Egg';
    }
    return `${isShiny(loaded) ? '✦ ' : ''}${getSpeciesData(loaded.species).name}`;
  };

  /**
   * What the player is carrying. The bag is read once and split
   * below: some of it can be handed over, some of it can be spent on
   * the pokemon, and the two lists move together when either does
   */
  const [bag, { refetch: refetchBag }] = createResource(
    () => owned(),
    async (uid) => getInventory(uid),
  );

  /**
   * Whether a catch is allowed to hold it at all
   */
  const isHoldable = (item: Items): boolean => {
    try {
      return (getItemData(item).flags & ItemFlags.Holdable) !== 0;
    } catch {
      // An unregistered item has no flags to read, so it is not
      // offered rather than assumed holdable
      return false;
    }
  };

  /**
   * What in the bag could be handed over. The button that opens the
   * bag asks this rather than opening onto an empty list
   */
  const holdables = (): InventoryEntry[] =>
    (bag.latest ?? []).filter((entry) => isHoldable(entry.item));

  /**
   * Whether the item would do this pokemon some good — a berry, a
   * potion, a cure, a revive. The rules decide: an item that would
   * change nothing about this pokemon is not offered, because using it
   * would spend it
   */
  const isRemedy = (item: Items): boolean => {
    const caught = view();

    return caught != null && healedByItem(caught, item) != null;
  };

  const moveItem = (item: Items, give: boolean): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    setStatus(null);
    (give ? giveItem(catchId, item) : takeItem(catchId, item))
      .then(async (moved) => {
        setStatus(
          moved
            ? `${describeItem(item)} ${give ? 'handed over' : 'taken back'}.`
            : `${describeItem(item)} could not be ${give ? 'handed over' : 'taken back'}.`,
        );
        await refetch();
        await refetchBag();
        await refetchEvolutions();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const heal = (item: Items): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    setStatus(null);
    useHealingItem(catchId, item)
      .then(async (state: HealthState | null) => {
        setStatus(
          state == null
            ? `${describeItem(item)} would do nothing for it.`
            : // Herbal medicine is swallowed, and the pokemon holds it
              // against whoever handed it over
              `${describeItem(item)} used — ${state.health} HP.${
                isHerbal(item) ? ' It did not enjoy that.' : ''
              }`,
        );
        await refetch();
        await refetchBag();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * Everything that moves a pokemon's training lands the same way:
   * the server decides it against the stored record and hands back
   * what the pokemon now has, and the sheet re-reads rather than
   * trusting its own arithmetic
   */
  const settleTraining = (
    running: Promise<TrainingResult | null>,
    refused: string,
    landed: (result: TrainingResult) => string,
  ): void => {
    setStatus(null);
    running
      .then(async (result) => {
        setStatus(result == null ? refused : landed(result));
        await refetch();
        await refetchBag();
        props.onChange?.();
      })
      .catch((thrown: unknown) => {
        setStatus(thrown instanceof Error ? thrown.message : String(thrown));
      });
  };

  const train = (stat: Stats, amount: number): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    settleTraining(
      trainEffort(catchId, stat, amount),
      'Those points could not be moved.',
      (result) =>
        `${STAT_LABELS[stat]} trained to ${result.effortValues[stat]} — ${result.unused} left to spend.`,
    );
  };

  const trainWithWing = (item: Items): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    settleTraining(
      useWing(catchId, item),
      `${describeItem(item)} could not be used.`,
      () => `${describeItem(item)} — three points it did not have to earn.`,
    );
  };

  const feedBitterBerry = (item: Items): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    settleTraining(
      feedEffortBerry(catchId, item),
      `${describeItem(item)} could not be fed.`,
      (result) =>
        `Bitter, and good for it — ${result.unused} points back to spend, and it thinks the better of you.`,
    );
  };

  const purify = (item: Items): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    setStatus(null);
    usePurifyingGem(catchId, item)
      .then(async (ivs) => {
        setStatus(
          ivs == null
            ? `${describeItem(item)} could not be used.`
            : `The shadow is gone — ${describeIVs(ivs)}.`,
        );
        await refetch();
        await refetchBag();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const polish = (item: Items): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    setStatus(null);
    useBottleCap(catchId, item)
      .then(async (ivs) => {
        setStatus(
          ivs == null
            ? `${describeItem(item)} could not be used.`
            : `${describeItem(item)} polished it — ${describeIVs(ivs)}.`,
        );
        await refetch();
        await refetchBag();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * Which catch is currently walking with the player, so the button
   * can say whether this is the one
   */
  const [buddy, { refetch: refetchBuddy }] = createResource(() => owned(), getBuddy);

  const takeAlong = (): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    setStatus(null);
    setBuddy(uid, catchId)
      .then(async (set) => {
        setStatus(set ? 'Walking with you now.' : 'That one cannot come along.');
        await refetchBuddy();
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const hatch = (): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    setStatus(null);
    hatchEgg(catchId)
      .then(async (species) => {
        setStatus(
          species == null
            ? 'It is not ready yet.'
            : `It hatched into ${getSpeciesData(species).name}!`,
        );
        await refetch();
        await refetchCandies();
        await refetchEvolutions();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  const evolve = (into: Species): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    setStatus(null);
    evolveCatch(catchId, into)
      .then(async (species) => {
        setStatus(
          species == null ? 'That evolution is no longer available.' : 'Evolution complete.',
        );
        await refetch();
        await refetchEvolutions();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * Mark it as one to keep, or put it away. Both are one field on the
   * record and both are the player's own doing, so they are settled
   * the same way: write, re-read, say what happened
   */
  const mark = (setting: Promise<boolean | null>, said: string, refused: string): void => {
    setStatus(null);
    setting
      .then(async (marked) => {
        setStatus(marked == null ? refused : said);
        await refetch();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
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

  const release = (): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    if (!releasing()) {
      setReleasing(true);
      return;
    }
    setStatus(null);
    releaseCatch(catchId)
      .then((released) => {
        setReleasing(false);

        if (!released) {
          setStatus('It could not be released.');
          return;
        }
        // The record is gone, so there is nothing left for this
        // dialog to show
        props.onChange?.();
        props.onClose();
      })
      .catch((caught: unknown) => {
        setReleasing(false);
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  };

  /**
   * Which bag is open, if either. They are panels rather than sections
   * because neither is part of reading the sheet: a player opens one,
   * hands something over or spends it, and is back to looking at the
   * pokemon
   */
  const [panel, setPanel] = createSignal<'items' | 'give' | null>(null);

  /**
   * One stat as the pokemon actually has it: the species' base, the
   * value it was born with, the effort put into it, and — for
   * everything but health — what its nature makes of that
   */
  const totalOf = (caught: CaughtPokemon, stat: Stats): number =>
    stat === Stats.HP
      ? getMaxHealth(caught)
      : getOtherStat(
          caught.level,
          getSpeciesData(caught.species).stats[stat],
          getIV(caught.ivs, stat),
          caught.effortValues[stat],
          getNatureFactor(caught.nature, stat),
        );

  /**
   * The tallest of the five the bars are drawn against. Health is left
   * out of it: it is counted on a different scale from the rest and
   * would flatten every other bar into the same short stub
   */
  const bestTotal = (caught: CaughtPokemon): number =>
    Math.max(
      1,
      ...STAT_ORDER.filter((stat) => stat !== Stats.HP).map((stat) => totalOf(caught, stat)),
    );

  /**
   * Whether the item is one this pokemon could be given right now —
   * a remedy, a cap it would gain from, a gem for a shadow, a wing, a
   * bitter berry. It is the one question behind the whole Use item
   * panel, so what is offered is never something that would be spent
   * on nothing
   */
  const isUsable = (item: Items): boolean => {
    const caught = view();

    if (caught == null) {
      return false;
    }
    if (isBottleCap(item)) {
      return !isPerfectIVs(caught.ivs);
    }
    if (isPurifyingGem(item)) {
      return isShadow(caught);
    }
    // A machine is offered only where it would teach something: one
    // this species can learn and does not know already
    if (isMachineItem(item)) {
      const move = getMachineMove(item);

      return (
        move != null &&
        new Set(getSpeciesData(caught.species).learnSet.teachable).has(move) &&
        !new Set(caught.moves).has(move)
      );
    }
    return isRemedy(item) || isWing(item) || BERRY_EFFORT_DROPS.has(item);
  };

  /**
   * Spend it, whatever it is. Each kind already has its own call and
   * its own message; this only decides which one the item belongs to
   */
  const useOn = (item: Items): void => {
    setPanel(null);

    // A machine is the one item that asks a question back: what a
    // pokemon gives up for it depends on how full its move list is,
    // and that is the teaching dialog's business
    const move = isMachineItem(item) ? getMachineMove(item) : null;

    if (move != null) {
      setTeaching({ move, rest: [], levelled: false });
      return;
    }
    if (isBottleCap(item)) {
      polish(item);
    } else if (isPurifyingGem(item)) {
      purify(item);
    } else if (isWing(item)) {
      trainWithWing(item);
    } else if (BERRY_EFFORT_DROPS.has(item)) {
      feedBitterBerry(item);
    } else {
      heal(item);
    }
  };

  /**
   * What the menu offers. Everything in it is occasional — the things
   * a player does to a pokemon now and then rather than every time
   * they open its sheet — and every one of them is refused while it is
   * fighting
   */
  const actions = (loaded: CaughtPokemon): MenuAction[] => [
    {
      label: isFavorite(loaded) ? 'Unfavorite' : 'Favorite',
      disabled: fighting.latest === true,
      onSelect: () => {
        favorite(!isFavorite(loaded));
      },
    },
    {
      label: isGuarded(loaded) ? 'Unlock' : 'Lock',
      disabled: fighting.latest === true,
      onSelect: () => {
        guard(!isGuarded(loaded));
      },
    },
    {
      label: 'Use item',
      disabled: frozen() || isEgg(loaded),
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
      disabled:
        props.onAuction == null ||
        fighting.latest === true ||
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
      label: buddy.latest === props.catchId ? 'Walking with you' : 'Walk with this one',
      disabled: buddy.latest === props.catchId,
      onSelect: takeAlong,
    },
  ];

  return (
    <>
      <Dialog
        width="wide"
        // The sheet steps aside while the teaching dialog is up rather
        // than sitting open behind it: two modals at once fight for the
        // click that closes them, and the sheet is what the player comes
        // back to afterwards
        isOpen={props.catchId != null && teaching() == null}
        onClose={() => {
          setStatus(null);
          // A release half-confirmed is a release declined
          setReleasing(false);
          setPanel(null);
          props.onClose();
        }}
        // The panel is named for what it is rather than for what is on
        // it: the pokemon's own name is written under its sprite, where
        // it belongs to the pokemon rather than to the window
        title="Pokemon Info"
        aside={
          <Show when={owned() == null ? null : view()}>
            {(loaded) => <Menu label="Actions" actions={actions(loaded())} />}
          </Show>
        }
        terse
        description={
          props.readOnly === true
            ? 'One pokemon in full, as it stands. Nothing here can be changed — it is not yours to change.'
            : `One pokemon in full: what it is, what it is carrying, and everything that can be
            done to it while it is not fighting.`
        }
      >
        {/* The record is read through `latest`, so a write that
            re-reads it keeps showing what it had while the read is in
            flight. Suspending instead tears the panel down and takes
            the page with it: marking a favorite would blink the whole
            screen for the length of one round trip */}
        <Show
          when={view()}
          fallback={<Note>{detail.loading ? 'Loading catch…' : 'No such catch.'}</Note>}
        >
          {(loaded) => (
            <>
              {/* Whether anything is holding the record still. A lock
                  and a favorite say so through the Actions menu, which
                  is where they are turned on and off; a raid is the one
                  nobody chose, so it is the one worth a sentence */}
              <Show when={owned()}>
                <Show when={fighting.latest}>
                  <Meta class="text-center">In a raid — nothing about it can be changed.</Meta>
                </Show>

                {/* Anything the bag can be spent on this pokemon: a
                    remedy, a cap, a gem for a shadow, a wing, a bitter
                    berry. One list rather than five, since the answer
                    to "what would this do for it" is the same question
                    every time */}
                <Show when={panel() === 'items'}>
                  <DialogSection title="Use item">
                    <InventoryPicker
                      inline
                      entries={bag.latest}
                      disabled={frozen()}
                      // Only the prized and special bands ask twice.
                      // Everything a player heals with — a Potion, a
                      // Full Restore, a wing — is spent over and
                      // over, and asking about each is a click for
                      // nothing; a cap or a Purifying Gem changes
                      // the pokemon for good, and the wrong pokemon
                      // is the wrong pokemon for good with it
                      confirm={(entry) => isPreciousItem(entry.item)}
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
                  </DialogSection>
                </Show>
              </Show>

              {/* The sheet itself, read down the middle: the pokemon
                  first, then what it is, then what it can do, then
                  where it has been.

                  Every section is ruled off from the one above it. The
                  sheet is a long column of headings and lists, and
                  without a line between them a player scrolling it
                  cannot tell where the moves stop and the abilities
                  start */}
              <div
                class="flex flex-col items-center gap-4 text-center [&>section]:w-full
                    [&>section]:border-t [&>section]:border-line-soft [&>section]:pt-4"
              >
                {/* What the record is about, walking. An egg is drawn
                    as an egg: what is inside it is not the player's to
                    see until it hatches */}
                <SpriteDisplay
                  species={isEgg(loaded()) ? Species.Egg : loaded().species}
                  shiny={!isEgg(loaded()) && isShiny(loaded())}
                  animation="Walk"
                  direction="down-right"
                  scale={4}
                  label={named()}
                />

                <div class="flex flex-col items-center gap-0.5">
                  <h3>{named()}</h3>
                  {/* Both of the rolls it was made from, drawn rather
                      than printed. Two of the same species with the
                      same sigil are the same individual */}
                  <Meta class="font-mono tracking-[0.2em]">
                    {getSigil(loaded().individualValue, loaded().traitValue)}
                  </Meta>
                </div>

                {/* What it is: what the dex calls its kind, the types
                    it fights as, and which it is. The species' own name
                    is the heading above this, so saying it twice would
                    leave the line saying nothing. An egg is none of it
                    yet */}
                <Show when={!isEgg(loaded())}>
                  <Row class="justify-center">
                    <span class="font-medium">{getSpeciesData(loaded().species).category}</span>
                    <Divider />
                    <For each={getSpeciesData(loaded().species).types}>
                      {(type) => <TypeBadge type={type} />}
                    </For>
                    {/* A mark rather than a word, and nothing at all
                        for something that has no gender: an empty
                        column is not information */}
                    <Show when={GENDER_MARKS[loaded().gender] !== ''}>
                      <Divider />
                      <span
                        class="text-lg leading-none"
                        title={GENDER_LABELS[loaded().gender]}
                        aria-label={GENDER_LABELS[loaded().gender]}
                      >
                        {GENDER_MARKS[loaded().gender]}
                      </span>
                    </Show>
                  </Row>
                </Show>

                <Row class="justify-center">
                  {/* The level and the thing that raises it are one
                      control, not a label beside a button: what a
                      player wants to know is where it stands and what
                      the next step costs, and those are one thought.
                      For a pokemon that is nobody's to raise — an egg,
                      somebody else's — it is only the label */}
                  <Show
                    when={owned() != null && !isEgg(loaded())}
                    fallback={<Badge tone="leaf">Lv. {loaded().level}</Badge>}
                  >
                    <Button
                      tone="primary"
                      disabled={
                        (candies.latest ?? 0) < getCandyCost(loaded()) ||
                        loaded().level >= MAX_LEVEL ||
                        frozen()
                      }
                      onClick={feedCandy}
                    >
                      {loaded().level >= MAX_LEVEL
                        ? `Lv. ${loaded().level} — at the cap`
                        : `Lv. ${loaded().level} → ${loaded().level + 1} (${getCandyCost(
                            loaded(),
                          )})`}
                    </Button>
                  </Show>
                  <Show when={!isEgg(loaded())}>
                    <Badge>{NATURE_NAMES[loaded().nature]}</Badge>
                  </Show>
                  <Badge tone="gold">
                    {candies.latest ?? 0} {(candies.latest ?? 0) === 1 ? 'candy' : 'candies'}
                  </Badge>
                </Row>

                {/* An egg has no evolution to offer, so the section
                    that would hold one holds the way out of the shell
                    instead: how far along the walk is, and the button
                    that ends it */}
                <Show when={isEgg(loaded())}>
                  <DialogSection title="Hatching">
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
                      {buddy.latest === props.catchId
                        ? '.'
                        : ' — it only moves while it is the one being carried.'}
                    </Note>
                    <Show when={owned()}>
                      <Row class="justify-center">
                        <Button tone="primary" disabled={!canHatch(loaded())} onClick={hatch}>
                          Hatch it
                        </Button>
                      </Row>
                    </Show>
                  </DialogSection>
                </Show>

                <Show when={!isEgg(loaded())}>
                  {/* Everything it could ever become, with the ones
                      it cannot become yet left in and refused. A row
                      that is out of reach says what it is waiting for,
                      so the sheet is also where a player finds out
                      what they are working towards */}
                  <DialogSection title="Evolution">
                    <Show
                      when={evolutions.latest?.length}
                      fallback={
                        <Note>
                          {evolutions.loading ? 'Checking evolutions…' : 'It does not evolve.'}
                        </Note>
                      }
                    >
                      <List>
                        <For each={evolutions.latest}>
                          {(option) => (
                            <ListRow>
                              <span class="grow text-left font-medium">
                                {getSpeciesData(option.evolution.species).name}
                              </span>
                              {/* What it is waiting for is on the
                                  button rather than in the row: a
                                  player reads the row for the name and
                                  asks the button why it is dead */}
                              <Show when={owned() != null}>
                                <Button
                                  tone="primary"
                                  disabled={frozen() || !option.available}
                                  title={describeEvolutionNeed(option) ?? undefined}
                                  onClick={() => {
                                    evolve(option.evolution.species);
                                  }}
                                >
                                  Evolve
                                </Button>
                              </Show>
                            </ListRow>
                          )}
                        </For>
                      </List>
                    </Show>
                  </DialogSection>

                  {/* Three readings of the same six numbers: what the
                      pokemon has, what it was born with, and what has
                      been trained into it. They are tabs rather than
                      three lists, because a player compares one stat
                      across them rather than reading all eighteen */}
                  <DialogSection title="Stats">
                    <TabGroup
                      horizontal
                      defaultValue={StatView.Total}
                      toggleable={false}
                      class="flex flex-col gap-2"
                    >
                      <TabBar>
                        <TabButton value={StatView.Total}>Total</TabButton>
                        <TabButton value={StatView.IV}>IV</TabButton>
                        <TabButton value={StatView.EV}>EV</TabButton>
                      </TabBar>

                      <TabPanel value={StatView.Total}>
                        <List>
                          <ListRow>
                            <span class="w-28 shrink-0 text-left">Health</span>
                            <span class="grow text-left tabular-nums">
                              {loaded().health} / {getMaxHealth(loaded())}
                              {isFainted(loaded()) ? ' · fainted' : ''}
                            </span>
                          </ListRow>
                          <For each={STAT_ORDER.filter((stat) => stat !== Stats.HP)}>
                            {(stat) => (
                              <ListRow>
                                <span class="w-28 shrink-0 text-left">{STAT_LABELS[stat]}</span>
                                {/* Measured against its own best rather
                                    than against a ceiling: what a player
                                    wants off this list is which end of
                                    the pokemon is the sharp one, and the
                                    bar the nature moved is the colour of
                                    the way it moved it */}
                                <div class="h-2 grow overflow-hidden rounded-full bg-line-soft">
                                  <div
                                    class={`h-full rounded-full ${
                                      NATURE_BARS[
                                        Math.sign(getNatureFactor(loaded().nature, stat) - 1) + 1
                                      ]
                                    }`}
                                    style={{
                                      width: `${(totalOf(loaded(), stat) / bestTotal(loaded())) * 100}%`,
                                    }}
                                  />
                                </div>
                                <Meta
                                  class={`w-12 text-right tabular-nums ${
                                    NATURE_NUMBERS[
                                      Math.sign(getNatureFactor(loaded().nature, stat) - 1) + 1
                                    ]
                                  }`}
                                >
                                  {totalOf(loaded(), stat)}
                                </Meta>
                              </ListRow>
                            )}
                          </For>
                        </List>
                        <Show when={loaded().statuses !== 0}>
                          <Meta>
                            {unpackStatuses(loaded().statuses)
                              .map((carried) => STATUS_NAMES[carried])
                              .join(' · ')}
                          </Meta>
                        </Show>
                      </TabPanel>

                      <TabPanel value={StatView.IV}>
                        <List>
                          <For each={STAT_ORDER}>
                            {(stat) => (
                              <ListRow>
                                <span class="w-28 shrink-0 text-left">{STAT_LABELS[stat]}</span>
                                <div class="h-2 grow overflow-hidden rounded-full bg-line-soft">
                                  <div
                                    class="h-full rounded-full bg-gold"
                                    style={{
                                      width: `${(getIV(loaded().ivs, stat) / MAX_IV) * 100}%`,
                                    }}
                                  />
                                </div>
                                <Meta class="w-12 text-right tabular-nums">
                                  {getIV(loaded().ivs, stat)}
                                </Meta>
                              </ListRow>
                            )}
                          </For>
                        </List>
                      </TabPanel>

                      <TabPanel value={StatView.EV}>
                        <List>
                          <For each={STAT_ORDER}>
                            {(stat) => (
                              <ListRow>
                                <span class="w-28 shrink-0 text-left">{STAT_LABELS[stat]}</span>
                                <div class="h-2 grow overflow-hidden rounded-full bg-line-soft">
                                  <div
                                    class="h-full rounded-full bg-leaf"
                                    style={{
                                      width: `${(loaded().effortValues[stat] / MAX_EFFORT_PER_STAT) * 100}%`,
                                    }}
                                  />
                                </div>
                                <Meta class="w-12 text-right tabular-nums">
                                  {loaded().effortValues[stat]}
                                </Meta>
                                <Show when={owned() != null}>
                                  <Button
                                    disabled={frozen() || loaded().effortValues[stat] <= 0}
                                    onClick={() => {
                                      train(stat, -EFFORT_STEP);
                                    }}
                                  >
                                    −{EFFORT_STEP}
                                  </Button>
                                  <Button
                                    tone="primary"
                                    disabled={
                                      frozen() || assignableEffort(loaded(), stat) < EFFORT_STEP
                                    }
                                    onClick={() => {
                                      train(stat, EFFORT_STEP);
                                    }}
                                  >
                                    +{EFFORT_STEP}
                                  </Button>
                                </Show>
                              </ListRow>
                            )}
                          </For>
                        </List>
                        {/* What is left to spend, under the rows it
                            would be spent on. It sits at the end
                            because it is the answer to "can I press
                            these", which is a question asked after
                            reading them rather than before */}
                        <Meta class="block text-right">Remaining: {unusedEffort(loaded())}</Meta>
                      </TabPanel>
                    </TabGroup>
                  </DialogSection>

                  <DialogSection title="Moves">
                    <Show when={loaded().moves.length} fallback={<Note>It knows nothing.</Note>}>
                      <List>
                        <For each={loaded().moves}>
                          {(move) => (
                            <ListRow class="justify-between">
                              <span class="flex items-center gap-2">
                                <TypeBadge type={getMoveData(move).type} />
                                {/* Which of the three kinds it is, as a
                                    mark rather than a word: the word is
                                    the title, so nothing rests on the
                                    colour alone */}
                                <span
                                  class="size-3 shrink-0 rounded-sm"
                                  style={{
                                    'background-color':
                                      MOVE_CATEGORY_COLORS[getMoveData(move).category],
                                  }}
                                  title={MOVE_CATEGORY_NAMES[getMoveData(move).category]}
                                  aria-label={MOVE_CATEGORY_NAMES[getMoveData(move).category]}
                                  role="img"
                                />
                                <span class="font-medium">{getMoveData(move).name}</span>
                              </span>
                              <Meta>
                                {getMoveData(move).power == null
                                  ? ''
                                  : `${getMoveData(move).power} power · `}
                                {getMoveData(move).pp} PP
                              </Meta>
                            </ListRow>
                          )}
                        </For>
                      </List>
                    </Show>
                  </DialogSection>

                  <DialogSection title="Abilities">
                    <Show when={loaded().abilities.length} fallback={<Note>None.</Note>}>
                      <List>
                        <For each={loaded().abilities}>
                          {(ability) => (
                            <ListRow>
                              <span class="grow text-left font-medium">
                                {describeAbility(ability)}
                              </span>
                            </ListRow>
                          )}
                        </For>
                      </List>
                    </Show>
                  </DialogSection>

                  <DialogSection title="Held items">
                    <Show when={loaded().items.length}>
                      <List>
                        <For each={loaded().items}>
                          {(item) => (
                            <ListRow>
                              <span class="grow text-left">{describeItem(item)}</span>
                              <Show when={owned() != null}>
                                <Button
                                  disabled={frozen()}
                                  onClick={() => {
                                    moveItem(item, false);
                                  }}
                                >
                                  Take back
                                </Button>
                              </Show>
                            </ListRow>
                          )}
                        </For>
                      </List>
                    </Show>
                    {/* A catch holds one item at a time, matching the
                        battle's per-unit limit. The button carries the
                        count so the section says how full it is
                        without a sentence saying so, and it is dead
                        rather than absent when there is nothing to
                        give: a player who empties their bag should see
                        the same sheet they saw before, with one thing
                        greyed out */}
                    <Show when={owned() != null}>
                      <Row class="justify-center">
                        <Button
                          disabled={
                            frozen() ||
                            holdables().length === 0 ||
                            loaded().items.length >= getCatchSlots(loaded(), Slots.Item)
                          }
                          onClick={() => {
                            setPanel((open) => (open === 'give' ? null : 'give'));
                          }}
                        >
                          Give item {loaded().items.length}/{getCatchSlots(loaded(), Slots.Item)}
                        </Button>
                      </Row>
                      <Show when={panel() === 'give'}>
                        <InventoryPicker
                          inline
                          entries={bag.latest}
                          disabled={frozen()}
                          value={null}
                          verb="Give"
                          filter={(entry) => isHoldable(entry.item)}
                          onPick={(item) => {
                            setPanel(null);

                            if (item != null) {
                              moveItem(item, true);
                            }
                          }}
                        />
                      </Show>
                    </Show>
                  </DialogSection>
                </Show>

                {/* Whose hands it has passed through, oldest first, and
                    where it came from before any of them */}
                <DialogSection title="History">
                  <Show when={loaded().history.length}>
                    <List>
                      <For each={loaded().history}>
                        {(entry) => (
                          <ListRow>
                            <span class="grow text-left font-medium">
                              {describeOwner(entry.owner)}
                            </span>
                            <Meta>
                              {ACQUISITION_NAMES[entry.kind]} · {describeDate(entry.acquiredAt)}
                            </Meta>
                          </ListRow>
                        )}
                      </For>
                    </List>
                  </Show>
                  <Meta>{describeHistory(loaded())}</Meta>
                </DialogSection>

                {/* There is no undoing it, so it takes two presses —
                    and whatever it is holding comes back to the bag */}
                <Show when={owned()}>
                  <DialogSection>
                    <Row class="justify-center">
                      <Button
                        tone="danger"
                        disabled={fighting.latest === true || onlyOne.latest === true}
                        onClick={release}
                      >
                        {releasing() ? 'Let it go for good?' : 'Release'}
                      </Button>
                      <Show when={releasing()}>
                        <Button
                          onClick={() => {
                            setReleasing(false);
                          }}
                        >
                          Keep it
                        </Button>
                      </Show>
                    </Row>
                    <Show when={isFavorite(loaded())}>
                      <Meta>A favorite cannot be released. Unfavorite it first.</Meta>
                    </Show>
                    {/* Nothing takes the last one: a player with an
                          empty collection has no way back into the
                          game except the gift that would replace it */}
                    <Show when={onlyOne.latest}>
                      <Meta>The only pokemon you have cannot be released.</Meta>
                    </Show>
                  </DialogSection>
                </Show>
              </div>

              <Status message={status()} />
            </>
          )}
        </Show>
        <DialogActions>
          <Button
            onClick={() => {
              setStatus(null);
              setReleasing(false);
              setPanel(null);
              props.onClose();
            }}
          >
            Close
          </Button>
        </DialogActions>
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
        catchId={teaching() == null ? null : props.catchId}
        move={teaching()?.move ?? null}
        cost={teaching()?.levelled === true ? 'Nothing' : undefined}
        teach={teaching()?.levelled === true ? learnLevelUpMove : undefined}
        onClose={nextTeaching}
        onTaught={() => {
          setStatus(teaching()?.levelled === true ? 'Learned.' : 'Taught.');
          Promise.all([refetch(), refetchBag()])
            .then(() => {
              props.onChange?.();
            })
            .catch(() => undefined);
        }}
      />
    </>
  );
}
