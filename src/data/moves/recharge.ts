import type { Moves } from '../ids/moves';
import { RECHARGE_MOVES } from '../battle';

/**
 * The moves that leave the user standing still once they land, read
 * from `src/data/battle/recharge.yaml`. The battle lays the recharge
 * on and the expert builder prices the idle cast, so both read this
 */
export { RECHARGE_MOVES };

export function isRechargeMove(move: Moves): boolean {
  return RECHARGE_MOVES.has(move);
}
