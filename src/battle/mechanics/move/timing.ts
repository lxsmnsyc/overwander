/**
 * How long a cast takes, and how long a blow takes to land. The cast
 * time is read off the mainline's own frame counts, which is why it
 * is written in frames rather than in turns
 */
const FPS = 60;
const FPS_DURATION = 1000 / FPS;
const FRAMES_PER_PRIORITY = 16;
const BASE_FRAMES = 104;

/**
 * The gap between a move going off and its effect landing, for moves
 * that do not name their own. It is what the swing takes: without it
 * the damage lands on the frame the animation starts, and every hit
 * in the game is over before it is seen.
 *
 * A move whose data carries a `delay` keeps it — a projectile's is its
 * flight time, which is longer than a swing
 */
export const MOVE_DELAY = 250;

export function getCastTime(priority: number): number {
  return (BASE_FRAMES - priority * FRAMES_PER_PRIORITY) * FPS_DURATION;
}
