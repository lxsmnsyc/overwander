import registerGen1Moves from './gen-1';
import registerGen2Moves from './gen-2';
import registerWeatherMoves from './weather';

export {
  PP_COOLDOWN_BASIS,
  PP_UP_LIMIT,
  PP_UP_STEP,
  getMoveCooldown,
  getMoveData,
  getMovePP,
  getRegisteredMoves,
} from './__create';
export type { MoveData } from './__create';
export { MOVE_WEATHERS, getWeatherMove } from './weather';

export function registerMoves(): void {
  registerGen1Moves();
  registerGen2Moves();
  registerWeatherMoves();
}
