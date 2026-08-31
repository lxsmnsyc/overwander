import { useSearchParams } from '@solidjs/router';
import { For, type JSX, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { Badge, Button, Meta, Note, Row, Select, Slider, Switch } from '../styled';
import Weather, {
  DARK_DAY_LAMP_CELLS,
  WEATHER_DESCRIPTIONS,
  WEATHER_NAMES,
  WEATHER_TYPES,
  favorsEverything,
  hiddenAbilityBoostOf,
  isBoostingWeather,
  shadowsWildMeetings,
  shinyBoostOf,
  teachesEggMove,
} from '../../data/overworld/weather';
import { BIOME_COLORS, BIOME_NAMES } from '../../data/biome';
import Biome from '../../data/ids/biome';
import QuadBatch from '../../canvas/gl/quad-batch';
import type { QuadPoint } from '../../canvas/gl/quad-batch';
import paintSky, { type Lamp, type SkyCamera, batchSky, batchWash } from '../../canvas/sky';
import {
  PICTURE_SPAN,
  TURN_DEAD_ZONE,
  angleOf,
  fitPicture,
  projectAir,
  radiusOf,
  shortestTurn,
  unprojectGround,
} from '../../canvas/board';
import createTwist from '../../canvas/twist';
import { GROUND_DEPTH } from '../../canvas/tilt';
import { TYPE_NAMES } from '../../data/constants/types';

/**
 * Every sky, on demand.
 *
 * A weather is the hardest thing in the game to look at on purpose:
 * it is derived from the chunk and the hour, so seeing Fogbow means
 * finding the one country and window that rolls one. This stages any
 * of them over any ground, at any strength, stopped or running.
 *
 * It draws through the same two painters the board does, and the
 * renderer is a switch rather than a fallback nobody can reach: the
 * WebGL pass and the 2D pass drifted apart once, and the only way to
 * notice is to put them side by side.
 *
 * The sky is in the address, so a link is a demonstration.
 */

/** What a bare `/demo/weather` opens on: the loudest one to look at */
const DEFAULT_SKY = Weather.Thunderstorm;

/** The ground it stands over until somebody picks another country */
const DEFAULT_GROUND = Biome.Grassland;

/** A step, for looking at one moment of a fall at a time */
const STEP = 100;

/** How wide the checker's squares are, in drawn pixels, off the board */
const CHECK = 48;

/** How many cells the board is across, which is what the chunk is */
const CELLS = 16;

/** How much darker the checker's other square is */
const CHECK_SHADE = 0.12;

/**
 * And how much darker the country beyond the board is. The overworld
 * fills the screen with the biome's own colour and stands the board on
 * it; a little off it here is what keeps the board readable when the
 * checker is turned off
 */
const BEYOND_SHADE = 0.25;

/**
 * Marks standing on the ground, where the board would have landmarks
 * and pokemon. They are here for one sky: a dark day is drawn as a
 * dark room with a lamp over everything worth walking to, and with an
 * empty field under it there would be nothing to light.
 *
 * Read as board fractions rather than screen ones, so on the board
 * they stand on cells and turn with it
 */
const MARKS: { x: number; y: number }[] = [
  { x: 0.22, y: 0.34 },
  { x: 0.48, y: 0.62 },
  { x: 0.74, y: 0.3 },
  { x: 0.62, y: 0.82 },
  { x: 0.16, y: 0.74 },
];

/** How wide a mark is drawn, as a share of the shorter side */
const MARK_SIZE = 0.055;

/** How far its lamp reaches, as a multiple of that */
const MARK_REACH = 3.4;

/**
 * The ground, as a flat country with a checker over it.
 *
 * A wash is a `multiply` or a `screen`, so it needs something opaque
 * under it or it lands on nothing: on the board that is the country
 * itself, and here it is this. The checker is what makes a veil
 * legible, since flat colour under fog looks like flat colour
 */
function shadeOf(colour: string, amount: number): string {
  const value = Number.parseInt(colour.slice(1), 16);
  const dim = (channel: number): number => Math.round(channel * (1 - amount));
  const red = dim((value >> 16) & 0xff);
  const green = dim((value >> 8) & 0xff);
  const blue = dim(value & 0xff);

  return `#${((red << 16) | (green << 8) | blue).toString(16).padStart(6, '0')}`;
}

/** One cell of the board, laid out ready for either painter */
interface Cell {
  corners: QuadPoint[];
  dark: boolean;
}

/**
 * The board, cell by cell, through the same camera the sky goes
 * through. It is a trapezoid rather than a rectangle, and every cell
 * is its own quad: the two far corners of one sit closer together
 * than its two near ones, which is the whole of what makes the ground
 * read as ground
 */
function boardCells(placed: ReturnType<typeof fitPicture>, yaw: number): Cell[] {
  const at = (u: number, v: number): QuadPoint => {
    const point = projectAir({ u, v }, 0, yaw);

    return { x: placed.x + point.x * placed.width, y: placed.y + point.y * placed.height };
  };
  // Every corner once, since each is shared by up to four cells
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
 * Where a mark stands and how far its lamp reaches.
 *
 * The lamp is the board's own: cells rather than a share of the
 * window, so a dark day here is lit exactly as far as a dark day in
 * the world is, which is the only reason to look at one on this page
 */
function marksOn(
  placed: ReturnType<typeof fitPicture>,
  yaw: number,
): { x: number; y: number; wide: number; reach: number }[] {
  const cell = placed.width / PICTURE_SPAN / CELLS;

  return MARKS.map((mark) => {
    const point = projectAir({ u: mark.x, v: mark.y }, 0, yaw);

    return {
      x: placed.x + point.x * placed.width,
      y: placed.y + point.y * placed.height,
      // A mark on a near cell is a larger mark, the same as everything
      // else standing on the board
      // A cell across, since that is what a landmark on the board is.
      // Drawn at the share of the window the flat ground uses them at,
      // a mark would be four cells wide and its lamp would look like a
      // pinhole beside it
      wide: cell * 0.5 * point.scale,
      reach: cell * DARK_DAY_LAMP_CELLS * point.scale,
    };
  });
}

export interface SkyStageProps {
  weather: Weather;
  strength: number;
  ground: Biome;
  checkered: boolean;
  running: boolean;
  /**
   * Whether the ground is the board rather than a flat country.
   *
   * The sky is weather standing in the world now, so it needs a camera
   * to stand in front of; without one it falls back to the flat sky it
   * used to be. Both are worth being able to look at, which is why
   * this is a switch and not a rewrite
   */
  board: boolean;
  /** Which way the camera has been walked round, in radians */
  yaw: number;
  onTurn: (yaw: number) => void;
  /** Steps the clock has been nudged by, while it is stopped */
  stepped: number;
  /** Whether to draw through WebGL rather than the 2D fallback */
  webgl: boolean;
  onRenderer: (said: string) => void;
}

/**
 * One canvas, drawing one sky. Keyed on the renderer by the page
 * above: a canvas hands out one kind of context for its whole life,
 * so switching means a new element rather than a new setting
 */
function SkyStage(props: SkyStageProps): JSX.Element {
  let canvas: HTMLCanvasElement | undefined;
  /**
   * How far into the sky it is drawing. It lives out here rather than
   * in the draw effect so a step moves it: read inside that effect it
   * would be a tracked read, and every step would restage the canvas
   * from nothing instead of nudging it along
   */
  let clock = 0;

  createEffect((last: number) => {
    clock += (props.stepped - last) * STEP;
    return props.stepped;
  }, props.stepped);

  createEffect(() => {
    const drawing = canvas;

    if (drawing == null) {
      return;
    }

    const batch = props.webgl ? QuadBatch.create(drawing) : null;
    const context = batch == null ? drawing.getContext('2d') : null;

    props.onRenderer(batch == null ? '2D' : 'WebGL');

    if (batch == null && context == null) {
      return;
    }

    let last = 0;
    let frame = 0;

    const paint = (now: number): void => {
      frame = requestAnimationFrame(paint);

      const elapsed = last === 0 ? 0 : now - last;

      last = now;
      if (props.running) {
        clock += elapsed;
      }

      const width = drawing.clientWidth;
      const height = drawing.clientHeight;
      const ratio = window.devicePixelRatio;

      if (!(width > 0) || !(height > 0)) {
        return;
      }

      const country = BIOME_COLORS[props.ground];
      const shade = shadeOf(country, CHECK_SHADE);
      const columns = Math.ceil(width / CHECK);
      const rows = Math.ceil(height / CHECK);
      const wide = Math.min(width, height) * MARK_SIZE;
      const placed = fitPicture(width, height);
      /**
       * The camera the sky stands in front of, where there is a board
       * to stand it on. Without one every painter falls back to the
       * flat sky, which is the other half of what this page is for
       */
      const camera: SkyCamera | undefined = props.board ? { yaw: props.yaw, ...placed } : undefined;
      const cells = props.board ? boardCells(placed, props.yaw) : [];
      const marks = props.board
        ? marksOn(placed, props.yaw)
        : MARKS.map((mark) => ({
            x: mark.x * width,
            y: mark.y * height,
            wide,
            reach: wide * MARK_REACH,
          }));
      // Laid back with the ground where there is a board under them,
      // and round where the sky is being drawn on the glass
      const lamps: Lamp[] = marks.map((mark) => ({
        x: mark.x,
        y: mark.y,
        reach: mark.reach,
        squash: props.board ? GROUND_DEPTH : 1,
      }));

      if (batch != null) {
        batch.begin(width, height, ratio);
        // The country behind the board as well as under it: a wash is
        // a multiply or a screen, and it lands on nothing without
        // something opaque beneath it
        batch.solid(props.board ? shadeOf(country, BEYOND_SHADE) : country, [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height },
        ]);
        if (props.board) {
          for (const cell of cells) {
            if (props.checkered || !cell.dark) {
              batch.solid(cell.dark ? shade : country, cell.corners);
            }
          }
        } else if (props.checkered) {
          for (let row = 0; row < rows; row++) {
            for (let column = row % 2; column < columns; column += 2) {
              const left = column * CHECK;
              const top = row * CHECK;

              batch.solid(shade, [
                { x: left, y: top },
                { x: left + CHECK, y: top },
                { x: left + CHECK, y: top + CHECK },
                { x: left, y: top + CHECK },
              ]);
            }
          }
        }
        for (const mark of marks) {
          batch.solid('#f4b63f', [
            { x: mark.x - mark.wide, y: mark.y - mark.wide },
            { x: mark.x + mark.wide, y: mark.y - mark.wide },
            { x: mark.x + mark.wide, y: mark.y + mark.wide },
            { x: mark.x - mark.wide, y: mark.y + mark.wide },
          ]);
        }
        batchWash(batch, width, height, props.weather, clock, props.strength, lamps, camera);
        batchSky(batch, width, height, props.weather, clock, props.strength, camera);
        batch.end();
        return;
      }
      if (context == null) {
        return;
      }

      const across = Math.max(1, Math.round(width * ratio));
      const down = Math.max(1, Math.round(height * ratio));

      if (drawing.width !== across || drawing.height !== down) {
        drawing.width = across;
        drawing.height = down;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1;
      context.fillStyle = props.board ? shadeOf(country, BEYOND_SHADE) : country;
      context.fillRect(0, 0, width, height);
      if (props.board) {
        for (const cell of cells) {
          if (!props.checkered && cell.dark) {
            continue;
          }
          context.fillStyle = cell.dark ? shade : country;
          context.beginPath();
          context.moveTo(cell.corners[0].x, cell.corners[0].y);
          for (const corner of cell.corners.slice(1)) {
            context.lineTo(corner.x, corner.y);
          }
          context.closePath();
          context.fill();
        }
      } else if (props.checkered) {
        context.fillStyle = shade;
        for (let row = 0; row < rows; row++) {
          for (let column = row % 2; column < columns; column += 2) {
            context.fillRect(column * CHECK, row * CHECK, CHECK, CHECK);
          }
        }
      }
      context.fillStyle = '#f4b63f';
      for (const mark of marks) {
        context.fillRect(mark.x - mark.wide, mark.y - mark.wide, mark.wide * 2, mark.wide * 2);
      }
      paintSky(context, width, height, props.weather, clock, props.strength, lamps, camera);
    };

    frame = requestAnimationFrame(paint);

    onCleanup(() => {
      cancelAnimationFrame(frame);
      batch?.dispose();
    });
  });

  /** Two fingers, the same gesture the board itself takes */
  const twist = createTwist();
  /**
   * The bit of ground being held, in the world's own angles, while a
   * drag is in progress
   */
  let turning: number | null = null;

  /** Where the pointer is, in fractions of the drawn picture */
  const fractionAt = (event: PointerEvent): { x: number; y: number } | null => {
    const element = canvas;

    if (element == null) {
      return null;
    }

    const bounds = element.getBoundingClientRect();
    const frame = fitPicture(bounds.width, bounds.height);

    if (frame.width === 0 || frame.height === 0) {
      return null;
    }
    return {
      x: (event.clientX - bounds.left - frame.x) / frame.width,
      y: (event.clientY - bounds.top - frame.y) / frame.height,
    };
  };

  /**
   * Take hold of the plane. What is grabbed is a point on the ground
   * rather than a number of pixels, so the board turns the way the
   * hand pushed it and not the way the mouse went
   */
  const grab = (event: PointerEvent): number | null => {
    const at = fractionAt(event);

    if (at == null) {
      return null;
    }

    const ground = unprojectGround(at.x, at.y, props.yaw);

    return radiusOf(ground) < TURN_DEAD_ZONE ? null : angleOf(ground);
  };

  /**
   * Turn the board so the grabbed point comes back under the pointer.
   * The point is held in the world's angles and the pointer read in
   * the camera's; the difference between the two is the yaw
   */
  const dragTo = (event: PointerEvent, grabbed: number): void => {
    const at = fractionAt(event);

    if (at == null) {
      return;
    }

    const seen = unprojectGround(at.x, at.y, 0);

    if (radiusOf(seen) < TURN_DEAD_ZONE) {
      return;
    }
    props.onTurn(props.yaw + shortestTurn(props.yaw, angleOf(seen) - grabbed));
  };

  return (
    <canvas
      ref={canvas}
      // The board turns under the sky here the way it does in the
      // world, since what the sky standing in the world buys is only
      // visible while the camera is moving
      class={`block size-full ${props.board ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{ 'touch-action': 'none' }}
      onPointerDown={(event) => {
        if (!props.board) {
          return;
        }
        twist.down(event);
        if (twist.turning()) {
          turning = null;
          return;
        }

        const grabbed = grab(event);

        if (grabbed == null) {
          return;
        }
        turning = grabbed;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!props.board) {
          return;
        }

        const spun = twist.move(event);

        if (spun != null) {
          props.onTurn(props.yaw + spun);
          return;
        }
        if (turning != null) {
          dragTo(event, turning);
        }
      }}
      onPointerUp={(event) => {
        twist.up(event);
        turning = null;
      }}
      onPointerCancel={(event) => {
        twist.up(event);
        turning = null;
      }}
    />
  );
}

export default function WeatherDemo(): JSX.Element {
  const [params, setParams] = useSearchParams<{ sky?: string; ground?: string }>();

  /** Every sky, read off the table that has to name them all */
  const skies = (): { value: Weather; label: string }[] =>
    Object.entries(WEATHER_NAMES).map(([key, label]) => ({ value: Number(key), label }));

  /**
   * Which one is being looked at. It comes out of the address by name
   * rather than by number, so a link says what it shows
   */
  const chosen = (): Weather =>
    skies().find((entry) => entry.label === params.sky)?.value ?? DEFAULT_SKY;

  const show = (sky: Weather): void => {
    setParams({ sky: WEATHER_NAMES[sky] });
  };

  /** The country under it, in the address for the same reason the sky is */
  const grounds = (): { value: Biome; label: string }[] =>
    Object.entries(BIOME_NAMES).map(([key, label]) => ({ value: Number(key), label }));

  const ground = (): Biome =>
    grounds().find((entry) => entry.label === params.ground)?.value ?? DEFAULT_GROUND;

  const stand = (biome: Biome): void => {
    setParams({ ground: BIOME_NAMES[biome] });
  };

  /** The next or previous sky, for sweeping the whole list */
  const shift = (by: number): void => {
    const all = skies();
    const at = all.findIndex((entry) => entry.value === chosen());

    show(all[(at + by + all.length) % all.length].value);
  };

  const [strength, setStrength] = createSignal(1);
  const [checkered, setCheckered] = createSignal(true);
  const [running, setRunning] = createSignal(true);
  const [webgl, setWebgl] = createSignal(true);
  const [board, setBoard] = createSignal(true);
  const [yaw, setYaw] = createSignal(0);
  const [stepped, setStepped] = createSignal(0);
  const [renderer, setRenderer] = createSignal('');

  /**
   * What the sky does to the world, off the same helpers the overworld
   * reads. A demo that only showed the picture would leave out half of
   * what a weather is
   */
  const effects = (): string[] => {
    const sky = chosen();
    const said: string[] = [];
    const shiny = shinyBoostOf(sky);
    const hidden = hiddenAbilityBoostOf(sky);

    if (favorsEverything(sky)) {
      said.push('favours every type');
    } else if (WEATHER_TYPES[sky].length > 0) {
      said.push(`favours ${WEATHER_TYPES[sky].map((type) => TYPE_NAMES[type]).join(', ')}`);
    }
    if (shiny > 1) {
      said.push(`shinies ×${shiny}`);
    }
    if (hidden > 1) {
      said.push(`hidden abilities ×${hidden}`);
    }
    if (teachesEggMove(sky)) {
      said.push('meetings carry an egg move');
    }
    if (shadowsWildMeetings(sky)) {
      said.push('meetings can be shadows');
    }
    if (isBoostingWeather(sky)) {
      said.push('carries into battle');
    }
    return said;
  };

  return (
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
      <div class="flex flex-wrap items-end gap-2">
        <h1 class="grow">Weather demo</h1>
        <Select label="Sky" class="w-56" value={chosen()} options={skies()} onChange={show} />
      </div>

      <Row>
        <Button
          onClick={() => {
            shift(-1);
          }}
        >
          Previous
        </Button>
        <Button
          onClick={() => {
            shift(1);
          }}
        >
          Next
        </Button>
        <Badge tone="tide">{WEATHER_NAMES[chosen()]}</Badge>
        <Show when={renderer()}>{(said) => <Badge tone="neutral">{said()}</Badge>}</Show>
      </Row>

      <Note>{WEATHER_DESCRIPTIONS[chosen()]}</Note>

      <Show when={effects().length > 0}>
        <Row>
          <For each={effects()}>{(said) => <Badge tone="leaf">{said}</Badge>}</For>
        </Row>
      </Show>

      {/* Keyed on the renderer, and on a word rather than the flag: a
          canvas hands out one kind of context for its whole life, so
          the other pass needs another element, and a `Show` asked
          about `false` would draw neither */}
      <Show keyed when={webgl() ? 'gl' : '2d'}>
        {(pass) => (
          <div class="h-[60vh] w-full overflow-hidden rounded-panel border-4 border-tide shadow-pop">
            <SkyStage
              weather={chosen()}
              strength={strength()}
              ground={ground()}
              checkered={checkered()}
              running={running()}
              stepped={stepped()}
              board={board()}
              yaw={yaw()}
              onTurn={(angle) => {
                setYaw(angle);
              }}
              webgl={pass === 'gl'}
              onRenderer={(said) => {
                setRenderer(said);
              }}
            />
          </div>
        )}
      </Show>

      <div class="grid gap-3 sm:grid-cols-2">
        <Select label="Ground" value={ground()} options={grounds()} onChange={stand} />
        <Slider
          label="Strength"
          description="What the board scales a sky by as it comes and goes"
          value={strength()}
          onChange={(share) => {
            setStrength(share);
          }}
        />
      </div>

      <Row>
        <Switch
          label="Running"
          checked={running()}
          onChange={(on) => {
            setRunning(on);
          }}
        />
        <Button
          disabled={running()}
          onClick={() => {
            setStepped((count) => count + 1);
          }}
        >
          Step {STEP}ms
        </Button>
        <Switch
          label="On the board"
          checked={board()}
          onChange={(on) => {
            setBoard(on);
          }}
        />
        <Switch
          label="Checkered ground"
          checked={checkered()}
          onChange={(on) => {
            setCheckered(on);
          }}
        />
        <Switch
          label="WebGL"
          checked={webgl()}
          onChange={(on) => {
            setWebgl(on);
          }}
        />
      </Row>

      <Meta>
        The same two painters the overworld uses, over the same board. Drag it to walk the camera
        round: the weather stands in the world rather than on the glass, so turning is the only way
        to see what it is doing. Take it off the board for the flat sky every painter falls back to
        without a camera, and turn WebGL off for the 2D pass the board falls back to when a browser
        will not give a context, which is the only way to catch the two drifting apart. The sky in
        the address is what is staged, so a link is a demonstration.
      </Meta>
    </main>
  );
}
