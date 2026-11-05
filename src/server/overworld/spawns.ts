import 'server-only';
import { Depth } from '../../overworld/depth';
import { type EncounterRecord, asEncounterRecord } from '../../model/encounter-record';
import { asSpawnRolls, spawnId as nameSpawn } from '../../model/snapshot-record';
import type { Spawn } from '../../overworld/chunk-snapshot';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import { WORLD_GENERATION } from '../../overworld/current';
import type { EncounterOptions } from '../../overworld/encounter';
import stageEncounter from '../../overworld/encounter/stage';
import type { Items } from '../../data/ids/items';
import { encounterKey, encounterWindow } from '../../overworld/safari';
import createOverworld from '../../overworld/setup';
import type { Buddy } from '../../overworld/core';
import resolveBuddy from '../buddy';
import { getSql, tx } from '../db';
import { readEncounter, writeEncounter } from '../encounter-io';
import { grantItem } from '../inventory';
import { recordSeenSpecies } from '../pokedex';
import { toZoneKey } from '../../model/local-time';
import { resolveSnapshot } from './claims';

/** Meeting one wild pokemon, and letting it go */

/**
 * Stage a meeting: the per-player derivation is written to
 * encounters/{spawnId}:{uid} on first interaction and returned as-is
 * afterwards, so re-entering a meeting cannot re-roll it into
 * something better
 */
export async function startEncounter(
  uid: string,
  snapshot: ChunkSnapshot,
  id: string,
  spawn: Spawn,
  options: EncounterOptions = {},
  /**
   * The buddy the caller has already looked up. Undefined means it has
   * not been asked for and this will ask; null is a player who has
   * none. Resolving one costs two round trips, and a caller that
   * needed it for a check of its own should not pay twice
   */
  resolved?: Buddy | null,
): Promise<EncounterRecord> {
  const existing = await readEncounter(id, uid);

  if (existing != null) {
    return asEncounterRecord(existing);
  }

  const record = stageEncounter(
    uid,
    snapshot,
    id,
    spawn,
    resolved === undefined ? await resolveBuddy(uid) : resolved,
    options,
  );

  await tx(async (transaction) => writeEncounter(transaction, record));
  // Met, whatever becomes of the meeting: the dex counts what a player
  // has laid eyes on, so one that flees or is walked away from is
  // still one they have seen. The early return above is what keeps a
  // meeting walked back into from being counted twice
  await recordSeenSpecies(uid, record.species, record.shiny);
  return record;
}

/**
 * Meet one of the chunk's published spawns. The spawn is read from
 * the shared store rather than taken from the caller, so the rolls
 * behind the meeting are the ones every player of that chunk sees
 */
export async function meetSpawn(
  uid: string,
  x: number,
  y: number,
  spawnId: string,
  now: number,
  offset: number,
  depth: Depth = Depth.Surface,
): Promise<EncounterRecord | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset, depth);

  if (snapshot == null) {
    return null;
  }

  // The name says which chunk, which zone and which window the spawn
  // belongs to, and the window it names has to be the live one: a
  // spawn from a window that has turned over, or from a chunk away,
  // is not standing there to be met
  const index = spawnIndex(spawnId);

  if (spawnId !== nameSpawn(snapshot.key, snapshot.timestamp, index)) {
    return null;
  }

  // Both are wanted and neither waits on the other, so they are asked
  // together: serially they are two round trips of a path that has
  // too many already. The roll comes off the stored window, which is
  // the one the whole zone is looking at, addressed by chunk seed and
  // zone rather than by `snapshot.key`
  const [buddy, stored] = await Promise.all([
    resolveBuddy(uid),
    getSql()`
      select species, individual_value as "individualValue", trait_value as "traitValue"
      from snapshot_spawns
      where generation = ${WORLD_GENERATION} and chunk_seed = ${snapshot.chunk.seed}
        and zone = ${toZoneKey(snapshot.offset)}
      order by idx
    `,
  ]);
  // What a lure changes is how many of the window's rolls a player is
  // **shown**, not which of them are standing there: the window
  // publishes the whole count for everybody. Judging it again here
  // took the extras back off anybody who swapped their buddy after
  // walking in, leaving spawns on their board that they were refused
  const rolls = asSpawnRolls([...stored]);

  if (index >= rolls.length) {
    return null;
  }

  const rolled = rolls[index];
  const spawn: Spawn = [rolled.species, rolled.individualValue, rolled.traitValue];

  return startEncounter(uid, snapshot, spawnId, spawn, {}, buddy);
}

/**
 * Which roll of the window a published spawn was: the id carries it
 * after the '#', and the extras a lure adds are the last of them
 */
function spawnIndex(spawnId: string): number {
  const index = Number(spawnId.slice(spawnId.lastIndexOf('#') + 1));

  return Number.isFinite(index) ? index : Number.POSITIVE_INFINITY;
}

/**
 * Take a spawn out of what this player is shown, for as long as the
 * window that staged it lasts.
 *
 * Two things retire one, and they look the same from the map's side:
 * a pokemon that **ran off**, and one that was **caught**. Neither is
 * standing there any more for the player it happened to, and both
 * leave it standing for everybody else — the spawn belongs to the
 * shared window, so what changes is only what this player is drawn.
 *
 * The key is recomputed from the stored encounter rather than taken
 * from the caller, so a player cannot retire a meeting they never had.
 * Resolves whether this call is what retired it
 */
export async function retireSpawn(uid: string, spawnId: string): Promise<boolean> {
  const stored = await readEncounter(spawnId, uid);

  return stored == null ? false : retireEncounter(uid, asEncounterRecord(stored));
}

/** `retireSpawn` for a caller already holding the stored encounter, such as a catch */
export async function retireEncounter(uid: string, encounter: EncounterRecord): Promise<boolean> {
  const key = encounterKey(encounter);
  // What comes back says whether this is the first time: a meeting
  // already retired pays nothing a second time, which is what stops a
  // client reporting the same flight over and over
  const rows = await getSql()`
    insert into fled_encounters (player, generation, key, window_at)
    values (${uid}, ${WORLD_GENERATION}, ${key}, ${encounterWindow(key)})
    on conflict do nothing
    returning key
  `;

  return rows.length > 0;
}

/**
 * Take what a meeting that ran off was carrying.
 *
 * Only a buddy that picks pockets comes away with anything, and only
 * where the meeting was holding something in the first place. It is
 * read from the stored encounter rather than from the caller, so what
 * is paid out is what the world actually staged
 */
export async function pocketFled(uid: string, spawnId: string): Promise<Items | null> {
  const stored = await readEncounter(spawnId, uid);

  if (stored == null) {
    return null;
  }

  const encounter = asEncounterRecord(stored);
  const item = encounter.items.at(0);

  if (item == null) {
    return null;
  }

  const overworld = createOverworld(uid, await resolveBuddy(uid));

  if (!overworld.checkPockets(spawnId)) {
    return null;
  }
  await grantItem(uid, item);
  return item;
}

/**
 * How long a fled encounter is remembered for.
 *
 * What it has to outlive is the window that staged it: the spawn is
 * gone when the window turns over, so a key from an older one can
 * never match anything again. The allowance is an hour rather than
 * one window, because the windows are **local** — a player who
 * crosses a zone reads a clock offset from the one their last key was
 * written against, and an hour is more than any of that is worth
 * arguing about.
 *
 * The hourly sweep in the schema is what actually forgets them;
 * readers filter by this figure, so a sweep that has not run yet
 * changes nothing they see
 */
export const FLED_MEMORY = 60 * 60 * 1000;
