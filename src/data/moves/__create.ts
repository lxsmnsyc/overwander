import type { CastAnimation } from '../constants/cast';
import type { Types } from '../constants/types';
import type { MoveCategories, Moves } from '../ids/moves';

export interface MoveData {
  name: string;

  type: Types;

  category: MoveCategories;

  power?: number;

  // By 100, undefined means no accuracy check
  accuracy?: number;

  priority?: number;

  pp: number;

  target: number;

  flags: number;

  steps?: number;

  /**
   * Visual delay in milliseconds (e.g. a projectile's flight time
   * before the impact cue); purely presentational, the battle
   * mechanics never wait on it
   */
  delay?: number;

  /**
   * What the caster looks like it is doing, most wanted first.
   *
   * Sprite sheets do not all carry the same clips, so this is a
   * **preference** rather than a name: the battle plays the first one
   * the sprite in front of it actually has. See
   * [`cast.ts`](../constants/cast.ts). The last entry is always a
   * common clip, so the walk cannot run off the end
   */
  cast: CastAnimation[];
}

const MOVE_DATA = new Map<Moves, MoveData>();

export function registerMove(move: Moves, data: MoveData): void {
  MOVE_DATA.set(move, data);
}

export function getRegisteredMoves(): Moves[] {
  return [...MOVE_DATA.keys()];
}

export function getMoveData(move: Moves): MoveData {
  const result = MOVE_DATA.get(move);
  if (result) {
    return result;
  }
  throw new Error('Missing move data for ' + move);
}
