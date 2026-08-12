import { type JSX, createEffect, createSignal, onMount } from 'solid-js';
import drawCaption from '../canvas/caption';
import { BIOME_COLORS, BIOME_NAMES } from '../data/biome';
import type Biome from '../data/ids/biome';

/**
 * The world around the player, painted a chunk at a time.
 *
 * A chunk is a handful of pixels rather than an element: a view this
 * wide is sixteen thousand of them, which is a picture rather than a
 * page. The camera is the caller's — this paints where it is pointed
 * and reports which way somebody asked to move it.
 *
 * There is no click target and no hover: the map is read, not used.
 * What it is *for* is knowing which way to walk, which is why the
 * player's own chunk is marked and everything else is just ground.
 */

/**
 * How many pixels wide one chunk is drawn. Enough to carry a grid line
 * and still leave a square of colour inside it
 */
const TILE = 6;

const COLORS = {
  void: '#05070b',
  grid: 'rgba(0, 0, 0, 0.35)',
  /**
   * The player's own chunk keeps its biome colour — where they are
   * standing is still ground — and is called out by a ring drawn
   * around it instead
   */
  player: '#ffffff',
  focus: '#3b82f6',
} as const;

/**
 * How far a pan moves the camera: one chunk, or a longer stride while
 * shift is held, since a hundred-chunk view is a lot to cross a step
 * at a time
 */
const PAN_STEP = 1;
const PAN_STRIDE = 8;

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
    return `${BIOME_NAMES[biome]} (${props.originX + (at % props.span)}, ${
      props.originY + Math.floor(at / props.span)
    })`;
  };

  onMount(() => {
    const element = canvas;
    const context = element?.getContext('2d');

    if (element == null || context == null) {
      return;
    }

    createEffect(() => {
      const across = props.span;
      const size = TILE * across;

      // Drawn at the map's own resolution and blown up by the browser,
      // so the backing store is the size of the map rather than the
      // size it is shown at
      if (element.width !== size) {
        element.width = size;
        element.height = size;
      }

      for (let row = 0; row < across; row++) {
        for (let column = 0; column < across; column++) {
          const biome = props.biomes[row * across + column];

          context.fillStyle = biome == null ? COLORS.void : BIOME_COLORS[biome];
          context.fillRect(column * TILE, row * TILE, TILE, TILE);
        }
      }

      // The grid on top of the ground rather than between the fills,
      // so a line is one pixel wherever it falls
      context.strokeStyle = COLORS.grid;
      context.lineWidth = 1;
      context.beginPath();
      for (let line = 0; line <= across; line++) {
        context.moveTo(line * TILE + 0.5, 0);
        context.lineTo(line * TILE + 0.5, size);
        context.moveTo(0, line * TILE + 0.5);
        context.lineTo(size, line * TILE + 0.5);
      }
      context.stroke();

      // Where the player is standing: the same ground, ringed
      const column = props.playerX - props.originX;
      const row = props.playerY - props.originY;

      if (column >= 0 && row >= 0 && column < across && row < across) {
        context.strokeStyle = COLORS.player;
        context.lineWidth = 2;
        context.strokeRect(column * TILE - 1, row * TILE - 1, TILE + 2, TILE + 2);
        context.lineWidth = 1;
      }

      // What the pointer is over, in the corner. It is drawn last so
      // the ground cannot be painted over it
      drawCaption(context, naming());

      // A border while the keyboard is in here, so it is clear which
      // thing the arrow keys are moving
      if (focused()) {
        context.strokeStyle = COLORS.focus;
        context.lineWidth = 2;
        context.strokeRect(1, 1, size - 2, size - 2);
        context.lineWidth = 1;
      }
    });
  });

  return (
    <canvas
      ref={canvas}
      tabindex={0}
      role="application"
      aria-label={`World map, ${props.span} chunks across, centred on ${
        props.originX + Math.floor(props.span / 2)
      }, ${props.originY + Math.floor(props.span / 2)}. Arrow keys pan.`}
      // Blown up from a few hundred pixels, so the chunks stay squares
      // rather than being smeared into each other
      class="mx-auto block h-auto w-[min(100%,34rem)] rounded-lg border border-line
        [image-rendering:pixelated] focus-visible:outline-none"
      title={naming()}
      onMouseMove={(event) => {
        setHovered(chunkAt(event));
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
  );
}
