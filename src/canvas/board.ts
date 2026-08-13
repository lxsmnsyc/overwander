import { CHUNK_CELLS } from '../overworld/chunk';

/**
 * The chunk seen from a chair rather than from a satellite.
 *
 * The board used to be drawn flat: a square of square cells, straight
 * down. That reads as a map, and what it is meant to read as is a
 * *place* — so the ground is laid back under the camera and the
 * pokemon standing on it are drawn upright, which is what makes them
 * look like they are standing on something rather than printed on it.
 *
 * Everything here is one projection and its inverse. Nothing else in
 * the game may work out where a cell is: the painter asks for the
 * corners, the pointer asks which cell it is over, and the browser
 * test asks where to click. Three readings of one transform, so a
 * pitch changed here changes all three at once.
 */

/**
 * How far above the board the camera sits, in degrees.
 *
 * 90 is straight down — the flat map this replaced. 0 is on the
 * ground, where the board would collapse to a line. 60 leaves the
 * near rows nearly square, foreshortens the far ones, and leaves a
 * sprite room to stand up in front of the row behind it
 */
export const PITCH = 60;

/**
 * How much of the board's depth survives the tilt. Straight down it
 * is all of it; edge-on it is none
 */
const DEPTH = Math.sin((PITCH * Math.PI) / 180);

/**
 * How far the camera stands back, in board widths.
 *
 * It is what makes the far edge narrower than the near one — the
 * difference between a tilted picture and a perspective one. Small
 * numbers are a wide lens: the board flares out toward the player and
 * the far rows crowd together. Large numbers flatten it back toward a
 * plain squash. This is a middle: the trapezoid is plain to see and
 * the far row is still comfortably wide enough for a sprite
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
 * there.
 *
 * `scale` is the whole of the third dimension: a cell twice as far
 * away is drawn half the size, and a sprite standing on it takes the
 * same factor. Drawing one at `scale` is what makes a row of pokemon
 * recede instead of standing in a line of identical cut-outs
 */
export interface ProjectedPoint {
  x: number;
  y: number;
  scale: number;
}

/**
 * Which way round the board is being looked at, in radians, turning
 * about its own middle.
 *
 * Everything below takes it rather than reading it from anywhere: the
 * board has no opinion about where the camera is standing, and the
 * canvas that does hands it in with every question it asks
 */
export type Yaw = number;

/**
 * A ground point turned about the middle of the board.
 *
 * The turn happens **before** the tilt, which is what makes it a
 * camera walking around a table rather than a picture being spun on
 * the screen: the far edge stays far, and a cell that swings toward
 * the viewer is drawn nearer and larger as it comes
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
 * The corners of the board, which is what it has to be fitted by: the
 * near edge is the widest thing in the picture and the far edge the
 * narrowest, so neither the width nor the height is the board's own
 */
const BOUNDS = ((): { left: number; top: number; width: number; height: number } => {
  const corners: ProjectedPoint[] = [];

  /**
   * Measured over **every** angle the board can be turned to, not
   * only the one it starts at.
   *
   * A frame fitted to the square as it stands would have to grow and
   * shrink as the board turned inside it, which reads as the board
   * lurching toward and away from the camera while the player is only
   * walking around it. Fitted once to the widest the board ever gets
   * — corner-on — the picture holds still and the turning is the only
   * thing that moves. A quarter turn is all there is to check: past
   * that it is the same square again
   */
  for (let step = 0; step <= 90; step++) {
    const yaw = (step * Math.PI) / 180;

    for (const corner of [
      { u: 0, v: 0 },
      { u: 1, v: 0 },
      { u: 0, v: 1 },
      { u: 1, v: 1 },
    ]) {
      corners.push(raw(turn(corner, yaw)));
    }
  }

  const left = Math.min(...corners.map((corner) => corner.x));
  const top = Math.min(...corners.map((corner) => corner.y));

  // The real extent rather than twice the furthest corner: the board
  // is not symmetric about its own middle once it is laid back, since
  // the near edge is both wider and further from the centre than the
  // far one
  return {
    left,
    top,
    width: Math.max(...corners.map((corner) => corner.x)) - left,
    height: Math.max(...corners.map((corner) => corner.y)) - top,
  };
})();

/**
 * How wide and tall the picture is, as a fraction of its width. The
 * board is wider than it is deep once it is laid back, so the canvas
 * is no longer square — a square one would be half empty
 */
export const ASPECT = BOUNDS.height / BOUNDS.width;

/**
 * Where a ground point lands, in fractions of the drawn picture: 0 to
 * 1 across and 0 to 1 down.
 *
 * Fractions rather than pixels because there are three sizes in play
 * — the canvas' own resolution, the size it is stretched to on
 * screen, and the box a browser test measures — and a fraction is
 * true of all of them
 */
export function projectGround(point: GroundPoint, yaw: Yaw = 0): ProjectedPoint {
  const projected = raw(turn(point, yaw));

  return {
    x: (projected.x - BOUNDS.left) / BOUNDS.width,
    y: (projected.y - BOUNDS.top) / BOUNDS.height,
    scale: projected.scale,
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
  const px = x * BOUNDS.width + BOUNDS.left;
  const py = y * BOUNDS.height + BOUNDS.top;

  /**
   * Solved rather than searched. With `t` for the depth either side of
   * the middle row, the forward transform is
   *
   *     py = t * F * DEPTH / (F - t * DEPTH)
   *
   * which rearranges to the line below; the across-ness then falls out
   * of the scale that depth implies
   */
  const t = (py * FOCAL) / (FOCAL * DEPTH + py * DEPTH);
  const v = t + 0.5;

  // ...and then turned back, since the turn is the first thing the
  // forward transform does and so the last thing this one undoes
  return turn({ u: px / scaleAt(v) + 0.5, v }, -yaw);
}

/**
 * The middle of a cell, as a fraction of the picture. It is where a
 * pointer is aimed and where a sprite stands
 */
export function projectCell(index: number, yaw: Yaw = 0): ProjectedPoint {
  return projectGround(
    {
      u: ((index % CHUNK_CELLS) + 0.5) / CHUNK_CELLS,
      v: (Math.floor(index / CHUNK_CELLS) + 0.5) / CHUNK_CELLS,
    },
    yaw,
  );
}

/**
 * The four corners of a cell, clockwise from the far left one. A cell
 * is a quad rather than a square now: the two far corners are closer
 * together than the two near ones
 */
export function projectCellQuad(index: number, yaw: Yaw = 0): ProjectedPoint[] {
  const left = (index % CHUNK_CELLS) / CHUNK_CELLS;
  const right = ((index % CHUNK_CELLS) + 1) / CHUNK_CELLS;
  const far = Math.floor(index / CHUNK_CELLS) / CHUNK_CELLS;
  const near = (Math.floor(index / CHUNK_CELLS) + 1) / CHUNK_CELLS;

  return [
    projectGround({ u: left, v: far }, yaw),
    projectGround({ u: right, v: far }, yaw),
    projectGround({ u: right, v: near }, yaw),
    projectGround({ u: left, v: near }, yaw),
  ];
}

/**
 * The order the cells have to be painted in: furthest from the camera
 * first, so a pokemon standing in front is drawn over the one behind
 * rather than through it.
 *
 * It is the row order only while the board faces front. Turned, the
 * far corner is a corner rather than a row, so the order is read off
 * the projection itself — which is the only thing that knows what
 * "further away" means once the camera has moved
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
 * Which way a thing standing on the board is facing, once the camera
 * has been walked around it.
 *
 * A pokemon faces a direction in the **world** — the way it was
 * standing when the window rolled it — and what the player sees is
 * that direction from wherever they are now. Turn the camera a
 * quarter and something that was facing you is facing across you.
 *
 * The eight sheet directions are what it lands on, so the answer is
 * rounded to the nearest of them
 */
export function facingFrom(worldFacing: number, yaw: Yaw = 0): number {
  const eighth = (2 * Math.PI) / SPRITE_FACINGS;
  const turned = Math.round((worldFacing * eighth - yaw) / eighth);

  return ((turned % SPRITE_FACINGS) + SPRITE_FACINGS) % SPRITE_FACINGS;
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
 * Which cell a fraction of the picture is over, or null for a press
 * that landed on the ground beside the board — which is most of the
 * top two corners now that the board is a trapezoid
 */
export function cellAtFraction(x: number, y: number, yaw: Yaw = 0): number | null {
  const { u, v } = unprojectGround(x, y, yaw);
  const column = Math.floor(u * CHUNK_CELLS);
  const row = Math.floor(v * CHUNK_CELLS);

  if (column < 0 || row < 0 || column >= CHUNK_CELLS || row >= CHUNK_CELLS) {
    return null;
  }
  return row * CHUNK_CELLS + column;
}
