import type { CastAnimation } from '../constants/cast';
import type { Types } from '../constants/types';
import { MoveAffects, type MoveCategories, MoveTargets, type Moves } from '../ids/moves';

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

  /**
   * How the move is cast: at one unit, at one team, or at nobody
   */
  target: MoveTargets;

  /**
   * Who the move reaches, as a `MoveAffects` mask. Filled in
   * from the way the move is cast when its entry leaves it out, so
   * anything reading a registered move always has a mask
   */
  affects: number;

  flags: number;

  steps?: number;

  /**
   * How long the move spends between firing and landing, in
   * milliseconds — a projectile's flight time.
   *
   * It is a **mechanical** wait, not a decoration: the effect resolves
   * when it expires, so anything happening in between happens first.
   * A move that names none still waits `MOVE_DELAY`, so a delay is
   * never what makes a move a projectile — naming one here is. The
   * field reads it that way: a move that named its own delay is drawn
   * with something crossing the gap, and everything else spends the
   * wait some other way
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

/**
 * A move as it is written down: everything `MoveData` holds, except
 * that the reach may be left to the way the move is cast
 */
export type RegisterMoveData = Omit<MoveData, 'affects'> & { affects?: number };

/**
 * What a move reaches when its entry says nothing: one enemy of
 * whatever shape it was cast at, and nothing at all for a move cast
 * at nobody, which is what a field effect and a move on the user
 * itself both want
 */
const DEFAULT_AFFECTS: { [key in MoveTargets]: number } = {
  [MoveTargets.None]: 0,
  [MoveTargets.Unit]: MoveAffects.Unit | MoveAffects.Enemy,
  [MoveTargets.Team]: MoveAffects.Team | MoveAffects.Enemy,
};

const MOVE_DATA = new Map<Moves, MoveData>();

/**
 * Flight time of a thrown or shot projectile before its impact cue
 */
export const PROJECTILE_DELAY = 500;

export function registerMove(move: Moves, data: RegisterMoveData): void {
  MOVE_DATA.set(move, { ...data, affects: data.affects ?? DEFAULT_AFFECTS[data.target] });
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

/**
 * How many casts a move's PP is worth over three minutes, which is
 * what turns PP into a wait
 */
export const PP_COOLDOWN_BASIS = 180;

/**
 * What Speed buys off a wait.
 *
 * Speed is the one mainline stat a real-time fight has no turn order
 * to spend, so it is spent here instead: a fast pokemon throws the
 * same move oftener rather than sooner, and the wind-up stays
 * priority's job.
 *
 * Every `SPEED_COOLDOWN_HALVING` points halves what is left of the
 * wait above the floor, so the curve approaches
 * `MAX_SPEED_COOLDOWN_CUT` without ever arriving and no point of
 * Speed is ever wasted. `SPEED_COOLDOWN_CEILING` is where it has
 * effectively landed: eight halvings, within half a point of the
 * floor, and past what anything in the game reaches without stacking
 * every multiplier it has
 */
export const SPEED_COOLDOWN_HALVING = 512;
export const SPEED_COOLDOWN_CEILING = 4096;
export const MAX_SPEED_COOLDOWN_CUT = 0.95;

/** What a wait is multiplied by at this Speed */
export function getSpeedCooldownFactor(speed: number): number {
  const floor = 1 - MAX_SPEED_COOLDOWN_CUT;

  return floor + (1 - floor) * 2 ** (-Math.max(0, speed) / SPEED_COOLDOWN_HALVING);
}

/**
 * How long a move takes to come back, in milliseconds, for a pokemon
 * that has spent `points` on it and moves at `speed`. Speed is
 * optional because a card over a move list has a move and no pokemon
 */
export function getMoveCooldown(move: Moves, points = 0, speed = 0): number {
  return (PP_COOLDOWN_BASIS / getMovePP(move, points)) * 1000 * getSpeedCooldownFactor(speed);
}
