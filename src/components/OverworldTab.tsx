import type { User } from 'firebase/auth';
import {
  For,
  type JSX,
  Show,
  createEffect,
  createResource,
  createSignal,
  from,
  onCleanup,
  onMount,
} from 'solid-js';
import { getBuddyEffects } from '../auth/buddy';
import { useAuth } from '../auth/context';
import type { EncounterRecord } from '../auth/encounter-record';
import { RaidKind, canJoinRaids, claimRaidReward, enterRaid } from '../auth/raids';
import { createSafariSession, isEncounterFled } from '../auth/safari';
import {
  type SpawnRecord,
  claimBerryPatch,
  claimHiddenGrotto,
  claimItemCache,
  startEncounter,
  visitChunk,
  watchSnapshotWindow,
  watchSpawns,
} from '../auth/snapshots';
import { BIOME_NAMES, TIME_OF_DAY_NAMES } from '../data/biome';
import type Biome from '../data/ids/biome';
import { getTimeOfDay } from '../data/ids/biome';
import type { Items } from '../data/ids/items';
import Landmark, { LANDMARK_NAMES } from '../data/overworld/landmark';
import { getItemData } from '../data/items';
import { getSpeciesData } from '../data/species';
import { CHUNK_CELLS } from '../overworld/chunk';
import ChunkSnapshot, { SPAWN_COUNT } from '../overworld/chunk-snapshot';
import { LURE_SPAWN_BONUS } from '../overworld/abilities/__create';
import type { Buddy } from '../overworld/core';
import createOverworld from '../overworld/setup';
import type { Spawn } from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import { isInWorld } from '../overworld/world';
import pickStartPosition from '../overworld/start';
import type SafariSession from '../overworld/safari';
import SafariDialog from './SafariDialog';
import { GameTab, useGame } from './game-context';

/**
 * How many spawns a visit publishes: the ordinary six plus the two a
 * lure draws in, rolled for every window so that a lure changes who
 * can see them rather than whether they exist
 */
const PUBLISHED_SPAWNS = SPAWN_COUNT + LURE_SPAWN_BONUS;

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

/**
 * Build the chunk's view from the window and the spawns the store
 * currently holds. Everything else — landmarks, caches, grottos,
 * raids — re-derives from the chunk seed and the window, so the
 * subscription only has to carry those two
 */
function buildChunkView(
  x: number,
  y: number,
  timestamp: number,
  published: [string, SpawnRecord][],
  player: string | null,
  buddy: Buddy | null,
): ChunkView {
  const chunk = getWorld().getChunk(x, y);
  const snapshot = new ChunkSnapshot(chunk, timestamp);
  // Rolling locally reproduces the published placement — same seed,
  // same window, same count — and is what pins each spawn to a cell
  snapshot.getSpawns(PUBLISHED_SPAWNS);

  const spawns = new Map<number, { id: string; spawn: Spawn }>();
  const cells = [...snapshot.getSpawnCells()];
  // The same engine the server stages encounters with: a lure decides
  // how many of the window's rolls are there for this player
  const overworld = createOverworld(player ?? '', player == null ? null : buddy);
  const visible = overworld.checkSpawnCount(SPAWN_COUNT);

  cells.forEach(([cell], index) => {
    // Roll order and publication order are the same, so the nth
    // placed cell carries the nth published spawn
    if (index >= visible || index >= published.length) {
      return;
    }

    const [id, stored] = published[index];

    spawns.set(cell, {
      id,
      spawn: [stored.species, stored.individualValue, stored.traitValue],
    });
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
  const [session, setSession] = createSignal<SafariSession<EncounterRecord> | null>(null);
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

  /**
   * Walking into a chunk publishes (or adopts) the window's spawns;
   * everything after that arrives through the subscriptions below,
   * so a window rolling over or a spawn another player caught shows
   * up without a reload
   */
  createEffect(() => {
    const chunk = getWorld().getChunk(chunkX(), chunkY());

    // The window always rolls the lure's extras, so every player of
    // the chunk shares one set of rolls whoever publishes them
    visitChunk(chunk, PUBLISHED_SPAWNS).catch((caught: unknown) => {
      setStatus(caught instanceof Error ? caught.message : String(caught));
    });
  });

  const snapshotWindow = from<number | null>((set) =>
    watchSnapshotWindow(getWorld().getChunk(chunkX(), chunkY()), (timestamp) => {
      set(timestamp);
    }),
  );

  const published = from<[string, SpawnRecord][]>((set) => {
    const timestamp = snapshotWindow();

    if (timestamp == null) {
      return () => undefined;
    }
    return watchSpawns(getWorld().getChunk(chunkX(), chunkY()), timestamp, (spawns) => {
      set(spawns);
    });
  });

  // What walks beside the player changes what the chunk holds, so the
  // view waits on it the same way it waits on the window
  const [buddy] = createResource(
    () => auth.user()?.uid ?? null,
    async (uid) => getBuddyEffects(uid),
  );

  const view = (): ChunkView | null => {
    const timestamp = snapshotWindow();

    return timestamp == null
      ? null
      : buildChunkView(
          chunkX(),
          chunkY(),
          timestamp,
          published() ?? [],
          auth.user()?.uid ?? null,
          buddy() ?? null,
        );
  };

  const cell = (): number => cellY() * CHUNK_CELLS + cellX();

  const move = (deltaX: number, deltaY: number): void => {
    let x = cellX() + deltaX;
    let y = cellY() + deltaY;
    let chunk = chunkX();
    let row = chunkY();

    // Walking off an edge carries into the neighboring chunk, and
    // the player re-enters it from the opposite edge
    if (x < 0) {
      chunk -= 1;
      x = CHUNK_CELLS - 1;
    } else if (x >= CHUNK_CELLS) {
      chunk += 1;
      x = 0;
    }
    if (y < 0) {
      row -= 1;
      y = CHUNK_CELLS - 1;
    } else if (y >= CHUNK_CELLS) {
      row += 1;
      y = 0;
    }

    // The world is finite: its outermost chunks have no neighbor to
    // step into, so a walk into the edge goes nowhere
    if (!isInWorld(chunk, row)) {
      return;
    }
    setChunkX(chunk);
    setChunkY(row);
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
  const meet = async (user: User, encounter: EncounterRecord): Promise<string | null> => {
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
      // The server decides what is standing there: a spawn from a
      // window that has turned over is no longer met
      const encounter = await startEncounter(loaded.snapshot, spawn.id);

      return encounter == null ? 'It is gone — the chunk has moved on.' : meet(user, encounter);
    }

    const landmark = loaded.landmarks.get(at);

    if (landmark === Landmark.ItemCache) {
      const item = await claimItemCache(loaded.snapshot, at);

      return item == null
        ? 'The cache is empty until the next window.'
        : `Found ${describeItem(item)}.`;
    }
    if (landmark === Landmark.BerryPatch) {
      const berry = await claimBerryPatch(loaded.snapshot, at);

      return berry == null
        ? 'The patch is bare until the next window.'
        : `Picked ${describeItem(berry)}.`;
    }
    if (landmark === Landmark.HiddenGrotto) {
      const claim = await claimHiddenGrotto(loaded.snapshot, at);

      if (claim == null) {
        return 'The grotto is quiet until the next window.';
      }
      if (claim.kind === 'item') {
        return `The grotto held ${describeItem(claim.item)}.`;
      }
      return meet(user, claim.encounter);
    }
    if (landmark === Landmark.LegendaryRaid || landmark === Landmark.ShadowRaid) {
      const kind = landmark === Landmark.ShadowRaid ? RaidKind.Shadow : RaidKind.Legendary;
      const lobby = await enterRaid(loaded.snapshot, at, kind);

      if (lobby == null) {
        // Nothing to walk into: either the hour stages no raid here,
        // or the player has no pokemon to stage one with
        return (await canJoinRaids(user.uid))
          ? 'The raid lobby is empty this hour.'
          : 'You need a pokemon of your own to raid — you can only watch a raid already under way.';
      }
      const [id, record] = lobby;

      // A raid already under way cannot be joined; walking in on one
      // is watching it, and a watched raid pays nothing
      if (record.battle != null) {
        game.setBattle({ id: record.battle, replay: true });
        return 'The raid has already started — you can only watch.';
      }

      // The lobby itself lives in the Raids tab
      game.setRaid(id);
      game.setTab(GameTab.Raids);
      return null;
    }
    return null;
  };

  // A cleared raid leaves its legendary waiting; it is met the moment
  // the player is back in the overworld
  createEffect(() => {
    const reward = game.reward();
    const user = auth.user();

    if (reward == null || user == null) {
      return;
    }
    game.setReward(null);
    claimRaidReward(reward.raid)
      .then(async (collected) => {
        if (collected == null) {
          setStatus('That raid has nothing left to collect.');
          return;
        }
        // The purse lands in the profile straight away; the pokemon
        // is still to be met
        setStatus(`The raid paid ${collected.gold} gold.`);
        setSession(await createSafariSession(user, collected.encounter));
      })
      .catch((caught: unknown) => {
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
    if (landmark === Landmark.ShadowRaid) {
      return 'S';
    }
    if (landmark === Landmark.BerryPatch) {
      return 'B';
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

      <Show when={view()} fallback={<p>Loading chunk…</p>}>
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

      <Show when={auth.user()}>
        {(user) => (
          <SafariDialog
            user={user()}
            session={session()}
            onClose={() => {
              setSession(null);
            }}
          />
        )}
      </Show>
    </section>
  );
}
