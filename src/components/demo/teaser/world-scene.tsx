import { type JSX, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import {
  type BoardView,
  type WatchedWindow,
  boardChunks,
  buildBoardView,
  naming,
} from '../../overworld/overworld-tab/board-view';
import {
  BOARD_CELLS,
  BOARD_CENTER,
  PLAYER_CELL,
  PUBLISHED_SPAWNS,
  STEP_PACE,
} from '../../overworld/overworld-tab/metrics';
import ChunkCanvas, { type SpawnCoat } from '../../overworld/chunk-canvas';
import { CellAura, type SpawnRank } from '../../overworld/chunk-canvas/scenery';
import { getSkybox, latitudeOf } from '../../../canvas/daylight';
import { CAVERN } from '../../../canvas/sky';
import { asOffset, getLocalOffset } from '../../../auth/local-time';
import Biome, { isIceBiome } from '../../../data/ids/biome';
import Landmark from '../../../data/overworld/landmark';
import { NPC_VISIT_TAGS } from '../../../data/overworld/npc';
import { CHARSETS, FREE_CHARSETS } from '../../../data/overworld/charsets';
import { getSpeciesData } from '../../../data/species';
import { isFeaturedSpecies } from '../../../data/species/day';
import { isLegendarySpecies, isMythicalSpecies } from '../../../data/biome';
import type { Species } from '../../../data/ids/species';
import ChunkSnapshot, { SNAPSHOT_INTERVAL } from '../../../overworld/chunk-snapshot';
import getWorld from '../../../overworld/current';
import type { Depth } from '../../../overworld/depth';
import { type CellFacts, canEnter } from '../../../overworld/field-moves';
import { findPathNear } from '../../../overworld/path';
import Strangers, { type Facing } from '../../../overworld/strangers';

const EXPERT_LANDMARKS = new Set<Landmark>([
  Landmark.GymLeader,
  Landmark.EliteFour,
  Landmark.Champion,
  Landmark.FrontierBrain,
]);

/** How many other trainers wander the board, and how often each picks somewhere new */
const STRANGER_COUNT = 3;
const STRANGER_REPLAN = 5000;

/** Which of the one-per-world kinds a spawn is, as the game's board ranks it */
function rankOf(species: Species): SpawnRank {
  if (isLegendarySpecies(species)) {
    return 'legendary';
  }
  return isMythicalSpecies(species) ? 'mythical' : null;
}

export interface WorldSceneProps {
  start: [number, number];
  /** The local instant the world is read at: the hour lights it and rolls its spawns */
  now: number;
  depth: Depth;
  yaw: number;
  onReady: (api: WorldApi) => void;
}

export interface WorldApi {
  walkTo: (x: number, y: number) => void;
  at: () => [number, number];
  landmarksNear: () => { x: number; y: number; landmark: Landmark }[];
}

export default function WorldScene(props: WorldSceneProps): JSX.Element {
  const offset = asOffset(getLocalOffset());
  const [at, setAt] = createSignal<[number, number]>(props.start);
  const [facing, setFacing] = createSignal<Facing>([0, 1]);
  const [goal, setGoal] = createSignal<[number, number] | null>(null);
  const [yaw, setYaw] = createSignal(props.yaw);
  const origin = (): [number, number] => [at()[0] - BOARD_CENTER, at()[1] - BOARD_CENTER];

  /** Every window over the board, rolled here the way the server would publish it */
  const windows = (originX: number, originY: number): Map<string, WatchedWindow> => {
    const world = getWorld(props.depth);
    const timestamp = Math.floor(props.now / SNAPSHOT_INTERVAL) * SNAPSHOT_INTERVAL;
    const records = new Map<string, WatchedWindow>();

    for (const [x, y] of boardChunks(originX, originY)) {
      const chunk = world.getChunk(x, y);
      const spawns = [];

      for (const [species, individualValue, traitValue] of new ChunkSnapshot(
        chunk,
        timestamp,
        offset,
      ).getSpawns(PUBLISHED_SPAWNS)) {
        spawns.push({ species, individualValue, traitValue });
      }
      records.set(`${x},${y}`, { x, y, record: { seed: chunk.seed, offset, timestamp, spawns } });
    }
    return records;
  };

  const view = createMemo((): BoardView => {
    const [originX, originY] = origin();

    return buildBoardView(
      originX,
      originY,
      windows(originX, originY),
      offset,
      null,
      null,
      new Set(),
      props.depth,
      props.now,
    );
  });

  /** The glow a fresh player sees: every fight unbeaten, every nest and tree untaken */
  const auras = createMemo(() => {
    const loaded = view();
    const next = new Map<number, CellAura>();

    for (const [index, landmark] of loaded.landmarks) {
      const spot = loaded.at(index);

      if (spot == null) {
        continue;
      }
      const { snapshot, cell } = spot;
      let fresh = false;
      let fight = false;

      if (landmark === Landmark.Trainer || landmark === Landmark.TeamRocket) {
        fight = snapshot.getTrainerStops().has(cell) || snapshot.getRocketStops().has(cell);
      } else if (EXPERT_LANDMARKS.has(landmark)) {
        fight =
          landmark === Landmark.FrontierBrain
            ? snapshot.getFrontierBrain(cell) != null
            : snapshot.getGymStops().has(cell) ||
              snapshot.getEliteStops().has(cell) ||
              snapshot.getChampionStops().has(cell);
      } else if (landmark === Landmark.WanderingNpc) {
        const standing = snapshot.getStandingNpc(cell);

        fresh = standing != null && NPC_VISIT_TAGS.has(standing);
      } else if (landmark === Landmark.Nest) {
        fresh = snapshot.getNests().has(cell);
      } else if (landmark === Landmark.HoneyTree) {
        fresh = true;
      }
      if (fight) {
        next.set(index, CellAura.Fight);
      } else if (fresh) {
        next.set(index, CellAura.Fresh);
      }
    }
    return next;
  });

  const spawns = createMemo(() => {
    const loaded = view();
    const coats = new Map<number, SpawnCoat>();

    for (const [index, standing] of loaded.spawns) {
      coats.set(index, {
        id: standing.id,
        species: standing.spawn[0],
        shiny: standing.shiny,
        featured: isFeaturedSpecies(standing.spawn[0], loaded.snapshot.timestamp),
        rank: rankOf(standing.spawn[0]),
      });
    }
    return coats;
  });

  // The same walking rule the game's board applies, on foot
  const factsAt = (loaded: BoardView, index: number): CellFacts => {
    const x = index % BOARD_CELLS;
    const y = Math.floor(index / BOARD_CELLS);
    const wet = loaded.ground.role(x, y) === 'water';
    const biome = loaded.ground.biome(x, y);

    return {
      fixture: loaded.landmarks.has(index),
      scenery: loaded.decorations.has(index),
      solid: loaded.walls.has(index),
      water: wet && biome !== Biome.Volcano && !isIceBiome(biome),
      lava: wet && biome === Biome.Volcano,
    };
  };
  const passableFrom =
    (loaded: BoardView, from: number) =>
    (index: number): boolean =>
      canEnter('walk', factsAt(loaded, from), factsAt(loaded, index));

  /** The next board cell on the way from one cell to another, or null when there is no way */
  const nextStep = (loaded: BoardView, from: number, to: number): number | null =>
    findPathNear(from, to, passableFrom(loaded, from))?.[0] ?? null;

  const stride = (): void => {
    const target = goal();

    if (target == null) {
      return;
    }
    const [x, y] = at();
    const [originX, originY] = origin();

    if (x === target[0] && y === target[1]) {
      setGoal(null);
      return;
    }
    const to = (target[1] - originY) * BOARD_CELLS + (target[0] - originX);
    const next =
      to < 0 || to >= BOARD_CELLS * BOARD_CELLS ? null : nextStep(view(), PLAYER_CELL, to);

    if (next == null || next === PLAYER_CELL) {
      setGoal(null);
      return;
    }
    const step: Facing = [
      (next % BOARD_CELLS) - (PLAYER_CELL % BOARD_CELLS),
      Math.floor(next / BOARD_CELLS) - Math.floor(PLAYER_CELL / BOARD_CELLS),
    ];

    setFacing(step);
    setAt([x + step[0], y + step[1]]);
  };

  // Other trainers, played back through the same class that plays real ones
  const strangers = new Strangers(() => Date.now(), STEP_PACE);
  const coats = [...FREE_CHARSETS];

  for (const charset of CHARSETS) {
    if (coats.length >= STRANGER_COUNT + 2) {
      break;
    }
    if (!coats.includes(charset.sheet)) {
      coats.push(charset.sheet);
    }
  }

  const wander = (): void => {
    const loaded = view();
    const [originX, originY] = origin();
    const standing = strangers.standing({ x: at()[0], y: at()[1] });

    for (let index = 0; index < STRANGER_COUNT; index++) {
      const uid = `stranger-${index}`;
      let here: (typeof standing)[number] | undefined;

      for (const one of standing) {
        if (one.uid === uid) {
          here = one;
        }
      }
      const x = here?.x ?? at()[0] + (index - 1) * 3;
      const y = here?.y ?? at()[1] + 2 + index;

      if (here == null) {
        strangers.see({ uid, charset: coats[index + 1], x, y, facing: [0, 1] });
      }
      const from = (y - originY) * BOARD_CELLS + (x - originX);
      const aim = Math.floor(Math.random() * BOARD_CELLS * BOARD_CELLS);
      const route = findPathNear(from, aim, passableFrom(loaded, from));

      if (route == null || route.length === 0) {
        continue;
      }
      const steps: Facing[] = [];
      let previous = from;

      for (const cell of route.slice(0, 10)) {
        steps.push([
          (cell % BOARD_CELLS) - (previous % BOARD_CELLS),
          Math.floor(cell / BOARD_CELLS) - Math.floor(previous / BOARD_CELLS),
        ]);
        previous = cell;
      }
      strangers.hear({ uid, x, y, steps, at: Date.now(), planned: true });
    }
  };

  onMount(() => {
    const pacing = window.setInterval(stride, STEP_PACE);
    const wandering = window.setInterval(wander, STRANGER_REPLAN);

    wander();
    onCleanup(() => {
      window.clearInterval(pacing);
      window.clearInterval(wandering);
    });
    props.onReady({
      walkTo: (x, y) => {
        setGoal([x, y]);
      },
      at,
      landmarksNear: () => {
        const [originX, originY] = origin();
        const near: { x: number; y: number; landmark: Landmark }[] = [];

        for (const [index, landmark] of view().landmarks) {
          near.push({
            x: originX + (index % BOARD_CELLS),
            y: originY + Math.floor(index / BOARD_CELLS),
            landmark,
          });
        }
        return near;
      },
    });
  });

  const titleOf = (index: number): string => {
    const spawn = view().spawns.get(index);

    return spawn == null ? '' : getSpeciesData(spawn.spawn[0]).name;
  };

  return (
    <div
      class="absolute inset-0"
      style={{
        'background-color': view().underground
          ? CAVERN.colour
          : getSkybox(props.now, latitudeOf(view().chunkY)).horizon,
      }}
    >
      <ChunkCanvas
        biome={view().biome}
        weather={view().weather}
        lamp={view().lamp}
        underground={view().underground}
        time={props.now}
        strangers={strangers}
        yaw={yaw()}
        latitude={latitudeOf(view().chunkY)}
        onTurn={(turned) => {
          setYaw(turned);
        }}
        caption={naming(view())}
        at={at()}
        origin={origin()}
        facing={facing()}
        landmarks={view().landmarks}
        phenomena={view().phenomena}
        ground={view().ground}
        wanderers={view().wanderers}
        coats={view().coats}
        berries={view().berries}
        picked={new Set()}
        dug={new Set()}
        auras={auras()}
        decorations={view().decorations}
        spawns={spawns()}
        label={titleOf}
        onPress={() => {}}
      />
    </div>
  );
}
