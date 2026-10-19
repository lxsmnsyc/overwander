import { RECOIL_MOVES } from '../battle';
import type { Moves } from '../ids/moves';

/** The moves that cost their user a share of what they deal (`src/data/battle/recoil.yaml`) */
export { RECOIL_MOVES };

export function isRecoilMove(move: Moves): boolean {
  return RECOIL_MOVES[move] != null;
}
