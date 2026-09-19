import { For, type JSX, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import type World from '../../overworld/world';
import { WEATHER_INTERVAL } from '../../overworld/chunk-snapshot';
import Weather, { WEATHER_NAMES } from '../../data/overworld/weather';
import { BIOME_COLORS, BIOME_NAMES } from '../../data/biome';
import type Biome from '../../data/ids/biome';
import { Badge, Button, Note, Row, Select } from '../styled';

/**
 * The sky over a stretch of the world, a chunk at a time.
 *
 * A chunk's weather is two noise readings, front and character, walked
 * along by the hour and classified against the ground. Drawn raw, the
 * two fields show whether a front is a smooth gradient or a patchwork;
 * drawn classified, what a player would meet walking across it.
 */

/** How many chunks across the picture is */
const SPAN = 128;

/** How many pixels a chunk is drawn */
const SCALE = 4;

/** How long a played hour stays on screen, in milliseconds */
const PLAY_STEP = 400;

const enum View {
  Sky = 0,
  Front = 1,
  Character = 2,
  Biome = 3,
  SkyGround = 4,
}

const VIEWS: { value: View; label: string }[] = [
  { value: View.Sky, label: 'Weather' },
  { value: View.Front, label: 'Front' },
  { value: View.Character, label: 'Character' },
  { value: View.Biome, label: 'Biome' },
  { value: View.SkyGround, label: 'Sky ground' },
];

/** A colour for each sky, for this picture only */
const SHADES: Record<Weather, [number, number, number]> = {
  [Weather.Clear]: [236, 226, 170],
  [Weather.Cloudy]: [176, 184, 196],
  [Weather.Overcast]: [128, 136, 150],
  [Weather.Breezy]: [170, 222, 206],
  [Weather.Drizzle]: [140, 186, 230],
  [Weather.Rain]: [82, 136, 214],
  [Weather.Downpour]: [40, 82, 170],
  [Weather.Thunderstorm]: [70, 40, 130],
  [Weather.Mist]: [210, 216, 226],
  [Weather.Fog]: [240, 240, 244],
  [Weather.Haze]: [214, 190, 150],
  [Weather.Frost]: [196, 232, 250],
  [Weather.Snow]: [250, 252, 255],
  [Weather.Blizzard]: [150, 200, 240],
  [Weather.Hail]: [120, 170, 190],
  [Weather.Sandstorm]: [214, 164, 84],
  [Weather.DustHaze]: [180, 150, 110],
  [Weather.Heatwave]: [240, 110, 60],
  [Weather.FallingAsh]: [90, 80, 80],
  [Weather.Aurora]: [80, 230, 170],
  [Weather.Rainbow]: [250, 120, 200],
  [Weather.PollenDrift]: [240, 220, 80],
  [Weather.MeteorShower]: [255, 60, 60],
  [Weather.FataMorgana]: [255, 170, 40],
  [Weather.DarkDay]: [20, 20, 30],
  [Weather.Fogbow]: [170, 110, 255],
};

/** A biome's map colour as channels */
function biomeShade(biome: Biome): [number, number, number] {
  const hex = Number.parseInt(BIOME_COLORS[biome].slice(1), 16);

  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
}

/** A reading from -1 to 1 as a grey, black at -1 */
function grey(value: number): [number, number, number] {
  const shade = Math.round(((value + 1) / 2) * 255);

  return [shade, shade, shade];
}

export interface WeatherMapProps {
  world: World;
  /** The chunk in the middle of the picture */
  centreX: number;
  centreY: number;
}

export default function WeatherMap(props: WeatherMapProps): JSX.Element {
  const now = Math.floor(Date.now() / WEATHER_INTERVAL);
  const [view, setView] = createSignal(View.Sky);
  const [hour, setHour] = createSignal(now);
  const [playing, setPlaying] = createSignal(false);
  const [counts, setCounts] = createSignal<[Weather, number][]>([]);
  const [under, setUnder] = createSignal<{
    x: number;
    y: number;
    weather: Weather;
    biome: Biome;
    front: number;
    character: number;
  } | null>(null);
  let canvas: HTMLCanvasElement | undefined;

  const originX = (): number => props.centreX - SPAN / 2;
  const originY = (): number => props.centreY - SPAN / 2;

  createEffect(() => {
    const world = props.world;
    const shown = view();
    const shownHour = hour();
    const x0 = originX();
    const y0 = originY();
    const context = canvas?.getContext('2d');

    if (context == null) {
      return;
    }
    const image = context.createImageData(SPAN * SCALE, SPAN * SCALE);
    const tally = new Map<Weather, number>();

    for (let row = 0; row < SPAN; row++) {
      for (let column = 0; column < SPAN; column++) {
        const reading = world.getWeatherReading(x0 + column, y0 + row, shownHour);
        const weather = world.getWeather(x0 + column, y0 + row, shownHour);
        let shade: [number, number, number];

        tally.set(weather, (tally.get(weather) ?? 0) + 1);
        if (shown === View.Front) {
          shade = grey(reading.front);
        } else if (shown === View.Character) {
          shade = grey(reading.character);
        } else if (shown === View.Biome) {
          shade = biomeShade(world.getChunkBiome(x0 + column, y0 + row));
        } else if (shown === View.SkyGround) {
          shade = biomeShade(world.getSkyGround(x0 + column, y0 + row));
        } else {
          shade = SHADES[weather];
        }
        for (let dy = 0; dy < SCALE; dy++) {
          for (let dx = 0; dx < SCALE; dx++) {
            const at = ((row * SCALE + dy) * SPAN * SCALE + column * SCALE + dx) * 4;

            image.data[at] = shade[0];
            image.data[at + 1] = shade[1];
            image.data[at + 2] = shade[2];
            image.data[at + 3] = 0xff;
          }
        }
      }
    }
    context.putImageData(image, 0, 0);

    const sorted: [Weather, number][] = [...tally];

    sorted.sort((a, b) => b[1] - a[1]);
    setCounts(sorted);
  });

  createEffect(() => {
    if (!playing()) {
      return;
    }
    const timer = setInterval(() => {
      setHour((was) => was + 1);
    }, PLAY_STEP);

    onCleanup(() => {
      clearInterval(timer);
    });
  });

  const look = (event: MouseEvent): void => {
    const surface = canvas;

    if (surface == null) {
      return;
    }
    const box = surface.getBoundingClientRect();
    const x = originX() + Math.floor(((event.clientX - box.left) / box.width) * SPAN);
    const y = originY() + Math.floor(((event.clientY - box.top) / box.height) * SPAN);
    const reading = props.world.getWeatherReading(x, y, hour());

    setUnder({
      x,
      y,
      weather: props.world.getWeather(x, y, hour()),
      biome: props.world.getChunkBiome(x, y),
      ...reading,
    });
  };

  return (
    <div class="flex flex-col gap-3">
      <Note>
        The weather, {SPAN} chunks across and centred on the same ground as the picture above, one
        square per chunk. Front (how much is falling) and Character (how calm or wild the air is)
        are the two raw readings, black at -1 and white at 1. Biome is each chunk's own country, and
        Sky ground is the commonest country round it, which is what its sky is read against.
      </Note>
      <Row>
        <Select
          label="Showing"
          class="w-40"
          value={view()}
          options={VIEWS}
          onChange={(chosen) => {
            setView(chosen);
          }}
        />
        <Button
          onClick={() => {
            setHour((was) => was - 1);
          }}
        >
          Hour earlier
        </Button>
        <Button
          onClick={() => {
            setHour((was) => was + 1);
          }}
        >
          Hour later
        </Button>
        <Button
          onClick={() => {
            setPlaying((was) => !was);
          }}
        >
          {playing() ? 'Stop' : 'Play'}
        </Button>
        <Button
          disabled={hour() === now}
          onClick={() => {
            setHour(now);
          }}
        >
          Now
        </Button>
        <Badge>
          {hour() === now ? 'This hour' : `${hour() - now > 0 ? '+' : ''}${hour() - now} h`}
        </Badge>
      </Row>
      <canvas
        ref={canvas}
        width={SPAN * SCALE}
        height={SPAN * SCALE}
        class="max-w-full self-start border border-line"
        onMouseMove={look}
      />
      <Show when={under()} keyed>
        {(spot) => (
          <Note>
            Chunk {spot.x}, {spot.y}: {WEATHER_NAMES[spot.weather]} over {BIOME_NAMES[spot.biome]},
            front {spot.front.toFixed(2)}, character {spot.character.toFixed(2)}
          </Note>
        )}
      </Show>
      <Show when={view() === View.Sky}>
        <Row>
          <For each={counts()}>
            {([weather, count]) => (
              <Badge>
                <span
                  class="inline-block size-3 rounded-sm"
                  style={{ background: `rgb(${SHADES[weather].join(', ')})` }}
                />{' '}
                {WEATHER_NAMES[weather]} {((count / (SPAN * SPAN)) * 100).toFixed(1)}%
              </Badge>
            )}
          </For>
        </Row>
      </Show>
    </div>
  );
}
