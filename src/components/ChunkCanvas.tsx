import { type JSX, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import type SpeciesSpriteAnimation from '../canvas/species-sprite-animation';
import loadSpeciesSprite from '../canvas/species-sprites';
import { BIOME_COLORS } from '../data/biome';
import type Biome from '../data/ids/biome';
import Landmark from '../data/overworld/landmark';
import type { Species } from '../data/ids/species';
import { CHUNK_CELLS } from '../overworld/chunk';

/**
 * The chunk the player is standing in, drawn rather than laid out.
 *
 * It was 256 buttons in a CSS grid, which is 256 elements to restyle
 * every time somebody takes a step. This is one element: the whole
 * chunk is repainted on a change, which for a grid this size is a
 * fraction of the work laying it out again would be — and it leaves
 * room for the things a grid of buttons could not do at all, like
 * shading the ring a player can actually reach from where they stand.
 *
 * What it is *not* is a second source of truth. Where the player is,
 * what is on a cell and whether it can be reached are all the tab's to
 * decide; this asks for them per cell and paints the answers.
 */

/**
 * How big a cell is drawn. The canvas is stretched to its container
 * afterwards, so this is only the resolution it is drawn at
 */
const CELL = 26;

const SIZE = CELL * CHUNK_CELLS;

/**
 * How much bigger than the sheet a pokemon standing in a cell is
 * drawn. A frame is around 32 pixels and a cell is 26, so a little
 * under half size leaves the pokemon inside its square with the grid
 * still readable around it
 */
const SPRITE_SCALE = 0.75;

const COLORS = {
  grid: 'rgba(0, 0, 0, 0.12)',
  /**
   * The cell the player is on, and the ring they can act on from it
   */
  player: '#ffd166',
  reach: 'rgba(255, 255, 255, 0.28)',
  /**
   * What marks out something that can be acted on *now*. The wash says
   * "in range"; this says "this one" — a landmark two steps away and
   * one at arm's length looked identical before, which is the thing a
   * player most needs to be able to tell apart
   */
  highlight: '#ffffff',
  spawn: '#2b2b2b',
  glyph: '#1c1c1c',
  landmark: 'rgba(255, 255, 255, 0.65)',
  /**
   * The keyboard's own pointer, drawn only while the canvas has focus
   */
  cursor: '#3b82f6',
} as const;

/**
 * One letter per landmark, the same ones the list used before the
 * chunk was a picture — they are short enough to read at this size and
 * a player already knows them
 */
const LANDMARK_GLYPHS: Record<Landmark, string> = {
  [Landmark.ItemCache]: 'C',
  [Landmark.Phenomenon]: '!',
  [Landmark.LegendaryLair]: 'R',
  [Landmark.ShadowLair]: 'S',
  [Landmark.BerryPatch]: 'B',
  [Landmark.TeamRocketStop]: 'T',
  [Landmark.Nest]: 'N',
  [Landmark.WanderingNpc]: 'P',
  [Landmark.Portal]: 'O',
};

export interface ChunkCanvasProps {
  /**
   * What the ground is made of, which is the whole of the background
   */
  biome: Biome;
  /**
   * The cell the player is standing on
   */
  player: number;
  landmarks: Map<number, Landmark>;
  /**
   * Which cells hold a pokemon this window, and which pokemon. It is
   * what stands there rather than only that something does: the
   * ground draws the pokemon itself
   */
  spawns: Map<number, Species>;
  /**
   * Whether the cell can be acted on from where the player stands.
   * The rule is the tab's — a thing, within the ring around them
   */
  reachable: (index: number) => boolean;
  /**
   * What to call the cell when the pointer rests on it
   */
  label: (index: number) => string;
  onReach: (index: number) => void;
  /**
   * A step, in cells. The chunk owns the walk keys because it owns the
   * focus: a player typing into something else, or reading a dialog
   * over the top of this, is not walking anywhere
   */
  onWalk: (deltaX: number, deltaY: number) => void;
}

/**
 * The keys that move something, and which way. A plain one walks the
 * player; the same key with shift moves the cursor, which is what
 * Enter acts on
 */
const MOVE_KEYS = new Map<string, [number, number]>([
  ['ArrowUp', [0, -1]],
  ['ArrowDown', [0, 1]],
  ['ArrowLeft', [-1, 0]],
  ['ArrowRight', [1, 0]],
  ['w', [0, -1]],
  ['s', [0, 1]],
  ['a', [-1, 0]],
  ['d', [1, 0]],
]);

export default function ChunkCanvas(props: ChunkCanvasProps): JSX.Element {
  let canvas: HTMLCanvasElement | undefined;
  /**
   * Bumped once per animation frame. The drawing is one effect over
   * everything that can change, so a sprite moving on is told the same
   * way a landmark appearing is: something changed, draw again
   */
  const [beat, setBeat] = createSignal(0);

  /**
   * One animation per species standing in the chunk, shared by every
   * cell holding that species. Two Rattata in a field are one sheet
   * and one playhead — they are scenery, and scenery need not be out
   * of step to be believed
   */
  const sprites = new Map<Species, SpeciesSpriteAnimation | null>();

  const spriteFor = (species: Species): SpeciesSpriteAnimation | null => {
    if (sprites.has(species)) {
      return sprites.get(species) ?? null;
    }

    // Held as null until it lands, so a species is asked for once
    // rather than once per frame it is drawn in
    sprites.set(species, null);
    loadSpeciesSprite(species)
      .then((loaded) => {
        sprites.set(species, loaded);
      })
      .catch(() => {
        // The dot it always was
      });
    return null;
  };
  const [hovered, setHovered] = createSignal<number | null>(null);
  const [focused, setFocused] = createSignal(false);
  /**
   * The cell the keyboard is pointing at. It follows the player until
   * it is moved, and goes back to them whenever they walk — which is
   * what a player looking at their own square expects, and it means
   * the cursor is never left behind in a chunk they have left
   */
  const [cursor, setCursor] = createSignal(props.player);

  createEffect(() => {
    setCursor(props.player);
  });

  const moveCursor = ([dx, dy]: [number, number]): void => {
    const x = Math.min(CHUNK_CELLS - 1, Math.max(0, (cursor() % CHUNK_CELLS) + dx));
    const y = Math.min(CHUNK_CELLS - 1, Math.max(0, Math.floor(cursor() / CHUNK_CELLS) + dy));

    setCursor(y * CHUNK_CELLS + x);
  };

  /**
   * Which cell a pointer at these page coordinates is over. The canvas
   * is drawn at a fixed size and stretched, so the reading is scaled
   * back through whatever the element actually ended up
   */
  const cellAt = (event: MouseEvent): number | null => {
    const element = canvas;

    if (element == null) {
      return null;
    }

    const bounds = element.getBoundingClientRect();
    const x = Math.floor(((event.clientX - bounds.left) / bounds.width) * CHUNK_CELLS);
    const y = Math.floor(((event.clientY - bounds.top) / bounds.height) * CHUNK_CELLS);

    if (x < 0 || y < 0 || x >= CHUNK_CELLS || y >= CHUNK_CELLS) {
      return null;
    }
    return y * CHUNK_CELLS + x;
  };

  onMount(() => {
    const element = canvas;
    const context = element?.getContext('2d');

    if (element == null || context == null) {
      return;
    }

    const ratio = window.devicePixelRatio;

    element.width = SIZE * ratio;
    element.height = SIZE * ratio;
    context.scale(ratio, ratio);

    /**
     * The pokemon standing about are the only thing here that moves
     * on its own, so the chunk keeps a frame clock of its own — the
     * battle canvas can borrow the fight's, and there is no fight
     * here. It stops with the component
     */
    let last = 0;
    let frame = requestAnimationFrame(function step(now: number): void {
      frame = requestAnimationFrame(step);

      const elapsed = last === 0 ? 0 : now - last;

      last = now;

      for (const sprite of sprites.values()) {
        sprite?.update(elapsed);
      }
      setBeat((count) => count + 1);
    });

    onCleanup(() => {
      cancelAnimationFrame(frame);
    });

    // Everything the drawing reads is a signal or a closure over one,
    // so reading them here is what subscribes the picture to them
    createEffect(() => {
      // Read so the picture redraws with the animations, not only when
      // something about the chunk changes
      beat();

      context.fillStyle = BIOME_COLORS[props.biome];
      context.fillRect(0, 0, SIZE, SIZE);

      context.font = `bold ${Math.round(CELL * 0.6)}px monospace`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      for (let index = 0; index < CHUNK_CELLS * CHUNK_CELLS; index++) {
        const x = (index % CHUNK_CELLS) * CELL;
        const y = Math.floor(index / CHUNK_CELLS) * CELL;
        const middle = { x: x + CELL / 2, y: y + CELL / 2 };

        const reachable = props.reachable(index);

        // The wash first, so a landmark inside it is drawn on top of
        // its own highlight
        if (reachable) {
          context.fillStyle = COLORS.reach;
          context.fillRect(x, y, CELL, CELL);
        }

        context.strokeStyle = COLORS.grid;
        context.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);

        // And then the highlight itself: a thing at arm's length is
        // ringed, which is what tells it from the same thing two steps
        // further off
        if (reachable) {
          context.strokeStyle = COLORS.highlight;
          context.lineWidth = 2;
          context.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);
          context.lineWidth = 1;
        }

        const landmark = props.landmarks.get(index);

        if (landmark != null) {
          context.fillStyle = COLORS.landmark;
          context.beginPath();
          context.arc(middle.x, middle.y, CELL * 0.36, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = COLORS.glyph;
          context.fillText(LANDMARK_GLYPHS[landmark], middle.x, middle.y + 1);
        }

        // A pokemon standing in the open is drawn where it stands,
        // facing the way somebody walking up to it would see it. One
        // whose sheet has not arrived is the dot it always was
        const standing = props.spawns.get(index);

        if (standing != null) {
          const sprite = spriteFor(standing);

          if (sprite?.ready === true) {
            sprite.play('Idle', { direction: 'down', loop: true });
            sprite.draw(context, middle.x, y + CELL - 2, {
              scale: SPRITE_SCALE,
              anchor: 'bottom',
            });
          } else {
            context.fillStyle = COLORS.spawn;
            context.beginPath();
            context.arc(middle.x, middle.y, CELL * 0.18, 0, Math.PI * 2);
            context.fill();
          }
        }

        if (index === props.player) {
          context.fillStyle = COLORS.player;
          context.beginPath();
          context.arc(middle.x, middle.y, CELL * 0.3, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = COLORS.glyph;
          context.stroke();
        }

        // Last of all, and only while the keyboard is in here: what
        // Enter would act on
        if (focused() && index === cursor()) {
          context.strokeStyle = COLORS.cursor;
          context.lineWidth = 3;
          context.strokeRect(x + 1.5, y + 1.5, CELL - 3, CELL - 3);
          context.lineWidth = 1;
        }
      }

      // A border while the keyboard is in here. It is not decoration:
      // the walk keys only work while this has focus, so whether it
      // does is the difference between the arrows moving somebody and
      // doing nothing at all
      context.strokeStyle = focused() ? COLORS.cursor : COLORS.grid;
      context.lineWidth = focused() ? 3 : 1;
      context.strokeRect(1.5, 1.5, SIZE - 3, SIZE - 3);
      context.lineWidth = 1;
    });

    // The overworld is what the tab is for, so it takes the keyboard
    // when it opens rather than waiting to be clicked
    element.focus({ preventScroll: true });
  });

  return (
    <canvas
      ref={canvas}
      // Focusable, so the chunk is still reachable by keyboard now
      // that its cells are paint rather than 256 buttons: tab to it,
      // point with shift and an arrow, act with Enter
      tabindex={0}
      role="application"
      aria-label={`Chunk map. ${props.label(cursor()) || 'Empty ground'} under the cursor.`}
      // A canvas has no per-cell elements to hang a tooltip on, so the
      // one tooltip it has says whatever the pointer is over
      title={hovered() == null ? '' : props.label(hovered() ?? 0)}
      class={`mx-auto block h-auto w-[min(100%,24rem)] rounded-lg border border-line
        focus-visible:outline-none ${
          hovered() != null && props.reachable(hovered() ?? 0) ? 'cursor-pointer' : 'cursor-default'
        }`}
      onMouseMove={(event) => {
        setHovered(cellAt(event));
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
        const step = MOVE_KEYS.get(event.key.length === 1 ? event.key.toLowerCase() : event.key);

        if (step != null) {
          event.preventDefault();
          // Shift points; without it, they walk
          if (event.shiftKey) {
            moveCursor(step);
          } else {
            props.onWalk(step[0], step[1]);
          }
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();

          if (props.reachable(cursor())) {
            props.onReach(cursor());
          }
        }
      }}
      onClick={(event) => {
        const index = cellAt(event);

        if (index != null) {
          setCursor(index);

          if (props.reachable(index)) {
            props.onReach(index);
          }
        }
      }}
    />
  );
}
