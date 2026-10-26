import type { PlayerIdentity } from '../../auth/user';
import type { WalkReport } from '../../auth/eggs';
import {
  getPosition,
  savePosition,
  visitBiome,
  watchPosition,
  settleWalk as writeWalk,
} from '../../auth/positions';
import type Biome from '../../data/ids/biome';
import type { PositionRecord } from '../../model/position-record';
import getWorld from '../../overworld/current';
import { Depth } from '../../overworld/depth';
import pickStartPosition, { type StartPosition, nearestFreeCell } from '../../overworld/start';
import { type Store, type WritableStore, createStore } from '../store';

/**
 * Where the player is standing, and keeping one player's walk on one
 * screen.
 *
 * A player signed in twice writes one row from two boards. Rather than
 * let the two drag each other back and forth, the screen that finds the
 * row standing in a chunk it is not in stands down until somebody takes
 * the walk back here
 */
export interface Walk {
  /** Null while it is still being found out */
  position: WritableStore<PositionRecord | null>;
  /** Where the walk went when another screen took it, or null while this one has it */
  elsewhere: Store<PositionRecord | null>;
  /**
   * The last place the player was put by something other than a walk.
   * The board keeps its own coordinates once placed, so being moved has
   * to reach it as news
   */
  moved: Store<PositionRecord | null>;
  /** Take the walk back onto this screen, which stands the other one down in turn */
  takeWalk: () => void;
  /**
   * Stand where the row already says this player is. A staff teleport
   * writes the row from the server, and is taken as this screen's own
   * write rather than a second screen's walk
   */
  standHere: (at: PositionRecord) => void;
  /** Write down where the player stands, keeping the stamp so the write is known when it comes back */
  saveWalk: (chunkX: number, chunkY: number, cellX: number, cellY: number, depth: Depth) => void;
  /** `saveWalk` with the paces walked since the last report, resolving what they came to */
  settleWalk: (
    chunkX: number,
    chunkY: number,
    cellX: number,
    cellY: number,
    depth: Depth,
    steps: number,
  ) => Promise<WalkReport | null>;
  /** Place the player and follow their row for as long as they are signed in; returns the stop */
  follow: (user: PlayerIdentity) => () => void;
}

export function createWalk(): Walk {
  const position = createStore<PositionRecord | null>(null);
  const elsewhere = createStore<PositionRecord | null>(null);
  const moved = createStore<PositionRecord | null>(null);
  /**
   * The newest stamp this screen wrote. Every write comes back around
   * the subscription, and one mistaken for somebody else's would stand
   * this screen down in the middle of its own walk
   */
  let wroteAt = 0;
  /** Saves still on their way, and the news that arrived while one was */
  let saving = 0;
  let heldNews: PositionRecord | null = null;

  const hearPosition = (record: PositionRecord | null): void => {
    // A save's own change can arrive before its stamp does, so news is
    // held until every save out has come back
    if (record != null && saving > 0) {
      heldNews = record;
      return;
    }

    const here = position.get();

    // A row nobody has written yet, this screen's own coming back
    // around, or news that arrived before there was anything to
    // compare it against
    if (record == null || record.movedAt <= wroteAt || here == null || elsewhere.get() != null) {
      return;
    }
    // Only a chunk counts: two screens in one chunk write cells over
    // each other harmlessly, while another chunk is a walk gone on
    // without this screen. It sticks once set, so a late write of this
    // screen's own cannot quietly start the walk up again
    if (record.chunkX !== here.chunkX || record.chunkY !== here.chunkY) {
      elsewhere.set(record);
    }
  };

  /** One save out and back, keeping its stamp and holding news that lands before it */
  const track = async (save: () => Promise<number>): Promise<void> => {
    saving += 1;
    try {
      wroteAt = Math.max(wroteAt, await save());
    } finally {
      saving -= 1;
      if (saving === 0 && heldNews != null) {
        const news = heldNews;

        heldNews = null;
        hearPosition(news);
      }
    }
  };

  const settleWalk: Walk['settleWalk'] = async (chunkX, chunkY, cellX, cellY, depth, steps) => {
    let report: WalkReport | null = null;

    await track(async () => {
      const settled = await writeWalk(steps, chunkX, chunkY, cellX, cellY, depth);

      report = settled.report;
      return settled.stamp;
    });
    return report;
  };

  const saveWalk: Walk['saveWalk'] = (chunkX, chunkY, cellX, cellY, depth) => {
    track(async () => savePosition(chunkX, chunkY, cellX, cellY, depth)).catch(() => {
      // A position that did not save is a walk that will save it,
      // and there is nothing here worth interrupting a walk for
    });
  };

  const standHere = (at: PositionRecord): void => {
    wroteAt = Math.max(wroteAt, at.movedAt);
    elsewhere.set(null);
    position.set(at);
    moved.set(at);
  };

  const takeWalk = (): void => {
    const at = elsewhere.get();

    if (at == null) {
      return;
    }
    elsewhere.set(null);
    position.set(at);
    saveWalk(at.chunkX, at.chunkY, at.cellX, at.cellY, at.depth);
  };

  /**
   * Where they left off, or for somebody who has never walked anywhere,
   * somewhere random in the starting region, written down at once so
   * the dice are rolled for them exactly once
   */
  const place = (user: PlayerIdentity): (() => void) => {
    let cancelled = false;

    const standAt = (at: PositionRecord | StartPosition, store: boolean): void => {
      if (cancelled) {
        return;
      }
      // A player put down for the first time is put down outside
      const depth = 'depth' in at ? at.depth : Depth.Surface;

      position.set({
        player: user.uid,
        chunkX: at.chunkX,
        chunkY: at.chunkY,
        cellX: at.cellX,
        cellY: at.cellY,
        depth,
        movedAt: 'movedAt' in at ? at.movedAt : 0,
      });
      if (store) {
        saveWalk(at.chunkX, at.chunkY, at.cellX, at.cellY, depth);
      }
    };

    getPosition(user.uid)
      .then((stored) => {
        if (stored != null) {
          // Scenery can have moved onto a saved cell since, so step off it and keep the new spot
          const open = nearestFreeCell(
            getWorld(),
            stored.chunkX,
            stored.chunkY,
            stored.cellX,
            stored.cellY,
          );

          standAt(
            { ...stored, ...open },
            open.cellX !== stored.cellX || open.cellY !== stored.cellY,
          );
          return;
        }
        standAt(pickStartPosition(getWorld(), `${user.uid}:${Date.now()}:${Math.random()}`), true);
      })
      .catch(() => {
        // Their position could not be read, which is no reason to keep
        // them out of the world. Nothing is written for it either: a
        // save on top of a failed read could move somebody whose real
        // record was there all along
        standAt(pickStartPosition(getWorld(), `${user.uid}:${Date.now()}:${Math.random()}`), false);
      });

    return () => {
      cancelled = true;
    };
  };

  /**
   * Standing in a biome is what discovers it, and the mark is the one
   * part of a walk the server sees: sent only where the ground
   * underfoot has changed to something else
   */
  const markBiomes = (): (() => void) => {
    let marked: Biome | null = null;

    const mark = (at: PositionRecord | null): void => {
      if (at == null) {
        return;
      }

      const biome = getWorld().getChunk(at.chunkX, at.chunkY).biome;

      if (biome === marked) {
        return;
      }
      marked = biome;
      visitBiome(at.chunkX, at.chunkY).catch(() => {
        // A mark that did not land is one the next crossing sends again
        marked = null;
      });
    };

    mark(position.get());
    return position.subscribe(mark);
  };

  const follow = (user: PlayerIdentity): (() => void) => {
    const stops: (() => void)[] = [markBiomes(), watchPosition(user.uid, hearPosition)];

    if (position.get() == null) {
      stops.push(place(user));
    }
    return () => {
      for (const stop of stops) {
        stop();
      }
    };
  };

  return {
    position,
    elsewhere,
    moved,
    takeWalk,
    standHere,
    saveWalk,
    settleWalk,
    follow,
  };
}
