import { type JSX, Show, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import { Badge, Meta, Note, Row, Select, Slider, Switch } from '../styled';
import { CELL, COLORS, SPRITE_STANDS, WIDTH, sizeOf } from '../overworld/chunk-canvas/metrics';
import { fitPicture, projectAir } from '../../canvas/board';
import { SHADOW_STAMP, bakeShadowDisc } from '../overworld/chunk-canvas/scenery';
import { castCorners, shadowCorners } from '../../canvas/placement';
import { directionOf, litFrame } from '../../canvas/sprite-sheet';
import { getRegisteredSpecies, getSpeciesData } from '../../data/species';
import { getCast, getSun } from '../../canvas/daylight';
import Bakery from '../../canvas/bakery';
import type { QuadPoint } from '../../canvas/gl/quad-batch';
import QuadBatch from '../../canvas/gl/quad-batch';
import type { Species } from '../../data/ids/species';
import { SpriteAnim } from '../../data/ids/sprite-anims';
import type SpeciesSpriteAnimation from '../../canvas/species-sprite-animation';
import { GROUND_SQUASH } from '../../canvas/tilt';
import loadSpeciesSprite from '../../canvas/species-sprites';

/**
 * Where the light throws a shadow, on demand.
 *
 * A shadow is the hardest thing on the board to look at on purpose:
 * it wants an hour, a camera angle and a place in the world all at
 * once, and reaching any particular one of those in the game means
 * waiting for it or walking to it. This stages all three at a stroke,
 * over the same board and through the same painter.
 *
 * The arrow on the ground is the point of the page. It is drawn from
 * the cast alone, so a shadow that has stopped agreeing with the light
 * reads as a picture leaning one way and an arrow pointing another:
 * turn the camera and the two must stay together the whole way round.
 */

/** How many cells the board is across, which is what a chunk is */
const CELLS = 16;

/** A whole day, for reading a fraction of the slider as an hour */
const DAY = 24 * 60 * 60 * 1000;

/** The hour a bare page opens on: well up, and well off noon */
const DEFAULT_HOUR = 15 / 24;

/** How much darker the checker's other square is */
const CHECK_SHADE = 0.12;

const GROUND = '#7cae4c';

/** Where the pokemon stand, near, middle and far */
const SPOTS: { u: number; v: number }[] = [
  { u: 0.3, v: 0.28 },
  { u: 0.52, v: 0.52 },
  { u: 0.72, v: 0.78 },
];

/** How long the arrow on the ground runs, in cells */
const ARROW_CELLS = 2.6;

/** And how wide it is drawn, as a share of its length. Thin: the
 * shadow lies along it, and a bar wide enough to hide one would
 * defeat the comparison the page is for */
const ARROW_WIDTH = 0.04;

const ARROW_COLOUR = '#f4b63f';

/** A colour dimmed, for the checker's darker square */
function shadeOf(colour: string, amount: number): string {
  const value = Number.parseInt(colour.slice(1), 16);
  const dim = (channel: number): number => Math.round(channel * (1 - amount));

  return `#${(((dim((value >> 16) & 0xff) << 16) | (dim((value >> 8) & 0xff) << 8) | dim(value & 0xff)) >>> 0).toString(16).padStart(6, '0')}`;
}

/** One cell of the board, ready for the batch */
interface Cell {
  corners: QuadPoint[];
  dark: boolean;
}

/** The board, cell by cell, through the same camera the game's goes through */
function boardCells(placed: ReturnType<typeof fitPicture>, yaw: number): Cell[] {
  const at = (u: number, v: number): QuadPoint => {
    const point = projectAir({ u, v }, 0, yaw);

    return { x: placed.x + point.x * placed.width, y: placed.y + point.y * placed.height };
  };
  const grid: QuadPoint[][] = [];

  for (let down = 0; down <= CELLS; down++) {
    const row: QuadPoint[] = [];

    for (let across = 0; across <= CELLS; across++) {
      row.push(at(across / CELLS, down / CELLS));
    }
    grid.push(row);
  }

  const cells: Cell[] = [];

  for (let down = 0; down < CELLS; down++) {
    for (let across = 0; across < CELLS; across++) {
      cells.push({
        corners: [
          grid[down][across],
          grid[down][across + 1],
          grid[down + 1][across + 1],
          grid[down + 1][across],
        ],
        dark: (across + down) % 2 === 1,
      });
    }
  }
  return cells;
}

/**
 * A bar lying on the ground from a point, along the way the light
 * throws. Four corners rather than a stroke, since the batch draws
 * quads and nothing else
 */
function arrowCorners(
  from: { x: number; y: number },
  cast: { dx: number; dy: number },
  reach: number,
): QuadPoint[] {
  const wide = reach * ARROW_WIDTH;
  // Square to the way it runs, so the bar keeps its width at every
  // bearing rather than pinching as it turns
  const acrossX = -cast.dy * wide;
  const acrossY = cast.dx * wide;

  return [
    { x: from.x + acrossX, y: from.y + acrossY },
    { x: from.x + cast.dx * reach + acrossX, y: from.y + cast.dy * reach + acrossY },
    { x: from.x + cast.dx * reach - acrossX, y: from.y + cast.dy * reach - acrossY },
    { x: from.x - acrossX, y: from.y - acrossY },
  ];
}

export default function ShadowDemo(): JSX.Element {
  const [hour, setHour] = createSignal(DEFAULT_HOUR);
  /** How far the camera has walked round, as a share of a whole turn */
  const [turned, setTurned] = createSignal(0);
  /** Where in the world it is standing, from the middle to the edge */
  const [placed, setPlaced] = createSignal(0.5);
  const [species, setSpecies] = createSignal<Species>(getRegisteredSpecies()[0]);
  const [running, setRunning] = createSignal(false);
  /** Whether to draw the round patch instead of the picture laid flat */
  const [round, setRound] = createSignal(false);
  const [arrow, setArrow] = createSignal(true);
  /**
   * How much bigger than the board draws them. The board's own size
   * is a pokemon a few dozen pixels tall, which is too small to read a
   * shadow off
   */
  const [zoom, setZoom] = createSignal(0.5);
  const [refused, setRefused] = createSignal(false);

  const localTime = (): number => hour() * DAY;
  const yaw = (): number => turned() * 2 * Math.PI;
  const latitude = (): number => placed() * 2 - 1;
  const magnified = (): number => 1 + zoom() * 3;
  const cast = (): ReturnType<typeof getCast> => getCast(localTime(), yaw(), latitude());
  const sun = (): ReturnType<typeof getSun> => getSun(localTime(), latitude());

  const pokemon = createMemo(() =>
    getRegisteredSpecies()
      .map((entry) => ({ value: entry, label: getSpeciesData(entry).name }))
      .sort((left, right) => left.label.localeCompare(right.label)),
  );

  /** The hour as somebody would say it */
  const clock = (): string => {
    const at = hour() * 24;
    const minutes = Math.round((at % 1) * 60);

    return `${String(Math.floor(at)).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const degrees = (angle: number): string => `${Math.round((angle * 180) / Math.PI)}°`;

  let canvas: HTMLCanvasElement | undefined;
  /**
   * The sheet being drawn. Held here rather than in a signal because
   * only the frame loop reads it, and a signal would restage the
   * canvas every time a pokemon finished loading
   */
  let sprite: SpeciesSpriteAnimation | null = null;

  createEffect(() => {
    const wanted = species();

    sprite = null;
    loadSpeciesSprite(wanted)
      .then((loaded) => {
        // Dropped where somebody has already picked another one: the
        // sheets arrive in whatever order they finish
        if (wanted === species()) {
          sprite = loaded;
        }
      })
      .catch(() => {
        sprite = null;
      });
  });

  createEffect(() => {
    const drawing = canvas;

    if (drawing == null) {
      return;
    }

    const batch = QuadBatch.create(drawing);

    if (batch == null) {
      setRefused(true);
      return;
    }

    const bakery = new Bakery();
    let baked = -1;
    let last = 0;
    let frame = requestAnimationFrame(function paint(now: number): void {
      frame = requestAnimationFrame(paint);

      const elapsed = last === 0 ? 0 : now - last;

      last = now;
      sprite?.update(elapsed);
      if (running()) {
        // A whole day in a minute, which is slow enough to watch a
        // shadow swing and fast enough to sit through
        setHour((at) => (at + elapsed / 60_000) % 1);
      }

      const width = drawing.clientWidth;
      const height = drawing.clientHeight;
      const ratio = window.devicePixelRatio;

      if (!(width > 0) || !(height > 0)) {
        return;
      }
      drawing.width = Math.round(width * ratio);
      drawing.height = Math.round(height * ratio);

      const frame_ = fitPicture(width, height);
      const magnify = frame_.width / WIDTH;
      const angle = yaw();
      const thrown = cast();
      const zoomed = magnified();
      const at = (point: {
        x: number;
        y: number;
        scale: number;
      }): {
        x: number;
        y: number;
        scale: number;
      } => ({
        x: frame_.x + point.x * frame_.width,
        y: frame_.y + point.y * frame_.height,
        scale: point.scale,
      });

      batch.begin(width, height, ratio);
      for (const cell of boardCells(frame_, angle)) {
        batch.solid(cell.dark ? shadeOf(GROUND, CHECK_SHADE) : GROUND, cell.corners);
      }

      const disc = bakeShadowDisc(bakery);

      if (baked !== bakery.revision) {
        batch.invalidate(bakery.sheet);
        baked = bakery.revision;
      }

      for (const spot of SPOTS) {
        const middle = at(projectAir(spot, 0, angle));

        if (arrow() && thrown.length > 0) {
          batch.solid(
            ARROW_COLOUR,
            arrowCorners(middle, thrown, CELL * ARROW_CELLS * middle.scale * magnify),
            0.85,
          );
        }
        if (sprite?.ready !== true) {
          continue;
        }
        sprite.play(SpriteAnim.Idle, { direction: 'Down', loop: true });

        const scale =
          (CELL * sizeOf(getSpeciesData(species()).height) * middle.scale * magnify * zoomed) /
          SPRITE_STANDS;
        const placement = { scale, anchor: 'shadow' } as const;
        const patch = sprite.shadowOf(middle.x, middle.y, {
          ...placement,
          color: COLORS.shadow,
          squash: GROUND_SQUASH,
          cast: thrown.length > 0 ? thrown : undefined,
        });
        const laid =
          round() || thrown.length <= 0
            ? null
            : sprite.facedQuadOf(
                middle.x,
                middle.y,
                litFrame('Down', directionOf(thrown.dx, thrown.dy)),
                placement,
              );

        if (patch != null && disc != null) {
          if (laid == null) {
            batch.quad(
              bakery.sheet,
              disc,
              shadowCorners({
                ...patch,
                radiusX: patch.radiusX * SHADOW_STAMP,
                radiusY: patch.radiusY * SHADOW_STAMP,
              }),
              patch.alpha,
              patch.colour,
              'smooth',
            );
          } else {
            batch.quad(
              laid.sheet,
              laid.source,
              castCorners(laid, patch, thrown),
              patch.alpha,
              patch.colour,
            );
          }
        }

        const quad = sprite.quadOf(middle.x, middle.y, placement);

        if (quad != null) {
          batch.quad(quad.sheet, quad.source, [
            { x: quad.left, y: quad.top },
            { x: quad.left + quad.width, y: quad.top },
            { x: quad.left + quad.width, y: quad.top + quad.height },
            { x: quad.left, y: quad.top + quad.height },
          ]);
        }
      }
      batch.end();
    });

    onCleanup(() => {
      cancelAnimationFrame(frame);
      batch.dispose();
    });
  });

  return (
    <div class="flex flex-col gap-4 p-4">
      <h1 class="text-2xl">Shadows</h1>
      <Meta>
        The board, one hour of light and one camera angle, through the same painter the overworld
        draws with. The sun stands in the world rather than on the camera, so walking the camera
        round has to carry every shadow round with it: the bar on the ground is drawn from the light
        alone, and the picture laid down beside it should never come away from it. Turn the laid
        picture off for the round patch a sprite falls back to when the sun is down.
      </Meta>

      <Show when={!refused()} fallback={<Note>This browser would not give a WebGL context.</Note>}>
        <canvas
          ref={canvas}
          class="block h-[min(60vh,32rem)] w-full rounded-panel border-4 border-tide bg-paper"
        />
      </Show>

      <Row>
        <Badge>{clock()}</Badge>
        <Badge>Camera {degrees(yaw())}</Badge>
        <Badge>Sun {sun().elevation.toFixed(2)} up</Badge>
        <Badge>
          Thrown {cast().dx.toFixed(2)}, {cast().dy.toFixed(2)}
        </Badge>
        <Badge>Reach {cast().length.toFixed(2)}</Badge>
        <Badge>{cast().length > 0 ? directionOf(cast().dx, cast().dy) : 'No cast'}</Badge>
      </Row>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Slider
          label="Hour"
          description="Local time, from midnight to midnight"
          value={hour()}
          onChange={(share) => {
            setHour(share);
          }}
        />
        <Slider
          label="Camera"
          description="How far the camera has walked round the board"
          value={turned()}
          onChange={(share) => {
            setTurned(share);
          }}
        />
        <Slider
          label="Latitude"
          description="The middle of the world at half, its edges at either end"
          value={placed()}
          onChange={(share) => {
            setPlaced(share);
          }}
        />
        <Slider
          label="Zoom"
          description="Bigger than the board draws them, so a shadow can be read"
          value={zoom()}
          onChange={(share) => {
            setZoom(share);
          }}
        />
      </div>

      <Row>
        <Select
          label="Pokemon"
          class="w-56"
          value={species()}
          options={pokemon()}
          onChange={(chosen) => {
            setSpecies(chosen);
          }}
        />
        <Switch
          label="Running"
          checked={running()}
          onChange={(on) => {
            setRunning(on);
          }}
        />
        <Switch
          label="Laid picture"
          checked={!round()}
          onChange={(on) => {
            setRound(!on);
          }}
        />
        <Switch
          label="Light bar"
          checked={arrow()}
          onChange={(on) => {
            setArrow(on);
          }}
        />
      </Row>
    </div>
  );
}
