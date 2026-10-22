import type { Moves } from '../ids/moves';
import { TUTOR_ONLY_MOVES } from '../battle';

/** The signature moves only the Move Tutor teaches, from `src/data/battle/tutor-only.yaml` */
export { TUTOR_ONLY_MOVES };

export function isTutorOnlyMove(move: Moves): boolean {
  return TUTOR_ONLY_MOVES.has(move);
}
