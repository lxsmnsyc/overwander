import type { User } from 'firebase/auth';
import {
  For,
  type JSX,
  Show,
  createEffect,
  createResource,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import { useAuth } from '../auth/context';
import { deriveRaidReward, enterRaid } from '../auth/raids';
import { createSafariSession, isEncounterFled } from '../auth/safari';
import {
  claimHiddenGrotto,
  claimItemCache,
  getChunkSnapshot,
  startEncounter,
  visitChunk,
} from '../auth/snapshots';
import { BIOME_NAMES, TIME_OF_DAY_NAMES } from '../data/biome';
import type Biome from '../data/ids/biome';
import { getTimeOfDay } from '../data/ids/biome';
import type { Items } from '../data/ids/items';
import Landmark, { LANDMARK_NAMES } from '../data/overworld/landmark';
import { getItemData } from '../data/items';
import { getSpeciesData } from '../data/species';
import { CHUNK_CELLS } from '../overworld/chunk';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import type { Spawn } from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import pickStartPosition from '../overworld/start';
import { EncounterType } from '../overworld/encounter';
import type SafariSession from '../overworld/safari';
import SafariDialog from './SafariDialog';
import { GameTab, type PendingReward, useGame } from './game-context';

/**
 * How many spawns a visit publishes for the chunk's window
 */
const SPAWN_COUNT = 6;

/**
 * Where a player entering a chunk without a stored position starts
 */
const START_CELL = CHUNK_CELLS / 2;

const MOVES = new Map<string, [x: number, y: number]>([
  ['ArrowUp', [0, -1]],
  ['ArrowDown', [0, 1]],
  ['ArrowLeft', [-1, 0]],
  ['ArrowRight', [1, 0]],
  ['w', [0, -1]],
  ['s', [0, 1]],
  ['a', [-1, 0]],
  ['d', [1, 0]],
]);

function describeItem(item: Items): string {
  try {
    return getItemData(item).name;
  } catch {
    return `Item #${item}`;
  }
}

interface ChunkView {
  x: number;
  y: number;
  biome: Biome;
  snapshot: ChunkSnapshot;
  landmarks: Map<number, Landmark>;
  /**
   * The window's spawns by cell, each with the id it was published
   * under, so an interaction can derive the same encounter every
   * observer sees
   */
  spawns: Map<number, { id: string; spawn: Spawn }>;
  caches: Map<number, Items>;
}

async function loadChunk([x, y]: readonly [number, number]): Promise<ChunkView> {
  const chunk = getWorld().getChunk(x, y);
  // The visit publishes (or adopts) the window's spawns before the
  // snapshot is read, so the two agree
  const published = await visitChunk(chunk, SPAWN_COUNT);
  const snapshot = await getChunkSnapshot(chunk);
  // Rolling locally reproduces the published placement — same seed,
  // same window, same count — and is what pins each spawn to a cell
  snapshot.getSpawns(SPAWN_COUNT);

  const spawns = new Map<number, { id: string; spawn: Spawn }>();
  const cells = [...snapshot.getSpawnCells()];

  cells.forEach(([cell, spawn], index) => {
    // Roll order and publication order are the same, so the nth
    // placed spawn carries the nth published id
    if (index < published.length) {
      spawns.set(cell, { id: published[index][0], spawn });
    }
  });

  return {
    x,
    y,
    biome: chunk.biome,
    snapshot,
    landmarks: chunk.getLandmarkCells(),
    spawns,
    caches: snapshot.getItemCaches(),
  };
}

/**
 * The overworld as the player walks it: arrow keys or WASD move one
 * cell at a time, stepping off an edge carries them into the
 * adjacent chunk, and landing on a spawn or a landmark triggers its
 * interaction
 */
export default function OverworldTab(): JSX.Element {
  const auth = useAuth();
  const [chunkX, setChunkX] = createSignal(0);
  const [chunkY, setChunkY] = createSignal(0);
  const [cellX, setCellX] = createSignal(START_CELL);
  const [cellY, setCellY] = createSignal(START_CELL);
  const [status, setStatus] = createSignal<string | null>(null);
  const [session, setSession] = createSignal<SafariSession | null>(null);
  const game = useGame();
  /**
   * The cell whose interaction already fired, so standing still (or
   * closing a dialog) does not trigger it again
   */
  const [visited, setVisited] = createSignal<string | null>(null);
  const [placed, setPlaced] = createSignal(false);

  // A player who has not walked anywhere yet starts somewhere in the
  // starting region rather than at the origin. The draw is seeded by
  // their uid, so it is the same place every time until a position
  // is actually stored
  createEffect(() => {
    const user = auth.user();

    if (user == null || placed()) {
      return;
    }

    const start = pickStartPosition(getWorld(), user.uid);

    setPlaced(true);
    setChunkX(start.chunkX);
    setChunkY(start.chunkY);
    setCellX(start.cellX);
    setCellY(start.cellY);
  });

  const [view, { refetch }] = createResource(() => [chunkX(), chunkY()] as const, loadChunk);

  const cell = (): number => cellY() * CHUNK_CELLS + cellX();

  const move = (deltaX: number, deltaY: number): void => {
    let x = cellX() + deltaX;
    let y = cellY() + deltaY;

    // Walking off an edge carries into the neighboring chunk, and
    // the player re-enters it from the opposite edge
    if (x < 0) {
      setChunkX(chunkX() - 1);
      x = CHUNK_CELLS - 1;
    } else if (x >= CHUNK_CELLS) {
      setChunkX(chunkX() + 1);
      x = 0;
    }
    if (y < 0) {
      setChunkY(chunkY() - 1);
      y = CHUNK_CELLS - 1;
    } else if (y >= CHUNK_CELLS) {
      setChunkY(chunkY() + 1);
      y = 0;
    }
    setCellX(x);
    setCellY(y);
  };

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      // The dialogs own the keyboard while they are open
      if (session() != null) {
        return;
      }

      const delta = MOVES.get(event.key.length === 1 ? event.key.toLowerCase() : event.key);

      if (delta == null) {
        return;
      }
      event.preventDefault();
      move(delta[0], delta[1]);
    };

    window.addEventListener('keydown', onKeyDown);
    onCleanup(() => {
      window.removeEventListener('keydown', onKeyDown);
    });
  });

  /**
   * Meet a spawn (or a grotto's pokemon): the encounter is derived
   * once per player and the safari session opens over it
   */
  const meet = async (
    user: User,
    snapshot: ChunkSnapshot,
    id: string,
    spawn: Spawn,
  ): Promise<string | null> => {
    const encounter = await startEncounter(user, snapshot, id, spawn);

    if (await isEncounterFled(user.uid, encounter)) {
      return 'Nothing here — it already fled from you.';
    }
    setSession(await createSafariSession(user, encounter));
    return null;
  };

  const interact = async (loaded: ChunkView, user: User): Promise<string | null> => {
    const at = cell();
    const spawn = loaded.spawns.get(at);

    if (spawn != null) {
      return meet(user, loaded.snapshot, spawn.id, spawn.spawn);
    }

    const landmark = loaded.landmarks.get(at);

    if (landmark === Landmark.ItemCache) {
      const item = await claimItemCache(user, loaded.snapshot, at);

      return item == null
        ? 'The cache is empty until the next window.'
        : `Found ${describeItem(item)}.`;
    }
    if (landmark === Landmark.HiddenGrotto) {
      const claim = await claimHiddenGrotto(user, loaded.snapshot, at);

      if (claim == null) {
        return 'The grotto is quiet until the next window.';
      }
      if (claim.kind === 'item') {
        return `The grotto held ${describeItem(claim.item)}.`;
      }
      return meet(user, loaded.snapshot, claim.id, claim.spawn);
    }
    if (landmark === Landmark.LegendaryRaid) {
      const lobby = await enterRaid(user, loaded.snapshot, at);

      if (lobby == null) {
        return 'The raid lobby is empty this hour.';
      }
      // The lobby itself lives in the Raids tab
      game.setRaid(lobby[0]);
      game.setTab(GameTab.Raids);
      return null;
    }
    return null;
  };

  /**
   * A cleared raid hands the legendary over as a meeting: the chunk,
   * biome and window are the raid's, the individual is the player's
   */
  const claimRaidReward = async (
    user: User,
    loaded: ChunkView,
    reward: PendingReward,
  ): Promise<void> => {
    const [spawnId, spawn] = deriveRaidReward(reward.raid, user.uid, reward.species);
    const encounter = await startEncounter(
      user,
      loaded.snapshot,
      `${spawnId}:${user.uid}`,
      spawn,
      EncounterType.Raid,
    );

    setSession(await createSafariSession(user, encounter));
  };

  // A raid cleared elsewhere leaves its legendary waiting; it is met
  // the moment the player is back in the overworld
  createEffect(() => {
    const reward = game.reward();
    const loaded = view();
    const user = auth.user();

    if (reward == null || loaded == null || user == null) {
      return;
    }
    game.setReward(null);
    claimRaidReward(user, loaded, reward).catch((caught: unknown) => {
      setStatus(caught instanceof Error ? caught.message : String(caught));
    });
  });

  // Every arrival at a new cell resolves its interaction once the
  // chunk it belongs to has loaded
  createEffect(() => {
    const loaded = view();
    const user = auth.user();
    const key = `${chunkX()},${chunkY()}:${cell()}`;

    if (loaded == null || user == null || loaded.x !== chunkX() || loaded.y !== chunkY()) {
      return;
    }
    if (visited() === key) {
      return;
    }
    setVisited(key);
    interact(loaded, user)
      .then(setStatus)
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      });
  });

  const contentOf = (index: number): string => {
    const loaded = view();

    if (index === cell()) {
      return '@';
    }
    if (loaded == null) {
      return '';
    }
    if (loaded.spawns.has(index)) {
      return '•';
    }

    const landmark = loaded.landmarks.get(index);

    if (landmark === Landmark.ItemCache) {
      return 'C';
    }
    if (landmark === Landmark.HiddenGrotto) {
      return 'G';
    }
    if (landmark === Landmark.LegendaryRaid) {
      return 'R';
    }
    return '';
  };

  const titleOf = (index: number): string => {
    const loaded = view();
    const landmark = loaded?.landmarks.get(index);
    const spawn = loaded?.spawns.get(index);

    if (spawn != null) {
      return getSpeciesData(spawn.spawn[0]).name;
    }
    return landmark == null ? '' : LANDMARK_NAMES[landmark];
  };

  return (
    <section>
      <h2>Overworld</h2>
      <p>Move with the arrow keys or WASD. Stepping off an edge crosses into the next chunk.</p>

      <Show when={!view.loading} fallback={<p>Loading chunk…</p>}>
        <Show when={view.error == null} fallback={<p>Could not reach the chunk.</p>}>
          <Show when={view()}>
            {(loaded) => (
              <>
                <p>
                  Chunk {loaded().x}, {loaded().y} · {BIOME_NAMES[loaded().biome]} ·{' '}
                  {new Date(loaded().snapshot.timestamp).toISOString().slice(11, 16)} UTC ·{' '}
                  {TIME_OF_DAY_NAMES[getTimeOfDay(loaded().snapshot.timestamp)]}
                </p>

                <div
                  style={{
                    display: 'grid',
                    'grid-template-columns': `repeat(${CHUNK_CELLS}, 1fr)`,
                    width: 'min(100%, 24rem)',
                    margin: '0 auto',
                    'font-family': 'monospace',
                  }}
                >
                  <For each={[...new Array<number>(CHUNK_CELLS * CHUNK_CELLS).keys()]}>
                    {(index) => (
                      <div
                        title={titleOf(index)}
                        style={{
                          'aspect-ratio': '1',
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                          border: '1px solid #eee',
                          background: index === cell() ? '#ffe08a' : 'transparent',
                        }}
                      >
                        {contentOf(index)}
                      </div>
                    )}
                  </For>
                </div>

                <p>
                  Cell {cellX()}, {cellY()}
                </p>
                <Show when={status()}>{(message) => <p role="status">{message()}</p>}</Show>
              </>
            )}
          </Show>
        </Show>
      </Show>

      <Show when={auth.user()}>
        {(user) => (
          <SafariDialog
            user={user()}
            session={session()}
            onClose={() => {
              setSession(null);
              // A caught or fled encounter leaves the window's spawn
              // list stale for this player
              Promise.resolve(refetch()).catch(() => undefined);
            }}
          />
        )}
      </Show>
    </section>
  );
}
