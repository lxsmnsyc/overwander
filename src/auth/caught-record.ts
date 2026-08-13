// Firestore returns untyped documents; the reads below restore
// const-enum fields via assertions that tsc requires but tsgolint
// (resolving const enums to number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import { SpawnRarity, getSpawnRarity } from '../data/biome';
import { BASE_FRIENDSHIP } from '../data/constants/friendship';
import { isPerfectIVs } from '../data/items/bottle-caps';
import { type Slots, defaultSlots, getSlots } from '../data/constants/slots';
import { type Stats, isZeroIVs } from '../data/constants/stats';
import type Abilities from '../data/ids/abilities';
import type Biome from '../data/ids/biome';
import type { Balls, Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import type { Genders, Species } from '../data/ids/species';
import type Lairs from '../data/overworld/lair';
import { EncounterType } from '../overworld/encounter';
import { PP_UP_LIMIT } from '../data/moves';
import {
  asBoolean,
  asNumber,
  asNumberArray,
  asRecord,
  asStatRecord,
  asString,
  isRecord,
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
  /**
   * Whether this pokemon has changed hands in a trade.
   *
   * The history already says so — an entry with `Acquisition.Trade` in
   * it is exactly this fact — but a history is a list, and a list
   * cannot be asked of the store. This can: "which of mine came from
   * somebody else" is one query rather than a whole box read and
   * filtered, which is what the same argument buys `auctionable`.
   *
   * It is also what opens a **trade evolution**: a Machoke that has
   * changed hands may become a Machamp, and one that has not may not
   * — see `meetsEvolutionCriteria`. The mainline evolves one during
   * the trade itself; here the trade opens the evolution and the
   * player asks for it from the catch sheet.
   *
   * Nothing sets it yet: trading does not exist. It is written `false`
   * from the day catches are created so that the day it does, old
   * records do not have to be told apart from new ones by their shape
   */
  traded: boolean;
  /**
   * Whether this is one a player would part with gold for — see
   * `isAuctionableCatch` for the four answers that count.
   *
   * It is **derived**, and stored anyway. Everything the derivation
   * reads is already on the record — `ivs`, `shiny`, `species` — so
   * nothing here is new information; what the field buys is the
   * ability to **ask the store**, which the inputs together cannot.
   * Perfect values are one integer and could be matched, and shiny is
   * a field, but "any of these four" is a disjunction, and a
   * disjunction over a whole box is four queries or none.
   *
   * It is written by whatever last changed one of the inputs, and it
   * is never trusted for a decision: `openAuction` re-derives it from
   * the record it is holding. A stale field can cost a listing a place
   * in a list; it can never authorize one
   */
  auctionable: boolean;
  moves: Moves[];
  /**
   * How many points have been spent on each move, keyed by the move's
   * id: what a PP Up bought, and what `getMovePP` reads to say how
   * often the move comes back.
   *
   * It is a **map beside the move list** rather than a field inside
   * it, because the list itself is a shape this game uses in four
   * places where points are meaningless — an encounter's rolled moves,
   * a battle snapshot's, a grunt's party, a bred egg's inheritance.
   * The training belongs to this individual, so it sits with the other
   * things spent on one: `effortValues`, `effortBonus`, `slots`.
   *
   * Only moves with something spent on them appear. A move put over by
   * another loses its points with it — the mainline loses PP Ups on a
   * forgotten move too — so nothing here outlives the move it belongs
   * to
   */
  movePoints: Record<string, number>;
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
 * Whether this is one somebody else would pay for.
 *
 * Any one of four answers is enough, and each is a different reason a
 * stranger cannot simply go and get one:
 *
 * - **Perfect values.** Six lucky rolls, or a Golden Bottle Cap spent
 *   on it. Nothing else in the game hands them over.
 * - **Nothing at all.** Six rolls landing on zero are exactly as rare
 *   as six landing on thirty-one, and a pokemon as bad as one can
 *   possibly be is a curiosity somebody will pay for. It is also the
 *   one of the four a player cannot manufacture: a cap only ever
 *   raises values, so a blank record can be found and never made —
 *   and spending a cap on one destroys what made it worth having.
 * - **Shiny.** The one thing a player cannot work towards at all.
 * - **A special-tier species.** A legendary or a mythical, which the
 *   world stages on its own schedule.
 *
 * It takes the three fields rather than a whole record, so a caller
 * part-way through an update can ask about the values it is **about
 * to write** — a cap that is raising `ivs`, an evolution that is
 * changing `species` — rather than about the ones already stored
 */
export function isAuctionableCatch(caught: {
  ivs: number;
  shiny: boolean;
  species: Species;
}): boolean {
  return (
    isPerfectIVs(caught.ivs) ||
    isZeroIVs(caught.ivs) ||
    isShiny(caught) ||
    getSpawnRarity(caught.species) === SpawnRarity.Special
  );
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
  /**
   * It was given to them: a mystery gift, which today is the pokemon
   * the game hands somebody who has none. It is its own kind because
   * it is the one arrival nobody worked for, and a history that
   * called it a catch would be saying they went and found it
   */
  Gift = 4,
  /**
   * They carried a fossil to somebody with the machinery to open it.
   * Like an egg, the pokemon was never anybody else's — it began
   * here — but nobody bred it and nothing hatched: what they handed
   * over was a rock
   */
  Revived = 5,
}

/**
 * What each is called where a history is shown
 */
export const ACQUISITION_NAMES: Record<Acquisition, string> = {
  [Acquisition.Caught]: 'Caught',
  [Acquisition.Egg]: 'Received as an egg',
  [Acquisition.Auction]: 'Won at auction',
  [Acquisition.Trade]: 'Traded for',
  [Acquisition.Gift]: 'Received as a gift',
  [Acquisition.Revived]: 'Revived from a fossil',
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
 * The points spent on each move, restored. Anything that is not a
 * count of them is left out rather than read as zero, and a count is
 * held to what a move will take — a stored figure past the limit is a
 * record that should not have one, and reading it back would make a
 * move faster than any amount of gold can buy
 */
export function asMovePoints(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {};
  }

  const spent: Record<string, number> = {};

  for (const [move, points] of Object.entries(value)) {
    if (typeof points === 'number' && points > 0) {
      spent[move] = Math.min(Math.floor(points), PP_UP_LIMIT);
    }
  }
  return spent;
}

/**
 * How many points have been spent on one of this pokemon's moves
 */
export function getMovePoints(caught: { movePoints: Record<string, number> }, move: Moves): number {
  return caught.movePoints[String(move)] ?? 0;
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
    // A record written before trading was a field was written before
    // trading was a thing, so it was never traded
    traded: asBoolean(data.traded),
    auctionable: asBoolean(data.auctionable),
    moves: asNumberArray(data.moves) as Moves[],
    // A record written before a move could be trained has nothing
    // spent on any of them
    movePoints: asMovePoints(data.movePoints),
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
