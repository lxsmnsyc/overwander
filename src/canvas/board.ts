import { CHUNK_CELLS } from '../overworld/chunk';

/**
 * The chunk seen from a chair rather than from a satellite: the ground
 * laid back under the camera, the pokemon on it drawn upright.
 *
 * Everything here is one projection and its inverse, and nothing else
 * in the game may work out where a cell is — the painter asks for
 * corners, the pointer asks which cell it is over, the browser test
 * asks where to click. A pitch changed here changes all three.
 */

/**
 * How far above the board the camera sits, in degrees. 90 is straight
 * down and 0 collapses it to a line; 60 keeps the near rows nearly
 * square and leaves a sprite room to stand in front of the row behind
 */
export const PITCH = 60;

/**
 * How much of the board's depth survives the tilt. Straight down it
 * is all of it; edge-on it is none
 */
const DEPTH = Math.sin((PITCH * Math.PI) / 180);

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
 * at it recedes instead of standing in a line of identical cut-outs
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
 * The perspective factor at a depth: how much bigger or smaller than
 * the board's middle row things are there
 */
function scaleAt(v: number): number {
  // Positive away from the camera, so the far half divides by more
  return FOCAL / (FOCAL - (v - 0.5) * DEPTH);
}

/**
 * The projection, before it is fitted to the canvas: the board's
 * middle at the origin, one unit wide
 */
function raw(point: GroundPoint): ProjectedPoint {
  const scale = scaleAt(point.v);

  return {
    x: (point.u - 0.5) * scale,
    y: (point.v - 0.5) * DEPTH * scale,
    scale,
  };
}

/**
 * How many cells of apron are drawn around the chunk. Nothing is ever
 * placed on one — a step onto the apron is a step into the chunk next
 * door — so it is one cell deep: a threshold rather than a road
 */
export const BORDER_CELLS = 1;

/**
 * The apron, in board fractions — the same units the ground is measured
 * in, where the chunk itself runs from 0 to 1
 */
const APRON = BORDER_CELLS / CHUNK_CELLS;

/**
 * How far from the middle the compass letters stand: past the apron
 * and a cell further. Off the board on purpose — a letter lying on the
 * ground reads as scenery rather than as which way the board faces
 */
const COMPASS_REACH = 0.5 + (BORDER_CELLS + 1) / CHUNK_CELLS;

/**
 * Room for the glyph itself, as a fraction of the picture's width. A
 * letter is drawn about its point, so fitting to the point alone clips
 * half of it. Added **after** the projection: ground beyond the near
 * edge is a long way down the screen once perspective has had it
 */
const LETTER_ROOM = 0.03;

/**
 * Everything that has to be inside the picture: the apron's corners
 * and the four compass letters. The chunk's own corners sit inside the
 * apron's, so they are not measured separately
 */
const OUTER: GroundPoint[] = [
  { u: -APRON, v: -APRON },
  { u: 1 + APRON, v: -APRON },
  { u: -APRON, v: 1 + APRON },
  { u: 1 + APRON, v: 1 + APRON },
  { u: 0.5, v: 0.5 - COMPASS_REACH },
  { u: 0.5 + COMPASS_REACH, v: 0.5 },
  { u: 0.5, v: 0.5 + COMPASS_REACH },
  { u: 0.5 - COMPASS_REACH, v: 0.5 },
];

const BOUNDS = ((): { left: number; top: number; width: number; height: number } => {
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
  const width = Math.max(...corners.map((corner) => corner.x)) - left;
  const height = Math.max(...corners.map((corner) => corner.y)) - top;
  // ...and then the same room on every side, measured on the picture
  // rather than on the ground, so the letters have somewhere to be
  // drawn and the board is not pushed up the screen to pay for it
  const room = width * LETTER_ROOM;

  return {
    left: left - room,
    top: top - room,
    width: width + room * 2,
    height: height + room * 2,
  };
})();

/**
 * The middle of the picture, which is what the board is turned about
 * and what it shrinks toward
 */
const MIDDLE = { x: BOUNDS.left + BOUNDS.width / 2, y: BOUNDS.top + BOUNDS.height / 2 };

/**
 * How large the board may be drawn at each angle, a degree at a time
 * through a quarter turn.
 *
 * A square corner-on is half as wide again as one facing front, so
 * either the picture is fitted to that and the board is always small,
 * or the board gives up a little while turned and has it back when it
 * comes round. This is the second. A quarter turn is the whole table:
 * a square and a cross repeat every ninety degrees
 */
const FIT = ((): number[] => {
  const table: number[] = [];

  for (let step = 0; step <= 90; step++) {
    const yaw = (step * Math.PI) / 180;
    let worst = 1;

    for (const point of OUTER) {
      const turned = raw(turn(point, yaw));

      worst = Math.max(
        worst,
        Math.abs(turned.x - MIDDLE.x) / (BOUNDS.width / 2),
        Math.abs(turned.y - MIDDLE.y) / (BOUNDS.height / 2),
      );
    }
    table.push(1 / worst);
  }
  return table;
})();

/**
 * How much of itself the board keeps at this angle: 1 facing front,
 * and least of all corner-on. Read between the degrees rather than
 * rounded to one, so that turning it is smooth
 */
function fitAt(yaw: Yaw): number {
  const degrees = ((((yaw * 180) / Math.PI) % 90) + 90) % 90;
  const step = Math.floor(degrees);

  return FIT[step] + (FIT[step + 1] - FIT[step]) * (degrees - step);
}

/**
 * How wide and tall the picture is, as a fraction of its width. The
 * board is wider than it is deep once it is laid back, so the canvas
 * is no longer square — a square one would be half empty
 */
export const ASPECT = BOUNDS.height / BOUNDS.width;

/**
 * How wide the picture is in board widths. The picture is not the
 * board — there is an apron and four letters around it — so a painter
 * multiplies its cell size by this to get cells the size it asked for
 */
export const PICTURE_SPAN = BOUNDS.width;

/**
 * How much of a screen the picture may take. Drawn edge to edge, the
 * corners are cut off the moment the camera is walked round; a little
 * kept back keeps the far corner a corner rather than a straight line
 */
const PICTURE_INSET = 0.96;

/**
 * And how much of the bottom is the menu's. South's compass letter
 * wants the same spot, so the picture keeps out of it — a button
 * reached for without looking should not move
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
  const room = {
    width: width * PICTURE_INSET,
    height: height * (PICTURE_INSET - PICTURE_FLOOR),
  };
  const drawn = Math.min(room.width, room.height / ASPECT);

  return {
    x: (width - drawn) / 2,
    // Centred in what is left once the menu has had its strip, rather
    // than in the screen: centred in the screen, the picture would sit
    // under the menu by half of it
    y: (height * (1 - PICTURE_FLOOR) - drawn * ASPECT) / 2,
    width: drawn,
    height: drawn * ASPECT,
  };
}

/**
 * Where a ground point lands, in fractions of the drawn picture.
 * Fractions rather than pixels because three sizes are in play — the
 * canvas' resolution, its size on screen, and the box a test measures
 */
export function projectGround(point: GroundPoint, yaw: Yaw = 0): ProjectedPoint {
  const projected = raw(turn(point, yaw));
  // Drawn toward the middle of the picture by however much the board
  // has given up at this angle. Whatever is standing on it gives up
  // the same, which is why the factor rides home on `scale`: a pokemon
  // is drawn the size of the ground it is standing on
  const fit = fitAt(yaw);

  return {
    x: (MIDDLE.x + (projected.x - MIDDLE.x) * fit - BOUNDS.left) / BOUNDS.width,
    y: (MIDDLE.y + (projected.y - MIDDLE.y) * fit - BOUNDS.top) / BOUNDS.height,
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
  // The shrinking comes off first, since it is the last thing the
  // forward transform does
  const fit = fitAt(yaw);
  const px = MIDDLE.x + (x * BOUNDS.width + BOUNDS.left - MIDDLE.x) / fit;
  const py = MIDDLE.y + (y * BOUNDS.height + BOUNDS.top - MIDDLE.y) / fit;

  /**
   * Solved rather than searched. With `t` for the depth either side of
   * the middle row the forward transform is
   *
   *     py = t * F * DEPTH / (F - t * DEPTH)
   *
   * which rearranges to the line below
   */
  const t = (py * FOCAL) / (FOCAL * DEPTH + py * DEPTH);
  const v = t + 0.5;

  // ...and then turned back, since the turn is the first thing the
  // forward transform does and so the last thing this one undoes
  return turn({ u: px / scaleAt(v) + 0.5, v }, -yaw);
}

/**
 * A cell of the drawn board, across and back from the chunk's top left
 * corner. A chunk cell has both in `0..CHUNK_CELLS - 1`; the apron is
 * one step outside that. The four apron corners are not cells: a
 * player only steps onto the apron straight
 */
export interface BoardCell {
  x: number;
  y: number;
}

/**
 * Whether the coordinates name a cell that is actually drawn — the
 * chunk, or the apron beside one of its four edges
 */
export function isBoardCell(cell: BoardCell): boolean {
  const outX = cell.x < 0 || cell.x >= CHUNK_CELLS;
  const outY = cell.y < 0 || cell.y >= CHUNK_CELLS;

  if (outX && outY) {
    return false;
  }
  return (
    cell.x >= -BORDER_CELLS &&
    cell.y >= -BORDER_CELLS &&
    cell.x < CHUNK_CELLS + BORDER_CELLS &&
    cell.y < CHUNK_CELLS + BORDER_CELLS
  );
}

/**
 * Whether this is a threshold rather than a piece of the chunk
 */
export function isBorderCell(cell: BoardCell): boolean {
  return cell.x < 0 || cell.y < 0 || cell.x >= CHUNK_CELLS || cell.y >= CHUNK_CELLS;
}

/**
 * Every cell the painter has to draw, the chunk and its apron
 */
export function boardCells(): BoardCell[] {
  const cells: BoardCell[] = [];

  for (let y = -BORDER_CELLS; y < CHUNK_CELLS + BORDER_CELLS; y++) {
    for (let x = -BORDER_CELLS; x < CHUNK_CELLS + BORDER_CELLS; x++) {
      if (isBoardCell({ x, y })) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
}

/**
 * Which chunk cell this is, or null for a threshold
 */
export function chunkCellOf(cell: BoardCell): number | null {
  return isBorderCell(cell) ? null : cell.y * CHUNK_CELLS + cell.x;
}

/**
 * Where a chunk cell sits on the board
 */
export function boardCellOf(index: number): BoardCell {
  return { x: index % CHUNK_CELLS, y: Math.floor(index / CHUNK_CELLS) };
}

/**
 * The way out of the chunk a threshold cell is: the edge cell stepped
 * off, and the step that takes the player over. Null for anything that
 * is not a threshold. The step is the ordinary one, so nothing about
 * crossing a boundary had to learn that the apron exists
 */
export function borderExit(cell: BoardCell): { cell: number; step: [number, number] } | null {
  if (!isBoardCell(cell) || !isBorderCell(cell)) {
    return null;
  }

  /**
   * Which side of the chunk this is off: -1 before the first cell, 1
   * past the last, and 0 for the axis the threshold is level with
   */
  const beyond = (along: number): number => {
    if (along < 0) {
      return -1;
    }
    return along >= CHUNK_CELLS ? 1 : 0;
  };
  const step: [number, number] = [beyond(cell.x), beyond(cell.y)];
  const from = {
    x: Math.min(CHUNK_CELLS - 1, Math.max(0, cell.x)),
    y: Math.min(CHUNK_CELLS - 1, Math.max(0, cell.y)),
  };

  return { cell: from.y * CHUNK_CELLS + from.x, step };
}

/**
 * The middle of a board cell, as a fraction of the picture
 */
export function projectBoardCell(cell: BoardCell, yaw: Yaw = 0): ProjectedPoint {
  return projectGround({ u: (cell.x + 0.5) / CHUNK_CELLS, v: (cell.y + 0.5) / CHUNK_CELLS }, yaw);
}

/**
 * The four corners of a board cell, clockwise from the far left one. A
 * cell is a quad rather than a square now: the two far corners are
 * closer together than the two near ones
 */
export function projectBoardCellQuad(cell: BoardCell, yaw: Yaw = 0): ProjectedPoint[] {
  const left = cell.x / CHUNK_CELLS;
  const right = (cell.x + 1) / CHUNK_CELLS;
  const far = cell.y / CHUNK_CELLS;
  const near = (cell.y + 1) / CHUNK_CELLS;

  return [
    projectGround({ u: left, v: far }, yaw),
    projectGround({ u: right, v: far }, yaw),
    projectGround({ u: right, v: near }, yaw),
    projectGround({ u: left, v: near }, yaw),
  ];
}

/**
 * The middle of a chunk cell, as a fraction of the picture. It is where
 * a pointer is aimed and where a sprite stands
 */
export function projectCell(index: number, yaw: Yaw = 0): ProjectedPoint {
  return projectBoardCell(boardCellOf(index), yaw);
}

/**
 * The four corners of a chunk cell
 */
export function projectCellQuad(index: number, yaw: Yaw = 0): ProjectedPoint[] {
  return projectBoardCellQuad(boardCellOf(index), yaw);
}

/**
 * Which way each compass point is, and where its letter stands. They
 * are ground points, so they turn with the board on their own; the
 * letters are drawn upright, since a compass is read by the player
 */
export function compassMarks(yaw: Yaw = 0): (ProjectedPoint & { label: string })[] {
  return (
    [
      ['N', 0, -1],
      ['E', 1, 0],
      ['S', 0, 1],
      ['W', -1, 0],
    ] as const
  ).map(([label, du, dv]) => ({
    label,
    ...projectGround({ u: 0.5 + du * COMPASS_REACH, v: 0.5 + dv * COMPASS_REACH }, yaw),
  }));
}

/**
 * The order cells are painted in: furthest first, so a pokemon in
 * front is drawn over the one behind. Read off the projection rather
 * than by row, since a turned board has a far corner rather than a far
 * row
 */
export function paintOrder(yaw: Yaw = 0): number[] {
  const cells = [...Array.from({ length: CHUNK_CELLS * CHUNK_CELLS }).keys()];
  const depth = cells.map((index) => projectCell(index, yaw).y);

  return cells.sort((one, other) => depth[one] - depth[other]);
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
export function boardCellAtFraction(x: number, y: number, yaw: Yaw = 0): BoardCell | null {
  const { u, v } = unprojectGround(x, y, yaw);
  const cell = { x: Math.floor(u * CHUNK_CELLS), y: Math.floor(v * CHUNK_CELLS) };

  return isBoardCell(cell) ? cell : null;
}

/**
 * The same reading, narrowed to the chunk: a press on the apron is not
 * a press on a cell of it
 */
export function cellAtFraction(x: number, y: number, yaw: Yaw = 0): number | null {
  const cell = boardCellAtFraction(x, y, yaw);

  return cell == null ? null : chunkCellOf(cell);
}
