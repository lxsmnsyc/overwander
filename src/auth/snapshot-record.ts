import type { Species } from '../data/ids/species';
import { asNumber, asString, isRecord } from './__normalize';

/**
 * What a chunk's shared window is, and how a stored one is read back.
 *
 * It lives apart from the store that resolves it because the
 * privileged server reads windows too — `meetSpawn` takes the roll a
 * player is meeting off this document — and neither side should have
 * to import the other to know the shape.
 */

/**
 * One synchronized spawn: the raw roll shared by every player viewing
 * the chunk from the same zone. Where it stands is not stored — the
 * cells are re-derived from the same seed and window — so a spawn is
 * only what it is, never where
 */
export interface SpawnRoll {
  species: Species;
  individualValue: number;
  traitValue: number;
}

/**
 * One shared window per chunk **and zone** at
 * snapshots/{chunkSeed}:{zone}: whoever finds the record missing or
 * expired refreshes it, and the stored window is canonical for every
 * player in that zone — nobody derives spawns from their own clock.
 *
 * The zone is part of the key because the window is local: players an
 * ocean apart are in different hours of the day, so they walk
 * different worlds rather than fighting over one window
 */
export interface SnapshotRecord {
  /**
   * The chunk seed this snapshot belongs to
   */
  seed: string;
  /**
   * Minutes east of UTC the window was read in
   */
  offset: number;
  /**
   * The 5-minute local window the snapshot covers
   */
  timestamp: number;
  /**
   * The window's spawns, in roll order.
   *
   * They were a collection of their own once — one document per
   * spawn, found by a three-field query on a composite index and
   * swept up by a second query when the window turned over. They are
   * a field because they have no life apart from this window: they
   * are rolled with it, replaced with it, and never read without it.
   * Publishing is one write, reading is one read, and a window that
   * rolls over takes its old spawns with it rather than leaving them
   * to be deleted
   */
  spawns: SpawnRoll[];
}

/**
 * What a spawn is called, for the encounter that is staged from it.
 * It is derived rather than stored — the chunk, the zone, the window
 * and which roll it was are all the id needs to say — so nothing has
 * to keep a document alive to give a spawn a name
 */
export function spawnId(key: string, timestamp: number, index: number): string {
  return `${key}@${timestamp}#${index}`;
}

/**
 * The document a chunk's window lives at, one per chunk and zone.
 *
 * It is **not** `ChunkSnapshot.key`, which the derivations are seeded
 * from and which joins the two halves with nothing between them. The
 * separator here is load-bearing twice over: the security rules read
 * the seed back out of the id to check that a published window is
 * filed under the chunk it claims to be from, and the two sides of
 * the game have to agree on the spelling or one of them writes a
 * window the other cannot find. They did not agree once — the server
 * asked for a document a colon away from the one the browser had
 * written — and every wild pokemon in the game answered "it is gone,
 * the chunk has moved on"
 */
export function windowId(seed: string, zone: string): string {
  return `${seed}:${zone}`;
}

/**
 * The stored rolls, restored. Anything that is not a roll is dropped
 * rather than read as a Missingno standing in the grass
 */
export function asSpawnRolls(value: unknown): SpawnRoll[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isRecord).map((entry) => ({
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    species: asNumber(entry.species) as Species,
    individualValue: asNumber(entry.individualValue),
    traitValue: asNumber(entry.traitValue),
  }));
}

/**
 * A stored window, restored
 */
export function asSnapshotRecord(value: unknown): SnapshotRecord {
  const data = isRecord(value) ? value : {};

  return {
    seed: asString(data.seed),
    offset: asNumber(data.offset),
    timestamp: asNumber(data.timestamp),
    spawns: asSpawnRolls(data.spawns),
  };
}
