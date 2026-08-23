import {
  For,
  Index,
  type JSX,
  type Resource,
  Show,
  createEffect,
  createResource,
  createSignal,
} from 'solid-js';
import { isLockLive } from '../../auth/battle-lock';
import { getBuddy, setBuddy } from '../../auth/buddy';
import { syncServerClock } from '../../auth/clock';
import { canHatch, isEgg } from '../../auth/egg';
import { hatchEgg } from '../../auth/eggs';
import {
  type CaughtPokemon,
  countCaught,
  getCaught,
  giveItem,
  isFavorite,
  isGuarded,
  listCaught,
  releaseCatch,
  setFavorite,
  setGuarded,
  setNickname,
  takeItem,
} from '../../auth/caught';
import useHealingItem from '../../auth/healing';
import {
  ACQUISITION_NAMES,
  NICKNAME_LIMIT,
  asNickname,
  catchAura,
  getCatchName,
  getCatchSlots,
  getMovePoints,
  isShadow,
  isShiny,
} from '../../auth/caught-record';
import { Slots } from '../../data/constants/slots';
import { type PokedexView, getPokedex } from '../../auth/pokedex';
import { getProfile } from '../../auth/profile';
import {
  type HealthState,
  STATUS_NAMES,
  getMaxHealth,
  healedByItem,
  isFainted,
} from '../../auth/health';
import useBall from '../../auth/balls';
import useBottleCap from '../../auth/bottle-caps';
import usePurifyingGem from '../../auth/purify';
import { type InventoryEntry, getInventory } from '../../auth/inventory';
import { isAuctionableCatch } from '../../auth/auctions';
import { getCandyCost, getCandyCount, getCatchCandy, useCandy } from '../../auth/candy';
import { learnLevelUpMove } from '../../auth/moves';
import { useAuth } from '../../auth/context';
import { type EvolutionOption, evolveCatch, listEvolutionOptions } from '../../auth/evolution';
import { SpriteAnim } from '../../data/ids/sprite-anims';
import { assignableEffort, unusedEffort } from '../../auth/effort';
import {
  type TrainingResult,
  feedEffortBerry,
  trainEffort,
  useEffortItem,
} from '../../auth/training';
import { MAX_LEVEL } from '../../data/constants/levels';
import {
  MAX_EFFORT_PER_STAT,
  MAX_IV,
  STAT_NAMES,
  STAT_ORDER,
  Stats,
  getIV,
  getOtherStat,
} from '../../data/constants/stats';
import getSigil from '../../data/constants/sigil';
import { ActionsIcon, LockIcon, StarIcon } from '../icons';

import { BERRY_EFFORT_DROPS } from '../../data/items/berries';
import { isPPItem, isVitamin } from '../../data/items/vitamins';
import { isWing } from '../../data/items/wings';
import type Natures from '../../data/ids/natures';
import { NATURE_NAMES, getNatureFactor } from '../../data/ids/natures';
import {
  BALL_ITEMS,
  Balls,
  ItemFlags,
  type Items,
  getBall,
  getMachineMove,
  isMachineItem,
} from '../../data/ids/items';
import { EvolutionMethod, Genders, Species } from '../../data/ids/species';
import ItemCard from '../items/ItemCard';
import MoveHoverCard from '../moves/MoveHoverCard';
import { getItemData } from '../../data/items';
import { isBottleCap, isPerfectIVs } from '../../data/items/bottle-caps';
import { isHerbal } from '../../data/items/medicine';
import { isPurifyingGem } from '../../data/items/purifying-gem';
import { unpackStatuses } from '../../data/ids/status';
import { PP_UP_LIMIT, getMoveData } from '../../data/moves';
import type { Moves } from '../../data/ids/moves';
import {
  type EvolutionData,
  SUPPORTED_METHODS,
  getFamilyName,
  getMovesLearnedAt,
  getSpeciesData,
} from '../../data/species';
import { BIOME_NAMES } from '../../data/biome';
import Biome from '../../data/ids/biome';
import { isPreciousItem } from '../../data/overworld/item-pool';
import { getLairTitle } from '../../data/overworld/lair';
import describeDate from '../../core/dates';
import {
  ENCOUNTER_TYPE_NAMES,
  EncounterType,
  isFatefulEncounter,
  isRaidEncounter,
} from '../../overworld/encounter';
import { describeAbility, detailAbility } from '../details';
import { GENDER_LABELS, GENDER_MARKS } from './catch-summary';
import IncreasePPDialog from './IncreasePPDialog';
import InventoryPicker from '../items/InventoryPicker';
import { describeItem } from '../items/ItemGrid';
import ItemSprite from '../items/ItemSprite';
import SpeciesCoat from '../sprites/SpeciesCoat';
import AnimatedSprite from '../sprites/AnimatedSprite';
import TeachMoveDialog from './TeachMoveDialog';
import TypeBadge from '../sprites/TypeBadge';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogSection,
  Divider,
  Field,
  HoverCard,
  List,
  ListRow,
  Menu,
  type MenuAction,
  Meta,
  Note,
  Row,
  RowButton,
  StepButton,
  TabBar,
  TabButton,
  TabGroup,
  TabPane,
  type ToastTone,
  TooltipHost,
  useToast,
} from '../styled';

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

/**
 * And the same three said in a mark rather than in a colour.
 *
 * A nature moves one stat up a tenth and another down a tenth, which
 * is the difference between two of the same species and is worth
 * being able to *see*. It was a colour alone, which says nothing to
 * anybody who cannot tell this blue from this red — and nothing at
 * all to a screen reader
 */
const NATURE_MARKS = ['▼', '', '▲'] as const;

const NATURE_WORDS = ['lowered by its nature', '', 'raised by its nature'] as const;

/**
 * Which of the three a nature does to this stat: −1, 0 or 1, shifted
 * to index the tables above
 */
function natureShift(nature: Natures, stat: Stats): number {
  return Math.sign(getNatureFactor(nature, stat) - 1) + 1;
}

/**
 * What the six are called. Exported because the dex entry prints the
 * species' base stats under the same names: two screens naming the
 * same six differently is two vocabularies for one thing
 */
export const STAT_LABELS: Record<Stats, string> = STAT_NAMES;

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
 * A gift and an event pokemon get a sentence instead of a list. The
 * ball is a formality and the date is already on the line above, so
 * what is left worth saying is that it was never met anywhere — or,
 * where the gift named one, the place it says it came from
 */
function describeHistory(caught: CaughtPokemon): string {
  if (caught.type === EncounterType.Fateful) {
    // Where a distribution says it happened, which is a name rather
    // than a chunk: nobody walked anywhere to meet this one
    return caught.origin.place == null
      ? 'Met in a fateful encounter.'
      : `Met in a fateful encounter at ${caught.origin.place}.`;
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
 * Whether the game can measure what this evolution asks for at all.
 *
 * Friendship, weather and party composition have no stored
 * counterpart, so an evolution needing one is never going to happen
 * here — and saying so plainly is kinder than naming a requirement a
 * player could chase forever
 */
function isMeasurableEvolution(evolution: EvolutionData): boolean {
  const { method } = evolution;

  return method !== 0 && (method & ~SUPPORTED_METHODS) === 0;
}

/**
 * How big a held-item picture is drawn in the tray. Small enough that
 * four of them fit across a third of the sheet
 */
const ITEM_SPRITE = 28;

/**
 * The squares the tray draws: what it is holding, plus the room it
 * still has. The room belongs to the pokemon — a Utility Belt widens
 * it — and is only drawn for somebody who can fill it
 */
function itemSlots(caught: CaughtPokemon, mine: boolean): null[] {
  return Array.from(
    {
      length: mine
        ? Math.max(caught.items.length, getCatchSlots(caught, Slots.Item))
        : caught.items.length,
    },
    () => null,
  );
}

/**
 * How big an item is drawn inside a condition. Small enough to sit on
 * a line of text without pushing the row open, large enough to be
 * recognised as the stone it is
 */
const CONDITION_ICON = 24;

/**
 * And how big the ball on a history row is: the same size as the text
 * beside it, since it is read as part of the line rather than as a
 * picture of its own
 */
const HISTORY_BALL = 20;

/**
 * What an evolution asks for, read straight off the row after the
 * picture it leads to: a Haunter's says `+ Trade`, an Eevee's shows
 * the stone, a Charmander's names the level.
 *
 * An item is its icon rather than its name, the way the bag draws it,
 * with the manner in front — **use** for a stone, spent on the spot,
 * and **holding** for something the pokemon must be carrying when the
 * moment comes. The two look nothing alike to play and read alike
 * written down, which is exactly the confusion a picture cannot fix
 * on its own.
 *
 * It says the same thing whether or not the condition is met, because
 * this is what the player is working towards rather than a complaint
 * about today — the button beside it is what reports availability
 */
function EvolutionCondition(props: { evolution: EvolutionData }): JSX.Element {
  const method = (): number => props.evolution.method;
  const item = (): Items | null => props.evolution.item ?? null;
  const has = (flag: EvolutionMethod): boolean => (method() & flag) !== 0;

  return (
    <Show when={isMeasurableEvolution(props.evolution)} fallback={<span>not possible here</span>}>
      <span class="inline-flex items-center gap-1">
        <Show when={has(EvolutionMethod.Level) ? props.evolution.level : null}>
          {(level) => <span>Lv. {level()}</span>}
        </Show>
        <Show when={has(EvolutionMethod.UsedItem) ? item() : null} keyed>
          {(stone) => (
            <>
              <span>use</span>
              <ItemSprite item={stone} size={CONDITION_ICON} label={describeItem(stone)} />
            </>
          )}
        </Show>
        <Show when={has(EvolutionMethod.HeldItem) ? item() : null} keyed>
          {(carried) => (
            <>
              <span>holding</span>
              <ItemSprite item={carried} size={CONDITION_ICON} label={describeItem(carried)} />
            </>
          )}
        </Show>
        <Show when={has(EvolutionMethod.Trade)}>
          <span>Trade</span>
        </Show>
      </span>
    </Show>
  );
}

/**
 * The same condition as a sentence, for the tooltip over the row.
 *
 * The row itself is shorthand — an icon, a word, a level — which is
 * what makes it readable at a glance and what makes it worth spelling
 * out for anyone who stops on it. It is also what a screen reader is
 * given, since a line of pictures and half-sentences is not something
 * that reads aloud
 */
function describeEvolutionMethod(evolution: EvolutionData): string {
  if (!isMeasurableEvolution(evolution)) {
    return 'This evolution is not possible here.';
  }

  const { method, item } = evolution;
  const steps: string[] = [];

  if ((method & EvolutionMethod.Level) !== 0 && evolution.level != null) {
    steps.push(`reach Lv. ${evolution.level}`);
  }
  if ((method & EvolutionMethod.UsedItem) !== 0 && item != null) {
    steps.push(`use ${withArticle(describeItem(item))}`);
  }
  if ((method & EvolutionMethod.HeldItem) !== 0 && item != null) {
    steps.push(`have it hold ${withArticle(describeItem(item))}`);
  }
  if ((method & EvolutionMethod.Trade) !== 0) {
    steps.push('trade it away');
  }
  if (steps.length === 0) {
    return 'It evolves on its own.';
  }
  return `To evolve, ${steps.join(' and ')}.`;
}

/**
 * A name with the article that belongs in front of it. Nothing here
 * is plural or proper, so the only question is the vowel
 */
function withArticle(name: string): string {
  return `${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name}`;
}

/**
 * A catch and its children come back together, so the dialog opens on
 * a single read.
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
 * Re-exported from where the battle card reads them too: an ability on
 * a sheet and one on a card are named the same way
 */
export { describeAbility, detailAbility };

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
  /**
   * Something out of the bag to spend on this pokemon the moment the
   * sheet opens. It is how the bag uses an item: the item is chosen
   * first and the pokemon second, which is the way round the sheet
   * cannot ask it
   */
  useItem?: Items | null;
  /**
   * Open a different one of the player's pokemon — the one before this
   * in the box, or the one after.
   *
   * Absent for a sheet that is not one of a run: a lot on the block is
   * a pokemon somebody is looking at rather than a page of their own
   * collection, and there is nothing either side of it to step to
   */
  onCatch?: (catchId: string) => void;
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
function CatchSheetBody(
  props: CatchDialogProps & {
    detail: Resource<{ id: string; caught: CaughtPokemon | null }>;
    siblings: Resource<string[]>;
    owners: Resource<Map<string, string>>;
    dex: Resource<PokedexView>;
    evolutions: Resource<EvolutionOption[]>;
    fighting: Resource<boolean>;
    onlyOne: Resource<boolean>;
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

  const view = (): CaughtPokemon | null => {
    // `latest` rather than the resource itself: everything on this
    // sheet that writes re-reads the record afterwards, and a read that
    // suspends unmounts the panel — and, through the boundary the page
    // is under, the page behind it. Keeping the last record on screen
    // while the next one arrives is what makes a favorite land without
    // the screen blinking. It is only kept while it is about the
    // pokemon being looked at
    const held = props.detail.latest;
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
   * The catch either side of this one, or null at the ends of the box.
   * The ends are ends rather than a loop: somebody stepping through
   * three hundred pokemon should stop at the last one instead of
   * quietly starting again
   */
  const neighbour = (step: number): string | null => {
    const listed = props.siblings();
    const catchId = props.catchId;

    if (listed == null || catchId == null) {
      return null;
    }

    const at = listed.indexOf(catchId);
    const wanted = at + step;

    return at < 0 || wanted < 0 || wanted >= listed.length ? null : listed[wanted];
  };

  const walk = (step: number): (() => void) | undefined => {
    const next = neighbour(step);
    const open = props.onCatch;

    if (next == null || open == null) {
      return undefined;
    }
    return () => {
      open(next);
    };
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
    return props.owners()?.get(entry.owner) ?? entry.name ?? 'A trainer';
  };

  /**
   * Whether the reader has met this species at all, and whether they
   * have owned one. A dex that has not arrived yet answers "no" to
   * both, which draws the shadow — a sheet that flashed the full
   * picture and then hid it would be worse than one that fills in
   */
  const dexKnows = (species: Species): { met: boolean; owned: boolean } => {
    const entry = props.dex();

    return {
      met: entry?.seen.some((tally) => tally.species === species) === true,
      owned: entry?.caught.some((tally) => tally.species === species) === true,
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

    return props.fighting() === true || (loaded != null && isGuarded(loaded));
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
  const [bottle, setBottle] = createSignal<Items | null>(null);

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
    useCandy(catchId)
      .then((level) => {
        say(level == null ? 'That candy could not be used.' : `Grew to level ${level}.`);
        props.onRecordChanged();
        props.onCandiesChanged();
        props.onEvolutionsChanged();
        props.onChange?.();

        if (level != null) {
          offerLevelMoves(level);
        }
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /**
   * What the dialog is called: what its owner calls it, which is the
   * species' own name until somebody names it otherwise.
   *
   * An egg gives away nothing about what is inside it — not the
   * species, not the name, not even whether it sparkles — and a record
   * still being read gives away nothing at all, but the dialog is
   * named either way rather than opening unnamed
   */
  const named = (): string => {
    const loaded = view();

    if (loaded == null) {
      return 'Catch';
    }
    if (isEgg(loaded)) {
      return 'Egg';
    }
    return `${isShiny(loaded) ? '✦ ' : ''}${getCatchName(loaded)}`;
  };

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
    (props.bag.latest ?? []).filter((entry) => isHoldable(entry.item));

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

  const heal = (item: Items): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    useHealingItem(catchId, item)
      .then((state: HealthState | null) => {
        say(
          state == null
            ? `${describeItem(item)} would do nothing for it.`
            : // Herbal medicine is swallowed, and the pokemon holds it
              // against whoever handed it over
              `${describeItem(item)} used — ${state.health} HP.${
                isHerbal(item) ? ' It did not enjoy that.' : ''
              }`,
        );
        props.onRecordChanged();
        props.onBagChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
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
    running
      .then((result) => {
        say(result == null ? refused : landed(result));
        props.onRecordChanged();
        props.onBagChanged();
        props.onChange?.();
      })
      .catch((thrown: unknown) => {
        say(thrown instanceof Error ? thrown.message : String(thrown), 'ember');
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

  /**
   * Whether the item is one that grants effort: a wing found on the
   * ground, or a vitamin bought off a shelf
   */
  const isEffortItem = (item: Items): boolean => isWing(item) || isVitamin(item);

  const trainWithItem = (item: Items): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    settleTraining(
      useEffortItem(catchId, item),
      `${describeItem(item)} could not be used.`,
      () => `${describeItem(item)} — points it did not have to earn.`,
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
    usePurifyingGem(catchId, item)
      .then((ivs) => {
        say(
          ivs == null
            ? `${describeItem(item)} could not be used.`
            : `The shadow is gone — ${describeIVs(ivs)}.`,
        );
        props.onRecordChanged();
        props.onBagChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  const polish = (item: Items): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    useBottleCap(catchId, item)
      .then((ivs) => {
        say(
          ivs == null
            ? `${describeItem(item)} could not be used.`
            : `${describeItem(item)} polished it — ${describeIVs(ivs)}.`,
        );
        props.onRecordChanged();
        props.onBagChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /**
   * Put it in the ball that was just spent on it. The history is not
   * touched: what each owner received it in is a fact about the
   * handover, not about the ball it sits in today
   */
  const reball = (item: Items): void => {
    const catchId = props.catchId;

    if (owned() == null || catchId == null) {
      return;
    }
    useBall(catchId, item)
      .then((ball) => {
        say(
          ball == null
            ? `${describeItem(item)} could not be used.`
            : `It is in ${withArticle(describeItem(item))} now.`,
        );
        props.onRecordChanged();
        props.onBagChanged();
        props.onChange?.();
      })
      .catch((caught: unknown) => {
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
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

  const evolve = (into: Species): void => {
    const uid = owned();
    const catchId = props.catchId;

    if (uid == null || catchId == null) {
      return;
    }
    evolveCatch(catchId, into)
      .then((species) => {
        say(species == null ? 'That evolution is no longer available.' : 'Evolution complete.');
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

  const release = (): void => {
    const catchId = props.catchId;
    const going = view();

    if (owned() == null || catchId == null || going == null) {
      return;
    }
    // Read before the record goes: once the release lands there is
    // nothing left to ask what it was
    const { family, name } = getSpeciesData(going.species);
    const paid = getCatchCandy(going.species);

    if (!releasing()) {
      setReleasing(true);
      return;
    }
    releaseCatch(catchId)
      .then((released) => {
        setReleasing(false);

        if (!released) {
          say('It could not be released.', 'ember');
          return;
        }
        // Said in passing rather than on the sheet, because the sheet
        // is about to close: what a player gets for letting a pokemon
        // go should still be somewhere they can read it afterwards.
        // The family is named — candy is held per family, so "1 candy"
        // on its own does not say which pile grew
        toast.push({
          message: `${name} was let go. ${paid} ${getFamilyName(family)} candy.`,
          tone: 'leaf',
        });
        // The record is gone, so there is nothing left for this
        // dialog to show
        props.onChange?.();
        props.onClose();
      })
      .catch((caught: unknown) => {
        setReleasing(false);
        say(caught instanceof Error ? caught.message : String(caught), 'ember');
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
   * Whether the item the bag sent along has already been spent. It is
   * cleared whenever the sheet is pointed at something new, so a
   * second potion out of the bag is a second potion spent
   */
  let spent = false;

  createEffect(() => {
    props.catchId;
    props.useItem;
    spent = false;
  });

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
   * The tallest of the six the bars are drawn against. Health counts
   * with the rest: it is the longest bar on most pokemon, which is
   * the honest picture of a stat that is bigger than the others
   */
  const bestTotal = (caught: CaughtPokemon): number =>
    Math.max(1, ...STAT_ORDER.map((stat) => totalOf(caught, stat)));

  /** What it has left, as a share of what it has */
  const healthLeft = (caught: CaughtPokemon): number => {
    const max = getMaxHealth(caught);

    return max <= 0 ? 0 : Math.max(0, Math.min(1, caught.health / max));
  };

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
    // A ball re-balls it, so the one it is already in would be spent
    // on nothing
    const ball = getBall(item);

    if (ball != null) {
      return ball !== caught.ball;
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
    // A bottle is offered only where there is a move for it to go on
    // that has not already taken everything it will take
    if (isPPItem(item)) {
      return caught.moves.some((move) => getMovePoints(caught, move) < PP_UP_LIMIT);
    }
    return isRemedy(item) || isEffortItem(item) || BERRY_EFFORT_DROPS.has(item);
  };

  /**
   * Whether the bag holds anything at all this pokemon would gain
   * from. It is the same question the picker's filter asks, asked
   * once over the whole bag, so the menu entry that opens the picker
   * knows whether there would be a list in it
   */
  const hasUsableItem = (): boolean =>
    (props.bag.latest ?? []).some((entry) => entry.amount > 0 && isUsable(entry.item));

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
    // And so does a bottle, for the same reason: what it buys lands on
    // one move and cannot be moved off it afterwards
    if (isPPItem(item)) {
      setBottle(item);
      return;
    }
    if (getBall(item) != null) {
      reball(item);
    } else if (isBottleCap(item)) {
      polish(item);
    } else if (isPurifyingGem(item)) {
      purify(item);
    } else if (isEffortItem(item)) {
      trainWithItem(item);
    } else if (BERRY_EFFORT_DROPS.has(item)) {
      feedBitterBerry(item);
    } else {
      heal(item);
    }
  };

  /**
   * Something the bag asked to be spent on this one.
   *
   * The pokemon was chosen after the item, so that choice is the
   * agreement and the sheet spends it on arrival. Once only — the
   * record changes underneath and the sheet reads it again — and a
   * cap on a flawless pokemon is said rather than quietly swallowed
   */
  createEffect(() => {
    const item = props.useItem;
    const caught = view();

    if (item == null || caught == null || spent) {
      return;
    }
    spent = true;
    if (isUsable(item)) {
      useOn(item);
    } else {
      say(`${describeItem(item)} would do this one no good.`, 'ember');
    }
  });

  /**
   * What the menu offers. Everything in it is occasional — the things
   * a player does to a pokemon now and then rather than every time
   * they open its sheet — and every one of them is refused while it is
   * fighting
   */
  const actions = (loaded: CaughtPokemon): MenuAction[] => [
    {
      label: isFavorite(loaded) ? 'Unfavorite' : 'Favorite',
      disabled: props.fighting() === true,
      onSelect: () => {
        favorite(!isFavorite(loaded));
      },
    },
    {
      label: isGuarded(loaded) ? 'Unlock' : 'Lock',
      disabled: props.fighting() === true,
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
      disabled:
        props.onAuction == null ||
        props.fighting() === true ||
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
      // Named for what it does to *this* pokemon: one that has never
      // been named is being given a name, and one that has is having
      // the name it answers to changed
      label: loaded.nickname === '' ? 'Set nickname' : 'Change nickname',
      // An egg is not named. What is in it has not been met, and a
      // name given to a shell is a name given to nobody
      disabled: props.fighting() === true || isEgg(loaded),
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

  /**
   * The menu's entries as the bar reads them: nothing at all until the
   * record is in hand, since every one of them acts on it
   */
  const menuActions = (): MenuAction[] => {
    const loaded = view();

    return loaded == null ? [] : actions(loaded);
  };

  return (
    <>
      <Dialog
        width="wide"
        // The sheet steps aside while the teaching dialog is up rather
        // than sitting open behind it: two modals at once fight for the
        // click that closes them, and the sheet is what the player comes
        // back to afterwards
        isOpen={props.catchId != null && teaching() == null && bottle() == null && naming() == null}
        onClose={() => {
          // A release half-confirmed is a release declined
          setReleasing(false);
          setPanel(null);
          props.onClose();
        }}
        // The panel is named for what it is rather than for what is on
        // it: the pokemon's own name is written under its sprite, where
        // it belongs to the pokemon rather than to the window
        title="Pokemon Info"
        // The run this sheet is one of, either side of its name. They
        // are the panel's rather than the pokemon's, so they stay put
        // however far down the sheet is scrolled.
        //
        // A pokemon that is not the reader's has no run to be one of:
        // a lot on the block is opened on its own, and there is
        // nothing either side of it to step to. The arrows are left
        // out entirely rather than drawn dead, since a pair of greyed
        // arrows reads as a box that has run out rather than as a box
        // that was never there
        lead={
          props.readOnly === true ? undefined : (
            <StepButton label="Previous pokemon" way="previous" onPress={walk(-1)} />
          )
        }
        aside={
          props.readOnly === true ? undefined : (
            <StepButton label="Next pokemon" way="next" onPress={walk(1)} />
          )
        }
        // And what can be done to it, on a bar of its own under the
        // name. It was a button in the corner of the heading, beside
        // the arrows that are there now — and what a player does to a
        // pokemon deserves more room than a corner
        bar={
          // Kept on a condition that does not flap. The menu used to
          // hang off the record itself, so every re-read of it — and
          // this sheet re-reads after everything it writes — threw the
          // menu away and built a new one, which **closes** it: the
          // open state lives in the instance. A player who pressed
          // Actions while the record was still settling watched the
          // menu shut itself, and pressing it the instant the sheet
          // opened often did nothing at all.
          //
          // Whose sheet it is cannot change under a player, so the
          // button stands from the first frame and the entries fill in
          // when the record arrives
          <>
            {/* The two marks a player puts on one themselves, at the
                other end of the same row: they are about the record
                rather than about the pokemon, which is what the row
                is for */}
            <Show when={view()}>
              {(record) => (
                <span class="mr-auto flex items-center gap-1.5">
                  <Show when={isGuarded(record())}>
                    <Badge tone="tide">
                      <LockIcon class="size-3.5" aria-hidden="true" />
                      Locked
                    </Badge>
                  </Show>
                  <Show when={isFavorite(record())}>
                    <Badge tone="gold">
                      <StarIcon class="size-3.5" aria-hidden="true" />
                      Favorite
                    </Badge>
                  </Show>
                </span>
              )}
            </Show>
            <Show when={owned() != null}>
              <Menu label="Actions" icon={ActionsIcon} actions={menuActions()} />
            </Show>
          </>
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
          fallback={
            <Note>{props.detail.latest == null ? 'Loading catch…' : 'No such catch.'}</Note>
          }
        >
          {(loaded) => (
            <>
              {/* Whether anything is holding the record still. A lock
                  and a favorite say so through the Actions menu, which
                  is where they are turned on and off; a raid is the one
                  nobody chose, so it is the one worth a sentence */}
              <Show when={owned()}>
                <Show when={props.fighting()}>
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
                      entries={props.bag.latest}
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
                    see until it hatches.

                    It stands on the floor of a box with room above it.
                    The header is stuck to the top of the panel, so a
                    sprite drawn tight against it was clipped by the
                    bar the moment anything scrolled — and the space
                    that was above the pokemon is better spent under
                    the header than between the pokemon and its name */}
                <div class="-mb-2 flex min-h-28 items-end justify-center pt-2">
                  <AnimatedSprite
                    species={isEgg(loaded()) ? Species.Egg : loaded().species}
                    shiny={!isEgg(loaded()) && isShiny(loaded())}
                    female={!isEgg(loaded()) && loaded().gender === Genders.Female}
                    aura={isEgg(loaded()) ? undefined : catchAura(loaded())}
                    animation={SpriteAnim.Walk}
                    direction="DownLeft"
                    scale={4}
                    shadow
                    label={named()}
                  />
                </div>

                <div class="flex flex-col items-center gap-0.5">
                  <h3>{named()}</h3>
                  {/* What it actually is, under what it is called —
                      and only where the two differ. A pokemon nobody
                      has named is headed by its species already, and
                      printing that twice would be the sheet answering
                      a question it has just answered */}
                  <Show when={!isEgg(loaded()) && loaded().nickname !== ''}>
                    <Meta>{getSpeciesData(loaded().species).name}</Meta>
                  </Show>
                  {/* Both of the rolls it was made from, drawn rather
                      than printed. Two of the same species with the
                      same sigil are the same individual */}
                  <Meta class="font-mono tracking-[0.2em]">
                    {getSigil(loaded().individualValue, loaded().traitValue)}
                  </Meta>
                  {/* What it has left, drawn the way the box draws it.
                      It is here rather than in the stats below because
                      it is about this pokemon *now* rather than about
                      what it is made of, and it is the one number a
                      player checks before sending it anywhere. An egg
                      has nothing to lose yet */}
                  <Show when={!isEgg(loaded())}>
                    <div class="flex w-48 max-w-full items-center gap-2">
                      <div
                        class="h-1.5 grow overflow-hidden rounded-full border border-line-soft
                          bg-line-soft"
                      >
                        <div
                          class={`h-full ${isFainted(loaded()) ? 'bg-muted' : 'bg-leaf'}`}
                          style={{ width: `${healthLeft(loaded()) * 100}%` }}
                        />
                      </div>
                      <Meta class="shrink-0 tabular-nums">
                        {Math.max(0, Math.round(loaded().health))}/{getMaxHealth(loaded())}
                        {isFainted(loaded()) ? ' · fainted' : ''}
                      </Meta>
                    </div>
                  </Show>
                </div>

                {/* What it is: what the dex calls its kind, the types
                    it fights as, and which it is. Its species is named
                    above — as the heading, or under it where a
                    nickname has taken the heading — so this line does
                    not say it a third time. An egg is none of it yet */}
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
                        (props.candies.latest ?? 0) < getCandyCost(loaded()) ||
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
                    {props.candies.latest ?? 0}{' '}
                    {(props.candies.latest ?? 0) === 1 ? 'candy' : 'candies'}
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
                      {props.buddy.latest === props.catchId
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
                      what they are working towards.

                      A pokemon at the end of its line has no section at
                      all rather than a heading over the words "It does
                      not evolve": most of a full-grown box would carry
                      a ruled-off paragraph saying nothing was going to
                      happen */}
                  <Show when={props.evolutions.latest?.length}>
                    <DialogSection title="Evolution">
                      {/* `items-center`: a row is as wide as what it
                          says, and stands in the middle of the sheet.
                          Stretched, the button ended up an inch of
                          empty paper away from the picture it acts on,
                          which reads as belonging to nothing */}
                      <List class="items-center">
                        {/* `Index` rather than `For`: the list is
                            re-read after everything this sheet writes,
                            and each read hands back fresh objects — so
                            a keyed-by-value list throws every row away
                            and builds it again, sprite and all, when
                            what actually changed is a flag on one of
                            them. What a line evolves into does not
                            move; only whether it can yet */}
                        <Index each={props.evolutions.latest}>
                          {(option) => (
                            <ListRow
                              class="items-center gap-3"
                              // The shorthand on the row spelled out,
                              // for anyone who stops on it and for
                              // anything that reads it aloud
                              title={describeEvolutionMethod(option().evolution)}
                            >
                              {/* What it turns into, drawn rather than
                                  named — and drawn to what the reader
                                  has earned of it, the way the dex
                                  draws one. A line whose end they have
                                  never met is a shape rather than a
                                  spoiler, which is the whole reason a
                                  dex is worth filling in */}
                              <div class="flex items-end justify-start">
                                <SpeciesCoat
                                  species={option().evolution.species}
                                  met={dexKnows(option().evolution.species).met}
                                  revealed={dexKnows(option().evolution.species).owned}
                                  scale={2}
                                />
                              </div>
                              {/* The condition reads as a sum with the
                                  picture: that shape, plus a trade.
                                  It stays on the row rather than
                                  hiding on the button, because it is
                                  what the player is working towards
                                  and they need it whether or not they
                                  are about to press anything */}
                              <span class="flex items-center gap-1 text-muted">
                                <span>+</span>
                                <EvolutionCondition evolution={option().evolution} />
                              </span>
                              <Show when={owned() != null}>
                                <Button
                                  tone="primary"
                                  disabled={frozen() || !option().available}
                                  onClick={() => {
                                    evolve(option().evolution.species);
                                  }}
                                >
                                  Evolve
                                </Button>
                              </Show>
                            </ListRow>
                          )}
                        </Index>
                      </List>
                    </DialogSection>
                  </Show>

                  {/* Three readings of the same six numbers: what the
                      pokemon has, what it was born with, and what has
                      been trained into it. They are tabs rather than
                      three lists, because a player compares one stat
                      across them rather than reading all eighteen */}
                  <DialogSection title="Stats">
                    <TabGroup horizontal defaultValue={StatView.Total} class="flex flex-col gap-2">
                      <TabBar>
                        <TabButton value={StatView.Total}>Total</TabButton>
                        <TabButton value={StatView.IV}>IV</TabButton>
                        <TabButton value={StatView.EV}>EV</TabButton>
                      </TabBar>

                      <TabPane value={StatView.Total}>
                        <List>
                          {/* All six, health included: what it is worth
                              in a fight is the whole set, and what it
                              has left of its health is said under the
                              sprite. No nature moves health, so its
                              mark column simply comes out empty */}
                          <For each={STAT_ORDER}>
                            {(stat) => (
                              <ListRow>
                                {/* The arrow the games have always used,
                                    in a column of its own at the head of
                                    the row — the mirror of the number at
                                    the far end of it. Written after the
                                    name it pushed the labels out of line
                                    with each other, since only two of
                                    the six carry one; given its own
                                    width it marks the row without moving
                                    anything. The bar and the number are
                                    already tinted, and a colour is not
                                    something everybody can read */}
                                <span
                                  class={`w-3 shrink-0 text-left ${
                                    NATURE_NUMBERS[natureShift(loaded().nature, stat)]
                                  }`}
                                  title={
                                    NATURE_MARKS[natureShift(loaded().nature, stat)] === ''
                                      ? undefined
                                      : `${STAT_LABELS[stat]} is ${
                                          NATURE_WORDS[natureShift(loaded().nature, stat)]
                                        }`
                                  }
                                  aria-label={
                                    NATURE_MARKS[natureShift(loaded().nature, stat)] === ''
                                      ? undefined
                                      : NATURE_WORDS[natureShift(loaded().nature, stat)]
                                  }
                                  role={
                                    NATURE_MARKS[natureShift(loaded().nature, stat)] === ''
                                      ? undefined
                                      : 'img'
                                  }
                                >
                                  {NATURE_MARKS[natureShift(loaded().nature, stat)]}
                                </span>
                                <span class="w-24 shrink-0 text-left">{STAT_LABELS[stat]}</span>
                                {/* Measured against its own best rather
                                    than against a ceiling: what a player
                                    wants off this list is which end of
                                    the pokemon is the sharp one, and the
                                    bar the nature moved is the colour of
                                    the way it moved it */}
                                <div class="h-2 grow overflow-hidden rounded-full bg-line-soft">
                                  <div
                                    class={`h-full rounded-full ${
                                      NATURE_BARS[natureShift(loaded().nature, stat)]
                                    }`}
                                    style={{
                                      width: `${(totalOf(loaded(), stat) / bestTotal(loaded())) * 100}%`,
                                    }}
                                  />
                                </div>
                                <Meta
                                  class={`w-12 text-right tabular-nums ${
                                    NATURE_NUMBERS[natureShift(loaded().nature, stat)]
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
                      </TabPane>

                      <TabPane value={StatView.IV}>
                        <List>
                          <For each={STAT_ORDER}>
                            {(stat) => (
                              <ListRow>
                                {/* The column the Total tab marks a
                                    nature in, empty here: a stat's name
                                    should not move when the tab under
                                    it changes */}
                                <span class="w-3 shrink-0" />
                                <span class="w-24 shrink-0 text-left">{STAT_LABELS[stat]}</span>
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
                      </TabPane>

                      <TabPane value={StatView.EV}>
                        <List>
                          <For each={STAT_ORDER}>
                            {(stat) => (
                              <ListRow>
                                {/* The column the Total tab marks a
                                    nature in, empty here: a stat's name
                                    should not move when the tab under
                                    it changes */}
                                <span class="w-3 shrink-0" />
                                <span class="w-24 shrink-0 text-left">{STAT_LABELS[stat]}</span>
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
                                {/* Only up. Effort is taken back off a
                                    stat by feeding the pokemon a bitter
                                    berry — a Pomeg for health, a Kelpsy
                                    for attack — which costs an item and
                                    earns the pokemon's regard. A button
                                    here undid all of that for free, and
                                    made six berries pointless */}
                                <Show when={owned() != null}>
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
                      </TabPane>
                    </TabGroup>
                  </DialogSection>

                  {/* What it brings to a fight, in one row: what it
                      knows, what it is, and what it carries. They were
                      three sections down a long sheet, which put the
                      three answers to "can it win this" three scrolls
                      apart */}
                  <DialogSection>
                    <div class="grid gap-3 sm:grid-cols-3">
                      <div class="flex flex-col gap-1">
                        <h4>Moves</h4>
                        {/* The name, with the entry over it. The
                            description was written out under each row
                            once, which is four paragraphs in a column
                            a third this wide */}
                        <Show
                          when={loaded().moves.length}
                          fallback={<Note>It knows nothing.</Note>}
                        >
                          <ul class="m-0 flex list-none flex-col gap-1 p-0">
                            <For each={loaded().moves}>
                              {(move) => (
                                <li>
                                  <MoveHoverCard class="block" move={move}>
                                    {/* The name and nothing else: what
                                        kind it is and what it does are
                                        on the card over it, and three
                                        marks in a column this narrow
                                        left no room for the word */}
                                    <span
                                      class="block truncate rounded-lg border-2 border-line
                                        bg-paper px-2 py-1 text-sm font-medium"
                                    >
                                      {getMoveData(move).name}
                                    </span>
                                  </MoveHoverCard>
                                </li>
                              )}
                            </For>
                          </ul>
                        </Show>
                      </div>

                      <div class="flex flex-col gap-1">
                        <h4>Abilities</h4>
                        <Show when={loaded().abilities.length} fallback={<Note>None.</Note>}>
                          <ul class="m-0 flex list-none flex-col gap-1 p-0">
                            <For each={loaded().abilities}>
                              {(ability) => (
                                <li>
                                  <TooltipHost class="block" {...detailAbility(ability)}>
                                    <Badge class="w-full justify-center" wrap>
                                      {describeAbility(ability)}
                                    </Badge>
                                  </TooltipHost>
                                </li>
                              )}
                            </For>
                          </ul>
                        </Show>
                      </div>

                      <div class="flex flex-col gap-1">
                        <h4>Held items</h4>
                        {/* Squares four across, the way the bag draws
                            them: a pokemon carries one by default and
                            a Utility Belt widens the record's own
                            room, so the tray is as wide as the pokemon
                            is rather than as wide as the game allows.
                            Room is only drawn for somebody who can
                            fill it — an empty square on a stranger's
                            pokemon is a button nobody may press */}
                        <ul class="m-0 grid list-none grid-cols-4 gap-1 p-0">
                          <Index each={itemSlots(loaded(), owned() != null)}>
                            {(_, at) => (
                              <li class="contents">
                                <Show
                                  when={at < loaded().items.length}
                                  fallback={
                                    <button
                                      type="button"
                                      disabled={frozen() || holdables().length === 0}
                                      aria-label="Give it an item"
                                      class="flex aspect-square cursor-pointer items-center
                                        justify-center rounded-lg border-2 border-dashed
                                        border-line bg-paper/40 p-0 text-muted shadow-none
                                        hover:border-tide hover:text-tide-dark
                                        active:translate-y-0 disabled:cursor-not-allowed"
                                      onClick={() => {
                                        setPanel('give');
                                      }}
                                    >
                                      +
                                    </button>
                                  }
                                >
                                  <HoverCard
                                    class="block"
                                    title="Info"
                                    footer={(close) => (
                                      <Show
                                        when={owned() != null}
                                        fallback={<Button onClick={close}>Close</Button>}
                                      >
                                        <Button
                                          tone="primary"
                                          disabled={frozen()}
                                          onClick={() => {
                                            close();
                                            moveItem(loaded().items[at], false);
                                          }}
                                        >
                                          Take back
                                        </Button>
                                      </Show>
                                    )}
                                    trigger={
                                      <span
                                        class="flex aspect-square w-full items-center
                                          justify-center rounded-lg border-2 border-line bg-paper"
                                      >
                                        <ItemSprite
                                          item={loaded().items[at]}
                                          size={ITEM_SPRITE}
                                          label=""
                                        />
                                      </span>
                                    }
                                  >
                                    <ItemCard item={loaded().items[at]} />
                                  </HoverCard>
                                </Show>
                              </li>
                            )}
                          </Index>
                        </ul>
                      </div>
                    </div>

                    {/* The bag opens as its own window rather than
                        unfolding inside the sheet: a tray of thirty
                        squares pushed everything under it off the
                        screen */}
                    <Show when={owned() != null}>
                      <InventoryPicker
                        open={panel() === 'give'}
                        onClose={() => {
                          setPanel(null);
                        }}
                        title="Give an item"
                        description="Choose what it should carry."
                        entries={props.bag.latest}
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
                            {/* The ball it arrived in, which is not
                                always the one it sits in now: a later
                                owner can re-ball it, and the entry is
                                the record of how it came across */}
                            <Show when={entry.ball != null}>
                              <ItemSprite
                                item={BALL_ITEMS[entry.ball ?? Balls.PokeBall]}
                                size={HISTORY_BALL}
                                label={describeItem(BALL_ITEMS[entry.ball ?? Balls.PokeBall])}
                              />
                            </Show>
                            {/* A previous owner is a way to them. The
                                reader's own name is not: pressing it
                                would open a read-only copy of the
                                profile the menu already gives them */}
                            <Show
                              when={
                                // A trainer with no account behind them —
                                // the original owner of a distribution —
                                // is a name rather than a way to anybody
                                entry.owner === '' || entry.owner === auth.user()?.uid
                                  ? null
                                  : (props.onTrainer ?? null)
                              }
                              fallback={
                                <span class="grow text-left font-medium">
                                  {describeOwner(entry)}
                                </span>
                              }
                            >
                              {(visit) => (
                                <RowButton
                                  class="grow text-left font-medium"
                                  onClick={() => {
                                    visit()(entry.owner);
                                  }}
                                >
                                  {describeOwner(entry)}
                                </RowButton>
                              )}
                            </Show>
                            {/* How they came by it, when, and what it
                                cost them where it cost anything: a lot
                                off the block is the one handover with a
                                price on it, and the price is most of
                                what the entry is worth reading for */}
                            <Meta>
                              {ACQUISITION_NAMES[entry.kind]} · {describeDate(entry.acquiredAt)}
                              {/* Grouped, since a winning bid runs to
                                  five figures and a bare 12000 is read
                                  digit by digit. Tested for absence
                                  rather than truth: nought gold is a
                                  price, and nothing is not */}
                              <Show when={entry.paid != null}>
                                {' '}
                                · {(entry.paid ?? 0).toLocaleString('en-US')} gold
                              </Show>
                            </Meta>
                          </ListRow>
                        )}
                      </For>
                    </List>
                  </Show>
                  <Meta>{describeHistory(loaded())}</Meta>
                </DialogSection>

                {/* There is no undoing it, so it takes two presses —
                    and whatever it is holding comes back to the bag,
                    along with the candy the pokemon was worth. The
                    second press names that candy: what a player gets
                    for it is part of the decision, and a number that
                    only turns up afterwards is a number they had to
                    make the decision without */}
                <Show when={owned()}>
                  <DialogSection>
                    <Row class="justify-center">
                      <Button
                        tone="danger"
                        // A favorite and a locked one are both marks a
                        // player put on the record to stop exactly
                        // this, so the button is dead rather than
                        // pressable and refused
                        disabled={
                          props.fighting() === true ||
                          props.onlyOne() === true ||
                          isFavorite(loaded()) ||
                          isGuarded(loaded())
                        }
                        onClick={release}
                      >
                        {releasing()
                          ? `Let it go for ${getCatchCandy(loaded().species)} candy?`
                          : 'Release'}
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
                    <Show when={isGuarded(loaded())}>
                      <Meta>A locked pokemon cannot be released. Unlock it first.</Meta>
                    </Show>
                    {/* Nothing takes the last one: a player with an
                          empty collection has no way back into the
                          game except the gift that would replace it */}
                    <Show when={props.onlyOne()}>
                      <Meta>The only pokemon you have cannot be released.</Meta>
                    </Show>
                  </DialogSection>
                </Show>
              </div>
            </>
          )}
        </Show>
        <DialogActions>
          <Button
            onClick={() => {
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

      {/* And the same shape for a bottle: a PP Up is spent on one move
          and nothing takes the points back, so it asks which before it
          leaves the bag */}
      <IncreasePPDialog
        catchId={bottle() == null ? null : props.catchId}
        item={bottle()}
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

/**
 * The sheet with its record read, which is where everything derived
 * from that record is asked for: what it can evolve into, whose
 * hands it has been through, its candies, and whether it is fighting.
 * All four are keyed on the record, so they belong to a body below
 * the one holding it
 */
function CatchSheet(
  props: CatchDialogProps & {
    detail: Resource<{ id: string; caught: CaughtPokemon | null }>;
    siblings: Resource<string[]>;
    dex: Resource<PokedexView>;
    onlyOne: Resource<boolean>;
    bag: Resource<InventoryEntry[]>;
    buddy: Resource<string | null>;
    onRecordChanged: () => void;
    onBagChanged: () => void;
    onBuddyChanged: () => void;
  },
): JSX.Element {
  const auth = useAuth();

  const owned = (): string | null => {
    const user = auth.user();

    if (props.readOnly === true) {
      return null;
    }
    return user != null && user.uid === props.player ? user.uid : null;
  };

  const view = (): CaughtPokemon | null => {
    const held = props.detail.latest;
    const loaded = held?.id === props.catchId ? held.caught : null;

    if (loaded == null) {
      return null;
    }
    return props.readOnly === true || loaded.owner === props.player ? loaded : null;
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

  return (
    <CatchSheetBody
      {...props}
      owners={owners}
      evolutions={evolutions}
      fighting={fighting}
      candies={candies}
      onCandiesChanged={() => {
        Promise.resolve(refetchCandies()).catch(() => undefined);
      }}
      onEvolutionsChanged={() => {
        Promise.resolve(refetchEvolutions()).catch(() => undefined);
      }}
    />
  );
}

/**
 * One pokemon in full.
 *
 * Everything the sheet is drawn from is read below this body rather
 * than in it: a record still arriving would otherwise throw to the
 * boundary around the whole page and take the world with it
 */
export default function CatchDialog(props: CatchDialogProps): JSX.Element {
  const auth = useAuth();

  const owned = (): string | null => {
    const user = auth.user();

    if (props.readOnly === true) {
      return null;
    }
    return user != null && user.uid === props.player ? user.uid : null;
  };

  const [detail, { refetch }] = createResource(() => props.catchId, loadDetail);

  /**
   * The rest of the box, in the order the box draws it — newest first,
   * the same sort the picker uses, so "next" means the square to the
   * right of this one rather than some other order nobody can see.
   *
   * Read once per player rather than per pokemon: stepping through a
   * collection would otherwise pay for the whole listing at every
   * press. It goes stale when a record leaves the box, which is a
   * release or a listing — and both of those shut the sheet
   */
  const [siblings] = createResource(
    // Read again each time the sheet **opens** rather than once for
    // the session: a pokemon caught since the last look belongs in the
    // run. Stepping does not re-read it — the source is the player
    // rather than the pokemon — so walking a box of three hundred is
    // still one query
    () =>
      props.readOnly === true || props.onCatch == null || props.catchId == null
        ? null
        : props.player,
    async (player) =>
      (await listCaught(player))
        .sort(([, one], [, other]) => other.caughtAt.localeCompare(one.caughtAt))
        .map(([id]) => id),
  );

  /**
   * What the reader's dex says, read once for the whole sheet.
   *
   * It is the dex rather than this record because of what it is for:
   * the evolutions below are drawn to what the **player** has met, so
   * a line they have never seen the end of is a silhouette here the
   * same way it is in the dex
   */
  const [dex] = createResource(() => auth.user()?.uid ?? null, getPokedex);

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
   * What the player is carrying. The bag is read once and split
   * below: some of it can be handed over, some of it can be spent on
   * the pokemon, and the two lists move together when either does
   */
  /**
   * Keyed on the sheet as well as the owner, so each pokemon opened
   * re-reads it. The sheet is mounted for the whole session — it is
   * the route's, not a list's — so a bag read once on mount is the bag
   * as it was before the player had played: a new account's read
   * landed before the starter gift did, and Use item stayed empty for
   * good
   */
  const [bag, { refetch: refetchBag }] = createResource(
    () => (props.catchId == null ? null : owned()),
    async (uid) => getInventory(uid),
  );

  /**
   * Which catch is currently walking with the player, so the button
   * can say whether this is the one
   */
  const [buddy, { refetch: refetchBuddy }] = createResource(() => owned(), getBuddy);

  return (
    <CatchSheet
      {...props}
      detail={detail}
      siblings={siblings}
      dex={dex}
      onlyOne={onlyOne}
      bag={bag}
      buddy={buddy}
      onRecordChanged={() => {
        Promise.resolve(refetch()).catch(() => undefined);
      }}
      onBagChanged={() => {
        Promise.resolve(refetchBag()).catch(() => undefined);
      }}
      onBuddyChanged={() => {
        Promise.resolve(refetchBuddy()).catch(() => undefined);
      }}
    />
  );
}
