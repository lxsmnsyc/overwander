import './gen-1';
import { registerGen1Moves } from './gen-1';

export type { MoveData } from './__create';
export { getMoveData, getRegisteredMoves } from './__create';

export function registerMoves() {
  registerGen1Moves();
}
