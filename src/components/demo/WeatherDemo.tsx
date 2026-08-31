import { useSearchParams } from '@solidjs/router';
import { For, type JSX, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { Badge, Button, Meta, Note, Row, Select, Slider, Switch } from '../styled';
import Weather, {
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
import paintSky, { type Lamp, batchSky, batchWash } from '../../canvas/sky';
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

/** How wide the checker's squares are, in drawn pixels */
const CHECK = 48;

/** How much darker the checker's other square is */
const CHECK_SHADE = 0.12;

/**
 * Marks standing on the ground, where the board would have landmarks
 * and pokemon. They are here for one sky: a dark day is drawn as a
 * dark room with a lamp over everything worth walking to, and with an
 * empty field under it there would be nothing to light
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

export interface SkyStageProps {
  weather: Weather;
  strength: number;
  ground: Biome;
  checkered: boolean;
  running: boolean;
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
      const marks = MARKS.map((mark) => ({ x: mark.x * width, y: mark.y * height }));
      const lamps: Lamp[] = marks.map((mark) => ({ ...mark, reach: wide * MARK_REACH }));

      if (batch != null) {
        batch.begin(width, height, ratio);
        batch.solid(country, [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height },
        ]);
        if (props.checkered) {
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
            { x: mark.x - wide, y: mark.y - wide },
            { x: mark.x + wide, y: mark.y - wide },
            { x: mark.x + wide, y: mark.y + wide },
            { x: mark.x - wide, y: mark.y + wide },
          ]);
        }
        batchWash(batch, width, height, props.weather, clock, props.strength, lamps);
        batchSky(batch, width, height, props.weather, clock, props.strength);
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
      context.fillStyle = country;
      context.fillRect(0, 0, width, height);
      if (props.checkered) {
        context.fillStyle = shade;
        for (let row = 0; row < rows; row++) {
          for (let column = row % 2; column < columns; column += 2) {
            context.fillRect(column * CHECK, row * CHECK, CHECK, CHECK);
          }
        }
      }
      context.fillStyle = '#f4b63f';
      for (const mark of marks) {
        context.fillRect(mark.x - wide, mark.y - wide, wide * 2, wide * 2);
      }
      paintSky(context, width, height, props.weather, clock, props.strength, lamps);
    };

    frame = requestAnimationFrame(paint);

    onCleanup(() => {
      cancelAnimationFrame(frame);
      batch?.dispose();
    });
  });

  return <canvas ref={canvas} class="block size-full" />;
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
        The same two painters the overworld uses, over a flat country instead of a board. Turn WebGL
        off to see the 2D pass the board falls back to when a browser will not give a context, which
        is the only way to catch the two drifting apart. The sky in the address is what is staged,
        so a link is a demonstration.
      </Meta>
    </main>
  );
}
