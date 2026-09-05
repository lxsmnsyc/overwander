import registerGen1Moves from './gen-1';
import registerGen2Moves from './gen-2';
import registerGen3Moves from './gen-3';
import registerWeatherMoves from './weather';

export {
  MAX_SPEED_COOLDOWN_CUT,
  PP_COOLDOWN_BASIS,
  PP_UP_LIMIT,
  PP_UP_STEP,
  SPEED_COOLDOWN_CEILING,
  SPEED_COOLDOWN_HALVING,
  getMoveCooldown,
  getMoveData,
  getMovePP,
  getRegisteredMoves,
  getSpeedCooldownFactor,
} from './__create';
export type { MoveData } from './__create';
export { MOVE_WEATHERS, getWeatherMove } from './weather';

export function registerMoves(): void {
  registerGen1Moves();
  registerGen2Moves();
  registerGen3Moves();
  registerWeatherMoves();
}
