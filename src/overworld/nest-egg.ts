import AleaRNG from '../core/alea';
import { MAX_LEVEL } from '../data/constants/levels';
import {
  FOGBOW_MOVE_CHANCE,
  FOGBOW_MOVE_SLOTS,
  FOGBOW_SECOND_MOVE_CHANCE,
  widensMoveSlots,
} from '../data/overworld/weather';
import { DEFAULT_MOVE_SLOTS, packSlots } from '../data/constants/slots';
import { MAX_IV, STAT_ORDER, setIV } from '../data/constants/stats';
import type EggGroups from '../data/ids/egg-groups';
import type { Moves } from '../data/ids/moves';
import type { Species } from '../data/ids/species';
import {
  getBaseSpecies,
  getEggMoves,
  getLevelUpMoves,
  getRegisteredSpecies,
  getSpeciesData,
} from '../data/species';
import type ChunkSnapshot from './chunk-snapshot';
import deriveEncounter, {
  type Encounter,
  EncounterType,
  MOVE_LIMIT,
  bonusMoveRoll,
  bonusMoveSlots,
  deriveMoves,
} from './encounter';

/**
 * What a nest's egg holds beyond a wild meeting of the same species.
 * All of it is decided at the claim from the nest, the window and the
 * player, so the egg cannot be re-rolled by asking again.
 */

/** How many of the six come out perfect, whichever ones the roll picks */
export const NEST_PERFECT_IVS = 2;

/** How much wider the hidden ability band is: one in five rather than one in eight */
export const NEST_HIDDEN_BOOST = 1.6;

/** How many moves come off the egg list */
export const NEST_EGG_MOVES = 2;

/** The share of its ordinary hatch steps a nest egg needs, since it was already laid */
export const NEST_HATCH_FACTOR = 0.5;

/** The room a nest egg hatches with: a second ability and a second held item */
export const NEST_ABILITY_SLOTS = 2;
export const NEST_ITEM_SLOTS = 2;

/** A nest egg's hatchling, and the room it hatches with */
export interface NestEgg extends Encounter {
  slots: number;
}

/** Which lines in each egg group learn each move by levelling, built once from the registry */
let teachers: Map<EggGroups, Map<Moves, Set<Species>>> | null = null;

function teachersIn(group: EggGroups): Map<Moves, Set<Species>> | undefined {
  if (teachers != null) {
    return teachers.get(group);
  }
  const built = new Map<EggGroups, Map<Moves, Set<Species>>>();

  for (const species of getRegisteredSpecies()) {
    const line = getBaseSpecies(species);
    const learned = getLevelUpMoves(species, MAX_LEVEL);

    for (const joined of getSpeciesData(species).eggGroups) {
      const known = built.get(joined) ?? new Map<Moves, Set<Species>>();

      built.set(joined, known);
      for (const move of learned) {
        known.set(move, (known.get(move) ?? new Set<Species>()).add(line));
      }
    }
  }
  teachers = built;
  return built.get(group);
}

/** Whether a line other than `line` in any of these groups learns the move by levelling */
function taughtByAnother(move: Moves, groups: EggGroups[], line: Species): boolean {
  for (const group of groups) {
    for (const teacher of teachersIn(group)?.get(move) ?? []) {
      if (teacher !== line) {
        return true;
      }
    }
  }
  return false;
}

/**
 * The species' egg moves that no other line sharing an egg group learns
 * by levelling. One pairing cannot pass these, so they are what a chain
 * of breeding is for
 */
export function getChainEggMoves(species: Species): Moves[] {
  const line = getBaseSpecies(species);
  const { eggGroups } = getSpeciesData(species);
  const chained: Moves[] = [];

  for (const move of getEggMoves(species)) {
    if (!taughtByAnother(move, eggGroups, line)) {
      chained.push(move);
    }
  }
  return chained;
}

/**
 * What a nest hatchling knows: two moves off its egg list, the first
 * from the chain-bred ones where the line has any, then what it has
 * learned by its hatch level. The inherited ones go first so they
 * survive the four-move limit
 */
export function deriveNestEggMoves(
  species: Species,
  level: number,
  random: () => number,
  bonus = 0,
): Moves[] {
  const inherited: Moves[] = [];
  const pick = (from: Moves[]): boolean => {
    const left: Moves[] = [];

    for (const move of from) {
      if (!inherited.includes(move)) {
        left.push(move);
      }
    }
    if (left.length === 0) {
      return false;
    }
    inherited.push(left[Math.floor(random() * left.length)]);
    return true;
  };
  const chained = getChainEggMoves(species);

  pick(chained.length > 0 ? chained : getEggMoves(species));
  while (inherited.length < NEST_EGG_MOVES && pick(getEggMoves(species))) {
    // Picked inside the condition
  }

  const moves = [...inherited];

  for (const move of deriveMoves(species, level)) {
    if (!moves.includes(move)) {
      moves.push(move);
    }
  }
  // A nest claimed under a fogbow hatches with room to spare, so the
  // inherited ones stop crowding out what it learned on its own
  return moves.slice(0, MOVE_LIMIT + bonus);
}

/**
 * The egg a nest hands this player. It is met under the sky of the
 * claim, as a wild meeting is, so rain is worth waiting for over a
 * Water egg
 */
export default function deriveNestEgg(
  snapshot: ChunkSnapshot,
  cell: number,
  species: Species,
  uid: string,
  level: number,
): NestEgg {
  // The first two draws are the individual value and the trait value
  const rng = new AleaRNG(`${snapshot.groundKey}${snapshot.nestTimestamp}nest${cell}egg:${uid}`);
  const hatchling = deriveEncounter(snapshot, [species, rng.int32(), rng.int32()], uid, {
    type: EncounterType.Hatched,
    level,
    weather: snapshot.weather,
    hiddenBoost: NEST_HIDDEN_BOOST,
    // A nest is claimed under the sky rather than hatched out of
    // nowhere, so the mirage's gifts reach it
    skyGifts: true,
  });
  const stats = [...STAT_ORDER];
  let ivs = hatchling.ivs;

  for (let perfect = 0; perfect < NEST_PERFECT_IVS; perfect += 1) {
    const [stat] = stats.splice(Math.floor(rng.random() * stats.length), 1);

    ivs = setIV(ivs, stat, MAX_IV);
  }
  // Its own stream, so the sky's gift does not move any of the draws
  // above it
  const wide = widensMoveSlots(snapshot.weather)
    ? bonusMoveSlots(
        bonusMoveRoll(hatchling.traitValue)(),
        FOGBOW_MOVE_CHANCE,
        FOGBOW_SECOND_MOVE_CHANCE,
        FOGBOW_MOVE_SLOTS,
      )
    : 0;

  return {
    ...hatchling,
    ivs,
    moves: deriveNestEggMoves(species, level, () => rng.random(), wide),
    // Room for what the sky handed it, where that is more than a nest
    // egg's own two abilities and four moves
    slots: packSlots(
      Math.max(NEST_ABILITY_SLOTS, hatchling.abilities?.length ?? 1),
      NEST_ITEM_SLOTS,
      DEFAULT_MOVE_SLOTS + wide,
    ),
  };
}
