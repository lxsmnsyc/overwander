import { type JSX, Show, createEffect, createSignal, onCleanup, onMount, untrack } from 'solid-js';
import { BIOME_COLORS, BIOME_NAMES } from '../../data/biome';
import type Biome from '../../data/ids/biome';
import LRUMap from '../../core/lru-map';
import shadeCell from '../../canvas/world-shade';
import settings from '../app/settings';
import { CHUNK_CELLS, worldCell } from '../../overworld/grid';
import { TOWN_RADIUS, TOWN_REGION, townOfRegion } from '../../overworld/town';
import getWorld from '../../overworld/current';
import type World from '../../overworld/world';

/**
 * The world around the player.
 *
 * By default a chunk is its country's colour, with the chunks towns stand
 * in picked out, and all of it is drawn at once. The detailed map reads
 * each chunk off every other cell of it instead: water, the level of the
 * land and its cliffs, towns and routes, shaded the way the world demo
 * shades them. The camera is the caller's: this paints where it is
 * pointed and reports which way somebody asked to move it.
 *
 * A caller that wants a chunk chosen from it passes `onPick`; without
 * one the map is read and not used.
 */

/** How many cells each pixel of the map reads: every other one */
const SAMPLE = 2;

/** How many pixels wide one chunk is drawn */
const TILE = CHUNK_CELLS / SAMPLE;

/** How many chunk pictures are kept: several views' worth, so panning back costs nothing */
const TILES_KEPT = 16_384;

/** How long one frame may spend reading chunks that are not kept yet, in milliseconds */
const FRAME_BUDGET = 12;

const COLORS = {
  void: '#05070b',
  grid: 'rgba(0, 0, 0, 0.35)',
  /**
   * A chunk a town stands in is ringed rather than filled: a beach, a
   * desert and a glacier are all pale, and a pale fill would read as one
   */
  townRing: '#ffffff',
  townEdge: 'rgba(0, 0, 0, 0.7)',
  player: '#ffffff',
  focus: '#3b82f6',
  /** The chunk somebody chose, ringed the way the player's own is */
  picked: '#facc15',
} as const;

const tiles = new LRUMap<string, ImageData>(TILES_KEPT);

/** One chunk's picture, read off every other cell of it */
function chunkTile(world: World, chunkX: number, chunkY: number): ImageData {
  const image = new ImageData(TILE, TILE);

  for (let row = 0; row < TILE; row++) {
    for (let column = 0; column < TILE; column++) {
      const shade = shadeCell(
        world,
        worldCell(chunkX, column * SAMPLE),
        worldCell(chunkY, row * SAMPLE),
        { reach: SAMPLE },
      );
      const at = (row * TILE + column) * 4;

      image.data[at] = shade[0];
      image.data[at + 1] = shade[1];
      image.data[at + 2] = shade[2];
      image.data[at + 3] = 0xff;
    }
  }
  return image;
}

/**
 * How far a pan moves the camera: one chunk, or a longer stride while
 * shift is held, since a hundred-chunk view is a lot to cross a step
 * at a time
 */
const PAN_STEP = 1;
export const PAN_STRIDE = 8;

const PAN_KEYS = new Map<string, [number, number]>([
  ['ArrowUp', [0, -1]],
  ['ArrowDown', [0, 1]],
  ['ArrowLeft', [-1, 0]],
  ['ArrowRight', [1, 0]],
  ['w', [0, -1]],
  ['s', [0, 1]],
  ['a', [-1, 0]],
  ['d', [1, 0]],
]);

/**
 * A town on the map, in chunks rather than cells: where its middle
 * falls and how far it reaches, so the mark is the size the place
 * actually is
 */
export interface TownMark {
  x: number;
  y: number;
  radius: number;
}

/**
 * The towns a view is looking at, asked of the regions it crosses
 * rather than of its chunks: a town belongs to one region and a region
 * is eight chunks, so a wide view is sixty-odd questions instead of
 * four thousand
 */
export function townsInView(originX: number, originY: number, span: number): TownMark[] {
  const world = getWorld();
  const first = Math.floor(originX / TOWN_REGION);
  const last = Math.floor((originX + span) / TOWN_REGION);
  const top = Math.floor(originY / TOWN_REGION);
  const bottom = Math.floor((originY + span) / TOWN_REGION);
  const marks: TownMark[] = [];

  for (let regionY = top; regionY <= bottom; regionY++) {
    for (let regionX = first; regionX <= last; regionX++) {
      const town = townOfRegion(world, regionX, regionY);

      // The map is drawn in chunks and a town is sited in cells
      if (town != null) {
        marks.push({
          x: town.x / CHUNK_CELLS,
          y: town.y / CHUNK_CELLS,
          radius: TOWN_RADIUS / CHUNK_CELLS,
        });
      }
    }
  }
  return marks;
}

export interface WorldMapCanvasProps {
  /**
   * How many chunks the view spans on each side
   */
  span: number;
  /**
   * The north-west chunk of the view
   */
  originX: number;
  originY: number;
  /**
   * One biome per chunk, row-major from the origin. Null is a chunk
   * beyond the world's edge: the world is bounded, so a camera near
   * the rim shows the end of it rather than repeating the last row
   */
  biomes: (Biome | null)[];
  /**
   * The towns the view is looking at. Biomes say what the ground is
   * and towns say where the people are, which is the other half of
   * deciding which way to walk
   */
  towns: TownMark[];
  /**
   * The chunk the player is standing in. It is marked when the camera
   * is looking somewhere that contains it, and simply absent when it
   * has been panned away from
   */
  playerX: number;
  playerY: number;
  /**
   * Which way the camera was asked to move, in chunks
   */
  onPan: (dx: number, dy: number) => void;
  /**
   * Take the camera back to the player
   */
  onRecenter: () => void;
  /**
   * A chunk chosen out of the view, ringed where the camera is
   * looking at it. Absent where nothing is chosen
   */
  pickedX?: number;
  pickedY?: number;
  /**
   * Fired with the chunk a click landed in. Passing it is what makes
   * the map something to use rather than something to read
   */
  onPick?: (chunkX: number, chunkY: number) => void;
  /**
   * Whether the ground is read a cell at a time. Left out, the player's
   * own setting decides
   */
  detailed?: boolean;
}

export default function WorldMapCanvas(props: WorldMapCanvasProps): JSX.Element {
  let canvas: HTMLCanvasElement | undefined;
  const [focused, setFocused] = createSignal(false);
  /**
   * The chunk under the pointer, as an index into the view. A map this
   * size is a wall of colour without it: a player can see that the
   * north-east is green, and nothing tells them which green
   */
  const [hovered, setHovered] = createSignal<number | null>(null);

  /**
   * Whether a town stands in a chunk: its middle against the town's reach,
   * since a town is a circle and a chunk it barely clips is not where it is
   */
  const settledAt = (x: number, y: number): boolean =>
    props.towns.some((town) => Math.hypot(x + 0.5 - town.x, y + 0.5 - town.y) <= town.radius);

  /**
   * Which chunk of the view a pointer at these page coordinates is
   * over. The map is drawn at its own resolution and blown up, so the
   * reading is scaled back through whatever the element ended up
   */
  const chunkAt = (event: MouseEvent): number | null => {
    const element = canvas;

    if (element == null) {
      return null;
    }

    const bounds = element.getBoundingClientRect();
    const across = props.span;
    const x = Math.floor(((event.clientX - bounds.left) / bounds.width) * across);
    const y = Math.floor(((event.clientY - bounds.top) / bounds.height) * across);

    if (x < 0 || y < 0 || x >= across || y >= across) {
      return null;
    }
    return y * across + x;
  };

  /**
   * What the pointer is over, in the words the overworld uses for the
   * chunk the player is standing in. Nothing beyond the world's edge
   * is anywhere, so it says nothing there
   */
  const naming = (): string => {
    const at = hovered();

    if (at == null) {
      return '';
    }

    const biome = props.biomes[at];

    if (biome == null) {
      return '';
    }
    const x = props.originX + (at % props.span);
    const y = props.originY + Math.floor(at / props.span);

    return `${settledAt(x, y) ? `Town, ${BIOME_NAMES[biome]}` : BIOME_NAMES[biome]} (${x}, ${y})`;
  };

  onMount(() => {
    const element = canvas;
    const context = element?.getContext('2d');
    // The ground on a page of its own, so a chunk filling in never paints
    // over the rings drawn on top
    const ground = document.createElement('canvas');
    const paint = ground.getContext('2d');

    if (element == null || context == null || paint == null) {
      return;
    }

    /** The ground, and everything marked over it */
    const compose = (): void => {
      const across = props.span;
      const size = TILE * across;

      context.clearRect(0, 0, size, size);
      context.drawImage(ground, 0, 0);

      // Where the player is standing: the same ground, ringed
      const column = props.playerX - props.originX;
      const row = props.playerY - props.originY;

      if (column >= 0 && row >= 0 && column < across && row < across) {
        context.strokeStyle = COLORS.player;
        context.lineWidth = 2;
        context.strokeRect(column * TILE - 1, row * TILE - 1, TILE + 2, TILE + 2);
        context.lineWidth = 1;
      }

      // The chosen chunk, ringed in a colour of its own: it is often
      // the chunk the player is standing in, and two rings the same
      // colour would say one thing
      const pickedColumn = (props.pickedX ?? Number.NaN) - props.originX;
      const pickedRow = (props.pickedY ?? Number.NaN) - props.originY;

      if (pickedColumn >= 0 && pickedRow >= 0 && pickedColumn < across && pickedRow < across) {
        context.strokeStyle = COLORS.picked;
        context.lineWidth = 2;
        context.strokeRect(pickedColumn * TILE - 1, pickedRow * TILE - 1, TILE + 2, TILE + 2);
        context.lineWidth = 1;
      }

      // A border while the keyboard is in here, so it is clear which
      // thing the arrow keys are moving
      if (focused()) {
        context.strokeStyle = COLORS.focus;
        context.lineWidth = 2;
        context.strokeRect(1, 1, size - 2, size - 2);
        context.lineWidth = 1;
      }
    };

    createEffect(() => {
      const across = props.span;
      const originX = props.originX;
      const originY = props.originY;
      const biomes = props.biomes;
      const size = TILE * across;
      const world = getWorld();
      const detailed = props.detailed ?? settings().detailedMap;
      const missing: number[] = [];
      /** The chunks towns stand in, ringed once the grid is down */
      const towns: number[] = [];

      // Drawn at the map's own resolution and blown up by the browser,
      // so the backing store is the size of the map rather than the
      // size it is shown at
      if (element.width !== size) {
        element.width = size;
        element.height = size;
      }
      if (ground.width !== size) {
        ground.width = size;
        ground.height = size;
      }

      for (let index = 0; index < across * across; index++) {
        const column = index % across;
        const row = Math.floor(index / across);
        const biome = biomes[index];

        if (biome == null) {
          paint.fillStyle = COLORS.void;
          paint.fillRect(column * TILE, row * TILE, TILE, TILE);
          continue;
        }
        const kept = detailed ? tiles.get(`${originX + column},${originY + row}`) : undefined;

        if (kept != null) {
          paint.putImageData(kept, column * TILE, row * TILE);
          continue;
        }
        // The country's own colour, which is what the detailed map shows
        // until a chunk has been read
        paint.fillStyle = BIOME_COLORS[biome];
        paint.fillRect(column * TILE, row * TILE, TILE, TILE);
        if (detailed) {
          missing.push(index);
        } else if (settledAt(originX + column, originY + row)) {
          towns.push(index);
        }
      }
      if (!detailed) {
        // The chunk grid, which is what the quick map is read by
        paint.strokeStyle = COLORS.grid;
        paint.lineWidth = 1;
        paint.beginPath();
        for (let line = 0; line <= across; line++) {
          paint.moveTo(line * TILE + 0.5, 0);
          paint.lineTo(line * TILE + 0.5, size);
          paint.moveTo(0, line * TILE + 0.5);
          paint.lineTo(size, line * TILE + 0.5);
        }
        paint.stroke();

        for (const index of towns) {
          const left = (index % across) * TILE;
          const top = Math.floor(index / across) * TILE;

          paint.strokeStyle = COLORS.townEdge;
          paint.strokeRect(left + 0.5, top + 0.5, TILE - 1, TILE - 1);
          paint.strokeStyle = COLORS.townRing;
          paint.strokeRect(left + 1.5, top + 1.5, TILE - 3, TILE - 3);
        }
      }
      untrack(compose);

      // Nearest the middle first, so the ground round the player fills in
      // before the corners do
      const middle = (across - 1) / 2;
      const away = (index: number): number =>
        Math.hypot((index % across) - middle, Math.floor(index / across) - middle);

      missing.sort((one, other) => away(one) - away(other));

      let next = 0;
      let frame = 0;
      const read = (): void => {
        const until = performance.now() + FRAME_BUDGET;

        while (next < missing.length && performance.now() < until) {
          const index = missing[next];
          const column = index % across;
          const row = Math.floor(index / across);
          const key = `${originX + column},${originY + row}`;
          const tile = tiles.get(key) ?? chunkTile(world, originX + column, originY + row);

          next += 1;
          tiles.set(key, tile);
          paint.putImageData(tile, column * TILE, row * TILE);
        }
        compose();
        if (next < missing.length) {
          frame = requestAnimationFrame(read);
        }
      };

      if (missing.length > 0) {
        frame = requestAnimationFrame(read);
      }
      onCleanup(() => {
        cancelAnimationFrame(frame);
      });
    });

    // The rings and the focus border follow their own props without the
    // ground being read again
    createEffect(compose);
  });

  return (
    // The map, with its caption standing over the corner of it rather
    // than painted into it. Drawn into the picture the words were
    // pixels: the canvas is a few hundred across and blown up to fit,
    // so every letter was blown up with it
    <div class="relative mx-auto w-[min(100%,34rem)]">
      <Show when={naming()} keyed>
        {(place) => (
          <span
            aria-hidden="true"
            class="pointer-events-none absolute top-1.5 left-1.5 z-10 rounded-lg bg-ink/70 px-1.5
              py-0.5 text-xs font-semibold text-parchment"
          >
            {place}
          </span>
        )}
      </Show>

      <canvas
        ref={canvas}
        tabindex={0}
        role="application"
        aria-label={`World map, ${props.span} chunks across, centred on ${
          props.originX + Math.floor(props.span / 2)
        }, ${props.originY + Math.floor(props.span / 2)}. Arrow keys pan.`}
        // Blown up from a few hundred pixels, so the chunks stay squares
        // rather than being smeared into each other
        class="block h-auto w-full rounded-xl border-4 border-tide shadow-pop
        [image-rendering:pixelated] focus-visible:outline-none"
        title={naming()}
        onMouseMove={(event) => {
          setHovered(chunkAt(event));
        }}
        onClick={(event) => {
          const at = chunkAt(event);

          if (at != null && props.biomes[at] != null) {
            props.onPick?.(
              props.originX + (at % props.span),
              props.originY + Math.floor(at / props.span),
            );
          }
        }}
        onMouseLeave={() => {
          setHovered(null);
        }}
        onFocus={() => {
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
        }}
        onKeyDown={(event) => {
          const step = PAN_KEYS.get(event.key);

          if (step != null) {
            event.preventDefault();

            const distance = event.shiftKey ? PAN_STRIDE : PAN_STEP;

            props.onPan(step[0] * distance, step[1] * distance);
            return;
          }
          // Back to where the player actually is, for a camera that has
          // wandered off
          if (event.key === 'Home' || event.key === 'c') {
            event.preventDefault();
            props.onRecenter();
          }
        }}
      />
    </div>
  );
}
