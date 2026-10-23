import { Types } from '../constants/types';
import { Moves } from '../ids/moves';
import {
  MAX_MOVE_ALLY_STAGES,
  MAX_MOVE_FOE_STAGES,
  MAX_MOVE_TERRAINS,
  MAX_MOVE_WEATHERS,
  MAX_POWER_OVERRIDES,
  TYPE_MAX_MOVES,
} from '../battle';
import { getMoveData } from './__create';

/**
 * The Max Moves: what a Dynamaxed pokemon throws in place of the move
 * it reached for. The battle side is in `src/battle/gimmicks/dynamax/max-moves.ts`
 * https://bulbapedia.bulbagarden.net/wiki/Max_Move
 *
 * Which Max Move each type becomes, and the sky, terrain or stage each
 * one brings, are `src/data/battle/max-moves.yaml`
 */
export {
  MAX_MOVE_ALLY_STAGES,
  MAX_MOVE_FOE_STAGES,
  MAX_MOVE_TERRAINS,
  MAX_MOVE_WEATHERS,
  TYPE_MAX_MOVES,
};

/** Every Max Move, Max Guard among them. None is learned, copied or called */
export const MAX_MOVES = new Set<Moves>([...TYPE_MAX_MOVES.values(), Moves.MaxGuard]);

export function isMaxMove(move: Moves): boolean {
  return MAX_MOVES.has(move);
}

/** Fighting and Poison read the lower table, since their Max Moves raise or drop a stat as well */
const LOWER_TABLE = new Set<Types>([Types.Fighting, Types.Poison]);

/**
 * What a Max Move hits with, read off the move it replaces: the
 * mainline's table by base power, and 100 for a move with no power of
 * its own
 */
export function maxPowerOf(base: Moves): number {
  const override = MAX_POWER_OVERRIDES[base];

  if (override != null) {
    return override;
  }

  const data = getMoveData(base);
  const power = data.power ?? 0;
  const lower = LOWER_TABLE.has(data.type);

  if (power <= 0) {
    return 100;
  }
  if (power >= 150) {
    return lower ? 100 : 150;
  }
  if (power >= 110) {
    return lower ? 95 : 140;
  }
  if (power >= 75) {
    return lower ? 90 : 130;
  }
  if (power >= 65) {
    return lower ? 85 : 120;
  }
  if (power >= 55) {
    return lower ? 80 : 110;
  }
  if (power >= 45) {
    return lower ? 75 : 100;
  }
  return lower ? 70 : 90;
}
