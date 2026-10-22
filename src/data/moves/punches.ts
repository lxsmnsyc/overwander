import { getMoveData } from './__create';
import { MoveFlags, type Moves } from '../ids/moves';

/** Whether a move is thrown with a fist, which is what Iron Fist reads */
export function isPunchMove(move: Moves): boolean {
  return (getMoveData(move).flags & MoveFlags.Punch) !== 0;
}
