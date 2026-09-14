import {
  BufferAttribute,
  BufferGeometry,
  Camera,
  CanvasTexture,
  DoubleSide,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from 'three';
import { WALL_BANDS, boardClipDepth, boardClipMatrix, boardView } from '../board';
import { SQUARES } from '../../overworld/grid';
import { FLAT_PITCH, PITCH } from '../tilt';
import { TERRAIN_TILE, type TerrainTiles } from '../terrain-tiles';
import type { CellLook } from '../terrain-cell';
import terrainCell from '../terrain-cell';
import SceneMarks from './scene-marks';

/**
 * The board as a scene with a depth buffer.
 *
 * Everything before this sorted the drawing by hand: the ground, then
 * what stands on it, and a cliff could only hide a sprite if it
 * happened to be painted later. No order answers a tree beside the
 * corner of a raised cell, where one sprite is in front of part of the
 * step and behind another part of it. So the country, the sprites and
 * the marks on the ground all go into one scene at their real depths
 * and the graphics card decides what is in front, a pixel at a time.
 *
 * The camera is the board's own projection rather than one placed to
 * look like it: [`boardClipMatrix`](../board.ts) writes the very
 * transform the rest of the game reads cells through, so a grid ruled
 * on the page lands on the ground it belongs to.
 *
 * The country is one mesh: a quad of ground per cell, whose corners
 * sink to the lowest ground meeting at each of them. The edge tile of
 * a terrace is the cliff, so its high side meets the ground above and
 * its low side the ground below with nothing standing between, and it
 * is a single draw however much country is on screen.
 */

/** How high one terrace step stands, in cells: the board's own rise. */
export const STEP = WALL_BANDS;

/** How many pixels a cell is drawn at, which is the pack's own tile. */
const TILE = TERRAIN_TILE;

/**
 * And how far a mark lying on the ground is brought forward, in cells.
 *
 * A whole cell, not a hair: a mark is given the depth of the cell it
 * belongs to, and a ring drawn round a cell or a shadow thrown across
 * one covers ground nearer the camera than that. Less than the two
 * cells a terrace step stands, so a slope in front of a mark still
 * hides it
 */
const MARK_NUDGE = 1;

/** Where something stands: a board cell, and how high the ground is */
export interface SceneSpot {
  x: number;
  z: number;
  y: number;
}

export interface BoardScene {
  /**
   * Build the country from the look of it, around a world origin.
   * `turns` is how far round the camera has been walked, in quarters,
   * which is what decides the water's edge tiles
   */
  ground: (look: CellLook, origin: [number, number], turns: number) => void;
  /**
   * Where the camera is and how big the page is. `shift` is how far
   * the country is drawn from where it lives, in cells
   */
  look: (
    yaw: number,
    screen: { width: number; height: number },
    picture: { x: number; y: number; width: number; height: number },
    ratio: number,
    shift: [number, number],
  ) => void;
  /** The flat marks, written in the page's own coordinates */
  marks: SceneMarks;
  /**
   * How near the viewer a spot on the board is, for a mark lying on
   * it. `spread` is how far the mark reaches past that spot, in cells
   */
  depthAt: (spot: SceneSpot, spread?: number) => number;
  draw: () => void;
  dispose: () => void;
}

export default function createBoardScene(
  canvas: HTMLCanvasElement,
  pack: TerrainTiles,
  cells: number,
): BoardScene {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false });
  const scene = new Scene();
  const camera = new Camera();

  camera.matrixAutoUpdate = false;

  const page = document.createElement('canvas');

  page.width = cells * TILE;
  page.height = cells * TILE;

  const paint = page.getContext('2d');
  const texture = new CanvasTexture(page);

  // The page holds the colours the tiles were drawn in, so it is read
  // as those rather than as light to be converted: left linear, every
  // tile comes out washed
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;

  /**
   * Opaque, with the holes cut rather than blended: the country is the
   * backdrop everything else is depth-tested against
   */
  const rock = new MeshBasicMaterial({ map: texture, alphaTest: 0.5, side: DoubleSide });
  const country = new Mesh(new BufferGeometry(), rock);

  country.frustumCulled = false;
  scene.add(country);

  const marks = new SceneMarks();

  for (const sheet of marks.meshes) {
    scene.add(sheet);
  }

  const heights = new Float32Array(cells * cells);
  /** The projection, kept so a mark can be given a depth off it */
  let clip = boardClipMatrix(0, { width: 1, height: 1 }, { x: 0, y: 0, width: 1, height: 1 });
  const lens = new Matrix4();
  const sized = { width: 0, height: 0, ratio: 0 };

  /**
   * One cell's quad, with its tile laid on it. Half a texel in on every
   * side, so a quad never samples the tile beside it however the
   * picture is scaled.
   *
   * Corners run far left, far right, near right, near left. The quad is
   * split along whichever diagonal joins the two corners nearest in
   * height, so a slope running across the cell is one plane: split the
   * other way, a step that turns a corner or runs on the diagonal folds
   * into a zigzag from corner to corner
   */
  const quad = (
    spots: number[],
    uvs: number[],
    order: number[],
    corners: number[][],
    cell: [number, number],
  ): void => {
    const start = spots.length / 3;

    for (const corner of corners) {
      spots.push(corner[0], corner[1], corner[2]);
    }
    const u0 = (cell[0] * TILE + 0.5) / page.width;
    const u1 = (cell[0] * TILE + TILE - 0.5) / page.width;
    const v0 = 1 - (cell[1] * TILE + 0.5) / page.height;
    const v1 = 1 - (cell[1] * TILE + TILE - 0.5) / page.height;
    /**
     * The tile's own four corners, hung on the cell's in the world's
     * order. Nothing is laid back here: the country keeps its way
     * round however far the camera is walked, and the one piece of art
     * that does follow the camera, the shore, is turned inside the
     * cell it was composed in
     */
    for (const [u, v] of [
      [u0, v0],
      [u1, v0],
      [u1, v1],
      [u0, v1],
    ]) {
      uvs.push(u, v);
    }
    const falling = Math.abs(corners[0][1] - corners[2][1]);
    const rising = Math.abs(corners[1][1] - corners[3][1]);

    if (rising < falling) {
      order.push(start, start + 3, start + 1, start + 1, start + 3, start + 2);
      return;
    }
    order.push(start, start + 2, start + 1, start, start + 3, start + 2);
  };

  const meshOf = (spots: number[], uvs: number[], order: number[]): BufferGeometry => {
    const made = new BufferGeometry();

    made.setAttribute('position', new BufferAttribute(new Float32Array(spots), 3));
    made.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
    made.setIndex(order);
    return made;
  };

  const ground = (look: CellLook, origin: [number, number], turns: number): void => {
    if (paint == null) {
      return;
    }
    // Flat on there is no elevation at all: the rest of the board zeroes
    // every height, and lifted here alone the ground would stand nearer
    // the camera than everything on it. The cliff tile still marks the
    // step, since it is picked from the levels rather than the heights
    const laidBack = boardView().mode !== '2d';
    const middle = cells / 2;

    const at = (x: number, z: number): number => z * cells + x;

    paint.clearRect(0, 0, page.width, page.height);
    paint.imageSmoothingEnabled = false;

    for (let z = 0; z < cells; z += 1) {
      for (let x = 0; x < cells; x += 1) {
        heights[at(x, z)] = laidBack ? (look.level?.(origin[0] + x, origin[1] + z) ?? 0) * STEP : 0;
      }
    }

    const spots: number[] = [];
    const uvs: number[] = [];
    const order: number[] = [];

    /**
     * How low the ground lies at one corner of the grid: the lowest of
     * the four cells that meet there. Two cells sharing a corner read
     * the same four, so a cliff tile's low side meets the ground below
     * it and its high side the ground above, with no gap between
     */
    const sunken = (cx: number, cz: number): number => {
      let low = Number.POSITIVE_INFINITY;

      for (const [ox, oz] of SQUARES) {
        const ax = cx + ox;
        const az = cz + oz;

        if (ax < 0 || az < 0 || ax >= cells || az >= cells) {
          continue;
        }
        low = Math.min(low, heights[at(ax, az)]);
      }
      return low;
    };

    for (let z = 0; z < cells; z += 1) {
      for (let x = 0; x < cells; x += 1) {
        const world: [number, number] = [origin[0] + x, origin[1] + z];
        const left = x - middle;
        const right = left + 1;
        const far = z - middle;
        const near = far + 1;
        const corners = [
          [left, sunken(x, z), far],
          [right, sunken(x + 1, z), far],
          [right, sunken(x + 1, z + 1), near],
          [left, sunken(x, z + 1), near],
        ];
        // The camera's quarter goes in for the shore alone, which is
        // the one edge that has to be picked and laid back to read
        // right from every side
        const tile = terrainCell(pack, look, world[0], world[1], undefined, turns, laidBack);

        if (tile != null) {
          paint.drawImage(tile, x * TILE, z * TILE);
        }
        quad(spots, uvs, order, corners, [x, z]);
      }
    }
    texture.needsUpdate = true;
    country.geometry.dispose();
    country.geometry = meshOf(spots, uvs, order);
  };

  /**
   * The tilt, which the lean and the nudge are both taken from. Read
   * every frame rather than fixed: the flat board is seen from
   * straight above, where a standing picture lies on the ground
   */
  let lean = (PITCH * Math.PI) / 180;
  let rise = Math.cos(lean);
  let away = Math.sin(lean);

  return {
    ground,
    marks,
    look: (yaw, screen, picture, ratio, shift): void => {
      lean = ((boardView().mode === '2d' ? FLAT_PITCH : PITCH) * Math.PI) / 180;
      rise = Math.cos(lean);
      away = Math.sin(lean);
      clip = boardClipMatrix(yaw, screen, picture);
      lens.fromArray(clip).transpose();
      camera.projectionMatrix.copy(lens);
      camera.projectionMatrixInverse.copy(lens).invert();
      // The country is drawn where the camera has got to rather than
      // where it lives, which is what makes a step a scroll
      country.position.set(shift[0], 0, shift[1]);

      if (sized.width !== screen.width || sized.height !== screen.height || sized.ratio !== ratio) {
        renderer.setPixelRatio(ratio);
        renderer.setSize(screen.width, screen.height, false);
        sized.width = screen.width;
        sized.height = screen.height;
        sized.ratio = ratio;
      }
    },
    depthAt: (spot, spread = MARK_NUDGE): number =>
      // Moved toward the camera, so a mark is neither in a tie with
      // the ground it is drawn over nor behind the ground in front
      boardClipDepth(
        clip,
        spot.x - cells / 2 + 0.5,
        spot.y + spread * away,
        spot.z - cells / 2 + 0.5 + spread * rise,
      ),
    draw: (): void => {
      marks.end();
      renderer.render(scene, camera);
    },
    dispose: (): void => {
      marks.dispose();
      country.geometry.dispose();
      rock.dispose();
      texture.dispose();
      renderer.dispose();
      // Browsers cap live contexts, and dispose alone leaves this one held until collected
      renderer.forceContextLoss();
    },
  };
}
