import type { Moves } from '../ids/moves';
import { PSEUDO_MOVES } from '../battle';

/** The moves that are not a pokemon's own, from `src/data/battle/pseudo.yaml` */
export { PSEUDO_MOVES };

export function isPseudoMove(move: Moves): boolean {
  return PSEUDO_MOVES.has(move);
}
