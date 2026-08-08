import registerGen1Moves from './gen-1';

export { getMoveData, getRegisteredMoves } from './__create';
export type { MoveData } from './__create';

export function registerMoves(): void {
  registerGen1Moves();
}
