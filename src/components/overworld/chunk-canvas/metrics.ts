import { BORDER_CELLS, PICTURE_SPAN } from '../../../canvas/board';
import { GROUND_DEPTH, GROUND_SQUASH } from '../../../canvas/tilt';
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
 * an apron of threshold cells around it and the compass marks stand
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
 * How many source pixels of a pokemon sheet stand on one cell of
 * ground, at the board's middle row. The rows in front are drawn
 * larger and the rows behind smaller, which is the projection's doing
 * and comes back with every point it is asked about.
 *
 * The same measure the scenery sheets carry as `stands`, so a tree and
 * a pokemon are sized the one way. Fewer pixels than a cell is wide on
 * purpose: a sprite is not sitting inside its cell, it stands up out of
 * it over the row behind, which is what makes the board read as a place
 * with things on it rather than a chart with pictures in it
 */
export const SPRITE_STANDS = 21;

/** The height a pokemon is drawn at its sheet's own size, in meters */
const ORDINARY_HEIGHT = 1;

/**
 * How much of the difference in height survives, and how far it is
 * allowed to carry. Onix is forty Digletts tall, so the ratio is
 * pulled through a root and clamped
 */
const HEIGHT_CURVE = 0.18;

const MIN_SIZE = 0.85;

const MAX_SIZE = 1.25;

/**
 * How much bigger or smaller than its sheet a pokemon of this height,
 * in meters, is drawn.
 *
 * The sheets are a poor measure of size: PMD art fills much the same
 * box whatever it is drawing, and the `shadowSize` beside it calls a
 * Ponyta small, so a horse came out shorter than a Rattata. The dex
 * height is the game's own answer to how big something is
 */
export function sizeOf(height: number): number {
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, (height / ORDINARY_HEIGHT) ** HEIGHT_CURVE));
}

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
export const PLANT_CELLS = 1.5;

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

/**
 * How many cells tall a scenery **cell** is drawn, for a sheet that
 * does not say how much ground its pieces cover.
 *
 * Each sheet packs its pieces in a square of its own, sized off its own
 * tallest, so this sizes whatever fills that square and everything
 * shorter comes out in proportion. It is a drawing choice rather than a
 * measurement, which is why the trees do not use it: a sheet carrying a
 * `stands` is drawn so that much ground covers a square instead
 */
export const SCENERY_CELLS = 1.7;

/** The charset the player walks in when nothing else is chosen. */
export const PLAYER_SHEET = 'characters/frlg/red';

/**
 * How long sliding across one cell takes, in milliseconds. It is the
 * tab's own step pace, so the slide arrives just as the next step
 * lands and a long walk reads as one motion
 */
export const SLIDE_PACE = 250;

/**
 * How far the slide moves this frame, in cells, with `span` still to
 * cover and `elapsed` milliseconds gone.
 *
 * One cell per pace is the walking speed, and on its own it is a
 * speed the slide can never make up ground at: the walk lays down a
 * step in exactly that time, so a frame lost to a chunk arriving was
 * lost for good and the arrears piled up over a long walk until they
 * passed `SNAP_CELLS` and the walker jumped. So whatever it is behind
 * by beyond the one cell it owes is walked off **on top** of the
 * normal speed, which puts it back in step within a pace and leaves
 * the snap for the jumps it is meant for
 */
export function slideGain(span: number, elapsed: number): number {
  return Math.min(span, (elapsed / SLIDE_PACE) * (1 + Math.max(0, span - 1)));
}

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

/**
 * How heavy a called-out cell is ruled, in pixels. The grid under it
 * is one, so anything at two reads as the grid drawn twice
 */
export const MARK_WEIGHT = 3;

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
   * The cell under somebody standing at a landmark, called out in the
   * colour of what walking up to them does.
   *
   * Once the charsets load, a nurse and a Rocket grunt are two people
   * standing on two cells and nothing on the board tells them apart —
   * a player walks up to one to find out, which for the grunt is the
   * one case where finding out costs something. The game's own two
   * colours: ember for a fight, tide for a counter
   */
  fight: 'rgba(230, 40, 41, 0.8)',
  serve: 'rgba(41, 128, 239, 0.8)',
  /**
   * And the three rungs of the league, which are worth telling apart
   * from an ambush and from each other: a badge, a mark and a title
   * are three different walks, and a player who wants the one they
   * are short of should be able to read it off the ground. Amber for
   * a gym, violet for a seat of the Elite Four, gold for a champion
   */
  gym: 'rgba(214, 138, 26, 0.85)',
  elite: 'rgba(155, 93, 229, 0.85)',
  champion: 'rgba(255, 226, 138, 0.95)',
  /** Under every mark, so one reads on pale ground as well as on dark */
  ringShade: 'rgba(0, 0, 0, 0.28)',
  /**
   * The line round the board while it has the keyboard, which is what
   * says the camera keys will answer
   */
  cursor: '#3b82f6',
  /**
   * The compass, which is four marks standing on the ground off the
   * edges of the board, each pointing the way it stands for. They are
   * read against whatever country the chunk is made of, so each is
   * drawn on a halo of its own rather than trusting a dark shape to
   * show up on dark ground
   */
  compass: '#1c1c1c',
  compassHalo: 'rgba(255, 255, 255, 0.75)',
  /**
   * North, in the game's own ember. Only one of the four needs telling
   * apart, and colouring it is what saves the other three from having
   * to be read at all
   */
  compassNorth: '#e62829',
  /**
   * The word said over the board while its pokemon are still coming,
   * on a halo for the same reason the compass has one
   */
  loading: '#1c1c1c',
  loadingHalo: 'rgba(255, 255, 255, 0.75)',
  /**
   * The ground under something standing on it. As dark as the shadow
   * the scenery sheets carry baked in, so a pokemon and the tree it is
   * standing beside sit on the same ground
   */
  shadow: 'rgba(0, 0, 0, 0.35)',
  /**
   * What lifts the board off the country it lies in. The ground
   * beyond it is the same colour — it is the same country — so the
   * board is the part of it with the light on
   */
  surface: 'rgba(255, 255, 255, 0.10)',
} as const;

/**
 * How tall a compass mark is on the reference picture, from its base
 * to its point
 */
export const COMPASS_SIZE = 15;

/**
 * And how wide its base is. Narrower than it is tall, so which end is
 * the point is not a thing anybody has to work out
 */
export const COMPASS_BASE = 11;

/**
 * How thick the halo under a compass mark is drawn
 */
export const COMPASS_HALO = 3;

/**
 * The three corners of a compass mark: a triangle standing at `spot`
 * with its point turned along `out`, which is the way that mark faces
 * once the board has been turned
 */
export function compassArrow(
  spot: { x: number; y: number },
  out: { x: number; y: number },
  magnify: number,
): { x: number; y: number }[] {
  const reach = (COMPASS_SIZE * magnify) / 2;
  const half = (COMPASS_BASE * magnify) / 2;
  const baseX = spot.x - out.x * reach;
  const baseY = spot.y - out.y * reach;

  return [
    { x: spot.x + out.x * reach, y: spot.y + out.y * reach },
    { x: baseX - out.y * half, y: baseY + out.x * half },
    { x: baseX + out.y * half, y: baseY - out.x * half },
  ];
}

/**
 * The same triangle grown by its halo. Each corner is pushed out from
 * the middle rather than the three edges being offset properly, which
 * is near enough at the width a halo is drawn and is three lines
 * rather than a polygon library
 */
export function grownArrow(
  points: { x: number; y: number }[],
  magnify: number,
): { x: number; y: number }[] {
  const halo = COMPASS_HALO * magnify;
  const middleX = (points[0].x + points[1].x + points[2].x) / 3;
  const middleY = (points[0].y + points[1].y + points[2].y) / 3;

  return points.map((point) => {
    const outX = point.x - middleX;
    const outY = point.y - middleY;
    const away = Math.hypot(outX, outY);

    return away === 0
      ? point
      : { x: point.x + (outX / away) * halo, y: point.y + (outY / away) * halo };
  });
}

/**
 * How flat the shadow lies. It is on the ground, and the ground is
 * laid back under the camera, so it is squashed the way the ground is.
 * From [`tilt`](../../../canvas/tilt.ts), which is where the sheet
 * cutters read it from as well: a sheet says where a piece of scenery
 * meets the ground, and finding that point needs this
 */
export { GROUND_SQUASH };

/**
 * How flat a pool of light lies. The board's own depth rather than the
 * shadow's: a lamp's reach is a circle drawn **on** the ground, so it
 * is laid back by exactly what the ground is and not by the flatter
 * figure a shadow is drawn at for looks
 */
export { GROUND_DEPTH };

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
 * round, which is the same north the compass marks are drawn from
 */
export const BEARINGS = new Map<string, string>([
  ['0,-1', 'north'],
  ['1,0', 'east'],
  ['0,1', 'south'],
  ['-1,0', 'west'],
]);
