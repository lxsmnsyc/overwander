import type { Spawn } from '../chunk-snapshot';

/**
 * The constants of a wild pokemon's life on the board. Times are local
 * milliseconds, the zone's own clock, as `ChunkSnapshot.timestamp` is
 */

/** Ordinary slots of a chunk, as many as the window held before */
export const SLOT_COUNT = 8;

/** Extra slots only a lure shows */
export const LURE_SLOTS = 3;

/** Index of the rare channel, outside the ordinary and lure slots */
export const RARE_SLOT = SLOT_COUNT + LURE_SLOTS;

/** Every slot of a chunk */
export const SLOT_TOTAL = SLOT_COUNT + LURE_SLOTS + 1;

/** Cycle length, present plus rest: 5.5 minutes */
export const SLOT_PERIOD = 330_000;

/** Shortest and longest time a pokemon stays: 3.5 to 4.5 minutes */
export const PRESENT_MIN = 210_000;
export const PRESENT_MAX = 270_000;

/** The shortest cycle worth showing */
export const MIN_STAY = 30_000;

/** A cycle never crosses a local hour */
export const HOUR = 3_600_000;

/** The server's allowance at the edges of a cycle, and for position */
export const MEET_DRIFT_MS = 1_000;
export const MEET_DRIFT_CELLS = 1;

/** The rare channel rolls the fixed bands at this multiple of their odds */
export const RARE_ODDS_SCALE = 8;

export type SlotKind = 'country' | 'street' | 'lure' | 'rare';

export interface SlotCycle {
  slot: number;
  cycle: number;
  /** Local ms */
  start: number;
  /** Local ms, already cut at the hour */
  end: number;
}

export interface LiveSpawn {
  /** The spawn id */
  id: string;
  slot: number;
  kind: SlotKind;
  cycle: SlotCycle;
  /** The start cell, chunk-local 0..255 */
  home: number;
  spawn: Spawn;
}
