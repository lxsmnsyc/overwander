import AleaRNG from '../core/alea';
import { SpawnRarity, getSpawnRarity } from '../data/biome';
import type Lairs from '../data/overworld/lair';
import type Weather from '../data/overworld/weather';
import {
  WEATHER_MIN_IV,
  hiddenAbilityBoostOf,
  isWeatherFavored,
  shinyBoostOf,
  teachesEggMove,
} from '../data/overworld/weather';
import { MAX_IV, Stats, packIVs } from '../data/constants/stats';
import type Abilities from '../data/ids/abilities';
import type Biome from '../data/ids/biome';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import type { Items } from '../data/ids/items';
import { Genders } from '../data/ids/species';
import type { Species } from '../data/ids/species';
import {
  SPECIES_DAY_HIDDEN_ABILITY_BOOST,
  SPECIES_DAY_SHINY_BOOST,
  getEggMoves,
  getSpeciesAbilityPools,
  getSpeciesData,
  isFeaturedSpecies,
} from '../data/species';
import { getSpeciesHeldItems, pickHeldItem } from '../data/species/held-items';
import type ChunkSnapshot from './chunk-snapshot';
import type { Spawn } from './chunk-snapshot';

/**
 * How a pokemon came to be encountered
 */
export const enum EncounterType {
  /**
   * Met in the overworld through a chunk snapshot's spawns
   */
  Wild = 0,
  /**
   * Hatched from an egg
   */
  Hatched = 1,
  /**
   * Fought and caught in a legendary raid lobby
   */
  LegendaryRaid = 2,
  /**
   * Distributed by an event or mystery gift
   */
  Fateful = 3,
  /**
   * Taken off a beaten Team Rocket grunt: fought alone, a commoner at
   * a fixed low level, and shadowed. Not a raid, and a record calling
   * it one would say the wrong thing about where it came from
   */
  Rocket = 4,
  /**
   * Fought and caught in a shadow raid lobby. Its own kind because the
   * prize differs: usually one of the biome's rare species, handed
   * over lower, and it keeps the Shadow ability for good
   */
  ShadowRaid = 5,
  /**
   * Fought and caught in a mythical raid — the one a raid item called
   */
  MythicalRaid = 6,
  /**
   * Brought back out of a fossil — the only pokemon nobody met. A
   * record calling it wild would name a chunk the species has not
   * lived in for a very long time
   */
  Revived = 7,
}

/**
 * Whether the meeting was a raid of any kind. What a raid gives — the
 * species-day IV floor, a prize that never bolts — belongs to all of
 * them, so records tell them apart without listing each one everywhere
 */
export function isRaidEncounter(type: EncounterType): boolean {
  return (
    type === EncounterType.LegendaryRaid ||
    type === EncounterType.ShadowRaid ||
    type === EncounterType.MythicalRaid
  );
}

/**
 * Whether the meeting happened nowhere. A gift, an event pokemon and a
 * mythical called out of a relic were none of them standing anywhere,
 * so none has a place to name — to a player they are one thing
 */
export function isFatefulEncounter(type: EncounterType): boolean {
  return type === EncounterType.Fateful || type === EncounterType.MythicalRaid;
}

/**
 * What each kind is called where a record is shown
 */
export const ENCOUNTER_TYPE_NAMES: Record<EncounterType, string> = {
  [EncounterType.Wild]: 'Wild',
  [EncounterType.Hatched]: 'Hatched',
  [EncounterType.LegendaryRaid]: 'Legendary Raid',
  [EncounterType.Fateful]: 'Fateful encounter',
  [EncounterType.Rocket]: 'Team Rocket',
  [EncounterType.ShadowRaid]: 'Shadow Raid',
  [EncounterType.MythicalRaid]: 'Mythical Raid',
  [EncounterType.Revived]: 'Revived from a fossil',
};

/**
 * A concrete wild pokemon derived from a spawn roll: everything a
 * battle or capture needs to materialize the unit
 */
export interface Encounter {
  /**
   * How the pokemon was encountered
   */
  type: EncounterType;
  species: Species;
  level: number;
  /**
   * The 32-bit roll the IVs are sliced from
   */
  individualValue: number;
  /**
   * The 32-bit roll whose byte slices drive level, gender, ability
   * and nature
   */
  traitValue: number;
  /**
   * The six per-stat values (0-31) sliced from the individual value,
   * packed five bits each into one integer. `individualValue` is the
   * roll they came from and stays beside them: the two agree for a
   * wild pokemon and disagree for a bred or polished one
   */
  ivs: number;
  nature: Natures;
  /**
   * One of the line's possible abilities, pre-evolutions included
   */
  ability: Abilities;
  /**
   * A pure gender-ratio roll from its dedicated spawn value
   */
  gender: Genders;
  /**
   * The lair it was fought in, for a raid prize; null for everything
   * met anywhere else, and for a shadow raid that stood in no
   * particular place
   */
  lair: Lairs | null;
  /**
   * Whether it sparkles for the observing user. The same wild pokemon
   * can be shiny for one trainer and plain for another, since the
   * roll is a resonance between their id and its trait value
   */
  shiny: boolean;
  /**
   * Whether it is shadowed, which carries the Shadow ability for good
   */
  shadow: boolean;
  /**
   * The last (up to) four level-up moves learnable at this level
   */
  moves: Moves[];
  /**
   * What it is carrying, which is nothing for most of them. A wild
   * pokemon holds at most one thing, so this is empty or a single
   * item
   */
  items: Items[];
  /**
   * The snapshot window the spawn belongs to
   */
  timestamp: number;
  /**
   * The chunk the spawn appeared in
   */
  x: number;
  y: number;
  biome: Biome;
}

/**
 * The 25 natures of NATURE_EFFECTS' enum
 */
const NATURE_COUNT = 25;

const IV_BITS = 5;
const IV_MASK = 0b11111;

/**
 * Each trait reads one 8-bit slice (0-255) of the trait value
 */
const TRAIT_BITS = 8;
const TRAIT_MASK = 0xff;
const TRAIT_RANGE = 256;

/**
 * What level a wild pokemon may be, by how rare it is. Rarity already
 * says roughly where a species belongs in a game, so it sets the band
 * too — otherwise a level 90 Rattata turns up in the first field.
 *
 * Specials get the whole range on purpose: there is one of each in the
 * world, and one that could only be met at a known strength is a
 * legendary with a known answer
 */
export const SPAWN_LEVELS: Record<SpawnRarity, [minimum: number, maximum: number]> = {
  [SpawnRarity.Base]: [5, 15],
  [SpawnRarity.Uncommon]: [15, 30],
  [SpawnRarity.Rare]: [30, 45],
  // The babies and the unowns are met the way a base spawn is: they
  // are rare to *find*, not far along
  [SpawnRarity.Prized]: [5, 15],
  [SpawnRarity.Special]: [1, 100],
};

/**
 * The held-item roll reads sixteen bits rather than eight: a slot
 * worth one percent cannot be told apart from nothing at 256 steps
 */
const HELD_ITEM_MASK = 0xffff;
const HELD_ITEM_RANGE = 0x10000;

/**
 * Share of the ability slice that lands a hidden ability (1/8)
 */
const HIDDEN_ABILITY_BAND = TRAIT_RANGE / 8;

/**
 * How many moves one pokemon carries. Anything that assembles a move
 * list — a level-up derivation, a hatchling's inheritance — cuts to
 * this
 */
export const MOVE_LIMIT = 4;

/**
 * A raid cleared on the featured family's own day hands over a
 * pokemon with no hopeless stat: every individual value starts here
 */
export const RAID_FAMILY_DAY_MIN_IV = 10;

/**
 * XOR results under this sparkle: 16 in 65536, i.e. the modern
 * 1/4096 shiny odds
 */
const SHINY_THRESHOLD = 16;

const HALF_BITS = 16;
const HALF_MASK = 0xffff;

/**
 * What a development run sparkles on instead: half of 65536, so about
 * one spawn in two. Shiny coats and their sparkle cannot be worked on
 * at 1 in 4096. `import.meta.env.DEV` is false in anything Vite
 * builds, so a production bundle keeps the real threshold
 */
const DEV_SHINY_THRESHOLD = (HALF_MASK + 1) / 2;

/**
 * Whether this run is a developer looking at the game rather than the
 * game itself. Read once at load, so the odds cannot change under a
 * session and the client agrees with the server about what sparkles.
 *
 * Production builds, unit tests and browser tests all keep the real
 * odds: the first is the game, and the other two check behaviour a
 * moving threshold would quietly change
 */
const SHOWING_OFF = ((): boolean => {
  // Read through a guard: the browser tests import this module into
  // Playwright's own Node runner, which transforms nothing, so
  // `import.meta.env` is missing there — and missing means real odds
  const env = (import.meta as { env?: Record<string, unknown> }).env ?? {};

  return env.DEV === true && env.MODE !== 'test' && env.VITE_REAL_SHINY_ODDS !== 'true';
})();

/**
 * The mainline shiny formula, adapted: the user id hashes to a stable
 * 32-bit trainer value whose halves XOR against the trait value's, so
 * each trainer sees their own shinies. It reads the trait value, which
 * keeps the sparkle independent of the IVs a pokemon rolled
 */
export function isShinyFor(userId: string, traitValue: number, boost = 1): boolean {
  const trainerValue = new AleaRNG(userId).int32();
  const shininess =
    (trainerValue >>> HALF_BITS) ^
    (trainerValue & HALF_MASK) ^
    (traitValue >>> HALF_BITS) ^
    (traitValue & HALF_MASK);

  // A boost widens the band: 8x takes the odds from 1/4096 to 1/512.
  // A dev run opens it to half of everything before any boost
  return shininess < (SHOWING_OFF ? DEV_SHINY_THRESHOLD : SHINY_THRESHOLD * boost);
}

/**
 * The ability a trait value picks for the species: the slice's band
 * chooses between the hidden and regular pools, its position within
 * the band chooses the entry.
 *
 * `boost` widens the hidden band without moving anything else — the
 * species day is what passes one
 */
export function deriveAbility(species: Species, traitValue: number, boost = 1): Abilities {
  const abilitySlice = (traitValue >>> (TRAIT_BITS * 2)) & TRAIT_MASK;
  const pools = getSpeciesAbilityPools(species);
  const band = Math.min(TRAIT_RANGE, HIDDEN_ABILITY_BAND * boost);

  if (pools.hidden.length > 0 && abilitySlice < band) {
    const fraction = abilitySlice / band;

    return pools.hidden[Math.floor(fraction * pools.hidden.length)];
  }

  const start = pools.hidden.length > 0 ? band : 0;
  const fraction = (abilitySlice - start) / (TRAIT_RANGE - start);

  return pools.regular[Math.floor(fraction * pools.regular.length)];
}

/**
 * The gender a trait value picks for the species: a pure ratio roll
 * from its own slice, independent of any stat. A species with no
 * ratio is genderless
 */
export function deriveGender(species: Species, traitValue: number): Genders {
  const { genderRatio } = getSpeciesData(species);

  if (genderRatio == null) {
    return Genders.Genderless;
  }

  const genderSlice = (traitValue >>> TRAIT_BITS) & TRAIT_MASK;
  const [male, female] = genderRatio;
  const femaleShare = female / (male + female);

  return genderSlice < femaleShare * TRAIT_RANGE ? Genders.Female : Genders.Male;
}

/**
 * The nature a trait value picks, from its own slice
 */
export function deriveNature(traitValue: number): Natures {
  const natureSlice = (traitValue >>> (TRAIT_BITS * 3)) & TRAIT_MASK;

  // tsc requires the assertion to treat the scaled slice as a
  // Natures; tsgolint resolves the const enum to number and disagrees
  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  return Math.floor((natureSlice / TRAIT_RANGE) * NATURE_COUNT) as Natures;
}

/**
 * What a wild pokemon of the species is carrying.
 *
 * The trait value is mixed before it is read, the way the size roll
 * mixes it: every 8-bit slice of it is already spoken for, and a
 * one-in-a-hundred item needs finer odds than 256 steps anyway
 */
export function deriveHeldItems(species: Species, traitValue: number, boost = 1): Items[] {
  const held = getSpeciesHeldItems(species);

  if (held == null) {
    return [];
  }

  let mixed = traitValue >>> 0;

  mixed ^= mixed << 7;
  mixed >>>= 0;
  mixed ^= mixed >>> 9;
  mixed ^= mixed << 8;
  mixed >>>= 0;

  const item = pickHeldItem(held, (mixed & HELD_ITEM_MASK) / HELD_ITEM_RANGE, boost);

  return item == null ? [] : [item];
}

/**
 * How far an individual may fall short of, or overshoot, its species'
 * listed height. The band is deliberately narrow: a pokemon is still
 * recognizably its species, and weight follows the cube of it
 */
export const MIN_SIZE_SCALE = 0.85;
export const MAX_SIZE_SCALE = 1.15;

/**
 * The measurements of one individual
 */
export interface Size {
  /**
   * Meters, to the centimeter
   */
  height: number;
  /**
   * Kilograms, to the hectogram
   */
  weight: number;
}

/**
 * The scale one individual is built at, between MIN_SIZE_SCALE and
 * MAX_SIZE_SCALE. The four trait slices are already spoken for, so the
 * value is mixed (xorshift) and read as two bytes averaged together:
 * a triangular distribution, so extremes are rare enough to show off
 */
export function deriveSizeScale(traitValue: number): number {
  let mixed = traitValue >>> 0;

  mixed ^= mixed << 13;
  mixed >>>= 0;
  mixed ^= mixed >>> 17;
  mixed ^= mixed << 5;
  mixed >>>= 0;

  const rolls = ((mixed & TRAIT_MASK) + ((mixed >>> TRAIT_BITS) & TRAIT_MASK)) / 2;

  return MIN_SIZE_SCALE + (rolls / TRAIT_MASK) * (MAX_SIZE_SCALE - MIN_SIZE_SCALE);
}

/**
 * The measurements a trait value gives an individual. Height scales
 * directly and weight with its cube, the way volume does; neither can
 * round to nothing. Derived rather than stored, so evolving grows the
 * pokemon while its proportions stay its own
 */
export function deriveSize(species: Species, traitValue: number): Size {
  const data = getSpeciesData(species);
  const scale = deriveSizeScale(traitValue);

  return {
    height: Math.max(0.01, Math.round(data.height * scale * 100) / 100),
    weight: Math.max(0.1, Math.round(data.weight * scale ** 3 * 10) / 10),
  };
}

/**
 * The last four level-up moves the species knows at that level
 */
export function deriveMoves(species: Species, level: number, banned?: Set<Moves>): Moves[] {
  const data = getSpeciesData(species);
  const learned = Object.keys(data.learnSet.level)
    .map(Number)
    .filter((threshold) => threshold <= level)
    .sort((a, b) => a - b)
    .flatMap((threshold) => data.learnSet.level[threshold])
    // Dropped before the four are taken rather than after, so a
    // pokemon barred from one move still comes with four
    .filter((move) => banned?.has(move) !== true);

  /**
   * The same move twice is one move. A learn set lists a move at every
   * level it is offered at — Kadabra is handed Confusion at 1 and
   * again at 16 — and taken as a run that is four slots holding two
   * moves. The **last** of each is kept, so the four are still the
   * four most recently learned
   */
  const unique: Moves[] = [];
  const seen = new Set<Moves>();

  for (let at = learned.length - 1; at >= 0; at--) {
    const move = learned[at];

    if (!seen.has(move)) {
      seen.add(move);
      unique.unshift(move);
    }
  }

  return unique.slice(-MOVE_LIMIT);
}

/**
 * The moves a hatchling knows: what its species has learned by its
 * hatch level, plus one off its line's egg list. The inherited move
 * goes first so it survives the four-move limit — it is the reason to
 * walk an egg at all
 */
export function deriveEggMoves(species: Species, level: number, random: () => number): Moves[] {
  const learned = deriveMoves(species, level);
  const inheritable = getEggMoves(species);

  if (inheritable.length === 0) {
    return learned;
  }

  const inherited = inheritable[Math.floor(random() * inheritable.length)];

  return [inherited, ...learned.filter((move) => move !== inherited)].slice(0, MOVE_LIMIT);
}

/**
 * The stream a fogbow's inherited move is picked from. Its own seed
 * rather than a slice of the trait value, so it takes nothing away
 * from the slices the level, gender, ability and nature already read
 */
function eggMoveRoll(traitValue: number): () => number {
  const rng = new AleaRNG(`${traitValue}:eggmove`);

  return () => rng.random();
}

/**
 * What the meeting was, beyond the spawn tuple itself
 */
export interface EncounterOptions {
  /**
   * How the pokemon is being met; a snapshot spawn is a wild meeting
   */
  type?: EncounterType;
  /**
   * A fixed level, overriding the one the trait value would roll.
   * Raid rewards come this way, so the prize is the same for every
   * player who cleared the same kind of raid
   */
  level?: number;
  /**
   * A level band to roll within, overriding the species' own. A
   * trainer's party comes this way: every pokemon rolls its own level
   * off its trait value, so a party has a spread rather than a rank.
   * `level` wins where both are given
   */
  levels?: [minimum: number, maximum: number];
  /**
   * Whether it comes out of a shadow raid, and so keeps the Shadow
   * ability for good
   */
  shadow?: boolean;
  /**
   * The sky the meeting happened under. A pokemon met under weather
   * comes with a floor under every one of its values, which is the
   * whole of what weather is worth: nothing about a fight changes.
   * Left out for the meetings weather has no say in, which is
   * everything that is handed over rather than met
   */
  weather?: Weather;
  /**
   * The lair the raid it came out of stands in
   */
  lair?: Lairs | null;
  /**
   * Where the meeting happened, overriding the chunk's own biome. A
   * mythical comes from `Beyond`: the chunk the relic was spent in is
   * where the player was standing, not where the pokemon came from
   */
  biome?: Biome;
  /**
   * An extra multiplier on the shiny odds, from whatever the player
   * brought along — the Shiny Charm, for one. It stacks with the
   * species day's own boost
   */
  shinyBoost?: number;
  /**
   * A multiplier on the odds it is carrying something, from a buddy
   * that finds what a pokemon has in its mouth
   */
  heldBoost?: number;
}

/**
 * The level a spawn rolls inside a band. It is the same arithmetic
 * the encounter does, exported so a lineup can be priced before the
 * fight is staged
 */
export function levelInBand(
  traitValue: number,
  [lowest, highest]: [minimum: number, maximum: number],
): number {
  return lowest + Math.floor(((traitValue & TRAIT_MASK) / TRAIT_RANGE) * (highest - lowest + 1));
}

export default function deriveEncounter(
  snapshot: ChunkSnapshot,
  spawn: Spawn,
  userId?: string,
  options: EncounterOptions = {},
): Encounter {
  const [species, individualValue, traitValue] = spawn;
  const type = options.type ?? EncounterType.Wild;
  const featured = isFeaturedSpecies(species, snapshot.timestamp);
  // A raid staged on the family's own day hands over a pokemon worth
  // keeping: no stat comes out of it hopeless
  // The weather's floor reaches only what the sky is about, so rain is
  // worth walking into for a Water type and worth nothing for a rat.
  // The two stack rather than the kinder one winning, and the total is
  // capped at a perfect value: a floor above the ceiling would hand
  // over something the game cannot roll
  const sky = options.weather;
  const minimumIV = Math.min(
    MAX_IV,
    (isRaidEncounter(type) && featured ? RAID_FAMILY_DAY_MIN_IV : 0) +
      (sky != null && isWeatherFavored(sky, getSpeciesData(species).types) ? WEATHER_MIN_IV : 0),
  );

  // Slices in trait order: level, gender, ability, nature — all but
  // the level are read by the derive helpers above
  const levelSlice = traitValue & TRAIT_MASK;

  const [lowest, highest] = options.levels ?? SPAWN_LEVELS[getSpawnRarity(species)];
  const level =
    options.level ?? lowest + Math.floor((levelSlice / TRAIT_RANGE) * (highest - lowest + 1));

  const sliceIV = (index: number): number =>
    Math.max(minimumIV, (individualValue >>> (IV_BITS * index)) & IV_MASK);

  const ivs = packIVs({
    [Stats.HP]: sliceIV(0),
    [Stats.Attack]: sliceIV(1),
    [Stats.Defense]: sliceIV(2),
    [Stats.SpecialAttack]: sliceIV(3),
    [Stats.SpecialDefense]: sliceIV(4),
    [Stats.Speed]: sliceIV(5),
  });

  // The ability slice serves twice: its band picks the pool, and its
  // position within the band picks the pool index. On the family's own
  // day the hidden band is the wider one
  const ability = deriveAbility(
    species,
    traitValue,
    (featured ? SPECIES_DAY_HIDDEN_ABILITY_BOOST : 1) *
      (sky == null ? 1 : hiddenAbilityBoostOf(sky)),
  );

  // Modern mechanics: gender is a pure ratio roll independent of any
  // stat, from its own dedicated slice
  const gender = deriveGender(species, traitValue);

  // The last four level-up moves learnable at this level
  // A fogbow hands over what a walk with an egg would have cost, so a
  // wild meeting under one already knows a move off its line's list.
  // Seeded by the trait value alone: what a pokemon knows is the
  // pokemon's, not the trainer's
  const moves =
    sky != null && teachesEggMove(sky) && type === EncounterType.Wild
      ? deriveEggMoves(species, level, eggMoveRoll(traitValue))
      : deriveMoves(species, level);
  const nature = deriveNature(traitValue);

  return {
    type,
    species,
    level,
    individualValue,
    traitValue,
    ivs,
    lair: options.lair ?? null,
    nature,
    ability,
    gender,
    // The day's featured family sparkles eight times as often, the
    // rarest sky doubles whatever is standing under it, and whatever
    // the player carries multiplies that further
    shiny:
      userId != null &&
      isShinyFor(
        userId,
        traitValue,
        (featured ? SPECIES_DAY_SHINY_BOOST : 1) *
          (sky == null ? 1 : shinyBoostOf(sky)) *
          (options.shinyBoost ?? 1),
      ),
    shadow: options.shadow === true,
    moves,
    // Wild meetings only: a raid prize and a hatchling arrive with
    // empty hands, and a Rocket's pokemon is carrying whatever its
    // trainer gave it rather than what its species picks up
    items:
      type === EncounterType.Wild ? deriveHeldItems(species, traitValue, options.heldBoost) : [],
    timestamp: snapshot.timestamp,
    x: snapshot.chunk.x,
    y: snapshot.chunk.y,
    biome: options.biome ?? snapshot.chunk.biome,
  };
}
