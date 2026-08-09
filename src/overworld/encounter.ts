import AleaRNG from '../core/alea';
import { Stats } from '../data/constants/stats';
import type Abilities from '../data/ids/abilities';
import type Biome from '../data/ids/biome';
import type { Moves } from '../data/ids/moves';
import type Natures from '../data/ids/natures';
import { Genders } from '../data/ids/species';
import type { Species } from '../data/ids/species';
import { getSpeciesAbilityPools, getSpeciesData } from '../data/species';
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
   * Fought and caught in a raid lobby
   */
  Raid = 2,
  /**
   * Distributed by an event or mystery gift
   */
  Fateful = 3,
}

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
 * XOR results under this sparkle: 16 in 65536, i.e. the modern
 * 1/4096 shiny odds
 */
const SHINY_THRESHOLD = 16;

const HALF_BITS = 16;
const HALF_MASK = 0xffff;

/**
 * The mainline shiny formula, adapted: the user id hashes into a
 * stable 32-bit "trainer value" whose 16-bit halves XOR against the
 * individual value's halves — shininess is a resonance between
 * trainer and pokemon, so each trainer sees their own shinies
 */
export function isShinyFor(userId: string, individualValue: number): boolean {
  const trainerValue = new AleaRNG(userId).int32();
  const shininess =
    (trainerValue >>> HALF_BITS) ^
    (trainerValue & HALF_MASK) ^
    (individualValue >>> HALF_BITS) ^
    (individualValue & HALF_MASK);

  return shininess < SHINY_THRESHOLD;
}

/**
 * Derive the concrete encounter behind a snapshot's spawn tuple. The
 * individual value maps to the six 5-bit IVs directly; the level,
 * gender, ability and nature each read their own 8-bit slice of the
 * trait value, so every derivation of the same tuple agrees.
 * Shininess is personal: it needs the observing user's id, and
 * anonymous derivations never sparkle
 */
export default function deriveEncounter(
  snapshot: ChunkSnapshot,
  spawn: Spawn,
  userId?: string,
): Encounter {
  const [species, individualValue, traitValue] = spawn;

  // Slices in trait order: level, gender, ability, nature
  const levelSlice = traitValue & TRAIT_MASK;
  const genderSlice = (traitValue >>> TRAIT_BITS) & TRAIT_MASK;
  const abilitySlice = (traitValue >>> (TRAIT_BITS * 2)) & TRAIT_MASK;
  const natureSlice = (traitValue >>> (TRAIT_BITS * 3)) & TRAIT_MASK;

  const level =
    MIN_SPAWN_LEVEL +
    Math.floor((levelSlice / TRAIT_RANGE) * (MAX_SPAWN_LEVEL - MIN_SPAWN_LEVEL + 1));

  const ivs: Record<Stats, number> = {
    [Stats.HP]: individualValue & IV_MASK,
    [Stats.Attack]: (individualValue >>> IV_BITS) & IV_MASK,
    [Stats.Defense]: (individualValue >>> (IV_BITS * 2)) & IV_MASK,
    [Stats.SpecialAttack]: (individualValue >>> (IV_BITS * 3)) & IV_MASK,
    [Stats.SpecialDefense]: (individualValue >>> (IV_BITS * 4)) & IV_MASK,
    [Stats.Speed]: (individualValue >>> (IV_BITS * 5)) & IV_MASK,
  };

  const data = getSpeciesData(species);
  const pools = getSpeciesAbilityPools(species);

  // The ability slice serves twice: its band picks the pool, and its
  // position within the band picks the pool index
  let ability: Abilities;
  if (pools.hidden.length > 0 && abilitySlice < HIDDEN_ABILITY_BAND) {
    const fraction = abilitySlice / HIDDEN_ABILITY_BAND;

    ability = pools.hidden[Math.floor(fraction * pools.hidden.length)];
  } else {
    const start = pools.hidden.length > 0 ? HIDDEN_ABILITY_BAND : 0;
    const fraction = (abilitySlice - start) / (TRAIT_RANGE - start);

    ability = pools.regular[Math.floor(fraction * pools.regular.length)];
  }

  // Modern mechanics: gender is a pure ratio roll independent of any
  // stat, from its own dedicated slice
  let gender = Genders.Genderless;
  if (data.genderRatio != null) {
    const [male, female] = data.genderRatio;
    const femaleShare = female / (male + female);

    gender = genderSlice < femaleShare * TRAIT_RANGE ? Genders.Female : Genders.Male;
  }

  // The last four level-up moves learnable at this level
  const learned = Object.keys(data.learnSet.level)
    .map(Number)
    .filter((threshold) => threshold <= level)
    .sort((a, b) => a - b)
    .flatMap((threshold) => data.learnSet.level[threshold]);
  const moves = learned.slice(-MOVE_LIMIT);

  // tsc requires the assertion to treat the scaled slice as a
  // Natures; tsgolint resolves the const enum to number and disagrees
  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  const nature = Math.floor((natureSlice / TRAIT_RANGE) * NATURE_COUNT) as Natures;

  return {
    // A snapshot spawn is always a wild meeting
    type: EncounterType.Wild,
    species,
    level,
    individualValue,
    traitValue,
    ivs,
    nature,
    ability,
    gender,
    shiny: userId != null && isShinyFor(userId, individualValue),
    moves,
    timestamp: snapshot.timestamp,
    x: snapshot.chunk.x,
    y: snapshot.chunk.y,
    biome: snapshot.chunk.biome,
  };
}
