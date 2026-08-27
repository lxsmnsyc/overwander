import { BORDER_CELLS, PICTURE_SPAN, PITCH } from '../../../canvas/board';
import { CHUNK_CELLS } from '../../../overworld/chunk';

/**
 * The board's reference measurements, its colours, and the few facts
 * about pressing and turning it that the tab shares.
 */

/**
 * How big a cell is at the size the picture was drawn at.
 *
 * The canvas is the page now, so the picture is however large the
 * screen allows rather than a fixed number of pixels. What this and
 * the sizes beside it describe is one **reference** picture: a radius
 * of `CELL * 0.3` is that on a board of this width and proportionally
 * more on a wider one. Everything measured in pixels is multiplied by
 * how much larger the real picture came out
 */
export const CELL = 26;

/**
 * The reference picture's width. It is wider than the chunk: there is
 * an apron of threshold cells around it and the compass letters stand
 * off that again
 */
export const WIDTH = CELL * CHUNK_CELLS * PICTURE_SPAN;

/**
 * How far past the chunk the apron of thresholds reaches, in board
 * fractions — the units the ground is measured in, where the chunk
 * itself runs from 0 to 1
 */
export const APRON = BORDER_CELLS / CHUNK_CELLS;

/**
 * How much bigger than the sheet a pokemon standing in a cell is
 * drawn, at the board's middle row. The rows in front of it are drawn
 * larger and the rows behind smaller — that factor is the projection's
 * and comes back with every point it is asked about.
 *
 * A little larger than it was, because a sprite is no longer sitting
 * inside its cell: it stands **up** out of it, over the row behind,
 * which is the whole of what makes the board read as a place with
 * things on it rather than a chart with pictures in it
 */
export const SPRITE_SCALE = 0.95;

/**
 * How much of that a pokemon gets, by the size the game calls it.
 *
 * Drawn pixels alone are a poor measure of how big something is: a
 * frame is trimmed to the widest pose in the sheet, so a Zubat with
 * its wings out came out taller on the board than most of the pokemon
 * twice its size. `shadowSize` is the game's own answer and the only
 * one a sheet carries, so it corrects what the drawing says rather
 * than replacing it. Gentle on purpose, since the artists already draw
 * a Gyarados larger than a Caterpie and this multiplies that
 */
export const SIZE_TIERS = [0.85, 1, 1.1];

/**
 * How many cells tall a charset's own cell is drawn.
 *
 * Not the scale the pokemon are drawn at: a charset is drawn at a
 * bigger pixel size than a PMD sheet, so sharing one number puts a
 * nurse two rows tall beside a Bulbasaur three quarters of a cell high.
 * Measured against the **source** cell rather than the cropped one, so
 * every charset stands the same height whatever its own crop came to
 */
export const NPC_CELLS = 1.45;

/**
 * How many cells tall a berry plant is drawn. Shorter than a person:
 * a bush the player walks up to should not hide whoever is standing
 * behind it
 */
export const PLANT_CELLS = 1.1;

/**
 * How many points of the sway loop the patches are spread over. A
 * prime, so neighbouring cells and whole rows both land on different
 * ones rather than a stripe of bushes moving as a block
 */
export const PLANT_PHASES = 7;

/**
 * The stage a stripped patch is drawn at: the youngest the sheet has,
 * which is the bush before it bore anything
 */
export const PICKED_STAGE = 0;

/** The charset the player walks in when nothing else is chosen. */
export const PLAYER_SHEET = 'characters/frlg/red';

/**
 * How long sliding across one cell takes, in milliseconds. It is the
 * tab's own step pace, so the slide arrives just as the next step
 * lands and a long walk reads as one motion
 */
export const SLIDE_PACE = 250;

/**
 * A jump of more than this many cells is not a walk: a crossing or a
 * portal moved the player, and the slide teleports with them
 */
export const SNAP_CELLS = 2;

/**
 * World pixels one cell is worth to a charset's walk cycle: a full
 * cycle of steps carries the walker across one cell
 */
export const CELL_STRIDE = 32;

/**
 * What the board says while the sheets for what is standing on it are
 * still coming, and how large it is drawn in board pixels
 */
export const LOADING_LABEL = 'Loading…';
export const LOADING_SIZE = 18;

export const COLORS = {
  grid: 'rgba(0, 0, 0, 0.12)',
  /**
   * The cell the player is on
   */
  player: '#ffd166',
  /**
   * The line round how far the player can lean: their own square and
   * the eight about it, drawn as one ring rather than as nine lit
   * cells. Whatever is inside it is theirs to press
   */
  highlight: '#ffffff',
  spawn: '#2b2b2b',
  glyph: '#1c1c1c',
  landmark: 'rgba(255, 255, 255, 0.65)',
  /**
   * The keyboard's own pointer, drawn only while the canvas has focus
   */
  cursor: '#3b82f6',
  /**
   * The compass, which is four letters standing on the ground off the
   * edges of the board. They are read against whatever country the
   * chunk is made of, so each one is drawn on a halo of its own rather
   * than trusting a dark letter to show up on dark ground
   */
  compass: '#1c1c1c',
  compassHalo: 'rgba(255, 255, 255, 0.75)',
  /**
   * The word said over the board while its pokemon are still coming,
   * on a halo for the same reason the compass has one
   */
  loading: '#1c1c1c',
  loadingHalo: 'rgba(255, 255, 255, 0.75)',
  /**
   * The ground under something standing on it
   */
  shadow: 'rgba(0, 0, 0, 0.28)',
  /**
   * What lifts the board off the country it lies in. The ground
   * beyond it is the same colour — it is the same country — so the
   * board is the part of it with the light on
   */
  surface: 'rgba(255, 255, 255, 0.10)',
} as const;

/**
 * How near the middle of the board a grab has to be before it is not
 * worth turning by.
 *
 * The board turns about its own middle, so a bit of plane grabbed
 * right at the centre has no angle to speak of: a pixel of movement
 * there would swing it half a turn. A grab inside this holds the
 * board still until the pointer has been dragged out past it, which
 * is what a hand on a turntable does
 */
export const TURN_DEAD_ZONE = 0.06;

/**
 * How big the compass letters are on the reference picture. They are
 * the only writing on it, and they are read at a glance rather than
 * studied
 */
export const COMPASS_SIZE = 15;

/**
 * How thick the halo under a compass letter is drawn
 */
export const COMPASS_HALO = 3;

/**
 * How flat the shadow lies. It is on the ground, and the ground is
 * laid back under the camera, so it is squashed the way the ground is
 */
export const GROUND_SQUASH = Math.sin((PITCH * Math.PI) / 180) * 0.55;

/**
 * Crossing a boundary, drawn rather than waited through.
 *
 * The next chunk's window is a round trip, and while it is in the air
 * there is nothing to draw. The world used to be taken off the screen
 * for that moment and a line of text put in its place, which is a
 * flash of the whole page for what is usually a fraction of a second
 * — and it happens every time a player walks off an edge.
 *
 * So the board is carried off instead: the one being left slides away
 * behind the walker and fades, and the one they have walked into comes
 * on from the far side. Nothing waits on the drawing — the caller
 * holds the old board up until the new one has arrived, and says which
 * half of the crossing this is
 */
export interface Crossing {
  /**
   * The step that took them over, in the world's own cells: north is
   * `dy` of -1 whichever way the camera is pointing
   */
  dx: number;
  dy: number;
  /**
   * Whether the board is being carried off or brought on
   */
  phase: 'out' | 'in';
}

/**
 * How long each half of a crossing takes. Short: it is a step, and a
 * player crossing several chunks would otherwise spend the walk
 * watching the boards rather than the world
 */
export const CROSSING_OUT = 180;

export const CROSSING_IN = 220;

/**
 * How far the board travels while it is being carried off, as a
 * fraction of the picture. Far enough to be leaving, near enough that
 * it is the same board the whole way
 */
export const CROSSING_SLIDE = 0.3;

/**
 * Which button turns the board. The left one is for pressing cells
 * and the right one has no other business here
 */
export const RIGHT_BUTTON = 2;

/**
 * How far a keyboard press turns the board. A quarter is what the
 * halves of it are counted in; a press is half of that, which lands
 * on a sprite facing every time
 */
export const QUARTER_TURN = Math.PI / 2;

/**
 * Whether this press is asking to turn the board rather than to press
 * a cell.
 *
 * The right button, or — for the Mac, where a trackpad and a Magic
 * Mouse both ship without one — **control and the left button**, which
 * is what that platform means by a secondary click everywhere else.
 * It costs nothing on the machines that do have a right button, since
 * control-clicking one was never a way of pressing a cell
 */
export function isTurningPress(event: { button: number; ctrlKey: boolean }): boolean {
  return event.button === RIGHT_BUTTON || (event.button === 0 && event.ctrlKey);
}

/**
 * Which way a step off the board goes, in the world's own words. North
 * is the far edge of the chunk however the camera has been walked
 * round, which is the same north the compass letters are drawn from
 */
export const BEARINGS = new Map<string, string>([
  ['0,-1', 'north'],
  ['1,0', 'east'],
  ['0,1', 'south'],
  ['-1,0', 'west'],
]);

/**
 * The keys that move the cursor, and which way. They no longer walk
 * anybody: a walk is a press on where you want to be, and this is that
 * press for a player who is using the keyboard for it
 */
export const MOVE_KEYS = new Map<string, [number, number]>([
  ['ArrowUp', [0, -1]],
  ['ArrowDown', [0, 1]],
  ['ArrowLeft', [-1, 0]],
  ['ArrowRight', [1, 0]],
  ['w', [0, -1]],
  ['s', [0, 1]],
  ['a', [-1, 0]],
  ['d', [1, 0]],
]);
