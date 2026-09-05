import { SHADOW_FRIENDSHIP } from '../../data/constants/friendship';
import type { CatchSnapshot } from '../../auth/catch-snapshot';
import { getMaxHealth } from '../../auth/health';
import { Slots, defaultSlots, withSlots } from '../../data/constants/slots';
import { getExpertHeldItems } from '../../data/items/expert-loadout';
import { getBestMoves } from '../../data/species/best-moves';
import Abilities from '../../data/ids/abilities';
import type ChunkSnapshot from '../chunk-snapshot';
import type { Spawn } from '../chunk-snapshot';
import deriveEncounter, { EncounterType, deriveSize, deriveTrainedAbilities } from '../encounter';
import { ROCKET_PARTY_LEVELS } from './levels';
import { PLAIN_OUTFIT, type StopOutfit } from './outfits';
import { trainStop } from './training';
import type { LevelBand } from './levels';

/**
 * A stop: somebody who bars a cell for the window and fights whoever
 * accepts.
 *
 * Six landmarks stage one, and the differences between them are all
 * numbers rather than machinery: a Team Rocket grunt, executive or
 * Giovanni, a duelling trainer, a gym leader, one of the Elite Four,
 * the Champion or a legend in that seat, and a Frontier Brain. What
 * changes with the landmark is the party's level band, the purse, the
 * loot and how the party was raised; what does not change is any of
 * the rest, which is why they share this file.
 *
 * It is a trainer battle rather than a raid: six a side, nobody
 * flagged as a boss, and the party is the player's own. The stop's
 * team is frozen into snapshots exactly as a player's is, and the
 * fight runs from the battle id like any other.
 */

/** Staging one stop's party, however it was fielded */
/**
 * One of the stop's pokemon as a catch snapshot, so the party is
 * fielded from the same shape a player's is.
 *
 * Team Rocket's are shadows, which is what a Team Rocket pokemon is;
 * everybody else's is its ordinary self. Either rolls its level
 * inside the band it was staged with rather than the one its species
 * would have taken, and its IVs, nature, gender, ability and moves
 * are the ones the spawn tuple gives, so no two stops field the same
 * six
 */
export function createStopSnapshot(
  snapshot: ChunkSnapshot,
  spawn: Spawn,
  shadow = true,
  levels: LevelBand = ROCKET_PARTY_LEVELS,
  outfit: StopOutfit = PLAIN_OUTFIT,
): CatchSnapshot {
  const fielded = deriveEncounter(snapshot, spawn, undefined, {
    type: EncounterType.Rocket,
    levels,
    shadow,
  });
  const size = deriveSize(fielded.species, fielded.traitValue);
  // A set, because a species with fewer abilities than the outfit
  // asks for carries fewer, and a shadow's own mark rides free of the
  // count either way
  const abilities = [
    ...new Set([
      ...deriveTrainedAbilities(
        fielded.species,
        fielded.traitValue,
        fielded.ability,
        outfit.abilities,
      ),
      ...(shadow ? [Abilities.Shadow] : []),
    ]),
  ];
  // The ranks that are meant to be hard field a built pokemon rather
  // than a rolled one: the four moves its species is best with, and
  // gear that follows those rather than its type line
  const moves = outfit.best === true ? getBestMoves(fielded.species, abilities) : fielded.moves;
  const items = getExpertHeldItems(fielded.species, outfit.items, {
    moves,
    abilities,
    best: outfit.best === true,
  });
  // Read off the roll rather than over it: the spawn tuple is what a
  // beaten stop hands over, and raising a party must not touch it
  const { ivs, effortValues } = trainStop(fielded.species, fielded.ivs, outfit.training);

  return {
    // A stop's pokemon stands for no catch record
    caught: '',
    species: fielded.species,
    level: fielded.level,
    ivs,
    effortValues,
    nature: fielded.nature,
    gender: fielded.gender,
    height: size.height,
    weight: size.weight,
    // A stop's pokemon never sparkles: the prize is what the fight
    // pays, not what it fields
    shiny: false,
    shadow,
    moves,
    // A stop buys no PP Ups: what it fields is what the roll gave it
    movePoints: {},
    abilities,
    items,
    // Room for exactly what it walked in with. `defaultSlots` already
    // widens the ability count for a second ability; the item count is
    // this outfit's own
    slots: withSlots(defaultSlots(abilities), Slots.Item, Math.max(1, items.length)),
    // A stop's pokemon has no record to have been hurt on: it is
    // made for this fight and arrives whole
    health: getMaxHealth({
      species: fielded.species,
      level: fielded.level,
      ivs,
      effortValues,
    }),
    // A shadow has been made to fight and nothing else
    friendship: SHADOW_FRIENDSHIP,
    statuses: 0,
  };
}

/**
 * The stop's whole party, weakest first: shadows for Team Rocket,
 * ordinary pokemon for everybody else. The band defaults to a grunt's,
 * for the callers that predate the league; theirs is the landmark's
 * to fix
 */
export function createStopParty(
  snapshot: ChunkSnapshot,
  spawns: Spawn[],
  shadow = true,
  levels: LevelBand = ROCKET_PARTY_LEVELS,
  outfit: StopOutfit = PLAIN_OUTFIT,
): CatchSnapshot[] {
  return spawns.map((spawn) => createStopSnapshot(snapshot, spawn, shadow, levels, outfit));
}

export {
  CHAMPION_PARTY_LEVELS,
  ELITE_PARTY_LEVELS,
  EXECUTIVE_PARTY_LEVELS,
  FRONTIER_PARTY_LEVELS,
  GIOVANNI_PARTY_LEVELS,
  GYM_PARTY_LEVELS,
  LEGEND_PARTY_LEVELS,
  ROCKET_PARTY_LEVELS,
  rocketPartyLevels,
  stopChallenger,
  stopPartyLevels,
} from './levels';
export type { GoldBand } from './gold';
export type { LevelBand } from './levels';
export {
  ACE_TRAINER_GOLD,
  CHAMPION_GOLD,
  ELITE_GOLD,
  EXECUTIVE_GOLD,
  FRONTIER_GOLD,
  GIOVANNI_GOLD,
  GYM_GOLD,
  LEGEND_GOLD,
  ROCKET_GRUNT_GOLD,
  TYPE_TRAINER_GOLD,
  rollStopGold,
  stopGoldBand,
} from './gold';
export {
  CHAMPION_LOOT_ODDS,
  ELITE_LOOT_ODDS,
  EXECUTIVE_LOOT_ODDS,
  LEGEND_LOOT_ODDS,
  ROCKET_REWARD_LEVEL,
  STOP_ALLIANCE,
  rollStopLoot,
} from './loot';
export {
  CHAMPION_TRAINING,
  ELITE_TRAINING,
  GYM_TRAINING,
  LEGEND_TRAINING,
  PLAIN_TRAINING,
  polishedStats,
  trainStop,
} from './training';
export type { StopTraining } from './training';
export {
  ACE_OUTFIT,
  CHAMPION_OUTFIT,
  ELITE_OUTFIT,
  FRONTIER_OUTFIT,
  GYM_OUTFIT,
  LEGEND_OUTFIT,
  PLAIN_OUTFIT,
  stopOutfit,
} from './outfits';
export type { StopOutfit } from './outfits';
export { counterParty, rentalOffer, rentedHand } from './rental';
