import {
  BOARD_CELLS,
  BOARD_CENTER,
  BOARD_RADIUS,
  BOARD_SPAN,
  VIEW_RADIUS,
} from '../overworld/board';
import { FLAT_PITCH, PITCH, depthOf, riseOf, squashOf } from './tilt';

/**
 * The chunk seen from a chair rather than from a satellite: the ground
 * laid back under the camera, the pokemon on it drawn upright.
 *
 * Everything here is one projection and its inverse, and nothing else
 * in the game may work out where a cell is — the painter asks for
 * corners, the pointer asks which cell it is over, the browser test
 * asks where to click.
 *
 * There are two of those projections rather than one. A screen with
 * room across it is drawn in **3d**: the board laid back, a trapezoid
 * with the far rows smaller than the near ones. A screen taller than
 * it is wide is drawn in **2d**: the board flat and square on, seen
 * from straight above, with no perspective anywhere in it. Which is in
 * hand is [`boardView`](#boardView), chosen from the shape of the
 * screen by `setBoardScreen` — everything below answers for whichever
 * screen was last named.
 *
 * The pitches themselves live in [`tilt`](./tilt.ts), where the tools
 * that cut sprite sheets can read them too, and the laid-back one is
 * re-exported here because this is where the rest of the game asks
 * about the board.
 */

export { PITCH };

/**
 * How big the board is, which is a fact about the world window rather
 * than about the picture of it, and is re-exported here because this
 * is where the rest of the game asks about the board
 */
export { BOARD_CELLS, BOARD_CENTER, BOARD_RADIUS, BOARD_SPAN, VIEW_RADIUS };

/**
 * How far the camera stands back, in board widths — what makes the far
 * edge narrower than the near one. Small numbers are a wide lens and
 * large ones flatten it to a squash; this middle keeps the trapezoid
 * plain while leaving the far row wide enough for a sprite
 */
const FOCAL = 2.4;

/**
 * A point on the ground, in board fractions: `u` across from the left
 * edge, `v` back from the near edge — 0 is the far row, 1 is the row
 * nearest the camera. Cell centres and cell corners are both asked
 * for, so the projection takes fractions rather than cells
 */
export interface GroundPoint {
  u: number;
  v: number;
}

/**
 * Where a ground point lands on the canvas, and how big things are
 * there. `scale` is the whole of the third dimension: a sprite drawn
 * at it recedes instead of standing in a line of identical cut-outs.
 * Flat on, it is 1 everywhere
 */
export interface ProjectedPoint {
  x: number;
  y: number;
  scale: number;
}

/**
 * Which way round the board is being looked at, in radians, about its
 * own middle. Everything below takes it as an argument: the board has
 * no opinion about where the camera stands
 */
export type Yaw = number;

/**
 * How far past the board the painting reaches, in cells. Two, because
 * the ground slides by up to a whole cell between steps and the rim is
 * drawn a cell outside the board: painted only to the rim, the far
 * edge would show a strip of nothing every time the camera caught up
 */
export const PAINT_CELLS = 2;

/**
 * How far out the rim is drawn, in cells: the country just past what
 * the player can press, so the board ends in ground rather than in an
 * edge
 */
export const BORDER_CELLS = 1;

/**
 * The board and its rim in board fractions: the same units the ground
 * is measured in, where the whole square runs from 0 to 1. `REACH` is
 * as far as the player can press, and `RIM` the ring of country drawn
 * outside it
 */
export const REACH = BOARD_RADIUS / BOARD_SPAN;
export const RIM = (BOARD_RADIUS + BORDER_CELLS) / BOARD_SPAN;

/**
 * How far from the middle the compass marks stand: past the apron and
 * a cell further. Off the board on purpose: a mark lying on the ground
 * reads as scenery rather than as which way the board faces
 */
const COMPASS_REACH = RIM + 1 / BOARD_SPAN;

/**
 * Room for the mark itself, as a fraction of the picture's width. A
 * mark is drawn about its point, so fitting to the point alone clips
 * half of it. Added **after** the projection: ground beyond the near
 * edge is a long way down the screen once perspective has had it
 */
const MARK_ROOM = 0.03;

/** A ring of ground points about the middle of the board */
export function groundRing(reach: number, points: number): GroundPoint[] {
  return Array.from({ length: points }, (_, step) => {
    const angle = (step / points) * Math.PI * 2;

    return { u: 0.5 + Math.cos(angle) * reach, v: 0.5 + Math.sin(angle) * reach };
  });
}

/**
 * Everything that has to be inside the picture: the ring the compass
 * marks stand on, which is the widest thing drawn. A circle rather
 * than four corners, and sampled rather than taken at the axes: laid
 * back under the camera a circle is an ellipse, and its widest point
 * on the screen is not where its widest point on the ground was
 */
const OUTER: GroundPoint[] = groundRing(COMPASS_REACH, 96);

/**
 * A ground point turned about the middle of the board. The turn is
 * applied **before** the tilt, so it reads as a camera walking around
 * a table rather than a picture spun on the screen
 */
function turn(point: GroundPoint, yaw: Yaw): GroundPoint {
  if (yaw === 0) {
    return point;
  }

  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const u = point.u - 0.5;
  const v = point.v - 0.5;

  return { u: u * cos - v * sin + 0.5, v: u * sin + v * cos + 0.5 };
}

/**
 * Which of the two boards is being drawn: `3d` laid back under the
 * camera, `2d` flat and seen from straight above
 */
export type BoardMode = '2d' | '3d';

/**
 * One way of looking at the board, worked out once from a pitch and a
 * lens. What a caller outside this file wants is the measurements at
 * the top; the rest is the projection's own working
 */
export interface BoardView {
  mode: BoardMode;
  /**
   * How much of a step across the board survives the tilt. Straight
   * down it is all of it; edge-on it is none. Anything measuring a
   * direction **on the ground** has to lay it back by this
   */
  depth: number;
  /**
   * And how much of a step into the air survives it: a drop ten cells
   * up is drawn this much of ten cells above where it will land. None
   * of it flat on, which is why the flat board draws its weather
   * against the glass instead of standing it in the world
   */
  rise: number;
  /**
   * How flat a patch of ground lies — a shadow, a pool of lamplight
   * drawn as an ellipse this much as tall as it is wide
   */
  squash: number;
  /** How wide and tall the picture is, as a fraction of its width */
  aspect: number;
  /**
   * How wide the picture is in board widths. The picture is not the
   * board — there is an apron and four letters around it — so a
   * painter multiplies its cell size by this to get cells the size it
   * asked for
   */
  span: number;
  /** How much bigger than the board's middle row things are at a depth */
  scaleAt: (v: number) => number;
  /** The projection: the board's middle at the origin, one unit wide */
  raw: (point: GroundPoint, height?: number) => ProjectedPoint;
  /** And its inverse, before the fit and the turn are taken off */
  groundAt: (x: number, y: number) => GroundPoint;
  bounds: { left: number; top: number; width: number; height: number };
  middle: { x: number; y: number };
  fit: number[];
}

/**
 * A view of the board. A `focal` of null is no perspective at all,
 * which is what the flat board wants: a cell the same size wherever it
 * sits, rather than one that grows as it comes toward the camera
 */
function createView(mode: BoardMode, pitch: number, focal: number | null): BoardView {
  const depth = depthOf(pitch);
  const rise = riseOf(pitch);
  /**
   * The perspective factor at a depth: how much bigger or smaller than
   * the board's middle row things are there
   */
  const scaleAt =
    focal == null
      ? (): number => 1
      : // Positive away from the camera, so the far half divides by more
        (v: number): number => focal / (focal - (v - 0.5) * depth);
  /**
   * The projection, before it is fitted to the canvas: the board's
   * middle at the origin, one unit wide
   */
  const raw = (point: GroundPoint, height = 0): ProjectedPoint => {
    const scale = scaleAt(point.v);

    return {
      x: (point.u - 0.5) * scale,
      // Depth pushes a point up the picture and so does height, each
      // laid back by its own half of the tilt
      y: ((point.v - 0.5) * depth - height * rise) * scale,
      scale,
    };
  };
  /**
   * The way back, solved rather than searched. With `t` for the depth
   * either side of the middle row the forward transform is
   *
   *     y = t * F * depth / (F - t * depth)
   *
   * which rearranges to the line below, and is a plain division by the
   * depth where there is no perspective to undo
   */
  const groundAt = (x: number, y: number): GroundPoint => {
    if (focal == null) {
      return { u: x + 0.5, v: y / depth + 0.5 };
    }

    const t = (y * focal) / (focal * depth + y * depth);
    const v = t + 0.5;

    return { u: x / scaleAt(v) + 0.5, v };
  };
  /**
   * Measured with the board **facing front**, which is how it is
   * nearly always looked at. Fitting every angle instead would size
   * the frame for a corner-on board and leave the front-facing one
   * marooned in empty country; turning gives way instead — see the fit
   * below
   */
  const corners = OUTER.map((point) => raw(point));
  const left = Math.min(...corners.map((corner) => corner.x));
  const top = Math.min(...corners.map((corner) => corner.y));
  // The real extent rather than twice the furthest corner: the board
  // is not symmetric about its own middle once it is laid back, since
  // the near edge is both wider and further from the centre than the
  // far one
  const wide = Math.max(...corners.map((corner) => corner.x)) - left;
  const deep = Math.max(...corners.map((corner) => corner.y)) - top;
  // ...and then the same room on every side, measured on the picture
  // rather than on the ground, so the marks have somewhere to be
  // drawn and the board is not pushed up the screen to pay for it
  const room = wide * MARK_ROOM;
  const bounds = {
    left: left - room,
    top: top - room,
    width: wide + room * 2,
    height: deep + room * 2,
  };
  const middle = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
  /**
   * How large the board may be drawn at each angle, a degree at a time
   * through a quarter turn.
   *
   * A square corner-on is half as wide again as one facing front, so
   * either the picture is fitted to that and the board is always
   * small, or the board gives up a little while turned and has it back
   * when it comes round. This is the second. A quarter turn is the
   * whole table: a square and a cross repeat every ninety degrees
   */
  const fit: number[] = [];

  for (let step = 0; step <= 90; step++) {
    const yaw = (step * Math.PI) / 180;
    let worst = 1;

    for (const point of OUTER) {
      const turned = raw(turn(point, yaw));

      worst = Math.max(
        worst,
        Math.abs(turned.x - middle.x) / (bounds.width / 2),
        Math.abs(turned.y - middle.y) / (bounds.height / 2),
      );
    }
    fit.push(1 / worst);
  }

  return {
    mode,
    depth,
    rise,
    squash: squashOf(pitch),
    aspect: bounds.height / bounds.width,
    span: bounds.width,
    scaleAt,
    raw,
    groundAt,
    bounds,
    middle,
    fit,
  };
}

/** The board laid back under the camera, drawn as a trapezoid */
const LAID_BACK = createView('3d', PITCH, FOCAL);

/**
 * And the board flat, seen from straight above. It costs the picture
 * its depth and buys a far row that can be pressed with a thumb, a
 * square picture where a portrait screen has the room, and sprites all
 * drawn at one size
 */
const FLAT = createView('2d', FLAT_PITCH, null);

/**
 * Which of the two a screen this shape is drawn with: taller than it
 * is wide is flat, anything else is laid back.
 *
 * The shape rather than the size, because it is the shape that makes
 * the tilt expensive. A portrait screen fits the picture to its width
 * and has height left over, which a laid-back board cannot use and a
 * square one can — and the cells it saves are the far ones, which the
 * tilt had drawn half as deep as the near ones.
 *
 * A pure reading, so the browser test can ask it of the box it just
 * measured rather than of whatever the last caller set
 */
export function viewFor(width: number, height: number): BoardView {
  return height > width ? FLAT : LAID_BACK;
}

let looking = LAID_BACK;

/**
 * Which way the board is being looked at now. Everything drawn on it
 * that is not a projection — the shadow a thing throws, a lamp's
 * ellipse, whether the weather stands in the world — reads what it
 * needs off this
 */
export function boardView(): BoardView {
  return looking;
}

/**
 * Say how large the screen the board is drawn on is, which is what
 * chooses between the two views. Called wherever that size is known:
 * the painter measures its canvas every frame, and the browser test
 * measures the same box before it aims at a cell
 */
export function setBoardScreen(width: number, height: number): void {
  looking = viewFor(width, height);
}

/**
 * How much of itself the board keeps at this angle: 1 facing front,
 * and least of all corner-on. Read between the degrees rather than
 * rounded to one, so that turning it is smooth
 */
function fitAt(yaw: Yaw): number {
  const { fit } = looking;
  const degrees = ((((yaw * 180) / Math.PI) % 90) + 90) % 90;
  const step = Math.floor(degrees);

  return fit[step] + (fit[step + 1] - fit[step]) * (degrees - step);
}

/**
 * How much of a screen the picture may take. Drawn edge to edge, the
 * corners are cut off the moment the camera is walked round; a little
 * kept back keeps the far corner a corner rather than a straight line
 */
const PICTURE_INSET = 0.96;

/**
 * And how much of the bottom is the menu's. South's compass mark wants
 * the same spot, so the picture keeps out of it: a button reached for
 * without looking should not move
 */
const PICTURE_FLOOR = 0.08;

/**
 * Where the picture goes on a screen of this size, in that screen's
 * pixels. The projection answers in fractions of the picture, and this
 * is the one place that turns those into pixels — the painter draws
 * through it and the browser test aims through it
 */
export function fitPicture(
  width: number,
  height: number,
): { x: number; y: number; width: number; height: number } {
  // The screen's own view rather than the one that is set, so that
  // fitting a picture is a reading and nothing else
  const { aspect } = viewFor(width, height);
  const room = {
    width: width * PICTURE_INSET,
    height: height * (PICTURE_INSET - PICTURE_FLOOR),
  };
  const drawn = Math.min(room.width, room.height / aspect);

  return {
    x: (width - drawn) / 2,
    // Centred in what is left once the menu has had its strip, rather
    // than in the screen: centred in the screen, the picture would sit
    // under the menu by half of it
    y: (height * (1 - PICTURE_FLOOR) - drawn * aspect) / 2,
    width: drawn,
    height: drawn * aspect,
  };
}

/**
 * Where a ground point lands, in fractions of the drawn picture.
 * Fractions rather than pixels because three sizes are in play — the
 * canvas' resolution, its size on screen, and the box a test measures
 */
export function projectGround(point: GroundPoint, yaw: Yaw = 0): ProjectedPoint {
  return projectAir(point, 0, yaw);
}

/**
 * The same, for a point standing **above** the ground rather than on
 * it. `height` is in board widths, so a drop at 1 is as high as the
 * chunk is wide. Nothing stands above a flat board: seen from straight
 * up, a thing in the air is over the spot it will land on.
 *
 * The fit rides home the same way it does for the ground, so a thing
 * in the air is drawn at the scale of the board under it: the sky and
 * the board give up the same room as the camera walks round, and
 * nothing slides against anything else
 */
export function projectAir(point: GroundPoint, height: number, yaw: Yaw = 0): ProjectedPoint {
  const { bounds, middle } = looking;
  const projected = looking.raw(turn(point, yaw), height);
  // Drawn toward the middle of the picture by however much the board
  // has given up at this angle. Whatever is standing on it gives up
  // the same, which is why the factor rides home on `scale`: a pokemon
  // is drawn the size of the ground it is standing on
  const fit = fitAt(yaw);

  return {
    x: (middle.x + (projected.x - middle.x) * fit - bounds.left) / bounds.width,
    y: (middle.y + (projected.y - middle.y) * fit - bounds.top) / bounds.height,
    scale: projected.scale * fit,
  };
}

/**
 * The reverse: which ground point is under a fraction of the picture.
 *
 * A picture you cannot press is a picture, not a board, so this has to
 * be exact rather than near enough — the same transform read backwards
 * rather than a guess refined by sampling
 */
export function unprojectGround(x: number, y: number, yaw: Yaw = 0): GroundPoint {
  const { bounds, middle } = looking;
  // The shrinking comes off first, since it is the last thing the
  // forward transform does
  const fit = fitAt(yaw);
  const px = middle.x + (x * bounds.width + bounds.left - middle.x) / fit;
  const py = middle.y + (y * bounds.height + bounds.top - middle.y) / fit;

  // ...and then turned back, since the turn is the first thing the
  // forward transform does and so the last thing this one undoes
  return turn(looking.groundAt(px, py), -yaw);
}

/**
 * A cell of the drawn board, across and back from its top left corner.
 * A board cell has both in `0..BOARD_CELLS - 1`; the apron is one step
 * outside that. The four apron corners are not cells: a player only
 * steps onto the apron straight
 */
export interface BoardCell {
  x: number;
  y: number;
}

/** How far a cell's middle is from the player, in cells */
export function reachOf(cell: BoardCell): number {
  return Math.hypot(cell.x - BOARD_CENTER, cell.y - BOARD_CENTER);
}

/**
 * Whether the coordinates name a cell the player may press: one inside
 * the circle the grid is ruled over. The country drawn past it is
 * looked at rather than walked to a square at a time
 */
export function isBoardCell(cell: BoardCell): boolean {
  return (
    cell.x >= 0 &&
    cell.y >= 0 &&
    cell.x < BOARD_CELLS &&
    cell.y < BOARD_CELLS &&
    reachOf(cell) <= BOARD_RADIUS
  );
}

/**
 * Every cell of country the painter draws, which runs off the picture
 * on every side: what the player looks out over rather than what they
 * can reach
 */
export function viewCells(): BoardCell[] {
  const cells: BoardCell[] = [];

  for (let y = 0; y < BOARD_CELLS; y++) {
    for (let x = 0; x < BOARD_CELLS; x++) {
      if (reachOf({ x, y }) <= VIEW_RADIUS) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

/** Every cell the pointer may land on, which is the board itself */
export function boardCells(): BoardCell[] {
  const cells: BoardCell[] = [];

  for (let y = 0; y < BOARD_CELLS; y++) {
    for (let x = 0; x < BOARD_CELLS; x++) {
      if (isBoardCell({ x, y })) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

/**
 * Which board cell this is, or null for a square outside the circle
 */
export function boardIndexOf(cell: BoardCell): number | null {
  return isBoardCell(cell) ? cell.y * BOARD_CELLS + cell.x : null;
}

/**
 * Where a board cell index sits on the board
 */
export function boardCellOf(index: number): BoardCell {
  return { x: index % BOARD_CELLS, y: Math.floor(index / BOARD_CELLS) };
}

/**
 * The middle of a board cell, as a fraction of the picture
 */
export function projectBoardCell(cell: BoardCell, yaw: Yaw = 0): ProjectedPoint {
  // Measured out from the middle rather than from a corner: the square
  // the cells are indexed in is wider than the one the picture is
  // fitted to, and it is the picture that decides the perspective
  return projectGround(
    {
      u: 0.5 + (cell.x - BOARD_CENTER) / BOARD_SPAN,
      v: 0.5 + (cell.y - BOARD_CENTER) / BOARD_SPAN,
    },
    yaw,
  );
}

/**
 * The four corners of a board cell, clockwise from the far left one. A
 * cell is a quad rather than a square now: the two far corners are
 * closer together than the two near ones
 */
export function projectBoardCellQuad(cell: BoardCell, yaw: Yaw = 0): ProjectedPoint[] {
  const left = 0.5 + (cell.x - BOARD_CENTER - 0.5) / BOARD_SPAN;
  const right = 0.5 + (cell.x - BOARD_CENTER + 0.5) / BOARD_SPAN;
  const far = 0.5 + (cell.y - BOARD_CENTER - 0.5) / BOARD_SPAN;
  const near = 0.5 + (cell.y - BOARD_CENTER + 0.5) / BOARD_SPAN;

  return [
    projectGround({ u: left, v: far }, yaw),
    projectGround({ u: right, v: far }, yaw),
    projectGround({ u: right, v: near }, yaw),
    projectGround({ u: left, v: near }, yaw),
  ];
}

/**
 * The middle of a board cell, as a fraction of the picture. It is where
 * a pointer is aimed and where a sprite stands
 */
export function projectCell(index: number, yaw: Yaw = 0): ProjectedPoint {
  return projectBoardCell(boardCellOf(index), yaw);
}

/**
 * The four corners of a board cell
 */
export function projectCellQuad(index: number, yaw: Yaw = 0): ProjectedPoint[] {
  return projectBoardCellQuad(boardCellOf(index), yaw);
}

/**
 * Which way each compass point is, and where its mark stands. They are
 * ground points, so they turn with the board on their own; which one
 * is north is answered here rather than left to the order they come in
 */
export function compassMarks(yaw: Yaw = 0): (ProjectedPoint & { north: boolean })[] {
  return (
    [
      [true, 0, -1],
      [false, 1, 0],
      [false, 0, 1],
      [false, -1, 0],
    ] as const
  ).map(([north, du, dv]) => ({
    north,
    ...projectGround({ u: 0.5 + du * COMPASS_REACH, v: 0.5 + dv * COMPASS_REACH }, yaw),
  }));
}

/**
 * The order cells are painted in: furthest first, so a pokemon in
 * front is drawn over the one behind. Read off the projection rather
 * than by row, since a turned board has a far corner rather than a far
 * row
 */
export function depthOrder(cells: Iterable<number>, yaw: Yaw = 0): number[] {
  const depth = new Map(
    [...cells].map((index) => [index, projectBoardCell(boardCellOf(index), yaw).y]),
  );

  return [...depth.keys()].sort((one, other) => (depth.get(one) ?? 0) - (depth.get(other) ?? 0));
}

/** The same, over every cell the player may press */
export function paintOrder(yaw: Yaw = 0): number[] {
  return depthOrder(
    boardCells().map((cell) => cell.y * BOARD_CELLS + cell.x),
    yaw,
  );
}

/**
 * How many ways a sheet can face. It is the sprite sheets' own number
 * — one row per eighth of a turn — and it is here because the board
 * is what decides which of them the camera is looking at
 */
export const SPRITE_FACINGS = 8;

/**
 * Which way a thing on the board faces once the camera has been walked
 * around it. A pokemon faces a direction in the **world**; turn the
 * camera a quarter and something facing you is facing across you. The
 * answer is rounded to the nearest of the eight sheet directions
 */
export function facingFrom(worldFacing: number, yaw: Yaw = 0): number {
  const eighth = (2 * Math.PI) / SPRITE_FACINGS;
  const turned = Math.round((worldFacing * eighth - yaw) / eighth);

  return ((turned % SPRITE_FACINGS) + SPRITE_FACINGS) % SPRITE_FACINGS;
}

/**
 * How many quarter turns the board has been given, rounded to the
 * nearest.
 *
 * Ground tiles are drawn for one point of view and can only be turned
 * in quarters, so a camera anywhere in between is served by whichever
 * quarter it is closest to. It changes over as the camera passes the
 * halfway point, which is the only place the switch is least visible
 */
export function yawTurns(yaw: Yaw = 0): number {
  const quarter = Math.round(yaw / (Math.PI / 2));

  return ((quarter % 4) + 4) % 4;
}

/**
 * The angle a ground point stands at, seen from the middle of the
 * board. It is what a drag is measured in: grab a bit of the plane
 * and the board turns so that bit stays under the pointer
 */
export function angleOf(point: GroundPoint): number {
  return Math.atan2(point.v - 0.5, point.u - 0.5);
}

/**
 * How far the point is from the middle of the board, in board widths.
 * A grab too near the middle has no angle worth speaking of — a pixel
 * of movement there is half a turn — so a caller checks this first
 */
export function radiusOf(point: GroundPoint): number {
  return Math.hypot(point.u - 0.5, point.v - 0.5);
}

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
 * The shortest way round from one angle to another. Turning the board
 * past due south should carry on turning rather than snapping back
 * the long way, which is what comparing two `atan2` results raw would
 * do every time one of them crossed the line
 */
export function shortestTurn(from: Yaw, to: Yaw): number {
  const difference = (to - from) % (2 * Math.PI);

  if (difference > Math.PI) {
    return difference - 2 * Math.PI;
  }
  if (difference < -Math.PI) {
    return difference + 2 * Math.PI;
  }
  return difference;
}

/**
 * Which board cell a fraction of the picture is over, or null for a
 * press that landed on the ground beside all of it — which is most of
 * the top two corners now that the board is a trapezoid, and the four
 * corners of the apron, where nothing is drawn
 */
export function boardCellAtFraction(
  x: number,
  y: number,
  yaw: Yaw = 0,
  shift: [number, number] = [0, 0],
): BoardCell | null {
  const { u, v } = unprojectGround(x, y, yaw);
  // The ground is drawn shifted by however far the camera has yet to
  // catch up, so a reading off the picture is taken back the same way
  const cell = {
    x: Math.floor((u - 0.5) * BOARD_SPAN + BOARD_CENTER + 0.5 - shift[0]),
    y: Math.floor((v - 0.5) * BOARD_SPAN + BOARD_CENTER + 0.5 - shift[1]),
  };

  return isBoardCell(cell) ? cell : null;
}

/**
 * The same reading, narrowed to the board: a press on the apron is not
 * a press on a cell of it
 */
export function cellAtFraction(x: number, y: number, yaw: Yaw = 0): number | null {
  const cell = boardCellAtFraction(x, y, yaw);

  return cell == null ? null : boardIndexOf(cell);
}
