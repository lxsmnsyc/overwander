import type Lairs from '../../data/overworld/lair';
import type Phenomenon from '../../data/overworld/phenomenon';
import type Weather from '../../data/overworld/weather';
import {
  WEATHER_MIN_IV,
  hiddenAbilityBoostOf,
  isWeatherFavored,
  shinyBoostOf,
  teachesEggMove,
} from '../../data/overworld/weather';
import { MAX_IV, Stats, packIVs } from '../../data/constants/stats';
import type Biome from '../../data/ids/biome';
import {
  SPECIES_DAY_HIDDEN_ABILITY_BOOST,
  SPECIES_DAY_SHINY_BOOST,
  getSpeciesData,
  isFeaturedSpecies,
} from '../../data/species';
import type ChunkSnapshot from '../chunk-snapshot';
import type { Spawn } from '../chunk-snapshot';
import { EncounterType, isRaidEncounter } from './kinds';
import { getSpawnLevels } from './levels';
import { deriveEggMoves, deriveMoves, eggMoveRoll } from './moves';
import type { Encounter } from './shape';
import { IV_BITS, IV_MASK, TRAIT_MASK, TRAIT_RANGE } from './bits';
import {
  RAID_FAMILY_DAY_MIN_IV,
  deriveAbility,
  deriveGender,
  deriveHeldItems,
  deriveNature,
  isShinyFor,
} from './traits';

/** Building one meeting out of a spawn */
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
   * What startled the meeting out, where something did. Only the
   * phenomena stage a meeting this way
   */
  phenomenon?: Phenomenon;
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
  /**
   * How many ordinary abilities it walks in with. One for everything
   * met in the world; a pokemon taken off somebody who trained two
   * into it keeps both
   */
  abilities?: number;
  /**
   * How many held items it has room for. One for everything met in
   * the world, and the room is what is handed over rather than
   * anything in it
   */
  itemSlots?: number;
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

  const [lowest, highest] = options.levels ?? getSpawnLevels(species);
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
    ...(options.phenomenon == null ? {} : { phenomenon: options.phenomenon }),
  };
}

export { ENCOUNTER_TYPE_NAMES, EncounterType, isFatefulEncounter, isRaidEncounter } from './kinds';
export type { Encounter } from './shape';
export {
  SINGLE_SPAWN_LEVELS,
  SPECIAL_SPAWN_LEVELS,
  PRIZED_SPAWN_LEVELS,
  getSpawnLevels,
  levelInBand,
} from './levels';
export {
  MAX_SIZE_SCALE,
  MIN_SIZE_SCALE,
  MOVE_LIMIT,
  RAID_FAMILY_DAY_MIN_IV,
  deriveAbility,
  deriveGender,
  deriveHeldItems,
  deriveNature,
  deriveSize,
  deriveSizeScale,
  deriveTrainedAbilities,
  isShinyFor,
} from './traits';
export type { Size } from './traits';
export { deriveEggMoves, deriveMoves } from './moves';
