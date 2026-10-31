import { localNow } from '../../auth/clock';
import {
  listClaimedItemCaches,
  listClaimedPhenomena,
  listLatheredHoneyTrees,
  listPickedBerryPatches,
  visitChunkWindow,
  watchSnapshotWindow,
} from '../../auth/snapshots';
import type { Unwatch } from '../../auth/watch';
import LRUMap from '../../core/lru-map';
import type { SnapshotRecord } from '../../model/snapshot-record';
import { CHUNK_CELLS } from '../../overworld/chunk';
import ChunkSnapshot, { SNAPSHOT_INTERVAL } from '../../overworld/chunk-snapshot';
import getWorld from '../../overworld/current';
import type { Depth } from '../../overworld/depth';
import { type Store, type WritableStore, createStore } from '../store';
import { BOARD_CENTER, CLAIM_MEMORY, PUBLISHED_SPAWNS, REFRESH_DEBOUNCE } from './board-metrics';
import {
  type BoardChunk,
  type WatchedWindow,
  boardChunks,
  runningWindows,
  viewChunks,
} from './board-view';
import describeFailure from '../../i18n/refusals';

/**
 * What each claim list answered, by player, list, chunk and window.
 *
 * A claim changes when the player takes something or the window turns
 * over, and neither happens because they walked a square. Kept outside
 * the board, so coming back from a battle or another tab asks nothing
 */
const claimed = new LRUMap<string, Promise<number[]>>(CLAIM_MEMORY);

/**
 * The chunk windows last seen, by layer, zone and chunk. A board mounted
 * again starts from any that are still live instead of reading each one
 */
const keptWindows = new LRUMap<string, SnapshotRecord>(CLAIM_MEMORY);

/** Where the player stands, as the windows follow it */
export interface WindowsWalk {
  x: Store<number>;
  y: Store<number>;
  depth: Store<Depth>;
  placed: Store<boolean>;
}

export interface WindowsDeps {
  walk: WindowsWalk;
  /** The player's own offset from UTC, which scopes every window they see */
  zone: number;
  uid: () => string | null;
  /** A window that could not be visited, said in words */
  failed: (message: string) => void;
}

/**
 * The chunk windows the board stands in, followed live, and what this
 * player has already taken from them.
 *
 * One subscription per chunk the board overlaps: what time it is there
 * and what stands in it arrive together, and a spawn another player
 * caught leaves every screen the moment its window is rewritten
 */
export interface BoardWindows {
  /** Hand over the chunks the board in view has built, which the claim lists are read for */
  attach: (chunks: () => BoardChunk[] | null) => void;
  /** Every window the board overlaps, by chunk key */
  windows: Store<Map<string, WatchedWindow>>;
  /** Those still running, which are the ones that stand anything */
  live: Store<Map<string, WatchedWindow>>;
  /** Cells whose happening this player already walked into this hour */
  spent: WritableStore<Set<string>>;
  /** Patches already stripped, caches already dug, and honey trees already lathered, by world cell */
  picked: WritableStore<Set<string>>;
  dug: WritableStore<Set<string>>;
  lathered: WritableStore<Set<string>>;
  /**
   * Ask for the windows, unless they were just asked for. `whatever`
   * skips the wait; `everything` reads even a live one again, for a
   * board caught behind the world
   */
  askForWindow: (whatever?: boolean, everything?: boolean) => void;
  /** This player took something, which is what can make a remembered claim list wrong */
  forgetClaims: () => void;
  dispose: () => void;
}

/** Whether the page is being looked at; outside a page there is nobody to hide from */
function onScreen(): boolean {
  return typeof document === 'undefined' || document.visibilityState === 'visible';
}

/** Whether two lists of chunks name the same chunks in the same order */
function sameChunks(was: [number, number][], now: [number, number][]): boolean {
  if (was.length !== now.length) {
    return false;
  }
  for (const [at, [cx, cy]] of was.entries()) {
    if (cx !== now[at][0] || cy !== now[at][1]) {
      return false;
    }
  }
  return true;
}

export default function createBoardWindows(deps: WindowsDeps): BoardWindows {
  const { walk, zone } = deps;
  const windows = createStore<Map<string, WatchedWindow>>(new Map());
  const live = createStore<Map<string, WatchedWindow>>(new Map());
  const spent = createStore<Set<string>>(new Set());
  const picked = createStore<Set<string>>(new Set());
  const dug = createStore<Set<string>>(new Set());
  const lathered = createStore<Set<string>>(new Set());
  const undo: (() => void)[] = [];
  let chunksInView: () => BoardChunk[] | null = () => null;

  const around = (): ReturnType<typeof getWorld> => getWorld(walk.depth.get());
  const originX = (): number => walk.x.get() - BOARD_CENTER;
  const originY = (): number => walk.y.get() - BOARD_CENTER;

  /** The chunks the board is watching, kept until a step changes which */
  let overlapped: [number, number][] = [];
  /** Every chunk the board draws, which is further out than the ones it watches */
  let seen: [number, number][] = [];

  /** The subscription open on each watched chunk, so a step only opens what arrived */
  const watched = new Map<string, Unwatch>();
  /** Which layer those subscriptions are open on */
  let watchedLayer: Depth | null = null;
  /** Chunks with a visit on its way, so a second ask for one waits on the first */
  const visiting = new Set<string>();

  /** Whether a window still stands, which is when visiting its chunk would only read it again */
  const isLive = (record: SnapshotRecord): boolean =>
    record.spawns.length > 0 && localNow(zone) < record.timestamp + SNAPSHOT_INTERVAL;

  const hold = (change: (held: Map<string, WatchedWindow>) => Map<string, WatchedWindow>): void => {
    windows.update(change);
  };

  /**
   * Seeing into a chunk publishes (or adopts) its window's spawns;
   * everything after that arrives through the subscriptions
   */
  const visit = (cx: number, cy: number, known?: SnapshotRecord | null): void => {
    const key = `${cx},${cy}`;

    if (visiting.has(key)) {
      return;
    }
    visiting.add(key);

    const depth = walk.depth.get();

    // The window always rolls the lure's extras, so every player of
    // the chunk shares one set of rolls whoever publishes them
    visitChunkWindow(around().getChunk(cx, cy), PUBLISHED_SPAWNS, zone, known)
      .then((record) => {
        // Taken as it was published, since the watch lets its own window's echo pass unread
        if (watchedLayer !== depth || !watched.has(key)) {
          return;
        }
        keptWindows.set(`${depth}|${zone}|${key}`, record);
        hold((held) => new Map(held).set(key, { x: cx, y: cy, record }));
      })
      .catch((caught: unknown) => {
        deps.failed(describeFailure(caught));
      })
      .finally(() => {
        visiting.delete(key);
      });
  };

  /** Visit the chunks whose window is missing or has run out; the watch carries a live one's changes */
  const refreshWindow = (everything = false): void => {
    const held = windows.get();

    for (const [cx, cy] of overlapped) {
      const record = held.get(`${cx},${cy}`)?.record;

      if (everything || record == null || !isLive(record)) {
        visit(cx, cy, everything ? undefined : record);
      }
    }
  };

  let askedAt = 0;

  const askForWindow = (whatever = false, everything = false): void => {
    const at = Date.now();

    if (!whatever && at - askedAt < REFRESH_DEBOUNCE) {
      return;
    }
    askedAt = at;
    refreshWindow(everything);
  };

  /** Follow one chunk's window on the layer the board was on when it was opened */
  const watchOne = (
    cx: number,
    cy: number,
    key: string,
    depth: Depth,
    kept: SnapshotRecord | undefined,
  ): Unwatch =>
    watchSnapshotWindow(
      around().getChunk(cx, cy),
      zone,
      (record) => {
        // A read that was already on its way when the layer changed
        if (watchedLayer !== depth) {
          return;
        }
        if (record == null) {
          keptWindows.delete(`${depth}|${zone}|${key}`);
        } else {
          keptWindows.set(`${depth}|${zone}|${key}`, record);
        }
        hold((held) => {
          const next = new Map(held);

          if (record == null) {
            next.delete(key);
          } else {
            next.set(key, { x: cx, y: cy, record });
          }
          return next;
        });
        // Nobody has published this window yet, so this board does
        if (record == null || !isLive(record)) {
          visit(cx, cy, record);
        }
      },
      () => windows.get().get(key)?.record.timestamp,
      kept == null || !isLive(kept) ? undefined : kept,
    );

  /** Open the watches the board's chunks need and close the ones it walked away from */
  const follow = (): void => {
    // Nothing is watched until the player has been put somewhere: chunk
    // 0,0 is not where they are, and publishing its window would be a
    // visit nobody made
    if (!walk.placed.get()) {
      return;
    }

    const wanted = boardChunks(originX(), originY());
    const depth = walk.depth.get();
    const layerChanged = depth !== watchedLayer;

    if (!layerChanged && sameChunks(overlapped, wanted)) {
      return;
    }
    overlapped = wanted;

    // A cave has the same chunk coordinates as the ground above it, so a
    // change of layer drops every window: kept, the board drew one layer's
    // spawns under the other layer's ids
    if (layerChanged) {
      for (const stop of watched.values()) {
        stop();
      }
      watched.clear();
      windows.set(new Map());
      watchedLayer = depth;
    }

    const keys = new Set<string>();

    for (const [cx, cy] of wanted) {
      keys.add(`${cx},${cy}`);
    }
    for (const [key, stop] of watched) {
      if (!keys.has(key)) {
        stop();
        watched.delete(key);
      }
    }
    // What the board walked away from is dropped rather than drawn again if they walk back
    hold((held) => {
      const kept = new Map<string, WatchedWindow>();

      for (const [key, watching] of held) {
        if (keys.has(key)) {
          kept.set(key, watching);
        }
      }
      return kept;
    });

    for (const [cx, cy] of wanted) {
      const key = `${cx},${cy}`;

      if (watched.has(key)) {
        continue;
      }

      const kept = keptWindows.get(`${depth}|${zone}|${key}`);

      watched.set(key, watchOne(cx, cy, key, depth, kept));
    }
  };

  /*
   * What this player already took
   */

  /** The claim reads in flight, so a newer look drops what an older one answers */
  let gathering = 0;

  /**
   * A claim list read from every chunk the board draws, gathered into
   * one set of world cells. Out past the watched chunks there is no
   * window to hand the server, so the current one stands in: a claim is
   * stamped with its landmark or phenomenon window, which the clock
   * alone decides
   */
  const gather = (
    named: string,
    ask: (snapshot: ChunkSnapshot) => Promise<number[]>,
    into: WritableStore<Set<string>>,
    /** The window the list's claims are stamped with, which is what makes a remembered answer stale */
    stamp: (snapshot: ChunkSnapshot) => number,
    round: number,
  ): void => {
    const chunks = chunksInView();

    if (chunks == null) {
      return;
    }

    const who = deps.uid() ?? '';
    const held = new Map<string, BoardChunk>();

    for (const piece of chunks) {
      held.set(`${piece.x},${piece.y}`, piece);
    }

    const current = Math.floor(localNow(zone) / SNAPSHOT_INTERVAL) * SNAPSHOT_INTERVAL;
    const lists: Promise<string[]>[] = [];

    for (const [cx, cy] of seen) {
      const piece = held.get(`${cx},${cy}`) ?? {
        x: cx,
        y: cy,
        snapshot: new ChunkSnapshot(around().getChunk(cx, cy), current, zone),
        world: (at: number): [number, number] => [
          cx * CHUNK_CELLS + (at % CHUNK_CELLS),
          cy * CHUNK_CELLS + Math.floor(at / CHUNK_CELLS),
        ],
      };

      lists.push(
        (async (): Promise<string[]> => {
          // The player is in the key because a claim is theirs: signing
          // in as somebody else must not read back the last one's
          const key = `${who}|${named}|${piece.snapshot.depth}|${piece.x},${piece.y}|${stamp(piece.snapshot)}`;
          const known = claimed.get(key) ?? ask(piece.snapshot);

          claimed.set(key, known);
          try {
            const cells: string[] = [];

            for (const taken of await known) {
              cells.push(piece.world(taken).join(','));
            }
            return cells;
          } catch (caught) {
            // A list that failed is asked again the next time the board looks
            claimed.delete(key);
            throw caught;
          }
        })(),
      );
    }

    Promise.all(lists)
      .then((found) => {
        if (round === gathering) {
          into.set(new Set(found.flat()));
        }
      })
      .catch(() => {
        // A board that cannot say what was already taken draws it all:
        // pressing a spent cell costs a refusal, not a mistake
      });
  };

  /** Patches, caches and honey trees refill with the landmarks, not with the spawns */
  const landmarkWindow = (snapshot: ChunkSnapshot): number => snapshot.landmarkTimestamp;

  /** The windows and the chunks drawn, as last read, so a step that changes neither reads nothing */
  let gatheredFor = '';

  /** Read the claim lists again, when a window turns over or the board draws other chunks */
  const regather = (): void => {
    const key = [
      ...overlapped.map(
        ([cx, cy]) => `${cx},${cy}@${windows.get().get(`${cx},${cy}`)?.record.timestamp ?? ''}`,
      ),
      '|',
      ...seen.map((pair) => pair.join(',')),
    ].join(' ');

    if (key === gatheredFor) {
      return;
    }
    gatheredFor = key;
    gathering += 1;
    gather(
      'phenomena',
      listClaimedPhenomena,
      spent,
      (snapshot) => snapshot.phenomenonTimestamp,
      gathering,
    );
    gather('patches', listPickedBerryPatches, picked, landmarkWindow, gathering);
    gather('caches', listClaimedItemCaches, dug, landmarkWindow, gathering);
    gather('honey', listLatheredHoneyTrees, lathered, landmarkWindow, gathering);
  };

  /*
   * Windows running out
   */

  let expiry: ReturnType<typeof setTimeout> | null = null;

  const relive = (): void => {
    live.set(runningWindows(windows.get(), localNow(zone)));
  };

  // Nothing else asks for a window while the player stands still, so the
  // soonest one to run out is what wakes the board to ask for the next
  const awaitExpiry = (): void => {
    if (expiry != null) {
      clearTimeout(expiry);
      expiry = null;
    }
    if (!walk.placed.get()) {
      return;
    }

    const now = localNow(zone);
    let soonest = Number.POSITIVE_INFINITY;

    for (const { record } of windows.get().values()) {
      const ends = record.timestamp + SNAPSHOT_INTERVAL;

      if (ends > now) {
        soonest = Math.min(soonest, ends);
      }
    }
    if (!Number.isFinite(soonest)) {
      return;
    }
    expiry = setTimeout(() => {
      expiry = null;
      // Rather than staying pressable and answering "too late"
      relive();
      // A hidden tab asks nothing: coming back to the page catches up
      if (onScreen()) {
        askForWindow(true);
      }
    }, soonest - now);
  };

  const onWindows = (): void => {
    relive();
    awaitExpiry();
    regather();
  };

  const onStep = (): void => {
    follow();

    const drawn = viewChunks(originX(), originY());

    if (drawn.join(' ') !== seen.join(' ')) {
      seen = drawn;
    }
    regather();
  };

  /*
   * Coming back to the page
   */

  // A tab left open all afternoon is showing an afternoon-old chunk, so
  // the moment somebody looks at the page again is the moment to ask
  const onReturn = (): void => {
    if (onScreen() && walk.placed.get()) {
      askForWindow(true);
    }
  };

  // Outside a page (a test, a worker) there is no tab to come back to
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onReturn);
    undo.push(() => {
      document.removeEventListener('visibilitychange', onReturn);
    });
  }
  undo.push(
    windows.subscribe(onWindows),
    walk.x.subscribe(onStep),
    walk.y.subscribe(onStep),
    walk.depth.subscribe(onStep),
    walk.placed.subscribe(() => {
      onStep();
      awaitExpiry();
    }),
  );
  onStep();

  return {
    attach: (chunks) => {
      chunksInView = chunks;
      gatheredFor = '';
      regather();
    },
    windows,
    live,
    spent,
    picked,
    dug,
    lathered,
    askForWindow,
    forgetClaims: () => {
      claimed.clear();
    },
    dispose: () => {
      for (const step of undo) {
        step();
      }
      if (expiry != null) {
        clearTimeout(expiry);
      }
      for (const stop of watched.values()) {
        stop();
      }
      watched.clear();
      gathering += 1;
    },
  };
}
