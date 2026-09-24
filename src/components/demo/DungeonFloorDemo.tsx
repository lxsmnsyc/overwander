import { type JSX, Show, batch, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import type { Moves } from '../../data/ids/moves';
import DungeonKind, {
  FLOOR_GIMMICKS,
  FLOOR_GIMMICK_NAMES,
  FloorGate,
  type FloorGimmick,
  OBSTACLE_MOVES,
} from '../../data/overworld/dungeon';
import Weather from '../../data/overworld/weather';
import { CAVE_DARK_CELLS, CAVE_LAMP_CELLS } from '../../data/overworld/cave';
import ChunkSnapshot, { NPC_INTERVAL } from '../../overworld/chunk-snapshot';
import getWorld from '../../overworld/current';
import type { BoardCell } from '../../canvas/board';
import { DIRECTIONS, Direction } from '../../overworld/dungeon/floor';
import { type CellGrid, cellAhead } from '../../overworld/dungeon/grid';
import type { DungeonLayout } from '../../overworld/dungeon/layout';
import { dungeonKindOf, getDungeonLayout } from '../../overworld/dungeon/stage';
import {
  type Footing,
  arrive,
  press,
  spottedBy,
  thingAt,
  tread,
} from '../../overworld/dungeon/tread';
import ChunkCanvas from '../overworld/chunk-canvas';
import { floorView } from '../overworld/dungeon-board/view';
import createGlide from '../overworld/dungeon-board/glide';
import findWalk from '../overworld/dungeon-board/walking';
import { dungeonTitle, floorName, floorRules } from '../overworld/dungeon-dialog/describe';
import { Badge, Button, Meta, Row, Select, Switch } from '../styled';

/** How much of the world and how many windows the search walks */
const CHUNKS_X = 48;
const CHUNKS_Y = 12;
const WINDOWS = 24;

const NOTHING = new Map<number, never>();
const NOTHING_SET = new Set<number>();

const ARROWS: Partial<Record<string, Direction>> = {
  ArrowUp: Direction.North,
  ArrowRight: Direction.East,
  ArrowDown: Direction.South,
  ArrowLeft: Direction.West,
  w: Direction.North,
  d: Direction.East,
  s: Direction.South,
  a: Direction.West,
};

interface Found {
  snapshot: ChunkSnapshot;
  cell: number;
  layout: DungeonLayout;
  floor: number;
}

/**
 * The `skip`th real dungeon near the origin with a floor laid out the way
 * asked, in whichever window has one
 */
function findDungeon(kind: DungeonKind, gimmick: FloorGimmick | null, skip: number): Found | null {
  const world = getWorld();
  const cells: [number, number, number][] = [];

  for (let x = 0; x < CHUNKS_X; x++) {
    for (let y = 0; y < CHUNKS_Y; y++) {
      for (const [cell, landmark] of world.getChunk(x, y).getLandmarkCells()) {
        if (dungeonKindOf(landmark) === kind) {
          cells.push([x, y, cell]);
        }
      }
    }
  }

  let left = skip;

  for (let window = 0; window < WINDOWS; window++) {
    for (const [x, y, cell] of cells) {
      const snapshot = new ChunkSnapshot(world.getChunk(x, y), window * NPC_INTERVAL);
      const layout = getDungeonLayout(snapshot, cell);

      if (layout == null) {
        continue;
      }
      for (const [floor, at] of layout.floors.entries()) {
        if (gimmick != null && at.gimmick !== gimmick) {
          continue;
        }
        if (left === 0) {
          return { snapshot, cell, layout, floor };
        }
        left -= 1;
        break;
      }
    }
  }
  return null;
}

/**
 * A real dungeon floor on the board, walked here and nowhere else: a
 * fight is won the moment it starts, a stash is marked taken, and the
 * stairs and falls move between floors the way the server moves them
 */
export default function DungeonFloorDemo(props: {
  width: number;
  height: number;
  yaw: number;
  onTurn: (yaw: number) => void;
}): JSX.Element {
  const [kind, setKind] = createSignal<DungeonKind>(DungeonKind.Hideout);
  const [gimmick, setGimmick] = createSignal<FloorGimmick>(FLOOR_GIMMICKS[0]);
  const [skip, setSkip] = createSignal(0);
  const [lit, setLit] = createSignal(false);
  const [moves, setMoves] = createSignal(false);
  const [floor, setFloor] = createSignal(0);
  const [footing, setFooting] = createSignal<Footing | null>(null);
  const [beaten, setBeaten] = createSignal(new Set<number>());
  const [said, setSaid] = createSignal<string | null>(null);
  let pacing: ReturnType<typeof setInterval> | undefined;
  let queued: Direction[] = [];
  const glide = createGlide();

  const wanted = createMemo(() =>
    findDungeon(kind(), kind() === DungeonKind.Frontier ? null : gimmick(), skip()),
  );
  // Held apart from what is wanted, so a new dungeon and the floor landed
  // on in it change together rather than one frame apart
  const [found, setFound] = createSignal<Found | null>(null);
  const grid = (): CellGrid | null => found()?.layout.floors[floor()]?.grid ?? null;
  const known = (): Set<Moves> => new Set(moves() ? OBSTACLE_MOVES : []);

  const land = (at: number, held = found()): void => {
    if (held == null) {
      return;
    }
    glide.play([]);
    batch(() => {
      setFound(held);
      setFloor(at);
      setBeaten(new Set<number>());
      setFooting(arrive(held.layout.floors[at].grid));
    });
  };

  // Straight onto the floor that was asked for
  createEffect(() => {
    const held = wanted();

    setSaid(null);
    if (held == null) {
      setFound(null);
    } else {
      land(held.floor, held);
    }
  });

  const win = (cell: number): void => {
    const room = grid()?.rooms.get(cell);

    if (room != null) {
      setBeaten(new Set([...beaten(), room]));
      setSaid('Won. The demo counts every fight as won.');
    }
  };

  const step = (direction: Direction): void => {
    const here = footing();
    const floorGrid = grid();
    const held = found();

    if (here == null || floorGrid == null || held == null || glide.at() != null) {
      return;
    }

    const trod = tread(floorGrid, here, direction, known());

    if (trod == null) {
      return;
    }

    const plan = held.layout.floors[floor()];

    setFooting(trod.footing);
    glide.play(trod.path);
    if (trod.event?.kind === 'fall') {
      setSaid('The floor gave way.');
      land(Math.max(0, floor() - 1));
      return;
    }
    if (trod.event?.kind === 'stairs') {
      const guarded = plan.gate === FloorGate.Guard && !beaten().has(plan.exit);
      const passless = plan.gate === FloorGate.Pass && !trod.footing.pass;

      if (guarded || passless) {
        setSaid(
          guarded ? 'The guard on the stairs is still standing.' : 'The stairs want the pass.',
        );
        return;
      }
      setSaid('Down to the next floor.');
      land(floor() + 1);
      return;
    }
    if (trod.event?.kind === 'arrival' && floor() > 0) {
      setSaid('Back up a floor.');
      land(floor() - 1);
      return;
    }

    const spotter = spottedBy(floorGrid, trod.footing, beaten());

    if (spotter != null) {
      queued = [];
      setSaid('Spotted!');
      win(spotter);
    }
  };

  const pressAhead = (): void => {
    const here = footing();
    const floorGrid = grid();

    if (here == null || floorGrid == null) {
      return;
    }

    const pressed = press(floorGrid, here, known());

    if (pressed == null) {
      return;
    }
    if (pressed.event?.kind === 'fight') {
      win(pressed.event.cell);
      return;
    }
    setFooting(pressed.footing);
    setSaid('Taken.');
  };

  createEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const direction = ARROWS[event.key];

      if (direction != null) {
        event.preventDefault();
        queued = [];
        step(direction);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        pressAhead();
      }
    };

    window.addEventListener('keydown', onKey);
    onCleanup(() => {
      window.removeEventListener('keydown', onKey);
      clearInterval(pacing);
    });
  });

  const view = createMemo(() => {
    const here = footing();
    const held = found();

    if (here == null || held == null) {
      return null;
    }
    return floorView({
      snapshot: held.snapshot,
      cell: held.cell,
      layout: held.layout,
      floor: floor(),
      footing: { ...here, at: glide.at() ?? here.at },
      beaten: beaten(),
      seen: new Set<number>(),
    });
  });

  const onPress = (cell: BoardCell): void => {
    const here = footing();
    const floorGrid = grid();
    const shown = view();

    if (here == null || floorGrid == null || shown == null) {
      return;
    }

    const target = (cell.y + shown.origin[1]) * floorGrid.width + cell.x + shown.origin[0];

    for (const direction of DIRECTIONS) {
      if (
        cellAhead(floorGrid, here.at, direction) === target &&
        thingAt(floorGrid, here, target) != null
      ) {
        setFooting({ ...here, facing: direction });
        pressAhead();
        return;
      }
    }
    queued = findWalk(floorGrid, here, target, known()) ?? [];
    clearInterval(pacing);
    pacing = setInterval(() => {
      if (glide.at() != null) {
        return;
      }

      const next = queued.shift();

      if (next == null) {
        clearInterval(pacing);
        return;
      }
      step(next);
    }, 180);
  };

  const gimmicks: { value: FloorGimmick; label: string }[] = [];

  for (const value of FLOOR_GIMMICKS) {
    gimmicks.push({ value, label: FLOOR_GIMMICK_NAMES[value] });
  }

  const at = (): [number, number] => {
    const shown = glide.at() ?? footing()?.at;
    const floorGrid = grid();

    return shown == null || floorGrid == null
      ? [0, 0]
      : [shown % floorGrid.width, Math.floor(shown / floorGrid.width)];
  };

  return (
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap gap-3">
        <Select
          label="Kind"
          class="w-56"
          value={kind()}
          options={[
            { value: DungeonKind.Hideout, label: 'Hideout' },
            { value: DungeonKind.Dungeon, label: 'Dungeon' },
            { value: DungeonKind.Frontier, label: 'Frontier' },
          ]}
          onChange={(chosen) => {
            setSkip(0);
            setKind(chosen);
          }}
        />
        <Select
          label="Layout"
          class="w-56"
          value={gimmick()}
          options={gimmicks}
          disabled={kind() === DungeonKind.Frontier}
          onChange={(chosen) => {
            setSkip(0);
            setGimmick(chosen);
          }}
        />
        <Switch
          label="Party carries a light"
          checked={lit()}
          onChange={(on) => {
            setLit(on);
          }}
        />
        <Switch
          label="Party knows the field moves"
          checked={moves()}
          onChange={(on) => {
            setMoves(on);
          }}
        />
        <Button
          onClick={() => {
            setSkip(skip() + 1);
          }}
        >
          Another dungeon
        </Button>
        <Button
          onClick={() => {
            land(floor());
          }}
        >
          Back to the arrival
        </Button>
      </div>
      <Show when={found()} fallback={<Meta>No dungeon like that near the origin.</Meta>}>
        {(held) => (
          <Row>
            <Badge tone="tide">
              {dungeonTitle(held().layout, held().snapshot, held().cell)} ·{' '}
              {floorName(held().layout.kind, floor())} of {held().layout.floors.length}
            </Badge>
            <Meta>{floorRules(held().layout.floors[floor()])}</Meta>
            <Show when={said()}>{(line) => <Badge tone="leaf">{line()}</Badge>}</Show>
          </Row>
        )}
      </Show>
      <div
        class="relative overflow-hidden rounded-panel border-4 border-tide bg-shade shadow-pop"
        style={{ width: `${props.width}px`, height: `${props.height}px`, 'max-width': '100%' }}
      >
        <Show when={view()}>
          {(shown) => (
            <ChunkCanvas
              biome={found()?.snapshot.chunk.biome ?? 0}
              weather={Weather.Clear}
              lamp={lit() ? CAVE_LAMP_CELLS : CAVE_DARK_CELLS}
              underground
              lit={shown().lit}
              yaw={props.yaw}
              latitude={0}
              onTurn={props.onTurn}
              caption="Dungeon floor"
              at={at()}
              origin={shown().origin}
              facing={[
                [0, 1, 0, -1][footing()?.facing ?? Direction.South],
                [-1, 0, 1, 0][footing()?.facing ?? Direction.South],
              ]}
              landmarks={shown().landmarks}
              pictures={shown().pictures}
              phenomena={NOTHING}
              ground={shown().ground}
              groundKey={`${found()?.cell ?? 0}:${floor()}:${kind()}:${skip()}`}
              wanderers={NOTHING}
              coats={shown().coats}
              facings={shown().facings}
              berries={NOTHING}
              picked={NOTHING_SET}
              dug={NOTHING_SET}
              auras={NOTHING}
              decorations={shown().decorations}
              spawns={shown().spawns}
              marks={shown().marks}
              label={() => ''}
              onPress={onPress}
            />
          )}
        </Show>
      </div>
      <Meta>
        Arrow keys or WASD walk, Enter or Space presses what you face. Every fight counts as won
        here, and nothing reaches the server.
      </Meta>
    </div>
  );
}
