import registerGen1Moves from './gen-1';
import registerWeatherMoves from './weather';

export { PP_UP_LIMIT, PP_UP_STEP, getMoveData, getMovePP, getRegisteredMoves } from './__create';
export type { MoveData } from './__create';
export { MOVE_WEATHERS, getWeatherMove } from './weather';

export function registerMoves(): void {
  registerGen1Moves();
  registerWeatherMoves();
}
