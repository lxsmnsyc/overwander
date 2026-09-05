import { Moves } from '../ids/moves';

/**
 * The moves that hurt their user for a share of what they dealt, and
 * how much of it.
 *
 * The table is data rather than mechanics because two sides read it:
 * [`src/battle/moves/recoil.ts`](../../battle/moves/recoil.ts) pays
 * the damage, and the expert builder prices a Reckless against what
 * the sheet actually carries. Kept in one place so the two cannot
 * disagree about which moves recoil
 */
export const RECOIL_MOVES: { [key in Moves]?: number } = {
  [Moves.TakeDown]: 1 / 4,
  [Moves.DoubleEdge]: 1 / 3,
  [Moves.Submission]: 1 / 4,
  [Moves.VoltTackle]: 1 / 3,
};

export function isRecoilMove(move: Moves): boolean {
  return RECOIL_MOVES[move] != null;
}
