import registerGen1Moves from './gen-1';

export { PP_UP_LIMIT, PP_UP_STEP, getMoveData, getMovePP, getRegisteredMoves } from './__create';
export type { MoveData } from './__create';

export function registerMoves(): void {
  registerGen1Moves();
}
