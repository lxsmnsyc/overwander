import { type JSX, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import {
  ASPECT,
  PITCH,
  type ProjectedPoint,
  SPRITE_FACINGS,
  angleOf,
  cellAtFraction,
  facingFrom,
  paintOrder,
  projectCell,
  projectCellQuad,
  projectGround,
  radiusOf,
  shortestTurn,
  unprojectGround,
} from '../canvas/board';
import type SpeciesSpriteAnimation from '../canvas/species-sprite-animation';
import { SPRITE_DIRECTIONS } from '../canvas/sprite-sheet';
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

const WIDTH = CELL * CHUNK_CELLS;

/**
 * The picture is shorter than it is wide: the board is laid back
 * under the camera, so its depth takes up less room than its width.
 * The element carries the same ratio, and the projection is what
 * decides both
 */
const HEIGHT = Math.round(WIDTH * ASPECT);

/**
 * How much bigger than the sheet a pokemon standing in a cell is
 * drawn, at the board's middle row. The rows in front of it are drawn
 * larger and the rows behind smaller — that factor is the projection's
 * and comes back with every point it is asked about.
 *
 * A little larger than it was, because a sprite is no longer sitting
 * inside its cell: it stands **up** out of it, over the row behind,
 * which is the whole of what makes the board read as a place with
 * things on it rather than a chart with pictures in it
 */
const SPRITE_SCALE = 0.95;

const COLORS = {
  grid: 'rgba(0, 0, 0, 0.12)',
  /**
   * The cell the player is on
   */
  player: '#ffd166',
  /**
   * The line round how far the player can lean: their own square and
   * the eight about it, drawn as one ring rather than as nine lit
   * cells. Whatever is inside it is theirs to press
   */
  highlight: '#ffffff',
  spawn: '#2b2b2b',
  glyph: '#1c1c1c',
  landmark: 'rgba(255, 255, 255, 0.65)',
  /**
   * The keyboard's own pointer, drawn only while the canvas has focus
   */
  cursor: '#3b82f6',
  /**
   * The compass: a face to read the needle against, and a needle
   * pointing the way the world's north has been turned to
   */
  compassFace: 'rgba(255, 255, 255, 0.55)',
  compassRim: 'rgba(0, 0, 0, 0.35)',
  needle: '#c2402f',
  /**
   * The ground under something standing on it
   */
  shadow: 'rgba(0, 0, 0, 0.28)',
  /**
   * What lifts the board off the country it lies in. The ground
   * beyond it is the same colour — it is the same country — so the
   * board is the part of it with the light on
   */
  surface: 'rgba(255, 255, 255, 0.10)',
} as const;

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
const TURN_DEAD_ZONE = 0.06;

/**
 * How big the compass is drawn, in the same pixels the board is.
 *
 * It earns its corner: the walk keys are the **world's** — up is
 * north whichever way the camera is looking — so a player who has
 * turned the board has no other way of telling which way that is.
 * Without it, turning the camera quietly scrambles the controls
 */
const COMPASS_RADIUS = 22;

const COMPASS_MARGIN = 14;

/**
 * How flat the shadow lies. It is on the ground, and the ground is
 * laid back under the camera, so it is squashed the way the ground is
 */
const GROUND_SQUASH = Math.sin((PITCH * Math.PI) / 180) * 0.55;

/**
 * Which button turns the board. The left one is for pressing cells
 * and the right one has no other business here
 */
const RIGHT_BUTTON = 2;

/**
 * How far a keyboard press turns the board. A quarter is what the
 * halves of it are counted in; a press is half of that, which lands
 * on a sprite facing every time
 */
const QUARTER_TURN = Math.PI / 2;

/**
 * Whether this press is asking to turn the board rather than to press
 * a cell.
 *
 * The right button, or — for the Mac, where a trackpad and a Magic
 * Mouse both ship without one — **control and the left button**, which
 * is what that platform means by a secondary click everywhere else.
 * It costs nothing on the machines that do have a right button, since
 * control-clicking one was never a way of pressing a cell
 */
export function isTurningPress(event: { button: number; ctrlKey: boolean }): boolean {
  return event.button === RIGHT_BUTTON || (event.button === 0 && event.ctrlKey);
}

/**
 * Which way a pokemon standing on a cell happens to be facing.
 *
 * A field of pokemon all facing the camera reads as a shop window.
 * They face whichever way they were standing when the window rolled
 * them, and it is derived rather than stored: the cell and the species
 * are what the world already knows, so every player looking at that
 * chunk sees the same Rattata looking the same way, and it does not
 * change under a camera walking around it
 */
function facingOf(index: number, species: Species): number {
  const mixed = Math.imul(index + 1, 2_654_435_761) ^ Math.imul(species + 1, 40_503);

  return (Math.abs(mixed) >>> 3) % SPRITE_FACINGS;
}

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
   * Where this is, in a few words.
   *
   * Nothing draws it any more — it is on the bar along the bottom of
   * the screen, where it costs the world nothing — but the picture is
   * still the thing being named, so it is still what a screen reader
   * is told this canvas is
   */
  caption: string;
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
  /**
   * Which way round the camera has been walked, in radians. It is the
   * caller's so that it survives a chunk change
   */
  yaw: number;
  onTurn: (yaw: number) => void;
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
   * Which way round the board is being looked at. It is the camera's,
   * not the world's: nothing about the chunk changes when it turns,
   * and walking north is still walking north.
   *
   * It belongs to the caller rather than to this canvas. Walking
   * across a chunk boundary takes the board away and brings another
   * one back, and a camera that lives here would be facing front
   * again every time — which is the one moment a player is most
   * likely to have turned it deliberately, to see what they were
   * walking toward
   */
  const yaw = (): number => props.yaw;
  const setYaw = (turn: (angle: number) => number): void => {
    props.onTurn(turn(props.yaw));
  };
  /**
   * The drag turning it, while one is in progress. Not a signal:
   * nothing is drawn from it — the yaw it produces is what the
   * picture reads
   */
  let turning: { pointer: number; angle: number } | null = null;
  /**
   * Whether the last press actually moved the camera. A drag that
   * turned the board is not also a press on the cell it ended over,
   * and on the Mac the two arrive as the same gesture
   */
  let turned = false;
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
   * Which cell a pointer at these page coordinates is over.
   *
   * The board is a trapezoid on a stretched canvas, so the reading
   * goes back through both: the element's own box turns the pointer
   * into a fraction of the picture, and the projection turns that
   * fraction back into the cell it was drawn from. A press near the
   * top corners lands on no cell at all now, which is honest — there
   * is no board there
   */
  const fractionAt = (event: MouseEvent): { x: number; y: number } | null => {
    const element = canvas;

    if (element == null) {
      return null;
    }

    const bounds = element.getBoundingClientRect();

    return {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    };
  };

  const cellAt = (event: MouseEvent): number | null => {
    const at = fractionAt(event);

    return at == null ? null : cellAtFraction(at.x, at.y, yaw());
  };

  /**
   * Take hold of the plane, or let go of it.
   *
   * What is grabbed is a **point on the ground**, not a number of
   * pixels: the board then turns so that point stays under the
   * pointer, the way a hand on a map turns the map. Dragging along one
   * axis and multiplying by a constant is a slider with a board drawn
   * next to it — it turns whichever way the mouse went rather than
   * whichever way the player pushed the ground
   */
  const grab = (event: MouseEvent): number | null => {
    const at = fractionAt(event);

    if (at == null) {
      return null;
    }

    const ground = unprojectGround(at.x, at.y, yaw());

    return radiusOf(ground) < TURN_DEAD_ZONE ? null : angleOf(ground);
  };

  /**
   * Turn the board so the grabbed point comes back under the pointer.
   *
   * The point is held in the world's own angles, and the pointer is
   * read in the camera's; the difference between the two is the yaw,
   * by construction. It is applied as the shortest way round, so
   * dragging past due south carries on rather than snapping back
   */
  const dragTo = (event: MouseEvent, grabbed: number): void => {
    const at = fractionAt(event);

    if (at == null) {
      return;
    }

    const seen = unprojectGround(at.x, at.y, 0);

    if (radiusOf(seen) < TURN_DEAD_ZONE) {
      return;
    }
    setYaw((angle) => angle + shortestTurn(angle, angleOf(seen) - grabbed));
  };

  onMount(() => {
    const element = canvas;
    const context = element?.getContext('2d');

    if (element == null || context == null) {
      return;
    }

    const ratio = window.devicePixelRatio;

    element.width = WIDTH * ratio;
    element.height = HEIGHT * ratio;
    context.scale(ratio, ratio);

    /**
     * A projected point in pixels rather than in fractions of the
     * picture. The projection answers in fractions because three
     * different sizes ask it the same question; this is the painter's
     * size
     */
    const at = (point: ProjectedPoint): ProjectedPoint => ({
      x: point.x * WIDTH,
      y: point.y * HEIGHT,
      scale: point.scale,
    });

    /**
     * Lay a cell's four corners out as a path, ready to be filled or
     * stroked. A cell is a quad now — the two far corners are closer
     * together than the two near ones — so nothing here can be a rect
     */
    /**
     * The board's own outline, as a path: four corners of ground
     * rather than the four corners of the canvas
     */
    const traceBoard = (): void => {
      const corners = [
        { u: 0, v: 0 },
        { u: 1, v: 0 },
        { u: 1, v: 1 },
        { u: 0, v: 1 },
      ].map((edge) => at(projectGround(edge, yaw())));

      context.beginPath();
      context.moveTo(corners[0].x, corners[0].y);
      for (const corner of corners.slice(1)) {
        context.lineTo(corner.x, corner.y);
      }
      context.closePath();
    };

    /**
     * The four corners of the ring around the player, in the picture's
     * own pixels — or null while there is nowhere to draw it. It is
     * clipped to the board, so a player standing against an edge is
     * ringed by the ground that is actually there
     */
    const reachOutline = (): ProjectedPoint[] | null => {
      const column = props.player % CHUNK_CELLS;
      const row = Math.floor(props.player / CHUNK_CELLS);
      const left = Math.max(0, column - 1) / CHUNK_CELLS;
      const right = Math.min(CHUNK_CELLS, column + 2) / CHUNK_CELLS;
      const far = Math.max(0, row - 1) / CHUNK_CELLS;
      const near = Math.min(CHUNK_CELLS, row + 2) / CHUNK_CELLS;

      if (right <= left || near <= far) {
        return null;
      }
      return [
        { u: left, v: far },
        { u: right, v: far },
        { u: right, v: near },
        { u: left, v: near },
      ].map((corner) => at(projectGround(corner, yaw())));
    };

    const traceCell = (index: number): void => {
      const quad = projectCellQuad(index, yaw()).map(at);

      context.beginPath();
      context.moveTo(quad[0].x, quad[0].y);
      for (const corner of quad.slice(1)) {
        context.lineTo(corner.x, corner.y);
      }
      context.closePath();
    };

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

      // Nothing outside the board. A tilted board leaves corners of
      // the canvas that are not board, and painting them — even a
      // shade of the ground — draws a rectangle around a picture that
      // has no rectangle in it. Cleared, the page's own colour is what
      // shows through, which is this same country carrying on past the
      // edge of what the player can reach
      context.clearRect(0, 0, WIDTH, HEIGHT);

      traceBoard();
      context.fillStyle = BIOME_COLORS[props.biome];
      context.fill();
      // The one thing that tells the board from the ground it is
      // standing on: a surface catches a little more light than the
      // country around it
      context.fillStyle = COLORS.surface;
      context.fill();

      context.textAlign = 'center';
      context.textBaseline = 'middle';

      /**
       * The ground first, all of it, and then everything standing on
       * it.
       *
       * Two passes rather than one, because a sprite is taller than
       * the cell it stands in: painted cell by cell, the row in front
       * would lay its ground over the feet of the row behind. Ground
       * is flat and cannot occlude anything, so it is finished before
       * the first pokemon is drawn
       */
      for (let index = 0; index < CHUNK_CELLS * CHUNK_CELLS; index++) {
        traceCell(index);
        context.strokeStyle = COLORS.grid;
        context.stroke();

        const landmark = props.landmarks.get(index);

        if (landmark != null) {
          const middle = at(projectCell(index, yaw()));

          context.fillStyle = COLORS.landmark;
          context.beginPath();
          context.arc(middle.x, middle.y, CELL * 0.36 * middle.scale, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = COLORS.glyph;
          context.font = `bold ${Math.round(CELL * 0.6 * middle.scale)}px monospace`;
          context.fillText(LANDMARK_GLYPHS[landmark], middle.x, middle.y + 1);
        }
      }

      /**
       * What the player can put a hand on: the square they are
       * standing in and the eight around it, drawn as **one ring**
       * rather than as nine outlined cells.
       *
       * Shading each of the nine drew a block of bright squares in the
       * middle of the board — a thing on the ground rather than a
       * measure of how far the player can lean, and it buried whatever
       * was standing inside it. One line round the outside says the
       * same and leaves the ground under it alone.
       *
       * The line is straight between the corners because the
       * projection is perspective: it maps straight lines to straight
       * lines, so four corners are the whole of a rectangle however
       * the board is turned
       */
      const reach = reachOutline();

      if (reach != null) {
        context.beginPath();
        context.moveTo(reach[0].x, reach[0].y);
        for (const corner of reach.slice(1)) {
          context.lineTo(corner.x, corner.y);
        }
        context.closePath();
        context.strokeStyle = COLORS.highlight;
        context.lineWidth = 2;
        context.stroke();
        context.lineWidth = 1;
      }

      /**
       * And then whatever is standing on it, from the back of the
       * board forwards — which is the order the cells are numbered in,
       * so a pokemon in front is drawn over the one behind it rather
       * than through it
       */
      for (const index of paintOrder(yaw())) {
        const middle = at(projectCell(index, yaw()));
        const standing = props.spawns.get(index);

        if (standing != null) {
          const sprite = spriteFor(standing);

          if (sprite?.ready === true) {
            // Facing the way it is standing in the world, seen from
            // wherever the camera has been walked to: turn a quarter
            // and something that was facing you is facing across you
            sprite.play('Idle', {
              direction: SPRITE_DIRECTIONS[facingFrom(facingOf(index, standing), yaw())],
              loop: true,
            });

            const scale = SPRITE_SCALE * middle.scale;
            // The sheet's own shadow marker is the point that stands on
            // the ground, so putting it on the middle of the cell is
            // the whole of standing a pokemon there — whatever is drawn
            // above it and however much empty frame is under its feet.
            //
            // What is drawn on that spot ties the billboard to the
            // cell. A sprite is a couple of cells tall and stands over
            // the rows behind it, so the eye reads it as belonging to
            // whichever row its *body* covers rather than to the one
            // its feet are on — and no amount of moving it up or down
            // fixes that, because the feet were already in the right
            // place. A patch of ground shading beneath says which cell
            // it is standing on, squashed the way this board squashes
            // everything lying on the ground, and sized by the sheet:
            // the description carries a shadow size per pokemon
            const placement = { scale, anchor: 'shadow' } as const;

            sprite.drawShadow(context, middle.x, middle.y, {
              ...placement,
              color: COLORS.shadow,
              squash: GROUND_SQUASH,
            });
            // Upright, and at its own size: the ground is tilted and
            // the pokemon on it are not, which is what a billboard is
            // and what makes them look like they are standing up out
            // of the board
            sprite.draw(context, middle.x, middle.y, placement);
          } else {
            context.fillStyle = COLORS.spawn;
            context.beginPath();
            context.arc(middle.x, middle.y, CELL * 0.18 * middle.scale, 0, Math.PI * 2);
            context.fill();
          }
        }

        if (index === props.player) {
          context.fillStyle = COLORS.player;
          context.beginPath();
          context.arc(middle.x, middle.y, CELL * 0.3 * middle.scale, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = COLORS.glyph;
          context.stroke();
        }

        // Last of all, and only while the keyboard is in here: what
        // Enter would act on
        if (focused() && index === cursor()) {
          traceCell(index);
          context.strokeStyle = COLORS.cursor;
          context.lineWidth = 3;
          context.stroke();
          context.lineWidth = 1;
        }
      }

      /**
       * And the compass, over the corner of the picture nothing else
       * uses.
       *
       * North is the world's, so it is drawn from the same turn the
       * board is: the needle is where the far edge of the chunk went.
       * It is flat rather than laid into the ground — a compass is a
       * thing in the player's hand, not a thing on the board
       */
      const compass = {
        x: COMPASS_RADIUS + COMPASS_MARGIN,
        y: HEIGHT - COMPASS_RADIUS - COMPASS_MARGIN,
      };

      context.beginPath();
      context.arc(compass.x, compass.y, COMPASS_RADIUS, 0, Math.PI * 2);
      context.fillStyle = COLORS.compassFace;
      context.fill();
      context.strokeStyle = COLORS.compassRim;
      context.lineWidth = 1;
      context.stroke();

      // Where north went: the chunk's far edge, turned by however far
      // the camera has been walked round
      const north = { x: Math.sin(yaw()), y: -Math.cos(yaw()) };
      const along = (distance: number, across = 0): { x: number; y: number } => ({
        x: compass.x + north.x * distance * COMPASS_RADIUS - north.y * across * COMPASS_RADIUS,
        y: compass.y + north.y * distance * COMPASS_RADIUS + north.x * across * COMPASS_RADIUS,
      });

      // A needle rather than a line: a point, and two shoulders behind
      // it
      const tip = along(0.62);
      const left = along(-0.26, -0.22);
      const right = along(-0.26, 0.22);

      context.beginPath();
      context.moveTo(tip.x, tip.y);
      context.lineTo(left.x, left.y);
      context.lineTo(right.x, right.y);
      context.closePath();
      context.fillStyle = COLORS.needle;
      context.fill();

      // The letter rides the needle rather than sitting at the top of
      // the face: it is what the needle is pointing at
      const letter = along(0.86);

      context.fillStyle = COLORS.glyph;
      context.font = 'bold 11px monospace';
      context.fillText('N', letter.x, letter.y);

      // Nothing is written on the board. The chunk used to caption
      // itself in a corner of the picture, which cost four cells of
      // the world to say something that never changes while the
      // player is standing in it — it is on the bar at the bottom
      // now, where the rest of the game's furniture is

      // A border while the keyboard is in here. It is not decoration:
      // the walk keys only work while this has focus, so whether it
      // does is the difference between the arrows moving somebody and
      // doing nothing at all. It follows the board's own outline,
      // which is a trapezoid rather than the canvas
      traceBoard();
      context.strokeStyle = focused() ? COLORS.cursor : COLORS.grid;
      context.lineWidth = focused() ? 3 : 1;
      context.stroke();
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
      // The caption is painted, so it is said here as well: it is the
      // only place the chunk names itself now
      aria-label={`Chunk map. ${props.caption}. ${
        props.label(cursor()) || 'Empty ground'
      } under the cursor.`}
      // A canvas has no per-cell elements to hang a tooltip on, so the
      // one tooltip it has says whatever the pointer is over
      title={hovered() == null ? '' : props.label(hovered() ?? 0)}
      // The chunk is the page, so it takes the page: drawn at its own
      // resolution and blown up to the largest box its container will
      // hold. The picture is no longer square — it is wider than it is
      // tall, because the board is laid back under the camera — so the
      // height follows the canvas' own proportions rather than being
      // asked for. `cqmin` is the shorter of the container's two
      // sides, which keeps a tall screen from cropping it.
      //
      // The element is exactly what is painted in it, with nothing
      // letterboxed, because a press is read back through the
      // element's own bounds: a box bigger than the picture would put
      // every cell a few pixels out
      class={`block h-auto w-[100cqmin] focus-visible:outline-none ${
        hovered() != null && props.reachable(hovered() ?? 0) ? 'cursor-pointer' : 'cursor-default'
      }`}
      // The right button walks the camera round the board rather than
      // opening the browser's own menu over it
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      onPointerDown={(event) => {
        if (!isTurningPress(event)) {
          return;
        }
        event.preventDefault();

        const grabbed = grab(event);

        if (grabbed == null) {
          return;
        }
        // Captured, so a drag that leaves the canvas keeps turning it
        // rather than stopping at the edge
        event.currentTarget.setPointerCapture(event.pointerId);
        turning = { pointer: event.pointerId, angle: grabbed };
      }}
      onPointerMove={(event) => {
        const drag = turning;

        if (drag?.pointer === event.pointerId) {
          turned = true;
          dragTo(event, drag.angle);
          // Whatever the pointer was over has moved out from under it
          setHovered(null);
          return;
        }
        setHovered(cellAt(event));
      }}
      onPointerUp={(event) => {
        if (turning?.pointer === event.pointerId) {
          event.currentTarget.releasePointerCapture(event.pointerId);
          turning = null;
        }
      }}
      onPointerCancel={() => {
        turning = null;
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
        // The same walk round the board, for a keyboard — and for
        // anyone whose pointer can do neither gesture. An eighth of a
        // turn a press, which is one sprite facing
        if (event.key === 'q' || event.key === 'e') {
          event.preventDefault();
          setYaw((angle) => angle + (event.key === 'q' ? -QUARTER_TURN : QUARTER_TURN) / 2);
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
        // A control-click is how the Mac turns the board, and unlike a
        // right-click it still comes back round as an ordinary click.
        // Left alone it would press whichever cell the drag finished
        // over — so the board turns, and then something on it opens
        if (isTurningPress(event) || turned) {
          turned = false;
          return;
        }

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
