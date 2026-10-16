/**
 * How far the overworld board is laid back, and what that does to
 * anything lying flat on it.
 *
 * A leaf of its own so that the tools which cut sprite sheets can read
 * it. A sheet says where a piece of scenery meets the ground, and
 * finding that point means knowing how deep a patch of ground reads
 * from here: the sheet and the board have to agree about the tilt or
 * every prop stands slightly out of its cell.
 */

/**
 * How far above the board the camera sits, in degrees. 90 is straight
 * down and 0 collapses it to a line; 60 keeps the near rows nearly
 * square and leaves a sprite room to stand in front of the row behind
 */
export const PITCH = 60;

/**
 * And how far above it the camera sits in the flat view, which is
 * straight down. A board with no tilt at all: every cell is the same
 * square wherever it is, which is what a thumb needs and what a
 * portrait screen has room for
 */
export const FLAT_PITCH = 90;

/** How much of a step across the board survives being drawn at a pitch */
export function depthOf(pitch: number): number {
  return Math.sin((pitch * Math.PI) / 180);
}

/** And how much of a step upward survives it */
export function riseOf(pitch: number): number {
  return Math.cos((pitch * Math.PI) / 180);
}

/**
 * How flat a patch of ground lies at a pitch: an ellipse as wide as
 * the patch and this much of that tall. Short of the pitch's own sine,
 * since a shadow hugging the ground reads better than one drawn as the
 * full circle the geometry would give
 */
export function squashOf(pitch: number): number {
  return depthOf(pitch) * 0.55;
}

/**
 * How much of a step across the board survives being drawn.
 *
 * The board is laid back under the camera, so a step away from the
 * viewer covers less of the picture than the same step across it.
 * Anything measuring a direction **on the ground** rather than on the
 * page has to lay it back by this or it points somewhere else
 */
export const GROUND_DEPTH = depthOf(PITCH);

/**
 * And how much of a step **upward** survives it.
 *
 * The other half of the same tilt: a step away from the viewer keeps
 * its sine, a step into the air keeps its cosine. Anything drawn above
 * the ground rather than on it — a raindrop, a fold of aurora — is
 * raised by this, and at sixty degrees it is half of what a step
 * across the board is worth
 */
export const GROUND_RISE = riseOf(PITCH);

/**
 * How flat a patch of ground lies: an ellipse as wide as the patch and
 * this much of that tall. Short of the tilt's own sine, since a shadow
 * hugging the ground reads better than one drawn as the full circle
 * the geometry would give
 */
export const GROUND_SQUASH = squashOf(PITCH);
