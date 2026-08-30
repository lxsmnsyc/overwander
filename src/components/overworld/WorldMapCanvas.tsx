import { type JSX, Show, createEffect, createSignal, onMount } from 'solid-js';
import { BIOME_COLORS, BIOME_NAMES } from '../../data/biome';
import type Biome from '../../data/ids/biome';

/**
 * The world around the player, painted a chunk at a time.
 *
 * A chunk is a handful of pixels rather than an element: a view this
 * wide is sixteen thousand of them, which is a picture rather than a
 * page. The camera is the caller's — this paints where it is pointed
 * and reports which way somebody asked to move it.
 *
 * What it is *for* is knowing which way to walk, which is why the
 * player's own chunk is marked and everything else is just ground.
 * A caller that wants a chunk chosen from it passes `onPick`; without
 * one the map is read and not used.
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
  /** The chunk somebody chose, ringed the way the player's own is */
  picked: '#facc15',
} as const;

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
    });
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
