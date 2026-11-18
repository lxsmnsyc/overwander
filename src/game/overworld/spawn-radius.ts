import {
  FADE_IN_MS,
  FADE_IN_NEAR_MS,
  FADE_OUT_MS,
  MEET_DRIFT_MS,
  NEAR_RING_CELLS,
  type SlotCycle,
} from '../../overworld/spawn-life';
import { BOARD_RADIUS } from './board-metrics';

/** How far from the player, in cells, a pokemon is drawn */
export const DRAW_RADIUS = BOARD_RADIUS;

/**
 * A pokemon first seen later than this after its cycle began was already
 * standing there when the player came to it, and is drawn at once
 */
export const STANDING_AFTER_MS = MEET_DRIFT_MS;

/** What the draw needs of a spawn to fade it */
export interface SpawnFade {
  cycle: SlotCycle;
  /** Cells from the player when it was first seen, which is when its cycle began unless its chunk was not loaded */
  distance: number;
  /** Already standing when first seen: no fade in */
  standing: boolean;
}

/** Whether a pokemon this far from the player is drawn */
export function isDrawn(distance: number): boolean {
  return distance <= DRAW_RADIUS;
}

/** Whether a spawn first seen at `seen` was already standing */
export function wasStanding(cycle: Pick<SlotCycle, 'start'>, seen: number): boolean {
  return seen - cycle.start > STANDING_AFTER_MS;
}

/**
 * How much of a pokemon is drawn at `now`, from 0 to 1.
 *
 * It fades in from the start of its cycle (slower when it starts beside
 * the player) and out over the end of it. One already standing when it
 * came into view is not faded in. `distance` is how far it was from the
 * player when it was first seen
 */
export function spawnAlpha(
  live: { cycle: Pick<SlotCycle, 'start' | 'end'> },
  now: number,
  distance: number,
  standing = false,
): number {
  const { start, end } = live.cycle;
  const length = distance <= NEAR_RING_CELLS ? FADE_IN_NEAR_MS : FADE_IN_MS;
  const rising = standing ? 1 : (now - start) / length;
  const falling = (end - now) / FADE_OUT_MS;

  return Math.max(0, Math.min(1, rising, falling));
}
