import { getMoveData } from './__create';
import { MoveFlags, type Moves } from '../ids/moves';

/** Whether a move is thrown with a foot */
export function isKickMove(move: Moves): boolean {
  return (getMoveData(move).flags & MoveFlags.Kick) !== 0;
}
