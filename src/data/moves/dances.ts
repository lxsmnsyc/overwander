import { getMoveData } from './__create';
import { MoveFlags, type Moves } from '../ids/moves';

/** Whether a move is danced, which is what a Dancer copies */
export function isDanceMove(move: Moves): boolean {
  return (getMoveData(move).flags & MoveFlags.Dance) !== 0;
}
