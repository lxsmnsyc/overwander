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
 * How flat a patch of ground lies: an ellipse as wide as the patch and
 * this much of that tall. Short of the tilt's own sine, since a shadow
 * hugging the ground reads better than one drawn as the full circle
 * the geometry would give
 */
export const GROUND_SQUASH = Math.sin((PITCH * Math.PI) / 180) * 0.55;
