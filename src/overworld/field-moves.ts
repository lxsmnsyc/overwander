import { Moves } from '../data/ids/moves';
import type { Species } from '../data/ids/species';
import { getLearnableMoves } from '../data/species';

/**
 * The moves a buddy can use out in the world. Each is open when the
 * buddy's species can learn it, whether or not it knows it right now.
 */

/** How the player is getting about */
export type Travel = 'walk' | 'surf' | 'fly';

/** The field moves, in the order their buttons stand */
export const FIELD_MOVES = [Moves.Surf, Moves.Fly, Moves.Dig, Moves.Teleport] as const;

export type FieldMove = (typeof FIELD_MOVES)[number];

/** Whether a species can use a field move: learnable at all, by any means */
export function canUseFieldMove(species: Species | null | undefined, move: FieldMove): boolean {
  return species != null && new Set(getLearnableMoves(species)).has(move);
}

/** What stands on one cell, as far as a step onto it cares */
export interface CellFacts {
  /** A landmark, which is walked up to rather than onto */
  fixture: boolean;
  /** A tree or anything else growing there */
  scenery: boolean;
  /** Rock, a cliff face or lava: whatever stops a walk on its own */
  solid: boolean;
  /** Open water, which a frozen lake is not */
  water: boolean;
  /** A volcano's lava, the one thing nothing flies over */
  lava: boolean;
}

/**
 * Whether a step from one cell onto another is allowed.
 *
 * Water is only closed to stepping in: a player already standing in it
 * (a reload that forgot they were surfing, say) can still swim out
 */
export function canEnter(travel: Travel, from: CellFacts, to: CellFacts): boolean {
  if (to.fixture) {
    return false;
  }
  if (travel === 'fly') {
    return !to.lava;
  }
  if (to.scenery || to.solid) {
    return false;
  }
  return !to.water || travel === 'surf' || from.water;
}

/** Whether a flight can come down here: somewhere a walk could stand */
export function canLand(at: CellFacts): boolean {
  return !at.fixture && !at.scenery && !at.solid && !at.water;
}
