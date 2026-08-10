import AleaRNG from '../core/alea';
import { Stats } from '../data/constants/stats';
import type Abilities from '../data/ids/abilities';
import type Biome from '../data/ids/biome';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import { Genders } from '../data/ids/species';
import type { Species } from '../data/ids/species';
import {
  SPECIES_DAY_SHINY_BOOST,
  getEggMoves,
  getSpeciesAbilityPools,
  getSpeciesData,
  isFeaturedSpecies,
} from '../data/species';
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
   * Taken off a beaten Team Rocket grunt. It is its own kind rather
   * than a raid: a grunt is fought alone, pays a commoner at a fixed
   * low level, and hands over a shadow, so a record that says "raid"
   * of one would be saying the wrong thing about where it came from
   */
  Rocket = 4,
  /**
   * Fought and caught in a shadow raid lobby. It is kept apart from a
   * legendary raid because the two are not the same prize: a shadow
   * raid usually stages one of the biome's rare species rather than a
   * legendary, hands it over lower, and its catch keeps the Shadow
   * ability for good
   */
  ShadowRaid = 5,
  /**
   * Fought and caught in a mythical raid — the one a raid item called
   */
  MythicalRaid = 6,
}

/**
 * Whether the meeting was a raid of either kind. What a raid gives —
 * the species-day IV floor, a prize that never bolts — belongs to
 * both, so the two kinds are told apart in records without having to
 * be listed separately everywhere they are alike
 */
export function isRaidEncounter(type: EncounterType): boolean {
  return (
    type === EncounterType.LegendaryRaid ||
    type === EncounterType.ShadowRaid ||
    type === EncounterType.MythicalRaid
  );
}

/**
 * What each kind is called where a record is shown
 */
export const ENCOUNTER_TYPE_NAMES: Record<EncounterType, string> = {
  [EncounterType.Wild]: 'Wild',
  [EncounterType.Hatched]: 'Hatched',
  [EncounterType.LegendaryRaid]: 'Legendary Raid',
  [EncounterType.Fateful]: 'Event',
  [EncounterType.Rocket]: 'Team Rocket',
  [EncounterType.ShadowRaid]: 'Shadow Raid',
  [EncounterType.MythicalRaid]: 'Mythical Raid',
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
   * Per-stat values (0-31), sliced from the individual value
   */
  ivs: Record<Stats, number>;
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
   * Whether this spawn sparkles for the observing user; the same
   * wild pokemon can be shiny for one trainer and plain for another
   */
  shiny: boolean;
  /**
   * Whether the pokemon is shadowed: a shadow raid's reward carries
   * the Shadow ability for good, alongside its own
   */
  shadow: boolean;
  /**
   * The last (up to) four level-up moves learnable at this level
   */
  moves: Moves[];
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

const MIN_SPAWN_LEVEL = 5;
const MAX_SPAWN_LEVEL = 100;

/**
 * Share of the ability slice that lands a hidden ability (1/8)
 */
const HIDDEN_ABILITY_BAND = TRAIT_RANGE / 8;

const MOVE_LIMIT = 4;

/**
 * A raid cleared on the featured family's own day hands over a
 * pokemon with no hopeless stat: every individual value starts here
 */
export const RAID_FAMILY_DAY_MIN_IV = 6;

/**
 * XOR results under this sparkle: 16 in 65536, i.e. the modern
 * 1/4096 shiny odds
 */
const SHINY_THRESHOLD = 16;

const HALF_BITS = 16;
const HALF_MASK = 0xffff;

/**
 * The mainline shiny formula, adapted: the user id hashes into a
 * stable 32-bit "trainer value" whose 16-bit halves XOR against the
 * trait value's halves — shininess is a resonance between trainer
 * and pokemon, so each trainer sees their own shinies. It reads the
 * trait value rather than the individual one, keeping the sparkle
 * independent of the IVs a pokemon rolled
 */
export function isShinyFor(userId: string, traitValue: number, boost = 1): boolean {
  const trainerValue = new AleaRNG(userId).int32();
  const shininess =
    (trainerValue >>> HALF_BITS) ^
    (trainerValue & HALF_MASK) ^
    (traitValue >>> HALF_BITS) ^
    (traitValue & HALF_MASK);

  // A boost widens the band that sparkles: at 8x the odds go from
  // 1/4096 to 1/512, which is the species day's shiny bonus
  return shininess < SHINY_THRESHOLD * boost;
}

/**
 * Derive the concrete encounter behind a snapshot's spawn tuple. The
 * individual value maps to the six 5-bit IVs directly; the level,
 * gender, ability and nature each read their own 8-bit slice of the
 * trait value, so every derivation of the same tuple agrees.
 * Shininess is personal: it needs the observing user's id, and
 * anonymous derivations never sparkle
 */
/**
 * The ability a trait value picks for the species: the slice's band
 * chooses between the hidden and regular pools, its position within
 * the band chooses the entry
 */
export function deriveAbility(species: Species, traitValue: number): Abilities {
  const abilitySlice = (traitValue >>> (TRAIT_BITS * 2)) & TRAIT_MASK;
  const pools = getSpeciesAbilityPools(species);

  if (pools.hidden.length > 0 && abilitySlice < HIDDEN_ABILITY_BAND) {
    const fraction = abilitySlice / HIDDEN_ABILITY_BAND;

    return pools.hidden[Math.floor(fraction * pools.hidden.length)];
  }

  const start = pools.hidden.length > 0 ? HIDDEN_ABILITY_BAND : 0;
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
 * MAX_SIZE_SCALE. The four trait slices are already spoken for —
 * level, gender, ability, nature — so the value is mixed first
 * (xorshift) and read as two bytes that are then averaged. Averaging
 * two rolls makes the distribution triangular: most of a species
 * comes out near its listed size and the extremes are rare, which is
 * what makes a giant worth showing off
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
 * The measurements a trait value gives an individual of the species.
 * Height scales directly; weight scales with the cube of it, the way
 * volume does — so a tenth taller is a third heavier. Both are
 * rounded the way a dex prints them, and neither can round to
 * nothing.
 *
 * It is derived rather than stored, so evolving grows the pokemon:
 * the trait value keeps the individual's proportions while the
 * species supplies the size those proportions apply to
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
export function deriveMoves(species: Species, level: number): Moves[] {
  const data = getSpeciesData(species);
  const learned = Object.keys(data.learnSet.level)
    .map(Number)
    .filter((threshold) => threshold <= level)
    .sort((a, b) => a - b)
    .flatMap((threshold) => data.learnSet.level[threshold]);

  return learned.slice(-MOVE_LIMIT);
}

/**
 * The moves a hatchling comes out knowing: what its species has
 * learned by the level it hatches at, and one move off its line's egg
 * list, which is what a nest guarantees.
 *
 * The inherited move goes first so it survives the four-move limit —
 * it is the reason to walk an egg at all — and a line with nothing to
 * inherit hatches knowing only its own
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
   * Whether it comes out of a shadow raid, and so keeps the Shadow
   * ability for good
   */
  shadow?: boolean;
  /**
   * An extra multiplier on the shiny odds, from whatever the player
   * brought along — the Shiny Charm, for one. It stacks with the
   * species day's own boost
   */
  shinyBoost?: number;
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
  const minimumIV = isRaidEncounter(type) && featured ? RAID_FAMILY_DAY_MIN_IV : 0;

  // Slices in trait order: level, gender, ability, nature — all but
  // the level are read by the derive helpers above
  const levelSlice = traitValue & TRAIT_MASK;

  const level =
    options.level ??
    MIN_SPAWN_LEVEL +
      Math.floor((levelSlice / TRAIT_RANGE) * (MAX_SPAWN_LEVEL - MIN_SPAWN_LEVEL + 1));

  const sliceIV = (index: number): number =>
    Math.max(minimumIV, (individualValue >>> (IV_BITS * index)) & IV_MASK);

  const ivs: Record<Stats, number> = {
    [Stats.HP]: sliceIV(0),
    [Stats.Attack]: sliceIV(1),
    [Stats.Defense]: sliceIV(2),
    [Stats.SpecialAttack]: sliceIV(3),
    [Stats.SpecialDefense]: sliceIV(4),
    [Stats.Speed]: sliceIV(5),
  };

  // The ability slice serves twice: its band picks the pool, and its
  // position within the band picks the pool index
  const ability = deriveAbility(species, traitValue);

  // Modern mechanics: gender is a pure ratio roll independent of any
  // stat, from its own dedicated slice
  const gender = deriveGender(species, traitValue);

  // The last four level-up moves learnable at this level
  const moves = deriveMoves(species, level);
  const nature = deriveNature(traitValue);

  return {
    type,
    species,
    level,
    individualValue,
    traitValue,
    ivs,
    nature,
    ability,
    gender,
    // The day's featured family sparkles eight times as often, and
    // whatever the player carries multiplies that further
    shiny:
      userId != null &&
      isShinyFor(
        userId,
        traitValue,
        (featured ? SPECIES_DAY_SHINY_BOOST : 1) * (options.shinyBoost ?? 1),
      ),
    shadow: options.shadow === true,
    moves,
    timestamp: snapshot.timestamp,
    x: snapshot.chunk.x,
    y: snapshot.chunk.y,
    biome: snapshot.chunk.biome,
  };
}
