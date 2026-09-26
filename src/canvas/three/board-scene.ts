import {
  BufferAttribute,
  BufferGeometry,
  Camera,
  CanvasTexture,
  DoubleSide,
  DynamicDrawUsage,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { WALL_BANDS, boardClipDepth, boardClipMatrix, boardView } from '../board';
import { SKY_BANDS } from '../daylight';
import parseColour, { type Colour } from '../gl/colour';
import { VIEW_RADIUS } from '../../overworld/board';
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

/**
 * How deep a strip of cells is painted again along the edge a step walks into,
 * counted from the old edge. More than the one new row, so a tile composed at
 * the old edge from what lay just past it is composed again once it is inside
 */
const SLIDE_STRIP = 2;

/** How far from the player the haze begins, in cells. It is whole sky by `VIEW_RADIUS` */
const HAZE_START = VIEW_RADIUS - 6;

/** How many steps the haze takes, so what stands in it fades the way the ground's pixels do */
const HAZE_STEPS = 4;

/** How much of the haze a spot this far from the player carries, from 0 to 1 */
export function hazeAt(reach: number): number {
  const share = Math.min(1, Math.max(0, (reach - HAZE_START) / (VIEW_RADIUS - HAZE_START)));

  return Math.ceil(share * HAZE_STEPS) / HAZE_STEPS;
}

/**
 * The haze written into the ground's shader. Each pixel of tile art is
 * sky or ground, never a blend: a 4x4 ordered dither decides which, so
 * the rim breaks up in the art's own pixels. The sky is the backdrop's
 * own bands, so a pixel gone to sky matches what is behind it
 */
const HAZE_VERTEX = `
varying vec2 hazeLocal;
varying vec2 hazeShift;
`;

const HAZE_FRAGMENT = `
uniform vec3 hazeTop;
uniform vec3 hazeBottom;
uniform float hazeScreen;
uniform float hazeOn;
varying vec2 hazeLocal;
varying vec2 hazeShift;

float hazeBayer(vec2 texel) {
  vec2 at = mod(texel, 4.0);
  int index = int(at.y) * 4 + int(at.x);
  int[16] order = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);

  return (float(order[index]) + 0.5) / 16.0;
}
`;

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
  ground: (
    look: CellLook,
    origin: [number, number],
    turns: number,
    /** The world cell at the page's corner, so a step can slide the page rather than repaint it */
    window: [number, number],
    /** What else the page was painted for, such as the board's shape or the layer underground */
    layer: string,
  ) => void;
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
  /**
   * The colours the ground's rim dissolves into, the sky at the top of
   * the screen and at the bottom, or nothing to leave the rim hard
   */
  haze: (sky: { top: string; bottom: string } | null) => void;
  /**
   * The light the country stands in, asked for at every cell corner in
   * the cells a scene spot is written in. Null leaves it at full
   * daylight.
   *
   * Read after `look`, since the ground is drawn where the camera has
   * got to rather than where it lives
   */
  light: (at: ((x: number, z: number) => Colour) | null) => void;
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
  /** How many cells the scene reaches past the board on each side */
  extra = 0,
): BoardScene {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false });
  const scene = new Scene();
  const camera = new Camera();

  camera.matrixAutoUpdate = false;

  /** A page and the context it is painted through */
  const sheetOf = (): { canvas: HTMLCanvasElement; paint: CanvasRenderingContext2D | null } => {
    const made = document.createElement('canvas');

    made.width = cells * TILE;
    made.height = cells * TILE;
    return { canvas: made, paint: made.getContext('2d') };
  };
  /** The page on show and a spare to slide it into, swapped on every slide */
  let front = sheetOf();
  let back = sheetOf();
  const page = front.canvas;
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
  const rock = new MeshBasicMaterial({
    map: texture,
    alphaTest: 0.5,
    side: DoubleSide,
    // The light the ground is standing in, written on its corners
    vertexColors: true,
  });
  const hazeTop = new Vector3();
  const hazeBottom = new Vector3();
  const hazeScreen = { value: 1 };
  const hazeOn = { value: 0 };

  rock.onBeforeCompile = (shader): void => {
    shader.uniforms.hazeTop = { value: hazeTop };
    shader.uniforms.hazeBottom = { value: hazeBottom };
    shader.uniforms.hazeScreen = hazeScreen;
    shader.uniforms.hazeOn = hazeOn;
    shader.vertexShader = `${HAZE_VERTEX}${shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
      hazeLocal = transformed.xz;
      hazeShift = vec2(modelMatrix[3][0], modelMatrix[3][2]);`,
    )}`;
    // After the colour space, since the backdrop's bands are mixed in the page's own colours
    shader.fragmentShader = `${HAZE_FRAGMENT}${shader.fragmentShader.replace(
      '#include <colorspace_fragment>',
      `#include <colorspace_fragment>
      if (hazeOn > 0.5) {
        vec2 hazeTexel = floor(hazeLocal * ${TILE.toFixed(1)});
        vec2 hazeSpot = (hazeTexel + 0.5) / ${TILE.toFixed(1)} + hazeShift;
        float hazeShare = clamp((length(hazeSpot) - ${HAZE_START.toFixed(1)}) / ${(VIEW_RADIUS - HAZE_START).toFixed(1)}, 0.0, 1.0);

        if (hazeShare > hazeBayer(hazeTexel)) {
          float hazeBand = (floor((1.0 - gl_FragCoord.y / hazeScreen) * ${SKY_BANDS.toFixed(1)}) + 0.5) / ${SKY_BANDS.toFixed(1)};

          gl_FragColor.rgb = mix(hazeTop, hazeBottom, clamp(hazeBand, 0.0, 1.0));
        }
      }`,
    )}`;
  };
  /**
   * One quad per cell, written in place on every build. The tile a quad samples
   * never moves, since the page slides under the quads rather than the other way
   */
  const count = cells * cells;
  const positions = new Float32Array(count * 12);
  const shades = new Float32Array(count * 12).fill(1);
  const tiles = new Float32Array(count * 8);
  const joins = count * 4 > 0xffff ? new Uint32Array(count * 6) : new Uint16Array(count * 6);
  const placed = new BufferAttribute(positions, 3).setUsage(DynamicDrawUsage);
  const lit = new BufferAttribute(shades, 3).setUsage(DynamicDrawUsage);
  const joined = new BufferAttribute(joins, 1).setUsage(DynamicDrawUsage);
  const shape = new BufferGeometry();

  for (let z = 0; z < cells; z += 1) {
    for (let x = 0; x < cells; x += 1) {
      const at = (z * cells + x) * 8;
      // Half a texel in on every side, so a quad never samples the tile beside it
      const u0 = (x * TILE + 0.5) / page.width;
      const u1 = (x * TILE + TILE - 0.5) / page.width;
      const v0 = 1 - (z * TILE + 0.5) / page.height;
      const v1 = 1 - (z * TILE + TILE - 0.5) / page.height;

      // The tile's own corners hung on the cell's in the world's order: the
      // country keeps its way round however far the camera is walked
      tiles[at] = u0;
      tiles[at + 1] = v0;
      tiles[at + 2] = u1;
      tiles[at + 3] = v0;
      tiles[at + 4] = u1;
      tiles[at + 5] = v1;
      tiles[at + 6] = u0;
      tiles[at + 7] = v1;
    }
  }
  shape.setAttribute('position', placed);
  shape.setAttribute('color', lit);
  shape.setAttribute('uv', new BufferAttribute(tiles, 2));
  shape.setIndex(joined);

  const country = new Mesh(shape, rock);

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

  /** What the page shows: the world cell at its corner, and what else it was painted for */
  let shown: { x: number; y: number; layer: string; turns: number; laidBack: boolean } | null =
    null;

  const ground = (
    look: CellLook,
    origin: [number, number],
    turns: number,
    window: [number, number],
    layer: string,
  ): void => {
    // Flat on there is no elevation at all: the rest of the board zeroes
    // every height, and lifted here alone the ground would stand nearer
    // the camera than everything on it. The cliff tile still marks the
    // step, since it is picked from the levels rather than the heights
    const laidBack = boardView().mode !== '2d';
    const middle = cells / 2;
    const width = page.width;
    const height = page.height;

    const at = (x: number, z: number): number => z * cells + x;

    const shiftX = shown == null ? 0 : window[0] - shown.x;
    const shiftY = shown == null ? 0 : window[1] - shown.y;
    // A step, rather than a turn, a new shape or a jump: the country a cell over is
    // already on the page, and only the edge walked into has to be painted
    const slides =
      shown?.layer === layer &&
      shown.turns === turns &&
      shown.laidBack === laidBack &&
      Math.abs(shiftX) < cells &&
      Math.abs(shiftY) < cells;

    if (slides) {
      back.paint?.clearRect(0, 0, width, height);
      back.paint?.drawImage(front.canvas, -shiftX * TILE, -shiftY * TILE);
      [front, back] = [back, front];
      texture.image = front.canvas;
    } else {
      front.paint?.clearRect(0, 0, width, height);
    }

    const paint = front.paint;

    if (paint == null) {
      return;
    }
    paint.imageSmoothingEnabled = false;

    for (let z = 0; z < cells; z += 1) {
      for (let x = 0; x < cells; x += 1) {
        heights[at(x, z)] = laidBack ? (look.level?.(origin[0] + x, origin[1] + z) ?? 0) * STEP : 0;
      }
    }

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
        const cell = at(x, z);
        const left = x - middle;
        const right = left + 1;
        const far = z - middle;
        const near = far + 1;
        // Corners run far left, far right, near right, near left
        const farLeft = sunken(x, z);
        const farRight = sunken(x + 1, z);
        const nearRight = sunken(x + 1, z + 1);
        const nearLeft = sunken(x, z + 1);
        const spot = cell * 12;

        positions[spot] = left;
        positions[spot + 1] = farLeft;
        positions[spot + 2] = far;
        positions[spot + 3] = right;
        positions[spot + 4] = farRight;
        positions[spot + 5] = far;
        positions[spot + 6] = right;
        positions[spot + 7] = nearRight;
        positions[spot + 8] = near;
        positions[spot + 9] = left;
        positions[spot + 10] = nearLeft;
        positions[spot + 11] = near;

        // Split along whichever diagonal joins the two corners nearest in height,
        // so a slope across the cell is one plane rather than a zigzag
        const start = cell * 4;
        const join = cell * 6;

        if (Math.abs(farRight - nearLeft) < Math.abs(farLeft - nearRight)) {
          joins[join] = start;
          joins[join + 1] = start + 3;
          joins[join + 2] = start + 1;
          joins[join + 3] = start + 1;
          joins[join + 4] = start + 3;
          joins[join + 5] = start + 2;
        } else {
          joins[join] = start;
          joins[join + 1] = start + 2;
          joins[join + 2] = start + 1;
          joins[join + 3] = start;
          joins[join + 4] = start + 3;
          joins[join + 5] = start + 2;
        }

        const oldX = x + shiftX;
        const oldZ = z + shiftY;
        const walkedInto =
          (shiftX !== 0 && (oldX < SLIDE_STRIP || oldX >= cells - SLIDE_STRIP)) ||
          (shiftY !== 0 && (oldZ < SLIDE_STRIP || oldZ >= cells - SLIDE_STRIP));

        if (slides && !walkedInto) {
          continue;
        }
        if (slides) {
          paint.clearRect(x * TILE, z * TILE, TILE, TILE);
        }
        // The camera's quarter goes in for the shore alone, which is
        // the one edge that has to be picked and laid back to read
        // right from every side
        const tile = terrainCell(
          pack,
          look,
          origin[0] + x,
          origin[1] + z,
          undefined,
          turns,
          laidBack,
        );

        if (tile != null) {
          paint.drawImage(tile, x * TILE, z * TILE);
        }
      }
    }
    shown = { x: window[0], y: window[1], layer, turns, laidBack };
    texture.needsUpdate = true;
    placed.needsUpdate = true;
    joined.needsUpdate = true;
  };

  /**
   * The tilt, which the lean and the nudge are both taken from. Read
   * every frame rather than fixed: the flat board is seen from
   * straight above, where a standing picture lies on the ground
   */
  let lean = (PITCH * Math.PI) / 180;
  let rise = Math.cos(lean);
  let away = Math.sin(lean);

  /** Whether the country is carrying light of its own, so white is written back only once */
  let shaded = false;

  const light = (at: ((x: number, z: number) => Colour) | null): void => {
    if (at == null) {
      if (!shaded) {
        return;
      }
      shades.fill(1);
      lit.needsUpdate = true;
      shaded = false;
      return;
    }
    // Asked for in the same cells a scene spot is written in, which is
    // where the shift and the scene's own reach go
    const shiftX = country.position.x - extra;
    const shiftZ = country.position.z - extra;

    for (let z = 0; z < cells; z += 1) {
      for (let x = 0; x < cells; x += 1) {
        const spot = (z * cells + x) * 12;
        const left = x + shiftX;
        const far = z + shiftZ;
        // The same four corners the positions are written on, in the
        // same order: far left, far right, near right, near left
        const corners = [
          [left, far],
          [left + 1, far],
          [left + 1, far + 1],
          [left, far + 1],
        ];

        for (const [corner, [cx, cz]] of corners.entries()) {
          const shade = at(cx, cz);

          shades[spot + corner * 3] = shade[0];
          shades[spot + corner * 3 + 1] = shade[1];
          shades[spot + corner * 3 + 2] = shade[2];
        }
      }
    }
    lit.needsUpdate = true;
    shaded = true;
  };

  return {
    ground,
    light,
    haze: (sky): void => {
      const upper = sky == null ? null : parseColour(sky.top);
      const lower = sky == null ? null : parseColour(sky.bottom);

      hazeOn.value = upper == null || lower == null ? 0 : 1;
      if (upper != null && lower != null) {
        hazeTop.set(upper[0], upper[1], upper[2]);
        hazeBottom.set(lower[0], lower[1], lower[2]);
      }
    },
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
        hazeScreen.value = screen.height * ratio;
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
        spot.x + extra - cells / 2 + 0.5,
        spot.y + spread * away,
        spot.z + extra - cells / 2 + 0.5 + spread * rise,
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
