import './hit';
import { registerGen1Moves } from './hit';

export { getMoveData } from './__create';
export type { MoveData } from './__create';

export function registerMoves() {
  registerGen1Moves();
}
