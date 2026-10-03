import type { Types } from '../../constants/types';
import type EggGroups from '../../ids/egg-groups';
import { Species, getBaseFormSpecies } from '../../ids/species';
import {
  getGrowthRoads,
  getRegisteredSpecies,
  getSpeciesData,
  isCosmeticForm,
  isWornForm,
} from '../../species';
import { SpawnRarity, getSpawnRarity } from '../../biome';
import { EVERY_LAIR, getLairResidents } from '../lair';
import canMeetSpecies from '../reach';
import { ELITE_MEMBER_POOLS, type EliteMember } from './elite';
import { GYM_LEADER_TYPES, type GymLeader } from './gym-leaders';

/**
 * Every expert fields a full 6, whatever their rank; the rank sets
 * the level instead
 */
export const EXPERT_PARTY_SIZE = 6;

/**
 * What counts as an expert's own.
 *
 * A type alone is too narrow for some of them: Kanto has one
 * fully-grown Ghost and one fully-grown Dragon, so Agatha and Lance
 * would each field six of the same pokemon. The wideners are the ones
 * the mainline's own teams are built from. **Kinship** the type table
 * misses, since Lance's Gyarados is a dragon by breeding and nothing
 * else; and the odd pokemon that is simply **theirs**, since Bruno's
 * Onix answers to no rule at all.
 *
 * Every route is still held to the rare band, so `also` cannot smuggle
 * a Magikarp or a Mewtwo onto a team
 */
export interface ExpertPool {
  /** The types that count as theirs; empty for an expert with none */
  types: Types[];
  /** Egg groups that count as theirs besides */
  eggGroups?: EggGroups[];
  /** Named species no rule reaches */
  also?: Species[];
}

/**
 * And what a gym leader fields: their own type and nothing more, read
 * off the table above rather than kept twice
 */
export function getGymLeaderPool(leader: GymLeader): ExpertPool {
  return { types: [GYM_LEADER_TYPES[leader]] };
}

/**
 * The species an expert may field out of a roster: the **rare** band
 * of it, which is the fully-evolved and single-line species, narrowed
 * to what their pool counts as theirs.
 *
 * The band is the whole of what separates them from a duelling
 * trainer: a leader fielding the same Bellsprout a player meets in the
 * grass is a leader nobody remembers beating. It leaves the babies and
 * the legendaries out with the half-grown, which is right for both.
 * A legendary belongs to its raid, and the egg to nothing at all.
 *
 * Which roster is the caller's: an elite fields their own region,
 * a gym leader every region there is
 */
const LAIR_SPECIES = (() => {
  const residents = new Set<Species>();

  for (const lair of EVERY_LAIR) {
    for (const species of getLairResidents(lair)) {
      residents.add(species);
    }
  }
  return residents;
})();

function inExpertPool(
  species: Species,
  types: Set<Types>,
  groups: Set<EggGroups>,
  named: Set<Species>,
): boolean {
  // A worn shape is nobody's to walk with; a rearrangement that is
  // kept, such as a Rotom in an appliance, is owned like anything else.
  // The prized band is a find, not an expert's partner
  if (
    species === Species.Egg ||
    LAIR_SPECIES.has(getBaseFormSpecies(species)) ||
    getSpawnRarity(species) === SpawnRarity.Prized ||
    isWornForm(species) ||
    isCosmeticForm(species)
  ) {
    return false;
  }
  // Nothing the world has nowhere to put: a line written but kept out
  // of every pool is not something a player could be walking either
  if (!canMeetSpecies(species)) {
    return false;
  }
  // Naming beats the band as well as the type rules. Bruno's Onix
  // and Agatha's Golbat are middle stages now that a Steelix and a
  // Crobat exist, and they are still the pokemon those two field
  if (named.has(species)) {
    return true;
  }
  // Grown as its line goes, with a rearrangement into another of its
  // own shapes left out: an appliance is a Rotom's address rather than
  // a stage it is waiting to leave
  if (getGrowthRoads(species).length > 0) {
    return false;
  }
  // An expert with no specialty takes the band whole
  if (types.size === 0) {
    return true;
  }

  const data = getSpeciesData(species);

  for (const type of data.types) {
    if (types.has(type)) {
      return true;
    }
  }
  for (const group of data.eggGroups) {
    if (groups.has(group)) {
      return true;
    }
  }
  return false;
}

function filterExpertPool(roster: Species[], pool: ExpertPool): Species[] {
  const types = new Set(pool.types);
  const groups = new Set(pool.eggGroups);
  const named = new Set(pool.also);
  const kept: Species[] = [];

  for (const species of roster) {
    if (inExpertPool(species, types, groups, named)) {
      kept.push(species);
    }
  }
  return kept;
}

/**
 * The five an expert rolls, which is their kind's band from every
 * region rather than the one they are standing in. A gym is a fight
 * about a type, so a steel gym should reach a Steelix wherever the
 * badge is handed out, and Karen's dark has nothing at all in Kanto
 */
export function getWorldExpertPool(pool: ExpertPool): Species[] {
  return filterExpertPool(getRegisteredSpecies(), pool);
}

export function getGymLeaderRoster(leader: GymLeader): Species[] {
  return getWorldExpertPool(getGymLeaderPool(leader));
}

export function getEliteMemberRoster(member: EliteMember): Species[] {
  return getWorldExpertPool(ELITE_MEMBER_POOLS[member]);
}
