import { type JSX, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import { Badge, Button, Note, Row, Select } from '../styled';
import type Biome from '../../data/ids/biome';
import BiomeId from '../../data/ids/biome';
import { BIOME_NAMES } from '../../data/biome';
import type Decoration from '../../data/overworld/decoration';
import Weather, { WEATHER_NAMES } from '../../data/overworld/weather';
import ChunkCanvas from '../overworld/chunk-canvas';
import type { SpawnCoat } from '../overworld/chunk-canvas/scenery';
import { BOARD_CELLS, BOARD_CENTER, boardIndexOf, viewFor } from '../../canvas/board';
import { SLIDE_PACE } from '../overworld/chunk-canvas/metrics';
import { findPathNear } from '../../overworld/path';
import { BOARD_MARGIN } from '../overworld/overworld-tab/metrics';
import World from '../../overworld/world';
import { WORLD_SEED } from '../../overworld/current';
import { CHUNK_CELLS, chunkOfCell } from '../../overworld/chunk';
import { type BoardGround, readBoardGround } from '../../overworld/board-ground';
import { readGround } from '../../overworld/ground';
import { blocksWalk } from '../../overworld/cliff';
import { TERRACE_TOP, levelAt } from '../../overworld/terrace';
import { getRegisteredSpecies } from '../../data/species';

/**
 * The board on its own, at whatever shape of screen you like.
 *
 * The country under it is the world's own: the same fields the game
 * generates from, read through the same window the overworld tab
 * reads, so a lake, a road, a terrace and a border are whatever the
 * seed says they are rather than shapes written out to look like some.
 * What is worth looking at is how the tilesets answer real ground:
 * where a shore runs, where a cliff stands, and whether a step reads
 * as a step.
 *
 * The chunk is drawn two ways: laid back under the camera where there
 * is room across the screen, and flat from straight above where there
 * is not. Which one the game picks is decided by the shape of the
 * window, so seeing both in the real game means resizing it. This
 * stands the same board in a frame of any shape instead.
 */

/** The frames the board can be stood in, and what each is meant to be */
const FRAMES = [
  { label: 'Phone, upright', width: 390, height: 720 },
  { label: 'Phone, on its side', width: 720, height: 390 },
  { label: 'Tablet, upright', width: 560, height: 760 },
  { label: 'Desktop', width: 960, height: 560 },
] as const;

/**
 * The scene as the board sees it: whatever of it is inside the window
 * the player is standing in the middle of
 */
function windowed<T>(
  scene: [at: [number, number], what: T][],
  at: [number, number],
): Map<number, T> {
  const seen = new Map<number, T>();

  for (const [where, what] of scene) {
    const index = boardIndexOf({
      x: BOARD_CENTER + where[0] - at[0],
      y: BOARD_CENTER + where[1] - at[1],
    });

    if (index != null) {
      seen.set(index, what);
    }
  }

  return seen;
}

/** Nothing to draw, but the board asks for all of them */
const NOTHING_MAPPED = new Map<number, never>();
const NOTHING_SET = new Set<number>();

/** How far the player's lamp reaches, in cells */
const LAMP = 3;

/** Where the search for a country starts, and how far it reaches */
const START: [number, number] = [0, 0];
const SEARCH_STEP = CHUNK_CELLS;
const SEARCH_RINGS = 128;

/**
 * How far out the level is read, in cells, to find a step nearby. Well
 * inside the picture: the board draws forty cells but frames about
 * twenty of them, so a step twenty cells out is one nobody can see
 */
const STEP_REACH = 6;

/**
 * Whether the ground round here changes level, which is where a cliff
 * is drawn. Read at five spots rather than over the window: the field
 * is smooth, and a step inside a board has to cross one of them
 */
function stepped(world: World, x: number, y: number): boolean {
  const here = levelAt(world, x, y);

  return (
    levelAt(world, x - STEP_REACH, y) !== here ||
    levelAt(world, x + STEP_REACH, y) !== here ||
    levelAt(world, x, y - STEP_REACH) !== here ||
    levelAt(world, x, y + STEP_REACH) !== here
  );
}

/**
 * The nearest cell of a country, searched outward a chunk at a time.
 *
 * A biome is a field over the world rather than a place in a list, so
 * the only way to stand in one is to go looking for it. Coarse on
 * purpose: a country is many chunks wide, and sampling every cell to
 * find one would walk a million of them.
 *
 * `step` asks for a spot where the ground changes level, so the board
 * lands somewhere with a cliff on it rather than in the middle of a
 * plain: about half the world's windows hold a step, and the flat ones
 * say nothing about how a country's rock is drawn
 */
function findCountry(
  world: World,
  biome: Biome,
  from: [number, number],
  onAStep: boolean,
): [number, number] | null {
  for (let ring = 0; ring <= SEARCH_RINGS; ring += 1) {
    const reach = ring * SEARCH_STEP;

    for (let step = -ring; step <= ring; step += 1) {
      const along = step * SEARCH_STEP;
      // The ring's own four sides, which is every cell this far out
      // without walking the middle again
      const spots: [number, number][] =
        ring === 0
          ? [from]
          : [
              [from[0] + along, from[1] - reach],
              [from[0] + along, from[1] + reach],
              [from[0] - reach, from[1] + along],
              [from[0] + reach, from[1] + along],
            ];

      for (const spot of spots) {
        if (
          world.getCellBiome(spot[0], spot[1]) === biome &&
          readGround(world, spot[0], spot[1]).role !== 'wall' &&
          (!onAStep || stepped(world, spot[0], spot[1]))
        ) {
          return spot;
        }
      }
    }
  }
  return null;
}

/** Where the pokemon stand, in cells from wherever the player landed */
const SPAWN_SPOTS: [number, number][] = [
  [-3, -4],
  [0, -3],
  [3, -2],
  [-2, 2],
  [4, 1],
  [-5, 0],
  [1, 4],
];

/**
 * A few pokemon standing about, taken off the front of the registry so
 * the page draws real sheets rather than dots. They keep to dry open
 * ground, since the country is the world's now and the spots above
 * are as likely to be lake as meadow
 */
function standing(world: World, at: [number, number]): [at: [number, number], coat: SpawnCoat][] {
  const species = getRegisteredSpecies().slice(0, 4);
  const placed: [at: [number, number], coat: SpawnCoat][] = [];

  for (const [dx, dy] of SPAWN_SPOTS) {
    const spot: [number, number] = [at[0] + dx, at[1] + dy];

    if (placed.length >= species.length) {
      break;
    }
    if (readGround(world, spot[0], spot[1]).role !== 'ground' || blocksWalk(world, ...spot)) {
      continue;
    }
    placed.push([
      spot,
      // The window names what it publishes, and the name is what the
      // board keeps a sheet under while the ground slides past
      {
        id: `demo-${placed.length}`,
        species: species[placed.length],
        shiny: false,
        featured: false,
      },
    ]);
  }
  return placed;
}

/**
 * The scenery over the window, carried out of the chunks it belongs
 * to. It is the chunk seed's own answer, so it needs no window from
 * the server: the trees are where they will be when somebody walks
 * here for real
 */
function scenery(world: World, originX: number, originY: number): Map<number, Decoration> {
  const seen = new Map<number, Decoration>();

  for (let y = chunkOfCell(originY); y <= chunkOfCell(originY + BOARD_CELLS - 1); y += 1) {
    for (let x = chunkOfCell(originX); x <= chunkOfCell(originX + BOARD_CELLS - 1); x += 1) {
      const shiftX = x * CHUNK_CELLS - originX;
      const shiftY = y * CHUNK_CELLS - originY;

      for (const [cell, what] of world.getChunk(x, y).getDecorationCells()) {
        const bx = (cell % CHUNK_CELLS) + shiftX;
        const by = Math.floor(cell / CHUNK_CELLS) + shiftY;

        if (bx >= 0 && by >= 0 && bx < BOARD_CELLS && by < BOARD_CELLS) {
          seen.set(by * BOARD_CELLS + bx, what);
        }
      }
    }
  }
  return seen;
}

/** Which way a key steps, in cells across and back */
const STEPS = new Map<string, [number, number]>([
  ['ArrowUp', [0, -1]],
  ['ArrowDown', [0, 1]],
  ['ArrowLeft', [-1, 0]],
  ['ArrowRight', [1, 0]],
  ['w', [0, -1]],
  ['s', [0, 1]],
  ['a', [-1, 0]],
  ['d', [1, 0]],
]);

export default function BoardDemo(): JSX.Element {
  const [frame, setFrame] = createSignal(0);
  const [wanted, setWanted] = createSignal<Biome>(BiomeId.TemperateForest);
  const [weather, setWeather] = createSignal<Weather>(Weather.Clear);
  const [seed, setSeed] = createSignal(WORLD_SEED);
  const [yaw, setYaw] = createSignal(0);
  const [at, setAt] = createSignal<[number, number]>(START);
  const [facing, setFacing] = createSignal<[number, number]>([0, 1]);
  const [spawns, setSpawns] = createSignal<[at: [number, number], coat: SpawnCoat][]>([]);
  /**
   * The walk in hand, in world cells and in order. A press is a route
   * rather than a step here, the way it is in the game: the way is
   * found once and then walked a cell at a time
   */
  const [queued, setQueued] = createSignal<[number, number][]>([]);

  const shape = (): (typeof FRAMES)[number] => FRAMES[frame()];
  const mode = (): string => viewFor(shape().width, shape().height).mode;
  /** The world itself, rebuilt only when another one is asked for */
  const world = createMemo(() => new World(seed()));
  const origin = (): [number, number] => [at()[0] - BOARD_CENTER, at()[1] - BOARD_CENTER];
  /**
   * The country under the window, read the way the overworld tab reads
   * it: once for the window, apron and all
   */
  const ground = createMemo<BoardGround>(() => {
    const [originX, originY] = origin();

    return readBoardGround(world(), originX, originY, BOARD_MARGIN, BOARD_CELLS);
  });
  const decorations = createMemo(() => {
    const [originX, originY] = origin();

    return scenery(world(), originX, originY);
  });
  const biome = (): Biome => world().getCellBiome(at()[0], at()[1]);

  /** Stand where the nearest country of this kind is, if there is one */
  const goTo = (kind: Biome): void => {
    const found =
      findCountry(world(), kind, START, true) ?? findCountry(world(), kind, START, false) ?? START;

    setAt(found);
    setSpawns(standing(world(), found));
  };

  /**
   * Whether a board cell can be stood on here.
   *
   * The rock and the cliff faces stop a walk as they do in the game,
   * and the water does not: this page is for looking at the ground,
   * and a shore drawn from the far side of a lake is a shore nobody
   * can inspect. A player in the real world swims nowhere
   */
  const passable = (cell: number): boolean => {
    const x = cell % BOARD_CELLS;
    const y = Math.floor(cell / BOARD_CELLS);
    const [originX, originY] = origin();

    return ground().role(x, y) !== 'wall' && !blocksWalk(world(), originX + x, originY + y);
  };

  /** One step, where the world allows it */
  const walk = (step: [number, number]): void => {
    setFacing(step);

    if (!passable((BOARD_CENTER + step[1]) * BOARD_CELLS + BOARD_CENTER + step[0])) {
      return;
    }
    setAt(([x, y]) => [x + step[0], y + step[1]]);
  };

  /**
   * Head for a cell, or as near to it as the ground allows. The route
   * is kept in world cells rather than board ones: the board is a
   * window that moves with the player, so a cell of it means somewhere
   * else by the time the next step lands
   */
  const headFor = (cell: { x: number; y: number }): void => {
    const to = boardIndexOf(cell);
    const [originX, originY] = origin();
    const found =
      to == null ? null : findPathNear(BOARD_CENTER * BOARD_CELLS + BOARD_CENTER, to, passable);

    setQueued(
      (found ?? []).map((step) => [
        originX + (step % BOARD_CELLS),
        originY + Math.floor(step / BOARD_CELLS),
      ]),
    );
  };

  /** The next cell of the route, taken at the pace the game walks */
  const onward = (): void => {
    const route = queued();

    if (route.length === 0) {
      return;
    }
    const [next, ...rest] = route;
    const [x, y] = at();
    const step: [number, number] = [next[0] - x, next[1] - y];

    setQueued(rest);
    // A route that no longer follows on is a route through ground that
    // has changed under it, so it is dropped rather than jumped along
    if (Math.abs(step[0]) + Math.abs(step[1]) !== 1) {
      setQueued([]);
      return;
    }
    walk(step);
  };

  onMount(() => {
    goTo(wanted());

    const walked = (event: KeyboardEvent): void => {
      const step = STEPS.get(event.key);

      if (step == null) {
        return;
      }
      event.preventDefault();
      // A key is the player taking over, so whatever they were walking
      // toward is given up
      setQueued([]);
      walk(step);
    };
    const pacing = window.setInterval(onward, SLIDE_PACE);

    onCleanup(() => {
      window.clearInterval(pacing);
    });

    window.addEventListener('keydown', walked);
    onCleanup(() => {
      window.removeEventListener('keydown', walked);
    });
  });

  return (
    <div class="flex flex-col gap-3 p-4">
      <div class="flex flex-wrap gap-3">
        <Select
          label="Screen"
          class="w-56"
          value={frame()}
          options={FRAMES.map((entry, index) => ({ value: index, label: entry.label }))}
          onChange={(chosen) => {
            setFrame(chosen);
          }}
        />
        <Select
          label="Go to"
          class="w-56"
          value={wanted()}
          options={Object.entries(BIOME_NAMES).map(([key, label]) => ({
            value: Number(key),
            label,
          }))}
          onChange={(chosen) => {
            setWanted(chosen);
            goTo(chosen);
          }}
        />
        <Select
          label="Sky"
          class="w-56"
          value={weather()}
          options={Object.entries(WEATHER_NAMES).map(([key, label]) => ({
            value: Number(key),
            label,
          }))}
          onChange={(chosen) => {
            setWeather(chosen);
          }}
        />
      </div>

      <Row>
        <Badge tone={mode() === '2d' ? 'tide' : 'leaf'}>{mode()}</Badge>
        <Badge tone="neutral">
          {shape().width} x {shape().height}
        </Badge>
        <Badge tone="leaf">{BIOME_NAMES[biome()]}</Badge>
        <Badge tone="neutral">
          {at()[0]}, {at()[1]}
        </Badge>
        <Badge tone="neutral">
          level {levelAt(world(), at()[0], at()[1])} of {TERRACE_TOP}
        </Badge>
        <Button
          onClick={() => {
            setSeed(`${WORLD_SEED}-${Math.floor(Math.random() * 1000)}`);
            goTo(wanted());
          }}
        >
          Another world
        </Button>
        <Badge>{seed()}</Badge>
      </Row>

      <Note>
        The ground is the real world's, read at the cell the badges name. Press a cell to walk
        there, which finds a way round whatever is in the road; the arrows step, and water, rock and
        the face of a cliff stop them the way they do in the game. A screen taller than it is wide
        is drawn flat from above, with the round shadow the board uses at night and the weather
        against the glass; anything wider is laid back under the camera. Drag the ground to walk the
        camera round.
      </Note>

      {/* The board takes the whole of whatever it is put in, so the
          frame is what decides its shape and therefore which of the two
          ways it is drawn */}
      <div
        class="relative overflow-hidden rounded-panel border-4 border-tide bg-shade shadow-pop"
        style={{ width: `${shape().width}px`, height: `${shape().height}px`, 'max-width': '100%' }}
      >
        <ChunkCanvas
          biome={biome()}
          weather={weather()}
          lamp={LAMP}
          underground={false}
          yaw={yaw()}
          onTurn={(turned) => {
            setYaw(turned);
          }}
          latitude={0}
          caption="Demo chunk"
          at={at()}
          origin={origin()}
          facing={facing()}
          landmarks={NOTHING_MAPPED}
          phenomena={NOTHING_MAPPED}
          ground={ground()}
          wanderers={NOTHING_MAPPED}
          coats={NOTHING_MAPPED}
          berries={NOTHING_MAPPED}
          picked={NOTHING_SET}
          dug={NOTHING_SET}
          decorations={decorations()}
          spawns={windowed(spawns(), at())}
          label={(index) => `Cell ${index}`}
          onPress={(cell) => {
            headFor(cell);
          }}
        />
      </div>
    </div>
  );
}
