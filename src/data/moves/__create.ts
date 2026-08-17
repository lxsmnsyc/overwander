import type { CastAnimation } from '../constants/cast';
import type { Types } from '../constants/types';
import type { MoveCategories, Moves } from '../ids/moves';

export interface MoveData {
  name: string;

  /**
   * What it does beyond its power and its PP, in a line, said the way
   * this engine resolves it rather than the way the mainline reads —
   * priority is a shorter wind-up here, not a turn taken first.
   *
   * Required, so a move cannot be added without somebody saying what
   * it is for, and short enough to sit under the name in a list
   */
  description: string;

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
   * How long the move spends between firing and landing, in
   * milliseconds — a projectile's flight time.
   *
   * It is a **mechanical** wait, not a decoration: the effect resolves
   * when it expires, so anything happening in between happens first.
   * A move that names none still waits `MOVE_DELAY`; what the field
   * reads is only whether to draw something travelling
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

/**
 * What one point spent on a move is worth: a fifth of the move's own
 * PP, and three points at most. It is the mainline's arithmetic for a
 * PP Up, and it lives here rather than with the item because it is a
 * property of the move — the item is only how a point is bought
 */
export const PP_UP_STEP = 0.2;

export const PP_UP_LIMIT = 3;

/**
 * What a move's PP comes to for one pokemon, with whatever has been
 * spent on it.
 *
 * PP here is not a pool that drains: the fights run in real time, and
 * a move's PP is how often it comes back — `PP_COOLDOWN_BASIS / pp`
 * seconds between casts. So the points a PP Up buys are a **shorter
 * wait** rather than more uses, which is the same thing the mainline
 * item buys said in this game's terms.
 *
 * The arithmetic is the mainline's: a fifth of the move's own PP per
 * point, floored, and no more than `PP_UP_LIMIT` points on one move.
 * A move with nothing spent on it answers exactly what it is
 * registered with, so this is safe to call for every move everywhere
 */
export function getMovePP(move: Moves, points = 0): number {
  const base = getMoveData(move).pp;

  return base + Math.floor(base * PP_UP_STEP * Math.min(Math.max(0, points), PP_UP_LIMIT));
}
