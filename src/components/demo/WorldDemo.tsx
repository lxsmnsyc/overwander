import { type JSX, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { BIOME_COLORS, BIOME_NAMES } from '../../data/biome';
import { Badge, Button, Meta, Note, Row, Switch } from '../styled';
import World from '../../overworld/world';
import { CHUNK_CELLS } from '../../overworld/chunk';
import { readGround } from '../../overworld/ground';
import { isTownAt } from '../../overworld/town';
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

/** How dark the water is drawn against the country it sits in */
const WATER_SHADE = 0.45;

/** What rock is drawn as, whatever country it comes through */
const ROCK: [number, number, number] = [64, 60, 58];

/** And what a town is drawn as, so the settled ground stands out */
const TOWN: [number, number, number] = [214, 196, 164];

/** How the chunk grid is drawn over it */
const GRID_COLOR = 'rgba(255, 255, 255, 0.25)';

/** How close it can be looked at, in pixels to a cell */
const MAX_ZOOM = 8;

/** How far one press of a pan button moves, in cells */
const STEP = 128;

/** The world every player is walking, so the picture is the real one */
const DEFAULT_SEED = 'overworld';

/** A colour from the palette, as its three channels */
function channels(color: string): [number, number, number] {
  const hex = color.replace('#', '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((one) => one + one)
          .join('')
      : hex;

  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

export default function WorldDemo(): JSX.Element {
  const [seed, setSeed] = createSignal(DEFAULT_SEED);
  const [left, setLeft] = createSignal(-SPAN / 2);
  const [top, setTop] = createSignal(-SPAN / 2);
  const [zoom, setZoom] = createSignal(1);
  const [grid, setGrid] = createSignal(true);
  const [drawn, setDrawn] = createSignal(0);
  const [under, setUnder] = createSignal<{ x: number; y: number; biome: Biome } | null>(null);
  let canvas: HTMLCanvasElement | undefined;

  createEffect(() => {
    const world = new World(seed());
    const scale = zoom();
    const x0 = left();
    const y0 = top();
    const showing = grid();
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
          const { biome, role } = readGround(world, x0 + x, y0 + y);
          let shade: number[] = ROCK;

          if (isTownAt(world, x0 + x, y0 + y) && role === 'ground') {
            shade = TOWN;
          } else if (role !== 'wall') {
            shade = channels(BIOME_COLORS[biome]).map((one) =>
              role === 'water' ? Math.round(one * WATER_SHADE) : one,
            );
          }

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

    setUnder({ x, y, biome: new World(seed()).getCellBiome(x, y) });
  };

  return (
    <div class="flex flex-col gap-3 p-3">
      <Meta>
        One pixel is one cell of the world. Water is its country's own colour, darkened, rock is
        grey and a town is pale. The chunk grid is drawn over the top, and nothing in the ground
        lines up with it.
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
            Cell {spot.x}, {spot.y} is {BIOME_NAMES[spot.biome]}, in chunk{' '}
            {Math.floor(spot.x / CHUNK_CELLS)}, {Math.floor(spot.y / CHUNK_CELLS)}
          </Note>
        )}
      </Show>
    </div>
  );
}
