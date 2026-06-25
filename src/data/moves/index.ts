import './gen-1';
import { registerGen1Moves } from './gen-1';

export { getMoveData } from './__create';
export type { MoveData } from './__create';

export function registerMoves() {
  registerGen1Moves();
}
