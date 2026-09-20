import { type JSX, Show, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import WorldMapCanvas, { townsInView } from '../overworld/WorldMapCanvas';
import WeatherMap from './WeatherMap';
import getWorld from '../../overworld/current';
import { BIOME_NAMES } from '../../data/biome';
import { Badge, Button, Meta, Note, Row, Switch } from '../styled';
import World, { Generation, isInWorld } from '../../overworld/world';
import { CHUNK_CELLS } from '../../overworld/chunk';
import shadeCell from '../../canvas/world-shade';
import { TERRACE_TOP, levelAt } from '../../overworld/terrace';
import type Biome from '../../data/ids/biome';

/**
 * The world's ground, a cell at a time.
 *
 * The climate and the water and the rock are fields over the whole
 * world now rather than rolls inside a chunk, and the thing worth
 * looking at is whether they read as country: whether a lake carries
 * over a chunk boundary, whether a border wanders or draws an oval,
 * whether a mountain is more rock than a meadow. None of that can be
 * seen a chunk at a time, which is the whole point of it.
 *
 * One pixel is one cell. The chunk grid is drawn over the top so that
 * the seams the old generator left are visible by their absence.
 */

/** How wide the picture is, in cells */
const SPAN = 512;

/** How the chunk grid is drawn over it */
const GRID_COLOR = 'rgba(255, 255, 255, 0.25)';

/** How close it can be looked at, in pixels to a cell */
const MAX_ZOOM = 8;

/** How far one press of a pan button moves, in cells */
const STEP = 128;

/** The world every player is walking, so the picture is the real one */
const DEFAULT_SEED = 'overworld';

/** How many chunks across the in-game map below it is, which is what the game's dialog shows */
const MAP_SPAN = 64;

export default function WorldDemo(): JSX.Element {
  const [seed, setSeed] = createSignal(DEFAULT_SEED);
  // Which generation the ground is read with, so the second can be
  // looked at beside the first on the same seed
  const [second, setSecond] = createSignal(false);
  const generation = (): Generation => (second() ? Generation.Second : Generation.First);
  const [left, setLeft] = createSignal(-SPAN / 2);
  const [top, setTop] = createSignal(-SPAN / 2);
  const [zoom, setZoom] = createSignal(1);
  const [grid, setGrid] = createSignal(true);
  const [roads, setRoads] = createSignal(true);
  const [levels, setLevels] = createSignal(true);
  const [drawn, setDrawn] = createSignal(0);
  const [under, setUnder] = createSignal<{ x: number; y: number; biome: Biome } | null>(null);
  const [detailedMap, setDetailedMap] = createSignal(true);
  let canvas: HTMLCanvasElement | undefined;
  /** Kept rather than built per read, so hovering the weather map reuses its caches */
  const weatherWorld = createMemo(() => new World(seed(), undefined, generation()));

  /** The in-game map's view, in chunks, centred on the middle of the picture above */
  const mapX = createMemo(() => Math.floor((left() + SPAN / 2) / CHUNK_CELLS) - MAP_SPAN / 2);
  const mapY = createMemo(() => Math.floor((top() + SPAN / 2) / CHUNK_CELLS) - MAP_SPAN / 2);
  const mapBiomes = createMemo(() => {
    const world = getWorld();
    const values: (Biome | null)[] = [];

    for (let row = 0; row < MAP_SPAN; row++) {
      for (let column = 0; column < MAP_SPAN; column++) {
        const x = mapX() + column;
        const y = mapY() + row;

        values.push(isInWorld(x, y) ? world.getChunkBiome(x, y) : null);
      }
    }
    return values;
  });

  createEffect(() => {
    const world = new World(seed(), undefined, generation());
    const scale = zoom();
    const x0 = left();
    const y0 = top();
    const showing = grid();
    const paved = roads();
    const stepped = levels();
    const surface = canvas;

    if (surface == null) {
      return;
    }

    const context = surface.getContext('2d');

    if (context == null) {
      return;
    }

    // Painted off the main thread's clock rather than in the effect
    // itself: a pan is a keypress and the field is a quarter of a
    // million samples, and a frame spent showing the old picture is
    // better than one spent showing nothing
    const timer = setTimeout(() => {
      const started = performance.now();
      const cells = Math.ceil(SPAN / scale);
      const image = context.createImageData(SPAN, SPAN);

      for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
          const shade = shadeCell(world, x0 + x, y0 + y, { roads: paved, levels: stepped });

          // One cell is `scale` pixels square, so the picture holds
          // fewer cells the closer it is looked at
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              const at = ((y * scale + dy) * SPAN + (x * scale + dx)) * 4;

              image.data[at] = shade[0];
              image.data[at + 1] = shade[1];
              image.data[at + 2] = shade[2];
              image.data[at + 3] = 0xff;
            }
          }
        }
      }
      context.putImageData(image, 0, 0);

      if (showing) {
        // The chunk grid, over the top: the point of the picture is
        // that nothing else lines up with it
        context.strokeStyle = GRID_COLOR;
        context.lineWidth = 1;
        for (let at = 0; at < cells; at++) {
          if ((x0 + at) % CHUNK_CELLS !== 0) {
            continue;
          }
          context.beginPath();
          context.moveTo(at * scale + 0.5, 0);
          context.lineTo(at * scale + 0.5, SPAN);
          context.stroke();
        }
        for (let at = 0; at < cells; at++) {
          if ((y0 + at) % CHUNK_CELLS !== 0) {
            continue;
          }
          context.beginPath();
          context.moveTo(0, at * scale + 0.5);
          context.lineTo(SPAN, at * scale + 0.5);
          context.stroke();
        }
      }
      setDrawn(Math.round(performance.now() - started));
    }, 0);

    onCleanup(() => {
      clearTimeout(timer);
    });
  });

  const look = (event: MouseEvent): void => {
    const surface = canvas;

    if (surface == null) {
      return;
    }

    const box = surface.getBoundingClientRect();
    const x = left() + Math.floor(((event.clientX - box.left) / box.width) * (SPAN / zoom()));
    const y = top() + Math.floor(((event.clientY - box.top) / box.height) * (SPAN / zoom()));

    setUnder({ x, y, biome: new World(seed(), undefined, generation()).getCellBiome(x, y) });
  };

  return (
    <div class="flex flex-col gap-3 p-3">
      <Meta>
        One pixel is one cell of the world. Water is its country's own colour, darkened, rock is
        grey, a town is pale and the roads between towns are rust. The chunk grid is drawn over the
        top, and nothing in the ground lines up with it.
      </Meta>
      <Row>
        <Button
          onClick={() => {
            setLeft((was) => was - STEP);
          }}
        >
          West
        </Button>
        <Button
          onClick={() => {
            setLeft((was) => was + STEP);
          }}
        >
          East
        </Button>
        <Button
          onClick={() => {
            setTop((was) => was - STEP);
          }}
        >
          North
        </Button>
        <Button
          onClick={() => {
            setTop((was) => was + STEP);
          }}
        >
          South
        </Button>
        <Badge>
          {left()}, {top()}
        </Badge>
        <Badge tone="leaf">{drawn()}ms</Badge>
      </Row>
      <Row>
        <Button
          disabled={zoom() <= 1}
          onClick={() => {
            setZoom((was) => Math.max(1, was - 1));
          }}
        >
          Wider
        </Button>
        <Button
          disabled={zoom() >= MAX_ZOOM}
          onClick={() => {
            setZoom((was) => Math.min(MAX_ZOOM, was + 1));
          }}
        >
          Closer
        </Button>
        <Badge>{zoom()} px a cell</Badge>
        <Switch
          label="Chunk grid"
          checked={grid()}
          onChange={(checked) => {
            setGrid(checked);
          }}
        />
        <Switch
          label="Roads"
          checked={roads()}
          onChange={(checked) => {
            setRoads(checked);
          }}
        />
        <Switch
          label="Levels"
          checked={levels()}
          onChange={(checked) => {
            setLevels(checked);
          }}
        />
        <Switch
          label="Second generation"
          checked={second()}
          onChange={(checked) => {
            setSecond(checked);
          }}
        />
        <Button
          onClick={() => {
            setSeed(`${DEFAULT_SEED}-${Math.floor(Math.random() * 1000)}`);
          }}
        >
          Another world
        </Button>
        <Badge>{seed()}</Badge>
      </Row>
      <canvas
        ref={canvas}
        width={SPAN}
        height={SPAN}
        class="max-w-full self-start border border-line"
        onMouseMove={look}
      />
      <Show when={under()} keyed>
        {(spot) => (
          <Note>
            Cell {spot.x}, {spot.y} is {BIOME_NAMES[spot.biome]} at level{' '}
            {levelAt(new World(seed(), undefined, generation()), spot.x, spot.y)} of {TERRACE_TOP},
            in chunk {Math.floor(spot.x / CHUNK_CELLS)}, {Math.floor(spot.y / CHUNK_CELLS)}
          </Note>
        )}
      </Show>
      <Meta>
        The world map as the game draws it, {MAP_SPAN} chunks across and centred on the same ground,
        in the game's own world whatever seed is above.
      </Meta>
      <Row>
        <Switch
          label="Detailed world map"
          checked={detailedMap()}
          onChange={(checked) => {
            setDetailedMap(checked);
          }}
        />
      </Row>
      <div class="w-full max-w-136 self-start">
        <WorldMapCanvas
          detailed={detailedMap()}
          span={MAP_SPAN}
          originX={mapX()}
          originY={mapY()}
          biomes={mapBiomes()}
          towns={townsInView(mapX(), mapY(), MAP_SPAN)}
          playerX={Number.NaN}
          playerY={Number.NaN}
          onPan={(dx, dy) => {
            setLeft((was) => was + dx * CHUNK_CELLS);
            setTop((was) => was + dy * CHUNK_CELLS);
          }}
          onRecenter={() => {
            setLeft(-SPAN / 2);
            setTop(-SPAN / 2);
          }}
        />
      </div>
      <WeatherMap
        world={weatherWorld()}
        centreX={mapX() + MAP_SPAN / 2}
        centreY={mapY() + MAP_SPAN / 2}
      />
    </div>
  );
}
