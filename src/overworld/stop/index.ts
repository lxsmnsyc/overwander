import { SHADOW_FRIENDSHIP } from '../../data/constants/friendship';
import type { CatchSnapshot } from '../../auth/catch-snapshot';
import { getMaxHealth } from '../../auth/health';
import { Slots, defaultSlots, withSlots } from '../../data/constants/slots';
import { getExpertHeldItems } from '../../data/items/expert-loadout';
import {
  type BuildRole,
  coreCategory,
  coreRoleOf,
  isCoreRole,
} from '../../data/species/best-moves';
import {
  type BestBuild,
  assignBuildRoles,
  getBestBuild,
  getBestNature,
  getBestParty,
} from '../../data/species/best-build';
import type { Items } from '../../data/ids/items';
import type { Species } from '../../data/ids/species';
import { getSpeciesStones, getStoneMega } from '../../data/items/mega-stones';
import { STAT_ORDER, Stats } from '../../data/constants/stats';
import { MoveCategories } from '../../data/ids/moves';
import { getSpeciesData } from '../../data/species';
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
  composed?: BestBuild,
): CatchSnapshot {
  const fielded = deriveEncounter(snapshot, spawn, undefined, {
    type: EncounterType.Rocket,
    levels,
    shadow,
  });
  const size = deriveSize(fielded.species, fielded.traitValue);
  // The ranks that are meant to be hard field a built pokemon rather
  // than a rolled one: the abilities its species is best with in the
  // job the party gave it, the four moves those abilities are worth,
  // the nature those moves want, and gear that follows all of it
  const built =
    outfit.best === true
      ? (composed ??
        getBestBuild(
          fielded.species,
          coreRoleOf(fielded.species),
          outfit.abilities,
          undefined,
          undefined,
          [],
          outfit.signatures === true,
        ))
      : undefined;
  // A set, because a species with fewer abilities than the outfit
  // asks for carries fewer, and a shadow's own mark rides free of the
  // count either way
  const abilities = [
    ...new Set([
      ...(built?.abilities ??
        deriveTrainedAbilities(
          fielded.species,
          fielded.traitValue,
          fielded.ability,
          outfit.abilities,
        )),
      ...(shadow ? [Abilities.Shadow] : []),
    ]),
  ];
  const moves = built?.moves ?? fielded.moves;
  const items = getExpertHeldItems(fielded.species, outfit.items, {
    moves,
    abilities,
    role: built?.role,
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
    nature: built?.nature ?? fielded.nature,
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
  // A built party is composed rather than assembled one at a time:
  // the jobs are handed out, the sky is settled once for all six, and
  // each member is built knowing both and knowing what the ones
  // before it brought. A rolled party has none of that to do, and
  // fields what it caught
  let composed: BestBuild[] | undefined;

  if (outfit.best === true) {
    const species: Spawn[0][] = [];

    for (const [one] of spawns) {
      species.push(one);
    }
    composed = getBestParty(species, outfit.abilities, outfit.signatures === true);
  }

  const party: CatchSnapshot[] = [];

  for (const [at, spawn] of spawns.entries()) {
    party.push(createStopSnapshot(snapshot, spawn, shadow, levels, outfit, composed?.[at]));
  }
  if (outfit.megas === true) {
    handMegaStone(party, outfit, composed);
  }
  return party;
}

function statTotal(species: Species): number {
  let total = 0;

  for (const stat of STAT_ORDER) {
    total += getSpeciesData(species).stats[stat];
  }
  return total;
}

/**
 * Which of a species' stones suits the job it was given: a core takes
 * the Mega that hits from its own side of the split, and otherwise the
 * one with the bigger stat total
 */
function stoneFor(species: Species, role: BuildRole): Items | null {
  const leans = coreCategory(role);
  let best: Items | null = null;
  let bestWorth = Number.NEGATIVE_INFINITY;

  for (const stone of getSpeciesStones(species)) {
    const mega = getStoneMega(stone);

    if (mega == null) {
      continue;
    }

    const stats = getSpeciesData(mega).stats;
    const swings = stats[Stats.Attack] > stats[Stats.SpecialAttack];
    const fits = leans == null || (leans === MoveCategories.Physical) === swings ? 1_000 : 0;
    const worth = fits + statTotal(mega);

    if (worth > bestWorth) {
      best = stone;
      bestWorth = worth;
    }
  }
  return best;
}

/**
 * One member carries a Mega Stone, since a team Mega Evolves once.
 * The cores come first; among them, and among the rest where no core
 * has one, the pick is the one the battle would evolve: highest level,
 * then the bigger Mega. The stone takes the member's first item slot,
 * and a built member is re-natured for the Mega it fights as
 */
function handMegaStone(
  party: CatchSnapshot[],
  outfit: StopOutfit,
  composed: BestBuild[] | undefined,
): void {
  const species: Species[] = [];

  for (const member of party) {
    species.push(member.species);
  }

  const roles = composed == null ? assignBuildRoles(species) : [];

  for (const build of composed ?? []) {
    roles.push(build.role);
  }

  let chosen: { at: number; stone: Items; core: boolean; level: number; total: number } | null =
    null;

  for (const [at, member] of party.entries()) {
    const role = roles[at] ?? coreRoleOf(member.species);
    const stone = stoneFor(member.species, role);
    const mega = stone == null ? null : getStoneMega(stone);

    if (stone == null || mega == null) {
      continue;
    }

    const candidate = {
      at,
      stone,
      core: isCoreRole(role),
      level: member.level,
      total: statTotal(mega),
    };

    if (
      chosen == null ||
      (candidate.core && !chosen.core) ||
      (candidate.core === chosen.core &&
        (candidate.level > chosen.level ||
          (candidate.level === chosen.level && candidate.total > chosen.total)))
    ) {
      chosen = candidate;
    }
  }
  if (chosen == null) {
    return;
  }

  const member = party[chosen.at];
  const items = [chosen.stone, ...member.items].slice(0, Math.max(1, outfit.items));
  const mega = getStoneMega(chosen.stone);
  const built = composed?.[chosen.at];

  party[chosen.at] = {
    ...member,
    items,
    nature:
      built == null || mega == null ? member.nature : getBestNature(mega, built.role, member.moves),
    slots: withSlots(member.slots, Slots.Item, Math.max(1, items.length)),
  };
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
  BOSS_OUTFIT,
  CHAMPION_OUTFIT,
  ELITE_OUTFIT,
  EXECUTIVE_OUTFIT,
  FRONTIER_OUTFIT,
  GYM_OUTFIT,
  LEGEND_OUTFIT,
  PLAIN_OUTFIT,
  stopOutfit,
} from './outfits';
export type { StopOutfit } from './outfits';
export { counterParty, rentalOffer, rentedHand } from './rental';
