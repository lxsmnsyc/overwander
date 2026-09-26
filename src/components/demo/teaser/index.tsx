import { useSearchParams } from '@solidjs/router';
import { type JSX, Match, type Resource, Show, Suspense, Switch, createResource } from 'solid-js';
import { asOffset, getLocalOffset, toLocalTime } from '../../../auth/local-time';
import { atClockHour } from '../../../data/day-clock';
import ensureBattleData from '../../../data/battle-data';
import Landmark from '../../../data/overworld/landmark';
import getWorld, { WORLD_GENERATION } from '../../../overworld/current';
import { Depth } from '../../../overworld/depth';
import { worldCell } from '../../../overworld/grid';
import pickStartPosition from '../../../overworld/start';
import { Generation } from '../../../overworld/world';
import BattleScene from './battle-scene';
import { type StagedFight, findBiome, findLandmark, stageRaid, stageStopFight } from './staging';
import WorldScene, { type WorldApi } from './world-scene';

/**
 * A full-screen stage for recording the teaser: the real board and the
 * real battle field, with no session and nothing around them. The
 * recorder picks the scene through the address and drives it through
 * `window.teaser`.
 */

interface TeaserHandle {
  generation: Generation;
  ready: boolean;
  /** When the foe side started each move, in epoch seconds like the recorder's frame stamps */
  foeCasts: number[];
  world: WorldApi | null;
  /** The world cell of the nearest landmark of these kinds, past the first `skip` */
  find: (kinds: Landmark[], skip?: number) => [number, number] | null;
  /** A free cell in the nearest chunk of the named biome, past the first `skip` */
  findBiome: (name: string, skip?: number) => [number, number] | null;
}

declare global {
  interface Window {
    teaser?: TeaserHandle;
  }
}

const DAY = 24 * 60 * 60 * 1000;

const STOP_KINDS: Partial<Record<string, Landmark>> = {
  gym: Landmark.GymLeader,
  trainer: Landmark.Trainer,
  rocket: Landmark.TeamRocket,
};

/** The staged fight, read apart from where it is loaded */
function Fielded(props: {
  fight: Resource<StagedFight | null>;
  onStart: () => void;
  onFoeCast: () => void;
}): JSX.Element {
  return (
    <Show when={props.fight()}>
      {(staged) => (
        <BattleScene fight={staged()} onStart={props.onStart} onFoeCast={props.onFoeCast} />
      )}
    </Show>
  );
}

export default function TeaserStage(): JSX.Element {
  const [params] = useSearchParams<{
    scene?: string;
    x?: string;
    y?: string;
    hour?: string;
    yaw?: string;
    cave?: string;
    skip?: string;
    boss?: string;
  }>();
  const offset = asOffset(getLocalOffset());
  const hour = Number(params.hour ?? 12);
  const now = Math.floor(toLocalTime(Date.now(), offset) / DAY) * DAY + atClockHour(hour);
  const skip = Number(params.skip ?? 0);
  const scene = params.scene ?? 'world';

  const handle: TeaserHandle = {
    generation: WORLD_GENERATION,
    ready: false,
    foeCasts: [],
    world: null,
    findBiome,
    find: (kinds, passed = 0) => {
      const found = findLandmark(new Set(kinds), passed);

      if (found == null) {
        return null;
      }
      return [
        worldCell(found.chunkX, found.cell % 16),
        worldCell(found.chunkY, Math.floor(found.cell / 16)),
      ];
    },
  };

  window.teaser = handle;

  const start = (): [number, number] => {
    if (params.x != null && params.y != null) {
      return [Number(params.x), Number(params.y)];
    }
    const spot = pickStartPosition(getWorld(), 'teaser');

    return [worldCell(spot.chunkX, spot.cellX), worldCell(spot.chunkY, spot.cellY)];
  };

  const [fight] = createResource(
    () => (scene === 'world' ? null : scene),
    async (wanted) => {
      await ensureBattleData();
      if (wanted === 'raid' || wanted === 'shadow') {
        return stageRaid(wanted === 'shadow', now, offset, params.boss);
      }
      const kind = STOP_KINDS[wanted];

      return kind == null ? null : stageStopFight(new Set([kind]), skip, now, offset);
    },
  );

  return (
    <main class="fixed inset-0 overflow-hidden bg-shade">
      <Show when={WORLD_GENERATION !== Generation.Second}>
        <p class="absolute top-2 left-2 z-10 rounded bg-ember px-2 text-on-accent">
          Not the live world: start the dev server with VITE_WORLD_GENERATION=2
        </p>
      </Show>
      <Switch>
        <Match when={scene === 'world'}>
          <WorldScene
            start={start()}
            now={now}
            depth={params.cave === '1' ? Depth.Cave : Depth.Surface}
            yaw={Number(params.yaw ?? 0)}
            onReady={(api) => {
              handle.world = api;
              handle.ready = true;
            }}
          />
        </Match>
        <Match when={scene !== 'world'}>
          <Suspense>
            <Fielded
              fight={fight}
              onStart={() => {
                handle.ready = true;
              }}
              onFoeCast={() => {
                handle.foeCasts.push(Date.now() / 1000);
              }}
            />
          </Suspense>
        </Match>
      </Switch>
    </main>
  );
}
