import projectField, {
  type FieldPoint,
  type FieldView,
  horizonOf,
  unprojectField,
} from '../../../canvas/battle/field';
import type BiomeTileset from '../../../canvas/biome-tileset';
import { type TileSpot, variantAt } from '../../../canvas/biome-tileset';
import type { QuadPoint } from '../../../canvas/gl/quad-batch';
import type QuadBatch from '../../../canvas/gl/quad-batch';

/**
 * The ground a fight is standing on, drawn from the biome's own
 * tileset.
 *
 * The same tiles the overworld lays on a chunk, put through the
 * battle's projection instead of the board's: a raid in a bog is
 * fought on the bog. A battle with no biome of its own, and one whose
 * biome nobody has packed a tileset for, keeps the plain field colour
 * that was there before any of this.
 *
 * Nothing here is picked per cell the way a chunk's tiles are. A chunk
 * has a map to read and edges to blend; a battlefield is one terrain
 * from end to end, so every tile is the fully-surrounded case and the
 * only thing that varies is which of the biome's variants it draws.
 */

/**
 * How many field units one tile covers.
 *
 * Chosen so a tile lands at about twice its own size on the screen at
 * the middle of the field, which is the scale the overworld draws its
 * ground at on an ordinary window
 */
const TILE_UNITS = 8;

/** The tile case with the same terrain on all eight sides. */
const SOLID = 255;

/**
 * How far out the ground is laid, in field units.
 *
 * The plane runs to the horizon, and the horizon is off the top of the
 * picture at the ordinary camera, so a bound is needed or the loop is
 * unbounded. This is comfortably past the far edge of the canvas
 */
const REACH = 300;

/**
 * How many points along each side of the picture are put back through
 * the projection to find what ground is in shot
 */
const SAMPLES = 6;

/**
 * How much larger than the middle of the field a tile may be drawn.
 *
 * The projection guards the horizon but not the camera's own back: the
 * ground plane runs behind the viewer, and a point there comes back
 * with a negative scale and a place on the canvas that is a reflection
 * rather than a position. Between the two is ground so close to the
 * lens that one tile covers the screen. Neither is worth drawing, and
 * both are ruinous to draw: this is what says so
 */
const NEAREST = 4;

/**
 * The part of the canvas the ground has to cover, in the drawing's own
 * coordinates. It is larger than the picture: the canvas is the whole
 * page with the field centred in it, and the margins are field too
 */
export interface FloorRegion {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The patch of ground in shot, in field units. */
interface Patch {
  fromX: number;
  toX: number;
  fromZ: number;
  toZ: number;
}

/**
 * What ground the picture is looking at, read by putting the corners
 * of the canvas back through the projection.
 *
 * Sampling rather than solving, because the camera turns: the visible
 * ground is a trapezoid at any yaw, and its bounding box in the
 * world's own axes is what the tiling loop needs. Where any sample
 * lands above the horizon the ground runs past the picture on that
 * side, and the whole reach is taken instead
 */
function coverage(view: FieldView, region: FloorRegion): Patch | null {
  let fromX = Number.POSITIVE_INFINITY;
  let toX = Number.NEGATIVE_INFINITY;
  let fromZ = Number.POSITIVE_INFINITY;
  let toZ = Number.NEGATIVE_INFINITY;
  let sky = false;

  for (let across = 0; across <= SAMPLES; across++) {
    const x = region.left + ((region.right - region.left) * across) / SAMPLES;

    for (let down = 0; down <= SAMPLES; down++) {
      const y = region.top + ((region.bottom - region.top) * down) / SAMPLES;
      const place = unprojectField(x, y, view);

      if (place == null) {
        sky = true;
        continue;
      }
      fromX = Math.min(fromX, place.x);
      toX = Math.max(toX, place.x);
      fromZ = Math.min(fromZ, place.z);
      toZ = Math.max(toZ, place.z);
    }
  }

  if (sky) {
    return { fromX: -REACH, toX: REACH, fromZ: -REACH, toZ: REACH };
  }
  if (fromX > toX) {
    return null;
  }
  // One tile past what was measured, since the samples are points and
  // the tiles they fall in reach further than they do
  const clamp = (value: number): number => Math.max(-REACH, Math.min(REACH, value));

  return {
    fromX: clamp(fromX - TILE_UNITS),
    toX: clamp(toX + TILE_UNITS),
    fromZ: clamp(fromZ - TILE_UNITS),
    toZ: clamp(toZ + TILE_UNITS),
  };
}

/**
 * The ground's own colour, worked out once per tileset by shrinking one
 * of its tiles to a single pixel.
 *
 * It is laid under the tiles as far back as the ground goes. Tiles meet
 * the horizon on a stepped line, being square and the horizon not, and
 * a step that showed the field colour through would read as a hole in
 * the world rather than as distance
 */
const HAZE = new WeakMap<BiomeTileset, string>();

function hazeOf(tiles: BiomeTileset, spot: TileSpot, tile: number): string {
  const known = HAZE.get(tiles);

  if (known != null) {
    return known;
  }
  const patch = document.createElement('canvas');

  patch.width = 1;
  patch.height = 1;

  const into = patch.getContext('2d', { willReadFrequently: true });
  let colour = 'transparent';

  if (into != null) {
    into.drawImage(spot.sheet, spot.x, spot.y, tile, tile, 0, 0, 1, 1);

    const [red, green, blue] = into.getImageData(0, 0, 1, 1).data;

    colour = `rgb(${red} ${green} ${blue})`;
  }
  HAZE.set(tiles, colour);
  return colour;
}

/**
 * The longer of two edges pointing the same way round the cell, as a
 * vector. Both run the same direction, so taking either keeps the tile
 * the right way up
 */
function longer(
  fromOne: { x: number; y: number },
  toOne: { x: number; y: number },
  fromOther: { x: number; y: number },
  toOther: { x: number; y: number },
): { x: number; y: number } {
  const one = { x: toOne.x - fromOne.x, y: toOne.y - fromOne.y };
  const other = { x: toOther.x - fromOther.x, y: toOther.y - fromOther.y };

  return one.x * one.x + one.y * one.y >= other.x * other.x + other.y * other.y ? one : other;
}

/** How far past its own cell a tile is drawn, as a fraction of one. */
const OVERLAP = 0.06;

/**
 * How far inside its own edges a tile is sampled, in the sheet's
 * pixels. Half of one, which is where a linear sampler stops reaching
 * past the rectangle it was asked for
 */
const INSET = 0.5;

/**
 * The cell's corners pushed out by the overlap, read across the quad
 * rather than along its axes. A tilted cell is not a parallelogram, so
 * its far edge grows by less than its near one
 */
function grown(corners: QuadPoint[]): QuadPoint[] {
  const [farLeft, farRight, nearRight, nearLeft] = corners;
  const spot = (u: number, v: number): QuadPoint => ({
    x:
      (1 - u) * (1 - v) * farLeft.x +
      u * (1 - v) * farRight.x +
      u * v * nearRight.x +
      (1 - u) * v * nearLeft.x,
    y:
      (1 - u) * (1 - v) * farLeft.y +
      u * (1 - v) * farRight.y +
      u * v * nearRight.y +
      (1 - u) * v * nearLeft.y,
  });
  const low = -OVERLAP;
  const high = 1 + OVERLAP;

  return [spot(low, low), spot(high, low), spot(high, high), spot(low, high)];
}

/**
 * One tile laid on a patch of ground.
 *
 * A canvas draws an image through an affine transform, which gives a
 * parallelogram, and a cell of a tilted plane is not one: its far edge
 * is shorter than its near edge. The board can ignore that, being
 * barely tilted across a cell. A battlefield cannot, and which
 * parallelogram is chosen is the whole difference between a floor and
 * a floor full of holes.
 *
 * So it is built from the longer of each pair of opposite edges. Fitted
 * to the shorter one, every tile falls short of the one beside it and
 * the field shows through in wedges; fitted to the longer one it laps
 * over instead, and an overlap on ground is nothing at all. Which of
 * the two is longer changes as the camera walks round, so it is
 * measured rather than assumed
 */
function layTile(
  context: CanvasRenderingContext2D,
  spot: TileSpot,
  tile: number,
  corners: { x: number; y: number }[],
): void {
  const [farLeft, farRight, nearRight, nearLeft] = corners;
  const across = longer(farLeft, farRight, nearLeft, nearRight);
  const down = longer(farLeft, nearLeft, farRight, nearRight);
  const acrossX = across.x;
  const acrossY = across.y;
  const downX = down.x;
  const downY = down.y;

  // A tile the camera is looking at edge-on has no area to draw into,
  // and its transform cannot be inverted
  if (Math.abs(acrossX * downY - acrossY * downX) < 1) {
    return;
  }

  context.save();
  context.transform(acrossX, acrossY, downX, downY, farLeft.x, farLeft.y);
  context.drawImage(
    spot.sheet,
    spot.x,
    spot.y,
    tile,
    tile,
    -OVERLAP,
    -OVERLAP,
    1 + OVERLAP * 2,
    1 + OVERLAP * 2,
  );
  context.restore();
}

/**
 * Lay the biome's ground over the picture.
 *
 * Drawn before anything standing on it, so there is nothing to sort:
 * the floor is under the whole fight by definition
 */
export default function drawFloor(
  context: CanvasRenderingContext2D,
  tiles: BiomeTileset,
  view: FieldView,
  region: FloorRegion,
  now: number,
  onto?: QuadBatch,
): void {
  if (!tiles.has('ground')) {
    return;
  }
  const patch = coverage(view, region);

  if (patch == null) {
    return;
  }

  const variants = tiles.data.variants;
  const sample = tiles.tileAt('ground', SOLID, 0, now);

  if (sample == null) {
    return;
  }
  // Everything from the horizon down is ground, whatever the tiles
  // manage to cover of it
  const skyline = Math.max(region.top, horizonOf(view));

  const haze = hazeOf(tiles, sample, tiles.tile);

  if (onto == null) {
    context.fillStyle = haze;
    context.fillRect(region.left, skyline, region.right - region.left, region.bottom - skyline);
  } else {
    onto.solid(haze, [
      { x: region.left, y: skyline },
      { x: region.right, y: skyline },
      { x: region.right, y: region.bottom },
      { x: region.left, y: region.bottom },
    ]);
  }

  const first = Math.floor(patch.fromX / TILE_UNITS);
  const last = Math.floor(patch.toX / TILE_UNITS);
  const nearest = Math.floor(patch.fromZ / TILE_UNITS);
  const furthest = Math.floor(patch.toZ / TILE_UNITS);
  const corners: FieldPoint[] = [
    { x: 0, z: 0 },
    { x: 0, z: 0 },
    { x: 0, z: 0 },
    { x: 0, z: 0 },
  ];

  for (let column = first; column <= last; column++) {
    for (let row = nearest; row <= furthest; row++) {
      const x = column * TILE_UNITS;
      const z = row * TILE_UNITS;
      // The middle of the cell first, and the corners only for the
      // cells that middle puts anywhere near the picture. A field runs
      // far enough past the frame that most of what this walks over is
      // nowhere in shot, and finding that out four projections at a
      // time is most of the work
      const middle = projectField({ x: x + TILE_UNITS / 2, z: z + TILE_UNITS / 2 }, view);

      if (!middle.visible || middle.scale <= 0 || middle.scale > NEAREST) {
        continue;
      }
      // Generous: a cell is drawn as a slanted quad, and how far that
      // reaches from its middle depends on where the camera is
      const room = TILE_UNITS * view.unit * middle.scale;

      if (
        middle.x + room < region.left ||
        middle.x - room > region.right ||
        middle.y + room < region.top ||
        middle.y - room > region.bottom
      ) {
        continue;
      }

      // The far edge first and then round, which is the winding
      // `layTile` lays its tile along
      corners[0] = { x, z: z + TILE_UNITS };
      corners[1] = { x: x + TILE_UNITS, z: z + TILE_UNITS };
      corners[2] = { x: x + TILE_UNITS, z };
      corners[3] = { x, z };

      const laid = corners.map((corner) => projectField(corner, view));

      if (laid.some((point) => !point.visible || point.scale <= 0 || point.scale > NEAREST)) {
        continue;
      }
      // Whether any of it is in shot. A field is deeper than the
      // picture and the camera turns inside it, so most of the ground
      // the loop walks over is off the edge
      const left = Math.min(...laid.map((point) => point.x));
      const right = Math.max(...laid.map((point) => point.x));
      const top = Math.min(...laid.map((point) => point.y));
      const bottom = Math.max(...laid.map((point) => point.y));

      if (
        right < region.left ||
        left > region.right ||
        bottom < region.top ||
        top > region.bottom
      ) {
        continue;
      }

      const spot = tiles.tileAt('ground', SOLID, variantAt(column, row, variants), now);

      if (spot == null) {
        continue;
      }
      // The tile is never turned: the ground is a surface rather than
      // a picture of one, so it swings with the camera the way the
      // pokemon standing on it do
      if (onto == null || !(spot.sheet instanceof HTMLCanvasElement)) {
        layTile(context, spot, tiles.tile, laid);
        continue;
      }
      // Written as the quad it actually covers. A 2D context can only
      // fit a parallelogram to a tilted cell, which is what `layTile`
      // measures the longer edges for; a pair of triangles takes the
      // cell as it is
      onto.quad(
        spot.sheet,
        // Half a texel in on every side. A 2D context samples inside
        // the rectangle it was given; a sampler does not, and these
        // tiles are packed against each other, so the edge of one
        // reads as a stripe of whatever was packed beside it
        {
          x: spot.x + INSET,
          y: spot.y + INSET,
          width: tiles.tile - INSET * 2,
          height: tiles.tile - INSET * 2,
        },
        grown(laid),
        1,
        undefined,
        'smooth',
      );
    }
  }
}
