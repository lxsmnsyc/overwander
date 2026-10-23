import { MoveFlags, type Moves } from '../ids/moves';
import { hasMoveFlag } from './__create';

/** Whether a move is thrown with a fist, which is what Iron Fist reads */
export function isPunchMove(move: Moves): boolean {
  return hasMoveFlag(move, MoveFlags.Punch);
}

/** Whether a move is thrown with a foot */
export function isKickMove(move: Moves): boolean {
  return hasMoveFlag(move, MoveFlags.Kick);
}

/** Whether a move is danced, which is what a Dancer copies */
export function isDanceMove(move: Moves): boolean {
  return hasMoveFlag(move, MoveFlags.Dance);
}
