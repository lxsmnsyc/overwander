// Rows arrive untyped; the reads below restore const-enum fields via
// assertions that tsc requires but tsgolint (resolving const enums to
// number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import { SpawnRarity, getSpawnRarity } from '../data/biome';
import { getSpeciesData } from '../data/species';
import { BASE_FRIENDSHIP } from '../data/constants/friendship';
import { isPerfectIVs } from '../data/items/bottle-caps';
import { type Slots, defaultSlots, getSlots } from '../data/constants/slots';
import { type Stats, isZeroIVs } from '../data/constants/stats';
import type { AuraKind } from '../canvas/auras';
import Abilities from '../data/ids/abilities';
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
 * from the store because the privileged server writes catches too, and
 * neither side should import the other to get the shape
 */

/**
 * How many items one pokemon can hold, matching the battle's per-unit
 * limit
 */
export const HELD_ITEM_LIMIT = 1;

/**
 * How much room this pokemon has for that kind of thing — the
 * record's own answer rather than the game's, which is what lets one
 * pokemon carry two abilities while the next carries one
 */
export function getCatchSlots(caught: { slots: number }, kind: Slots): number {
  return getSlots(caught.slots, kind);
}

/**
 * A caught encounter, permanently recorded. IVs, gender and nature are
 * stored even though they re-derive from the rolls, so a record is
 * readable and queryable on its own.
 *
 * The record shape is flat: abilities, held items and ownership
 * history are lists here and child tables in the database, joined back
 * together on the way in and out
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
  /**
   * What its owner calls it. Stored **empty** until somebody names it
   * and read back as the species' name — a stored copy would go stale
   * on evolution, while a real nickname survives it
   */
  nickname: string;
  level: number;
  individualValue: number;
  traitValue: number;
  /**
   * Individual values, five bits per stat. This is what every reader
   * uses: a bred egg inherits three of them and a bottle cap raises
   * them, so it disagrees with `individualValue` and wins
   */
  ivs: number;
  gender: Genders;
  nature: Natures;
  /**
   * The five yes-or-no questions a catch answers, each its own field
   * so each can be queried. Whether it is **fighting** is not among
   * them: `lockedAt` carries that, and zero is a free pokemon
   */
  shiny: boolean;
  shadow: boolean;
  egg: boolean;
  favorite: boolean;
  guarded: boolean;
  /**
   * Whether it has changed hands. A field rather than a read of
   * `history` so the store can be queried. Set where a pokemon passes
   * between players: winning it at auction is one such handover, a
   * swap between two players the other
   */
  traded: boolean;
  /**
   * Whether a handover has already met what a trade evolution asks
   * for. `traded` alone cannot answer it: a Machop traded and then
   * levelled is not a Machoke that was traded, and a Karrablast
   * becomes an Escavalier only against a Shelmet. Both questions are
   * settled at the handover, by `settleHandover`, so what is
   * kept here is the answer rather than the evidence.
   *
   * Spent by the evolution it opens and cleared by any other change
   * of species, so a shape that did not earn it never reads it
   */
  canEvolve: boolean;
  /**
   * Whether somebody would pay for it — see `isAuctionableCatch`.
   *
   * Derived from `ivs`, `shiny` and `species`, and stored anyway: "any
   * of these four" is a disjunction, and a disjunction over a whole
   * box is four queries or none. Never trusted for a decision —
   * `openAuction` re-derives it — so a stale field can cost a listing
   * a place in a list but can never authorize one
   */
  auctionable: boolean;
  moves: Moves[];
  /**
   * Points spent on each move, keyed by move id: what a PP Up bought.
   *
   * A map beside the move list rather than a field in it, because the
   * list shape is reused where points are meaningless — encounters,
   * battle snapshots, grunt parties, egg inheritance. A move put over
   * by another loses its points with it
   */
  movePoints: Record<string, number>;
  /**
   * The rolled ability, plus Shadow for a shadow catch, which it keeps
   * for good
   */
  abilities: Abilities[];
  /**
   * Room for abilities, held items and moves, three bits each. A
   * ceiling belongs to the individual: a shadow carries two abilities
   * where everything else carries one
   */
  slots: number;
  /**
   * What it is holding, up to HELD_ITEM_LIMIT; a fresh catch holds
   * nothing
   */
  items: Items[];
  /**
   * Whose hands it has passed through, oldest first
   */
  history: OwnershipRecord[];
  /**
   * The `startedAt` of the battle holding it, zero when free. The lock
   * expires `BATTLE_TIMEOUT` after this, and the stamp tells one
   * battle's lock from a later one's
   */
  lockedAt: number;
  /**
   * How far the egg has been carried — buddy steps at a walking pace
   * only
   */
  steps: number;
  /**
   * How far it has to be carried, frozen when the egg was found, so a
   * later change to hatching cannot strand one halfway
   */
  hatchSteps: number;
  /**
   * When steps were last credited, on the server's clock. Written by
   * the server, never by the walker
   */
  steppedAt: number;
  /**
   * Health left. A battle leaves it where it left it and zero means
   * fainted; the maximum is derived (see [`health.ts`](./health.ts)),
   * so anything that moves the maximum moves this in proportion
   */
  health: number;
  /**
   * The non-volatile statuses it walked out of its last battle with,
   * as a mask of `StatusFlags`. Everything else a fight does —
   * confusion, flinching, a substitute — ends with the fight
   */
  statuses: number;
  /**
   * The lair a raid prize was fought in, so a record says where it
   * came from rather than only what kind of raid it was. Null for
   * anything met another way
   */
  lair: Lairs | null;
  /**
   * The ball the catch was made with
   */
  ball: Balls;
  /**
   * When it was caught, as a local ISO 8601 string in the catcher's
   * zone — `2026-08-10T22:14:03.123+08:00`. The offset keeps the
   * instant recoverable
   */
  caughtAt: string;
  /**
   * The catcher's locale tag, e.g. `en-PH`, so a date or number shown
   * beside the record reads the way its catcher would read it
   */
  locale: string;
  /**
   * Effort per stat; a fresh catch starts at zero. What may be put
   * here is capped by level and `effortBonus` — see
   * [`effort.ts`](./effort.ts) for the arithmetic both sides read
   */
  effortValues: Record<Stats, number>;
  /**
   * Effort granted by wings rather than levels. Kept apart because it
   * is what the pokemon **may** spend: taking training back off a stat
   * hands those points back
   */
  effortBonus: number;
  /**
   * How far it has walked as somebody's buddy since hatching, or since
   * being caught. It buys friendship rather than hatching, which is
   * why it is counted apart from `steps`
   */
  walked: number;
  /**
   * What it thinks of its owner, 0 to `MAX_FRIENDSHIP`: up with levels
   * and walks, down when it faints
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
    /**
     * What the place is called, where somebody named it: a
     * distribution says the town it was received in, since a gift
     * happened at no coordinate anybody walked to
     */
    place?: string;
  };
}

/**
 * What to call a catch: the name its owner gave it, or its species'
 * name. It says nothing about eggs — a caller showing one decides that
 * for itself, since the species is what an egg must not give away
 */
export function getCatchName(caught: { nickname: string; species: Species }): string {
  return caught.nickname === '' ? getSpeciesData(caught.species).name : caught.nickname;
}

/**
 * Whether the catch sparkles, as its original catcher saw it
 */
export function isShiny(caught: { shiny: boolean }): boolean {
  return caught.shiny;
}

/**
 * Whether somebody else would pay for it. Any one of four answers is
 * enough, and each is a reason a stranger cannot simply go and get
 * one: perfect values, values of nothing at all (as rare, and
 * impossible to manufacture), shiny, or a special-tier species.
 *
 * It takes the three fields rather than a record, so a caller can ask
 * about values it is **about to write**
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
 * Whether it carries a shadow: the Shadow ability for good, and double
 * candy at every level
 */
export function isShadow(caught: { shadow: boolean }): boolean {
  return caught.shadow;
}

/**
 * Whether it is a shadow put right. The Purified mark does nothing in
 * a fight, but it is worth drawing
 */
export function isPurified(caught: { abilities: Abilities[] }): boolean {
  return new Set(caught.abilities).has(Abilities.Purified);
}

/**
 * Which aura it stands in — a shadow's haze, a purified one's light —
 * or none, in which case it casts a plain shadow like anything else
 */
export function catchAura(caught: {
  shadow: boolean;
  abilities: Abilities[];
}): AuraKind | undefined {
  if (isShadow(caught)) {
    return 'shadow';
  }
  return isPurified(caught) ? 'purified' : undefined;
}

/**
 * Whether the player has marked it as one they are keeping. A favorite
 * cannot be released, auctioned or traded — a guard against a mis-click
 * on something irreversible, and nothing else
 */
export function isFavorite(caught: { favorite: boolean }): boolean {
  return caught.favorite;
}

/**
 * Whether the player has put it away. A guarded pokemon cannot be
 * levelled, trained, evolved, fielded, healed, purified, or handed
 * anything; it may still walk, gain friendship and stand as a parent.
 * Unlike the battle lock, this one comes off whenever they say so
 */
export function isGuarded(caught: { guarded: boolean }): boolean {
  return caught.guarded;
}

/**
 * How a pokemon came into one owner's hands.
 *
 * Not the same question as `EncounterType`, which says how it was
 * first met and never changes: a Mewtwo can be a raid prize its second
 * owner bought at auction, and the record keeps both
 */
export const enum Acquisition {
  /**
   * They caught it themselves
   */
  Caught = 0,
  /**
   * It came to them as an egg. The pokemon was never anybody else's
   */
  Egg = 1,
  /**
   * They won it at auction
   */
  Auction = 2,
  /**
   * They took it in a trade. Nothing writes this yet; the member ships
   * so old records match new ones the day trading exists
   */
  Trade = 3,
  /**
   * It was given to them — today, the pokemon the game hands somebody
   * who has none. Its own kind because nobody worked for it
   */
  Gift = 4,
  /**
   * They carried a fossil to somebody with the machinery. Like an egg
   * it began here, but what they handed over was a rock
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
   * What to call this owner when the uid names nobody the store knows:
   * the original trainer of a distributed pokemon, who is a name in a
   * story rather than an account. Absent for every hand a pokemon has
   * actually passed through, which is named by its profile
   */
  name?: string;
  /**
   * When this owner obtained it, as a local ISO 8601 string in their
   * own zone
   */
  acquiredAt: string;
  /**
   * How they came by it
   */
  kind: Acquisition;
  /**
   * What they paid for it in gold, where it changed hands for gold at
   * all — the winning bid, for a lot off the block. Null for a pokemon
   * somebody caught, hatched or was given, and for a sale recorded
   * before the figure was kept.
   *
   * It is part of the history rather than of the pokemon because it is
   * a fact about *that* handover: a Mewtwo may be won twice, and what
   * the second winner paid says nothing about what the first did
   */
  paid: number | null;
  /**
   * The ball it was in when this owner received it. The pokemon's own
   * `ball` is whatever it sits in today — a later owner can put it in
   * another — so the entry keeps the one it arrived in. Null for a
   * handover recorded before the ball was kept
   */
  ball: Balls | null;
}

/**
 * Restore an ownership history from an untyped row.
 * `origin` is what the first entry means for a record written before
 * the field existed — the caller knows whether it was caught or
 * hatched, and the history does not
 */
function asOwnershipHistory(
  value: unknown,
  origin: Acquisition,
  caughtIn: Balls | null,
): OwnershipRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry, at) => {
    const record = asRecord(entry);
    // An older entry says nothing about how it changed hands, but the
    // first is where the pokemon began and every later one can only be
    // a sale: the auction house is the one thing that ever appended
    const older = at === 0 ? origin : Acquisition.Auction;
    // And the same for the ball: where the pokemon began is answerable
    // from the record's own — nothing could have re-balled a catch
    // written before re-balling existed — while a later sale is not
    const wore = at === 0 ? caughtIn : null;

    return {
      owner: asString(record.owner),
      // Left off rather than stored empty: a name is only there for an
      // owner no profile can name
      ...(typeof record.name === 'string' && record.name !== ''
        ? { name: asString(record.name) }
        : {}),
      acquiredAt: asString(record.acquiredAt),
      kind: record.kind == null ? older : (asNumber(record.kind) as Acquisition),
      // A sale written before the price was kept says nothing about it,
      // which is not the same as having been won for nothing
      paid: typeof record.paid === 'number' ? asNumber(record.paid) : null,
      ball: typeof record.ball === 'number' ? (asNumber(record.ball) as Balls) : wore,
    };
  });
}

/**
 * The points spent on each move, restored. Anything that is not a
 * count is left out rather than read as zero, and a count is held to
 * `PP_UP_LIMIT`: a stored figure past it would make a move faster than
 * any amount of gold can buy
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
 * Restore a catch from an untyped row. The client's
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
    // No stored name is the same as never having been given one
    nickname: asString(data.nickname),
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
    // trading was a thing
    traded: asBoolean(data.traded),
    canEvolve: asBoolean(data.canEvolve),
    auctionable: asBoolean(data.auctionable),
    moves: asNumberArray(data.moves) as Moves[],
    movePoints: asMovePoints(data.movePoints),
    abilities,
    // Missing slots mean the room the game used to give everything,
    // which is what its own abilities say
    slots: data.slots == null ? defaultSlots(abilities) : asNumber(data.slots),
    items: asNumberArray(data.items) as Items[],
    // Something hatched began as an egg in its first owner's hands;
    // everything else was caught by them
    history: asOwnershipHistory(
      data.history,
      type === EncounterType.Hatched ? Acquisition.Egg : Acquisition.Caught,
      typeof data.ball === 'number' ? (asNumber(data.ball) as Balls) : null,
    ),
    lockedAt: asNumber(data.lockedAt),
    steps: asNumber(data.steps),
    hatchSteps: asNumber(data.hatchSteps),
    steppedAt: asNumber(data.steppedAt),
    // Missing health means whole. Reading it as zero would faint every
    // pokemon caught before fights could hurt anything
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
    // Missing friendship starts where a fresh catch starts rather than
    // at zero: those pokemon were caught and kept, not neglected
    friendship: data.friendship == null ? BASE_FRIENDSHIP : asNumber(data.friendship),
    origin: {
      timestamp: asNumber(origin.timestamp),
      x: asNumber(origin.x),
      y: asNumber(origin.y),
      biome: asNumber(origin.biome) as Biome,
      // Named only where somebody named it, so a record from the world
      // is not given an empty name to show
      ...(typeof origin.place === 'string' && origin.place !== ''
        ? { place: asString(origin.place) }
        : {}),
    },
  };
}
