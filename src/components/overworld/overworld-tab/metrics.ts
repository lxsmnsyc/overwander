import Landmark from '../../../data/overworld/landmark';
import { BOARD_CELLS, BOARD_CENTER, BOARD_RADIUS } from '../../../overworld/board';
import { CHUNK_CELLS } from '../../../overworld/chunk';

/**
 * The landmarks a player fights somebody at, all served by the one
 * challenge dialog and the rocket-stop machinery under it
 */
export const FIGHT_LANDMARKS = new Set([
  Landmark.TeamRocket,
  Landmark.Trainer,
  Landmark.GymLeader,
  Landmark.EliteFour,
  Landmark.Champion,
]);

/**
 * The landmarks that pay out on the press itself, with nothing opened
 * in between. Their claim is the whole interaction, so the cell has to
 * be held shut while the call is in flight
 */
export const HARVEST_LANDMARKS = new Set([
  Landmark.ItemCache,
  Landmark.BerryPatch,
  Landmark.ApricornTree,
]);

/**
 * How many spawns a visit publishes. It is the publisher's own figure,
 * re-exported here because the board reads it beside its other
 * measurements
 */
export { PUBLISHED_SPAWNS } from '../../../auth/snapshots';

/**
 * How wide the board is and where the player stands on it. Both the
 * projection's, since the picture is what decides how much of the
 * world fits in it: the board is a window that follows the player, so
 * they are always in the middle of it and it is the ground that moves
 */
export { BOARD_CELLS, BOARD_CENTER, BOARD_RADIUS };

export const PLAYER_CELL = BOARD_CENTER * BOARD_CELLS + BOARD_CENTER;

/**
 * How far past the square it reads the ground, in cells. One cell, so
 * that the outermost of the drawn ones still knows what is beside it:
 * an edge tile is decided by its neighbours, and a neighbour nobody
 * read is a seam
 */
export const BOARD_MARGIN = 1;

/**
 * Where a player entering a chunk without a stored position starts
 */
export const START_CELL = CHUNK_CELLS / 2;

/**
 * How long the game waits before writing down where somebody is. A
 * walk is a run of keypresses, and what is worth keeping is where it
 * ended
 */
export const SAVE_DELAY = 1500;

/**
 * How many paces are walked before the egg being carried is told
 * about them. Reporting every cell would be a write per keypress;
 * reporting in batches costs the walker nothing, since the server
 * credits against the time that passed rather than the moment the
 * report arrived
 */
export const STEP_REPORT_SIZE = 8;

/**
 * How often the chunk may be asked for while the player is playing.
 *
 * The window it is showing lasts five minutes, and asking for it again
 * is a write: whoever asks for an expired one rolls the next set of
 * spawns for everybody standing there. Left on a timer, a player who
 * walked away from the screen kept rolling windows for a chunk nobody
 * was looking at, once every five minutes, for as long as the tab was
 * open.
 *
 * So it is asked for when it is actually worth asking: when the page
 * comes back to the front, and while the player is doing something —
 * and no more than once in five seconds, since a walk is twenty
 * presses and each one is not a question about the world
 */
export const REFRESH_DEBOUNCE = 5000;

/**
 * How big the picture on one of those lines is. Small: the line is
 * two words wide, and the picture is there to be recognised rather
 * than admired
 */
export const ICON_SIZE = 24;

/**
 * How long a cell takes to walk, in milliseconds.
 *
 * Slow enough to be a walk rather than a jump to the far side of the
 * chunk, and quick enough that crossing one is not something a player
 * sits through. It is also what a step *costs*: the egg being carried
 * counts every one of them, so a walk that took no time would be a
 * hatching machine
 */
export const STEP_PACE = 250;
