import { Moves } from '../ids/moves';

/**
 * The moves that are not a pokemon's own: a confused unit hitting
 * itself, the bare fallback swing and the last resort. Nothing that
 * reads "the move a pokemon chose" should count them
 */
export const PSEUDO_MOVES = new Set<Moves>([Moves._Confused, Moves.Struggle, Moves.Attack]);

export function isPseudoMove(move: Moves): boolean {
  return PSEUDO_MOVES.has(move);
}
