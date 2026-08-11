// Firestore returns untyped documents; the reads below restore
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import { BASE_FRIENDSHIP } from '../data/constants/friendship';
import { type Slots, defaultSlots, getSlots } from '../data/constants/slots';
import type { Stats } from '../data/constants/stats';
import type Abilities from '../data/ids/abilities';
import type Biome from '../data/ids/biome';
import type { Balls, Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import type { Genders, Species } from '../data/ids/species';
import type Lairs from '../data/overworld/lair';
import { EncounterType } from '../overworld/encounter';
import {
  asBoolean,
  asNumber,
  asNumberArray,
  asRecord,
  asStatRecord,
  asString,
} from './__normalize';
import { getMaxHealth } from './health';

/**
 * What a catch is, and how a stored one is read back. It lives apart
 * from the store that queries it because the privileged server writes
 * catches too: both sides need the shape, and neither should have to
 * import the other to get it
 */

/**
 * How many items one pokemon can hold at a time, matching the
 * battle's per-unit item limit
 */
export const HELD_ITEM_LIMIT = 1;

/**
 * How much room this pokemon has for that kind of thing. It is the
 * record's own answer — see [`slots.ts`](../data/constants/slots.ts) —
 * rather than the game's, which is what lets one pokemon carry two
 * abilities while the next carries one
 */
export function getCatchSlots(caught: { slots: number }, kind: Slots): number {
  return getSlots(caught.slots, kind);
}

/**
 * A caught encounter, permanently recorded. The IVs, gender and
 * nature are stored explicitly (even though they re-derive from the
 * individual and trait values) so records are readable and queryable
 * on their own.
 *
 * Everything about one catch lives in this one document: its
 * abilities, what it holds and whose hands it has passed through were
 * once three side stores keyed by the same id, which meant four reads
 * to show a pokemon and four documents to keep in step. They are
 * fields now, and a catch is read, written and secured as a whole
 */
export interface CaughtPokemon {
  /**
   * The current owner's uid
   */
  owner: string;
  /**
   * How the pokemon was originally encountered
   */
  type: EncounterType;
  species: Species;
  level: number;
  individualValue: number;
  traitValue: number;
  /**
   * Individual values, five bits per stat packed into one integer.
   * These are what every reader uses: for a wild catch they are
   * slices of `individualValue`, but a bred egg inherits three of
   * them from its parents and a bottle cap raises them, so the two
   * fields disagree and this one is what counts
   */
  ivs: number;
  gender: Genders;
  nature: Natures;
  /**
   * The five yes-or-no questions a catch answers, each its own field
   * so each can be asked of the store: `where('shiny', '==', true)`
   * is a query, and a bit of a packed field is not. Whether it is
   * **fighting** is not among them — `lockedAt` has always carried
   * that, and a stamp of zero is a free pokemon
   */
  shiny: boolean;
  shadow: boolean;
  egg: boolean;
  favorite: boolean;
  guarded: boolean;
  moves: Moves[];
  /**
   * The abilities the catch has: the rolled one, plus Shadow for a
   * shadow catch, which it keeps for good
   */
  abilities: Abilities[];
  /**
   * How much room it has for each of the three lists — abilities,
   * held items and moves — packed three bits each and read through
   * `getSlots`. A ceiling belongs to the individual rather than to
   * the game: a shadow carries two abilities where everything else
   * carries one
   */
  slots: number;
  /**
   * What it is holding, up to HELD_ITEM_LIMIT; a fresh catch holds
   * nothing
   */
  items: Items[];
  /**
   * Whose hands it has passed through, oldest first: the catcher, and
   * an entry per trade
   */
  history: OwnershipRecord[];
  /**
   * The `startedAt` of the battle that locked it, zero when free. The
   * lock expires on its own `BATTLE_TIMEOUT` after this, so a party
   * walked out on is not held forever, and the stamp tells one
   * battle's lock from a later one's when the fight releases it
   */
  lockedAt: number;
  /**
   * How far the egg has been carried. Only steps walked while it is
   * the player's buddy count, and only at a walking pace
   */
  steps: number;
  /**
   * How far it has to be carried, frozen when the egg was found: a
   * later change to what hatching costs cannot strand an egg somebody
   * is already halfway through
   */
  hatchSteps: number;
  /**
   * When steps were last credited, on the server's clock. It is what
   * the next report is measured against, so it is written by the
   * server and never by the walker
   */
  steppedAt: number;
  /**
   * How much health it has left. A battle leaves it where it left it,
   * so a party is looked after between fights rather than reset
   * between them; zero means fainted, and a fainted pokemon cannot be
   * fielded until something heals it.
   *
   * The maximum is derived rather than stored — see
   * [`src/auth/health.ts`](./health.ts) — so anything that changes the
   * maximum moves this in proportion
   */
  health: number;
  /**
   * The non-volatile statuses it walked out of its last battle with,
   * as a mask of `StatusFlags`. A pokemon can carry several at once —
   * poisoned and asleep is an ordinary way to come out of a raid —
   * while everything else a fight does (confusion, flinching, a
   * substitute) belongs to the fight and ends with it
   */
  statuses: number;
  /**
   * The lair it was fought in, for a raid prize. It is what the raid
   * was called, so a record can say where it came from rather than
   * only what kind of raid it was — null for everything met any other
   * way
   */
  lair: Lairs | null;
  /**
   * The ball the catch was made with
   */
  ball: Balls;
  /**
   * When it was caught, as an ISO 8601 string in the catcher's own
   * zone — `2026-08-10T22:14:03.123+08:00`. The local date is what a
   * player means by "when I caught it", and the offset keeps the
   * instant behind it recoverable
   */
  caughtAt: string;
  /**
   * The catcher's locale tag, e.g. `en-PH`. A record carries where it
   * came from, so a date or a number shown alongside it can be read
   * the way its catcher would read it
   */
  locale: string;
  /**
   * Effort values per stat; a fresh catch starts at zero.
   *
   * What may be put here is not free: a pokemon has
   * `EFFORT_PER_LEVEL` points per level it has taken, plus whatever
   * wings have added to `effortBonus`, and the six values together
   * never come to more than that. See
   * [`src/auth/effort.ts`](./effort.ts) for the arithmetic both sides
   * read
   */
  effortValues: Record<Stats, number>;
  /**
   * Effort granted by wings rather than by levels. It is kept apart
   * from the values themselves because it is what a pokemon may spend
   * rather than what it has spent — a wing is three more points, and
   * feeding a berry to take training back off a stat hands those
   * points back to be spent again
   */
  effortBonus: number;
  /**
   * How far this pokemon has walked as somebody's buddy since it came
   * out of its shell — or since it was caught, for one that was never
   * in one. It buys friendship rather than hatching anything, which is
   * why it is counted apart from `steps`
   */
  walked: number;
  /**
   * What the pokemon thinks of its owner, 0 to `MAX_FRIENDSHIP`. It
   * rises with levels taken and walks shared and falls when the
   * pokemon is knocked out; see
   * [`src/data/constants/friendship.ts`](../data/constants/friendship.ts)
   */
  friendship: number;
  /**
   * Where and when the spawn appeared
   */
  origin: {
    timestamp: number;
    x: number;
    y: number;
    biome: Biome;
  };
}

/**
 * Whether the catch sparkles, as its original catcher saw it
 */
export function isShiny(caught: { shiny: boolean }): boolean {
  return caught.shiny;
}

/**
 * Whether it carries a shadow: the Shadow ability for good, and
 * double candy at every level
 */
export function isShadow(caught: { shadow: boolean }): boolean {
  return caught.shadow;
}

/**
 * Whether the player has marked it as one they are keeping. A favorite
 * cannot be released, put up for auction or traded away — it is a
 * guard against a mis-click on something irreversible, and it changes
 * nothing else about the pokemon
 */
export function isFavorite(caught: { favorite: boolean }): boolean {
  return caught.favorite;
}

/**
 * Whether the player has put it away.
 *
 * A guarded pokemon is kept exactly as it is: it cannot be levelled,
 * trained, have its values moved, evolved, taken into a fight, healed
 * or purified, and nothing can be given to it or taken back off it.
 * What it is still free to do is what only ever adds to it — walking,
 * friendship, and standing as a parent. Unlike the battle lock beside
 * it, this one is the player's own doing and comes off whenever they
 * say so
 */
export function isGuarded(caught: { guarded: boolean }): boolean {
  return caught.guarded;
}

/**
 * How a pokemon came into one owner's hands.
 *
 * It is not the same question as `EncounterType`, which says how the
 * pokemon was first met and never changes. This says how it reached
 * *this* owner, so a Mewtwo can be a legendary raid prize that its
 * second owner bought at auction — the record keeps both, and a chain
 * of them reads as the pokemon's life rather than as a list of uids
 */
export const enum Acquisition {
  /**
   * They caught it themselves
   */
  Caught = 0,
  /**
   * It came to them as an egg, out of a nest or a breeder's hands.
   * The pokemon was never anybody else's — it began here
   */
  Egg = 1,
  /**
   * They won it at auction
   */
  Auction = 2,
  /**
   * They took it in a trade. Nothing writes this yet: trading does not
   * exist, and the member is here so the day it does, old records do
   * not have to be told apart from new ones by their shape
   */
  Trade = 3,
}

/**
 * What each is called where a history is shown
 */
export const ACQUISITION_NAMES: Record<Acquisition, string> = {
  [Acquisition.Caught]: 'Caught',
  [Acquisition.Egg]: 'Received as an egg',
  [Acquisition.Auction]: 'Won at auction',
  [Acquisition.Trade]: 'Traded for',
};

export interface OwnershipRecord {
  owner: string;
  /**
   * When this owner obtained the pokemon, as a local ISO 8601 string
   * in that owner's own zone
   */
  acquiredAt: string;
  /**
   * How they came by it
   */
  kind: Acquisition;
}

/**
 * Restore an ownership history from an untyped Firestore value.
 *
 * `origin` is what the first entry means for a record written before
 * this field existed — the caller knows whether the pokemon was caught
 * or hatched, and the history does not
 */
function asOwnershipHistory(value: unknown, origin: Acquisition): OwnershipRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry, at) => {
    const record = asRecord(entry);
    // An older entry says nothing about how it changed hands, but both
    // cases are knowable: the first is where the pokemon began, and
    // every entry after it can only be a sale, since the auction house
    // has been the one thing that ever appended one
    const older = at === 0 ? origin : Acquisition.Auction;

    return {
      owner: asString(record.owner),
      acquiredAt: asString(record.acquiredAt),
      kind: record.kind == null ? older : (asNumber(record.kind) as Acquisition),
    };
  });
}

/**
 * Restore a catch from an untyped Firestore value. The client's
 * converter and the privileged server both read through here, so the
 * two agree on what a stored catch means
 */
export function asCaughtPokemon(value: unknown): CaughtPokemon {
  const data = asRecord(value);
  const origin = asRecord(data.origin);
  const type = asNumber(data.type) as EncounterType;
  const species = asNumber(data.species) as Species;
  const level = asNumber(data.level);
  const ivs = asNumber(data.ivs);
  const effortValues = asStatRecord(data.effortValues);
  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  const abilities = asNumberArray(data.abilities) as Abilities[];

  return {
    owner: asString(data.owner),
    type,
    species,
    level,
    individualValue: asNumber(data.individualValue),
    traitValue: asNumber(data.traitValue),
    ivs,
    gender: asNumber(data.gender) as Genders,
    nature: asNumber(data.nature) as Natures,
    shiny: asBoolean(data.shiny),
    shadow: asBoolean(data.shadow),
    egg: asBoolean(data.egg),
    favorite: asBoolean(data.favorite),
    guarded: asBoolean(data.guarded),
    moves: asNumberArray(data.moves) as Moves[],
    abilities,
    // A record written before the field existed has the room the game
    // used to give everything, which is what its own abilities say
    slots: data.slots == null ? defaultSlots(abilities) : asNumber(data.slots),
    items: asNumberArray(data.items) as Items[],
    // Something hatched began as an egg in its first owner's hands;
    // everything else was caught by them
    history: asOwnershipHistory(
      data.history,
      type === EncounterType.Hatched ? Acquisition.Egg : Acquisition.Caught,
    ),
    lockedAt: asNumber(data.lockedAt),
    steps: asNumber(data.steps),
    hatchSteps: asNumber(data.hatchSteps),
    steppedAt: asNumber(data.steppedAt),
    // A record written before a fight could hurt anything has no
    // health field, and reading that as zero would faint every
    // pokemon caught until now. Missing means whole, which is what
    // those records meant
    health:
      data.health == null
        ? getMaxHealth({ species, level, ivs, effortValues })
        : asNumber(data.health),
    statuses: asNumber(data.statuses),
    lair: data.lair == null ? null : (asNumber(data.lair) as Lairs),
    ball: asNumber(data.ball) as Balls,
    caughtAt: asString(data.caughtAt),
    locale: asString(data.locale),
    effortValues,
    effortBonus: asNumber(data.effortBonus),
    walked: asNumber(data.walked),
    // A record written before a pokemon could think anything of
    // anybody starts where a fresh catch starts, rather than at the
    // zero a missing field would read as: those pokemon were caught
    // and kept, not neglected
    friendship: data.friendship == null ? BASE_FRIENDSHIP : asNumber(data.friendship),
    origin: {
      timestamp: asNumber(origin.timestamp),
      x: asNumber(origin.x),
      y: asNumber(origin.y),
      biome: asNumber(origin.biome) as Biome,
    },
  };
}
