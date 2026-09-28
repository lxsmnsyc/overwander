import { Moves } from '../ids/moves';

/**
 * The moves thrown with a foot. The mainline has no flag for them, so
 * they are kept as data, the way the punches are
 */
export const KICK_MOVES = new Set<Moves>([
  Moves.BlazeKick,
  Moves.DoubleKick,
  Moves.HiJumpKick,
  Moves.JumpKick,
  Moves.LowKick,
  Moves.MegaKick,
  Moves.RollingKick,
  Moves.TripleKick,
  Moves.TropKick,
]);

export function isKickMove(move: Moves): boolean {
  return KICK_MOVES.has(move);
}
