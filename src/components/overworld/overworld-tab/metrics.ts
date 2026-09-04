import Landmark from '../../../data/overworld/landmark';
import { LURE_SPAWN_BONUS } from '../../../overworld/abilities/__create';
import { CHUNK_CELLS } from '../../../overworld/chunk';
import { SPAWN_COUNT } from '../../../overworld/chunk-snapshot';

/**
 * The landmarks a player fights somebody at, all served by the one
 * challenge dialog and the stop machinery under it
 */
export const FIGHT_LANDMARKS = new Set([
  Landmark.TeamRocket,
  Landmark.Trainer,
  Landmark.GymLeader,
  Landmark.EliteFour,
  Landmark.Champion,
  Landmark.FrontierBrain,
]);

/**
 * How many spawns a visit publishes: the ordinary eight plus the
 * three a lure draws in, rolled for every window so that a lure
 * changes who can see them rather than whether they exist
 */
export const PUBLISHED_SPAWNS = SPAWN_COUNT + LURE_SPAWN_BONUS;

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

/**
 * How long a chunk may be held on screen after the player has walked
 * out of it.
 *
 * The board being carried off is held up until the next chunk's window
 * lands, and that is a round trip nobody can promise. Past this it is
 * let go of whether or not there is anything to put in its place: a
 * player looking at a chunk they left ten seconds ago is worse off
 * than one looking at a line that says the next one is loading
 */
export const CROSSING_LIMIT = 4000;
