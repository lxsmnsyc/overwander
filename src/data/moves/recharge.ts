import { Moves } from '../ids/moves';

/**
 * The moves that leave the user standing still once they land.
 *
 * The table is data rather than mechanics because two sides read it:
 * [`src/battle/moves/recharge.ts`](../../battle/moves/recharge.ts)
 * lays the recharge on, and the expert builder prices the cast that is
 * spent doing nothing. Kept in one place so the two cannot disagree
 * about which moves recharge
 */
export const RECHARGE_MOVES = new Set<Moves>([
  Moves.HyperBeam,
  Moves.BlastBurn,
  Moves.HydroCannon,
  Moves.FrenzyPlant,
  Moves.GigaImpact,
  Moves.RockWrecker,
  Moves.RoarOfTime,
  Moves.PrismaticLaser,
]);

export function isRechargeMove(move: Moves): boolean {
  return RECHARGE_MOVES.has(move);
}
