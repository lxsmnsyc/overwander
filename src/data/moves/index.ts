import { registerMove } from './__create';
import { readMoves } from './yaml';

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
export { TUTOR_ONLY_MOVES, isTutorOnlyMove } from './tutor-only';
export { MOVE_WEATHERS, getWeatherMove } from './weather';

export function registerMoves(): void {
  // Written as YAML, a folder per part (see ./yaml.ts)
  const read = readMoves({
    battle: import.meta.glob('./battle/**/*.yaml', { eager: true, import: 'default' }),
    cast: import.meta.glob('./cast/**/*.yaml', { eager: true, import: 'default' }),
    text: import.meta.glob('../text/en/moves/**/*.yaml', { eager: true, import: 'default' }),
  });

  for (const [move, data] of read) {
    registerMove(move, data);
  }
}
